
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Dataset
from .serializer import DatasetSerializer
import pandas as pd
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

logger = logging.getLogger(__name__)


MINIO_URL = "10.72.98.137:9000"
minio_client = Minio(endpoint=MINIO_URL, access_key="admin", secret_key="Notgood1", secure=False)
BUCKET = "alacrity"
DATASET_CACHE = OrderedDict() 
CACHE_LOCK = Lock()
MAX_CACHE_SIZE = 100  

def get_jwt_hash(request):
    """Extract and hash JWT token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        return hashlib.sha256(token.encode()).hexdigest()
    return None

def load_dataset_into_cache(request, dataset_id):
    """Load dataset from MinIO into cache, decrypting with Fernet."""
    jwt_hash = get_jwt_hash(request)
    if not jwt_hash:
        raise ValueError("No valid JWT token found")

    cache_key = f"{dataset_id}:{jwt_hash}"
    with CACHE_LOCK:
        if cache_key in DATASET_CACHE:
            DATASET_CACHE.move_to_end(cache_key) 
            logger.info(f"Dataset {cache_key} retrieved from cache")
            return DATASET_CACHE[cache_key]

        try:
            dataset = Dataset.objects.get(dataset_id=dataset_id)
            cipher = Fernet(dataset.encryption_key.encode())
            expected_prefix = f"http://{MINIO_URL}/{BUCKET}/"
            link = dataset.link
            if not link:
                return Response({"error": "Dataset link is missing"}, status=400)
            if link.startswith("http://http://"):
                link = link.replace("http://http://", "http://", 1)
                logger.warning(f"Corrected malformed link for dataset {dataset_id}: {link}")
            if not link.startswith(expected_prefix):
                raise ValueError(f"Dataset link does not start with {expected_prefix}")

            file_key = link.split(expected_prefix)[1]
            response = minio_client.get_object(bucket_name=BUCKET, object_name=file_key)
            encrypted_data = response.read()
            decrypted_data = cipher.decrypt(encrypted_data)

            parquet_file = io.BytesIO(decrypted_data)
            df = pd.read_parquet(parquet_file, engine="pyarrow")
            con = duckdb.connect(":memory:")
            con.register("temp", df)
            if len(DATASET_CACHE) >= MAX_CACHE_SIZE:
                DATASET_CACHE.popitem(last=False)  # Remove least recently used
            DATASET_CACHE[cache_key] = con
            logger.info(f"Dataset {cache_key} loaded into cache")
            return con
        except Dataset.DoesNotExist:
            raise
        except Exception as e:
            logger.error(f"Failed to load dataset {dataset_id}: {e}", exc_info=True)
            raise

@api_view(['GET'])
def dataset_detail(request, dataset_id):
    """Retrieve dataset details and check if it's cached."""
    try:
        dataset = Dataset.objects.get(dataset_id=dataset_id)
        jwt_hash = get_jwt_hash(request)
        if not jwt_hash:
            return Response({"error": "Authentication required"}, status=401)
        cache_key = f"{dataset_id}:{jwt_hash}"
        load_dataset_into_cache(request, dataset_id)
        serializer = DatasetSerializer(dataset)
        data = serializer.data
        data['is_loaded'] = cache_key in DATASET_CACHE
        return Response(data, status=200)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found"}, status=404)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        logger.error(f"Error in dataset_detail: {e}", exc_info=True)
        return Response({"error": "Failed to load dataset"}, status=500)

@api_view(['POST'])
def clear_dataset_cache(request, dataset_id):
    """Clear dataset from cache."""
    try:
        jwt_hash = get_jwt_hash(request)
        if not jwt_hash:
            return Response({"error": "Authentication required"}, status=401)
        cache_key = f"{dataset_id}:{jwt_hash}"
        with CACHE_LOCK:
            if cache_key in DATASET_CACHE:
                DATASET_CACHE[cache_key].close()
                del DATASET_CACHE[cache_key]
                logger.info(f"Cache cleared for {cache_key}")
                return Response({"message": "Cache cleared"}, status=200)
        return Response({"message": "No cache to clear"}, status=200)
    except Exception as e:
        logger.error(f"Error clearing cache for {dataset_id}: {e}", exc_info=True)
        return Response({"error": "Failed to clear cache"}, status=500)



def calculate_mean(df, column, filter_query):
    """Calculate mean of a column."""
    query = f"SELECT AVG({column}) FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    result = df.execute(query).fetchone()[0]
    return {"operation": "mean", "value": float(result) if result is not None else None, "column": column}

def calculate_median(df, column, filter_query):
    """Calculate median of a column."""
    query = f"SELECT MEDIAN({column}) FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    result = df.execute(query).fetchone()[0]
    return {"operation": "median", "value": float(result) if result is not None else None, "column": column}

def calculate_mode(df, column, filter_query):
    """Calculate mode of a column."""
    query = f"SELECT MODE({column}) FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    result = df.execute(query).fetchone()[0]
    return {"operation": "mode", "value": result, "column": column}

def calculate_t_test(df, column1, column2, filter_query):
    """Perform independent t-test with boxplot visualization."""
    query = f"SELECT {column1}, {column2} FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    df_result = df.execute(query).fetchdf()
    if not pd.api.types.is_numeric_dtype(df_result[column1]) or not pd.api.types.is_numeric_dtype(df_result[column2]):
        raise ValueError("Both columns must be numerical for t-test")
    t_stat, p_value = stats.ttest_ind(df_result[column1].dropna(), df_result[column2].dropna())
    
    # Visualization: Boxplot
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
    
    # Accuracy check: Normality and variance assumptions
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

def calculate_chi_square(df, column1, column2, filter_query):
    """Perform Chi-Square test with heatmap visualization."""
    query = f"SELECT {column1}, {column2} FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    df_result = df.execute(query).fetchdf()
    if df_result.empty:
        raise ValueError("No data after filtering")
    contingency_table = df_result.pivot_table(index=column1, columns=column2, aggfunc='size', fill_value=0)
    chi2, p, dof, expected = stats.chi2_contingency(contingency_table)
    
    # Visualization: Heatmap
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

def calculate_anova(df, column1, column2, filter_query):
    """Perform one-way ANOVA with boxplot visualization, without group means."""
    query = f"SELECT {column1}, {column2} FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    df_result = df.execute(query).fetchdf()
    if not pd.api.types.is_numeric_dtype(df_result[column1]):
        raise ValueError(f"{column1} must be numerical for ANOVA")
    groups = [group[column1].dropna() for name, group in df_result.groupby(column2)]
    if not groups or any(len(g) == 0 for g in groups):
        raise ValueError("Not enough data in groups for ANOVA")
    f_stat, p_value = stats.f_oneway(*groups)
    
    # Visualization: Boxplot
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

def calculate_correlation(df, column1, column2, filter_query, method="pearson"):
    """Calculate Pearson or Spearman correlation with scatterplot."""
    query = f"SELECT {column1}, {column2} FROM temp"
    if filter_query:
        query += f" WHERE {filter_query}"
    df_result = df.execute(query).fetchdf()
    if len(df_result) > 1000:  # Downsample for plotting
        df_result = df_result.sample(n=1000, random_state=42)
    if not pd.api.types.is_numeric_dtype(df_result[column1]) or not pd.api.types.is_numeric_dtype(df_result[column2]):
        raise ValueError(f"Both columns must be numerical for {method} correlation")
    corr_func = stats.pearsonr if method == "pearson" else stats.spearmanr
    corr, p_value = corr_func(df_result[column1].dropna(), df_result[column2].dropna())
    
    # Visualization: Scatterplot with regression line
    plt.figure(figsize=(8, 6))
    plt.scatter(df_result[column1], df_result[column2], alpha=0.5, color='blue', label='Data Points')
    slope, intercept, _, _, _ = linregress(df_result[column1].dropna(), df_result[column2].dropna())
    line = slope * df_result[column1] + intercept
    plt.plot(df_result[column1], line, color='red', label=f'Regression Line (r={corr:.3f})')
    plt.xlabel(column1)
    plt.ylabel(column2)
    plt.title(f"{method.capitalize()} Correlation: {corr:.3f}")
    plt.legend()
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
    """Perform statistical analysis based on request parameters."""
    operation = request.GET.get("operation")
    column = request.GET.get("column")
    column1 = request.GET.get("column1")
    column2 = request.GET.get("column2")
    filter_column = request.GET.get("filter_column")
    filter_operator = request.GET.get("filter_operator")
    filter_value = request.GET.get("filter_value")

    try:
        if not operation:
            logger.error("No operation specified")
            return Response({"error": "Operation parameter is required"}, status=400)

        logger.info(f"Performing {operation} on dataset {dataset_id}")
        dataset = Dataset.objects.get(dataset_id=dataset_id)
        con = load_dataset_into_cache(request, dataset_id)
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
            "pearson": lambda df, col1, col2, filt: calculate_correlation(df, col1, col2, filt, "pearson"),
            "spearman": lambda df, col1, col2, filt: calculate_correlation(df, col1, col2, filt, "spearman"),
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
    """List all datasets."""
    datasets = Dataset.objects.select_related('contributor_id__organization').all()
    serializer = DatasetSerializer(datasets, many=True)
    print(serializer.data)
    return Response({"datasets": serializer.data}, status=status.HTTP_200_OK)

@api_view(['GET'])
def dataset_view(request, dataset_id):
    """Retrieve a single dataset's details."""
    try:
        dataset = Dataset.objects.select_related('contributor_id__organization').get(dataset_id=dataset_id)
        serializer = DatasetSerializer(dataset)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": "Failed to fetch dataset"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)