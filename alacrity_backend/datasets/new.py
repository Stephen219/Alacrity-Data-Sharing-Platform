import uuid
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Dataset
from .serializer import DatasetSerializer
import pandas as pd
import numpy as np
from minio import Minio
import io
import duckdb
import scipy.stats as stats
from cryptography.fernet import Fernet
import logging
import hashlib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO
import base64
from scipy.stats import linregress
from collections import OrderedDict
from threading import Lock
from sklearn.preprocessing import LabelEncoder
import json
import tenseal as ts
import gzip
import time
from typing import List, Dict
from django.http import HttpResponse
from .pre_analysis import pre_analysis


logger = logging.getLogger(__name__)

MINIO_URL = "10.72.98.137:9000"
minio_client = Minio(endpoint=MINIO_URL, access_key="admin", secret_key="Notgood1", secure=False)
BUCKET = "alacrity"
DATASET_CACHE = OrderedDict()
CACHE_LOCK = Lock()
MAX_CACHE_SIZE = 100

def get_jwt_hash(request):
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        return hashlib.sha256(token.encode()).hexdigest()
    return None

def load_dataset_into_cache(request, dataset_id, normalize=False):
    has_access = has_access_to_dataset(request.user.id, dataset_id)
    if not has_access:
        return Response({"error": "You do not have access to this dataset"}, status=403)
    jwt_hash = get_jwt_hash(request)
    if not jwt_hash:
        raise ValueError("No valid JWT token found")
    cache_key = f"{dataset_id}:{jwt_hash}"
    
    with CACHE_LOCK:
        if cache_key in DATASET_CACHE and DATASET_CACHE[cache_key]["normalized"] == normalize:
            DATASET_CACHE.move_to_end(cache_key)
            logger.info(f"Dataset {cache_key} retrieved from cache")
            return DATASET_CACHE[cache_key]["con"]

        try:
            dataset = Dataset.objects.get(dataset_id=dataset_id)
            cipher = Fernet(dataset.encryption_key.encode())
            file_key = dataset.link.split(f"http://{MINIO_URL}/{BUCKET}/")[1]
            response = minio_client.get_object(bucket_name=BUCKET, object_name=file_key)
            encrypted_data = response.read()
            decrypted_data = cipher.decrypt(encrypted_data)

            parquet_file = io.BytesIO(decrypted_data)
            df = pd.read_parquet(parquet_file, engine="pyarrow")
            
            if normalize:
                # Clean data: remove duplicates and rows with missing values
                df = df.drop_duplicates().dropna()
                logger.info(f"Dataset {dataset_id} cleaned: duplicates and missing values removed")

            con = duckdb.connect(":memory:")
            con.register("temp", df)
            
            if cache_key in DATASET_CACHE:
                DATASET_CACHE[cache_key]["con"].close()
                del DATASET_CACHE[cache_key]
            
            if len(DATASET_CACHE) >= MAX_CACHE_SIZE:
                oldest_key = next(iter(DATASET_CACHE))
                DATASET_CACHE[oldest_key]["con"].close()
                del DATASET_CACHE[oldest_key]
            
            DATASET_CACHE[cache_key] = {"con": con, "normalized": normalize}
            logger.info(f"Dataset {cache_key} loaded into cache (normalized={normalize})")
            return con
        except Exception as e:
            logger.error(f"Failed to load dataset {dataset_id}: {e}", exc_info=True)
            raise

def has_access_to_dataset(user_id, dataset_id):
    from dataset_requests.models import DatasetRequest
    try:
        return DatasetRequest.objects.filter(
            dataset_id=dataset_id,
            researcher_id=user_id,
            request_status='approved'
        ).exists()
    except Exception as e:
        logger.error(f"Error checking dataset access: {e}")
        return False


def generate_pie_chart(series):
    plt.figure(figsize=(6, 6))
    value_counts = series.value_counts()
    plt.pie(value_counts, labels=value_counts.index, autopct='%1.1f%%', startangle=90)
    plt.axis('equal')
    buffer = BytesIO()
    plt.savefig(buffer, format="png", bbox_inches="tight")
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    plt.close()
    buffer.close()
    return f"data:image/png;base64,{image_base64}"

@api_view(['GET'])
def dataset_detail(request, dataset_id):
    has_access = has_access_to_dataset(request.user.id, dataset_id)
    if not has_access:
        return Response({"error": "You do not have access to this dataset"}, status=403)
    try:
        dataset = Dataset.objects.get(dataset_id=dataset_id)
        normalize = request.GET.get("normalize", "false").lower() == "true"
        jwt_hash = get_jwt_hash(request)
        if not jwt_hash:
            return Response({"error": "Authentication required"}, status=401)
        cache_key = f"{dataset_id}:{jwt_hash}"
        
        con = load_dataset_into_cache(request, dataset_id, normalize=normalize)
        df = con.execute("SELECT * FROM temp").fetchdf()
        overview = pre_analysis(df)
        print (overview)
        
        serializer = DatasetSerializer(dataset)
        data = serializer.data
        data['is_loaded'] = cache_key in DATASET_CACHE
        data['overview'] = overview
        data['normalized'] = DATASET_CACHE[cache_key]["normalized"]
        return Response(data, status=200)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found"}, status=404)
    except Exception as e:
        logger.error(f"Error in dataset_detail: {e}", exc_info=True)
        return Response({"error": "Failed to load dataset"}, status=500)

@api_view(['POST'])
def clear_dataset_cache(request, dataset_id):
    try:
        jwt_hash = get_jwt_hash(request)
        if not jwt_hash:
            return Response({"error": "Authentication required"}, status=401)
        cache_key = f"{dataset_id}:{jwt_hash}"
        with CACHE_LOCK:
            if cache_key in DATASET_CACHE:
                DATASET_CACHE[cache_key]["con"].close()
                del DATASET_CACHE[cache_key]
                logger.info(f"Cache cleared for {cache_key}")
                return Response({"message": "Cache cleared"}, status=200)
        return Response({"message": "No cache to clear"}, status=200)
    except Exception as e:
        logger.error(f"Error clearing cache for {dataset_id}: {e}", exc_info=True)
        return Response({"error": "Failed to clear cache"}, status=500)


def calculate_mean(con, column, filter_query):
    query = f"SELECT AVG({column}) FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    result = con.execute(query).fetchone()[0]
    return {"operation": "mean", "value": float(result) if result is not None else None, "column": column}

def calculate_median(con, column, filter_query):
    query = f"SELECT MEDIAN({column}) FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    result = con.execute(query).fetchone()[0]
    return {"operation": "median", "value": float(result) if result is not None else None, "column": column}

def calculate_mode(con, column, filter_query):
    query = f"SELECT MODE({column}) FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    result = con.execute(query).fetchone()[0]
    return {"operation": "mode", "value": result, "column": column}

def calculate_t_test(con, column1, column2, filter_query):
    query = f"SELECT {column1}, {column2} FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    df_result = con.execute(query).fetchdf()
    t_stat, p_value = stats.ttest_ind(df_result[column1].dropna(), df_result[column2].dropna())
    
    plt.figure(figsize=(8, 6))
    sns.boxplot(data=df_result[[column1, column2]])
    plt.title(f"T-Test Boxplot\nt = {t_stat:.3f}, p = {p_value:.3e}")
    plt.ylabel("Value")
    buffer = BytesIO()
    plt.savefig(buffer, format="png", bbox_inches="tight")
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    plt.close()
    buffer.close()
    
    normality_p1 = stats.shapiro(df_result[column1].dropna())[1] if len(df_result[column1].dropna()) >= 3 else 1.0
    normality_p2 = stats.shapiro(df_result[column2].dropna())[1] if len(df_result[column2].dropna()) >= 3 else 1.0
    variance_pval = stats.levene(df_result[column1].dropna(), df_result[column2].dropna())[1]
    accuracy_note = (
        "Warning: Non-normal data" if min(normality_p1, normality_p2) < 0.05 else "Normality met"
    ) + "; " + (
        "Warning: Unequal variances" if variance_pval < 0.05 else "Variance met"
    )

    return {
        "operation": "t_test",
        "t_stat": float(t_stat),
        "p_value": float(p_value),
        "image": f"data:image/png;base64,{image_base64}",
        "accuracy_note": accuracy_note,
        "columns": [column1, column2]
    }

def calculate_chi_square(con, column1, column2, filter_query):
    query = f"SELECT {column1}, {column2} FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    df_result = con.execute(query).fetchdf()
    contingency_table = df_result.pivot_table(index=column1, columns=column2, aggfunc='size', fill_value=0)
    chi2, p, dof, expected = stats.chi2_contingency(contingency_table)
    
    plt.figure(figsize=(8, 6))
    sns.heatmap(contingency_table, annot=True, fmt="d", cmap="YlGnBu", cbar=True)
    plt.title(f"Chi-Square Contingency Table\nχ² = {chi2:.3f}, p = {p:.3e}")
    plt.xlabel(column2)
    plt.ylabel(column1)
    buffer = BytesIO()
    plt.savefig(buffer, format="png", bbox_inches="tight")
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    plt.close()
    buffer.close()
    
    expected_df = pd.DataFrame(expected, index=contingency_table.index, columns=contingency_table.columns)
    low_expected = (expected_df < 5).sum().sum()
    accuracy_note = "Warning: Some expected frequencies < 5" if low_expected > 0 else "Expected frequencies adequate"

    return {
        "operation": "chi_square",
        "chi2": float(chi2),
        "p_value": float(p),
        "degrees_of_freedom": int(dof),
        "contingency_table": contingency_table.to_dict(),
        "image": f"data:image/png;base64,{image_base64}",
        "accuracy_note": accuracy_note,
        "columns": [column1, column2]
    }

def calculate_anova(con, column1, column2, filter_query):
    query = f"SELECT {column1}, {column2} FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    df_result = con.execute(query).fetchdf()
    groups = [group[column1].dropna() for name, group in df_result.groupby(column2)]
    f_stat, p_value = stats.f_oneway(*groups)
    
    plt.figure(figsize=(8, 6))
    sns.boxplot(x=column2, y=column1, data=df_result)
    plt.title(f"ANOVA Boxplot\nF = {f_stat:.3f}, p = {p_value:.3e}")
    plt.xlabel(column2)
    plt.ylabel(column1)
    buffer = BytesIO()
    plt.savefig(buffer, format="png", bbox_inches="tight")
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    plt.close()
    buffer.close()
    
    normality_pvals = [stats.shapiro(group)[1] for group in groups if len(group) >= 3]
    variance_pval = stats.levene(*groups)[1] if len(groups) > 1 else 1.0
    accuracy_note = (
        "Warning: Non-normal data" if any(p < 0.05 for p in normality_pvals) else "Normality met"
    ) + "; " + (
        "Warning: Unequal variances" if variance_pval < 0.05 else "Variance met"
    )

    return {
        "operation": "anova",
        "f_stat": float(f_stat),
        "p_value": float(p_value),
        "image": f"data:image/png;base64,{image_base64}",
        "accuracy_note": accuracy_note,
        "columns": [column1, column2]
    }

def calculate_correlation(con, column1, column2, filter_query, method="pearson"):
    query = f"SELECT {column1}, {column2} FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    df_result = con.execute(query).fetchdf()
    if len(df_result) > 1000:
        df_result = df_result.sample(n=1000, random_state=42)
    corr_func = stats.pearsonr if method == "pearson" else stats.spearmanr
    corr, p_value = corr_func(df_result[column1].dropna(), df_result[column2].dropna())
    
    plt.figure(figsize=(8, 6))
    plt.scatter(df_result[column1], df_result[column2], alpha=0.5)
    slope, intercept, _, _, _ = linregress(df_result[column1].dropna(), df_result[column2].dropna())
    line = slope * df_result[column1] + intercept
    plt.plot(df_result[column1], line, color='red')
    plt.xlabel(column1)
    plt.ylabel(column2)
    plt.title(f"{method.capitalize()} Correlation: {corr:.3f}")
    buffer = BytesIO()
    plt.savefig(buffer, format="png", bbox_inches="tight")
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    plt.close()
    buffer.close()
    
    return {
        "operation": method,
        "correlation": float(corr),
        "p_value": float(p_value),
        "image": f"data:image/png;base64,{image_base64}",
        "slope": float(slope),
        "intercept": float(intercept),
        "columns": [column1, column2]
    }

@api_view(['GET'])
def analyze_dataset(request, dataset_id):
    operation = request.GET.get("operation")
    column = request.GET.get("column")
    column1 = request.GET.get("column1")
    column2 = request.GET.get("column2")
    filter_column = request.GET.get("filter_column")
    filter_operator = request.GET.get("filter_operator")
    filter_value = request.GET.get("filter_value")
    normalize = request.GET.get("normalize", "false").lower() == "true"

    try:
        if not operation:
            logger.error("No operation specified")
            return Response({"error": "Operation parameter is required"}, status=400)

        logger.info(f"Performing {operation} on dataset {dataset_id}")
        dataset = Dataset.objects.get(dataset_id=dataset_id)
        jwt_hash = get_jwt_hash(request)
        cache_key = f"{dataset_id}:{jwt_hash}"
        
        con = load_dataset_into_cache(request, dataset_id, normalize=normalize)
        schema = dataset.schema

        if column and column not in schema:
            return Response({"error": f"Column '{column}' not in schema"}, status=400)
        if column1 and column1 not in schema:
            return Response({"error": f"Column '{column1}' not in schema"}, status=400)
        if column2 and column2 not in schema:
            return Response({"error": f"Column '{column2}' not in schema"}, status=400)

        filter_query = ""
        if filter_column and filter_operator and filter_value:
            if filter_column not in schema:
                return Response({"error": f"Filter column '{filter_column}' not in schema"}, status=400)
            valid_operators = ["=", "!=", ">", ">=", "<", "<="]
            if filter_operator not in valid_operators:
                return Response({"error": f"Invalid filter operator. Use one of: {valid_operators}"}, status=400)
            col_type = schema[filter_column]
            filter_query = f"{filter_column} {filter_operator} {float(filter_value) if col_type in ['int64', 'float64'] else filter_value}"

        analysis_functions = {
            "mean": calculate_mean,
            "median": calculate_median,
            "mode": calculate_mode,
            "t_test": calculate_t_test,
            "chi_square": calculate_chi_square,
            "anova": calculate_anova,
            "pearson": lambda con, col1, col2, filt: calculate_correlation(con, col1, col2, filt, "pearson"),
            "spearman": lambda con, col1, col2, filt: calculate_correlation(con, col1, col2, filt, "spearman"),
        }

        if operation not in analysis_functions:
            return Response({"error": f"Unsupported operation: {operation}"}, status=400)

        if operation in ["mean", "median", "mode"]:
            if not column or (schema[column] not in ["int64", "float64"] and operation != "mode"):
                return Response({"error": f"Numeric column required for {operation}"}, status=400)
            result = analysis_functions[operation](con, column, filter_query)
        else:
            if not (column1 and column2):
                return Response({"error": f"Two columns required for {operation}"}, status=400)
            if operation in ["t_test", "pearson", "spearman"] and (schema[column1] not in ["int64", "float64"] or schema[column2] not in ["int64", "float64"]):
                return Response({"error": f"Numeric columns required for {operation}"}, status=400)
            result = analysis_functions[operation](con, column1, column2, filter_query)
        
        result["normalized"] = DATASET_CACHE[cache_key]["normalized"]
        return Response(result, status=200)

    except Dataset.DoesNotExist:
        logger.error(f"Dataset not found: {dataset_id}")
        return Response({"error": "Dataset not found"}, status=404)
    except ValueError as e:
        logger.error(f"Validation error in analyze_dataset: {e}")
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        logger.error(f"Error in analyze_dataset: {e}", exc_info=True)
        return Response({"error": "Something went wrong"}, status=500)

@api_view(['GET'])
def all_datasets_view(request):
    datasets = Dataset.objects.select_related('contributor_id__organization').all()
    serializer = DatasetSerializer(datasets, many=True, context={"request": request})
    return Response({"datasets": serializer.data}, status=status.HTTP_200_OK)

@api_view(['GET'])
def dataset_view(request, dataset_id):
    try:
        dataset = Dataset.objects.select_related('contributor_id__organization').get(dataset_id=dataset_id)
        serializer = DatasetSerializer(dataset)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": "Failed to fetch dataset"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)













# # &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&    download &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&


import numpy as np
import concurrent.futures


def encode_column(values: List, col_type: str) -> List[float]:
    """Encode values based on type for HE compatibility with improved efficiency."""
    if col_type.startswith("object") or any(isinstance(v, str) for v in values[:100] if not pd.isna(v)):
        unique_vals = pd.Series(values).dropna().unique()
        mapping = {val: float(i) for i, val in enumerate(sorted(unique_vals))}
       
        result = np.array([mapping.get(v, 0.0) if not pd.isna(v) else 0.0 for v in values], dtype=np.float32)
        return result.tolist()
    else:
       
        return np.nan_to_num(np.array(values, dtype=np.float32)).tolist()

@api_view(['GET'])
def download_dataset(request, dataset_id):
    """Download entire dataset with HE encryption, 

    Args:
        request: Django request object
        dataset_id: Dataset ID to download

    Returns:
        HttpResponse: Encrypted dataset in
            application/gzip format with JSON data
                


    """
    start_time = time.time()
    has_access = has_access_to_dataset(request.user.id, dataset_id)
    if not has_access:
        return HttpResponse(
            json.dumps({"error": "You do not have access to this dataset"}),
            status=403,
            content_type="application/json"
        )

    try:
        dataset = Dataset.objects.get(dataset_id=dataset_id)
        jwt_hash = get_jwt_hash(request)
        if not jwt_hash:
            return HttpResponse(
                json.dumps({"error": "Authentication required"}),
                status=401,
                content_type="application/json"
            )

        columns = request.GET.get("columns", None)
        
        compression_level = 9
        max_rows = request.GET.get("max_rows")  # tried to add max_rows to limit the number of rows but i can do this later
        max_rows = int(max_rows) if max_rows and max_rows.isdigit() else None

        cipher = Fernet(dataset.encryption_key.encode())
        expected_prefix = f"http://{MINIO_URL}/{BUCKET}/"
        link = dataset.link
        if not link.startswith(expected_prefix):
            raise ValueError(f"Dataset link does not start with {expected_prefix}")
        file_key = link.split(expected_prefix)[1]
        response = minio_client.get_object(bucket_name=BUCKET, object_name=file_key)
        encrypted_data = response.read()
        decrypted_data = cipher.decrypt(encrypted_data)
        parquet_buffer = io.BytesIO(decrypted_data)
        df = pd.read_parquet(parquet_buffer, engine="pyarrow")
        logger.info(f"Dataset {dataset_id} loaded, rows: {len(df)}, cols: {len(df.columns)}")
        
        if max_rows and max_rows < len(df):
            df = df.head(max_rows)
            
        logger.info(f"Dataset {dataset_id} loaded, rows: {len(df)}, cols: {len(df.columns)}")

        # Filter columns
        if columns:
            selected_cols = [col.strip() for col in columns.split(",") if col.strip() in df.columns]
            if selected_cols:
                df = df[selected_cols]
            else:
                logger.warning(f"No valid columns in {columns}, using all")

      
        optimized_schema = {}
        for col in df.columns:
            if col in dataset.schema:
                optimized_schema[col] = dataset.schema[col]

       
        
        context = ts.context(
            ts.SCHEME_TYPE.CKKS,
            poly_modulus_degree=8192,  
            coeff_mod_bit_sizes=[40, 20, 20, 40]  
        )
        context.global_scale = 2**30  
        context.generate_galois_keys()
        def get_optimal_batch_size(col_type, values_len):
            if col_type.startswith("object"):
                return min(8192, values_len)
            else:
                return min(4096, values_len)

        encrypted_data = {}
        encoding_info = {}
        column_sizes = {}
        
       
        def process_column(column):
            values = df[column].tolist()
            col_type = str(df[column].dtype)
            encoded_values = encode_column(values, col_type)
            
           
            batch_size = get_optimal_batch_size(col_type, len(encoded_values))
            batches = [encoded_values[i:i + batch_size] for i in range(0, len(encoded_values), batch_size)]
            
            if len(batches) > 0 and len(batches[-1]) < batch_size:
                batches[-1] += [0.0] * (batch_size - len(batches[-1]))
            encrypted_batches = []
            total_size = 0
            
            for batch in batches:
                vector = ts.ckks_vector(context, batch)
                serialized = vector.serialize()
                total_size += len(serialized)
                encrypted_batches.append(base64.b64encode(serialized).decode('utf-8'))
            
            return {
                "column": column,
                "encrypted": encrypted_batches,
                "encoding_info": {
                    "type": "categorical" if col_type.startswith("object") else "numeric",
                    "batch_size": batch_size,
                    "original_length": len(values),
                    "batches": len(batches)
                },
                "size": total_size
            }
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(8, len(df.columns))) as executor:
            results = list(executor.map(process_column, df.columns))
        for result in results:
            column = result["column"]
            encrypted_data[column] = result["encrypted"]
            encoding_info[column] = result["encoding_info"]
            column_sizes[column] = result["size"]
        serialized_context = base64.b64encode(context.serialize(save_public_key=True)).decode('utf-8')
        output = {
            "encrypted_columns": encrypted_data,
            "context": serialized_context,
            "schema": optimized_schema,
            "encoding_info": encoding_info,
            "row_count": len(df),
            "column_sizes": column_sizes 
        }
        json_str = json.dumps(output)
        json_buffer = io.BytesIO()
        with gzip.GzipFile(fileobj=json_buffer, mode="wb", compresslevel=compression_level) as gz:
            gz.write(json_str.encode('utf-8'))
        
        json_buffer.seek(0)
        compressed_data = json_buffer.getvalue()

        elapsed_time = time.time() - start_time
        size_mb = len(compressed_data) / (1024**2)
        logger.info(f"Dataset {dataset_id} encrypted, size: {size_mb:.2f} MB, time: {elapsed_time:.2f}s")
        size_ratio = size_mb / (len(decrypted_data) / (1024**2))
        logger.info(f"Size ratio: {size_ratio:.2f}x, Speed: {(size_mb/elapsed_time):.2f} MB/s")

        response = HttpResponse(
            compressed_data,
            content_type="application/gzip",
            status=200
        )
        response['Content-Disposition'] = f"attachment; filename={dataset.title}_encrypted.json.gz"
        response['Content-Length'] = len(compressed_data)
        response['X-Processing-Time'] = f"{elapsed_time:.2f}s"
        response['X-Compression-Ratio'] = f"{size_ratio:.2f}x"
        
        return response

    except Dataset.DoesNotExist:
        logger.error(f"Dataset not found: {dataset_id}")
        return HttpResponse(
            json.dumps({"error": "Dataset not found"}),
            status=404,
            content_type="application/json"
        )
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return HttpResponse(
            json.dumps({"error": str(e)}),
            status=400,
            content_type="application/json"
        )
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        return HttpResponse(
            json.dumps({"error": "Failed to prepare encrypted download"}),
            status=500,
            content_type="application/json"
        )
    




    