"""
this is an extrension of views. py but it takes care of the analysis of the dataset
"""
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

logger = logging.getLogger(__name__)

MINIO_URL = "10.72.98.137:9000"
minio_client = Minio(
    endpoint=MINIO_URL,
    access_key="admin",
    secret_key="Notgood1",
    secure=False
)
BUCKET = "alacrity"  # Updated to match your link

DATASET_CACHE = {}

def get_jwt_hash(request):
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        return hashlib.sha256(token.encode()).hexdigest()
    

    return None

"""
this function is used to load the dataset into the cache
the function takes in the request and the dataset_id
the function then loads the dataset into the cache

"""

def load_dataset_into_cache(request, dataset_id):
    jwt_hash = get_jwt_hash(request)
    if not jwt_hash:
        raise ValueError("No valid JWT token found")

    cache_key = f"{dataset_id}:{jwt_hash}"
    if cache_key in DATASET_CACHE:
        logger.info(f"Dataset {cache_key} already in cache")
        return DATASET_CACHE[cache_key]

    try:
        dataset = Dataset.objects.get(dataset_id=dataset_id)
        cipher = Fernet(dataset.encryption_key.encode())
        
        # Define expected prefix
        expected_prefix = f"http://{MINIO_URL}/{BUCKET}/"
        link = dataset.link
        if not link:
            return Response({"error": "Dataset link is missing"}, status=400)
        print(dataset.link)
        print(expected_prefix)
        
        
        if link.startswith("http://http://"):
            link = link.replace("http://http://", "http://", 1)
            logger.warning(f"Corrected malformed link for dataset {dataset_id}: {link}")

        
        if not link.startswith(expected_prefix):
            logger.error(f"Malformed link for dataset {dataset_id}: {link}")
            raise ValueError(f"Dataset link does not start with {expected_prefix}")
        
        file_key = link.split(expected_prefix)[1]
        print(file_key)
        
        logger.info(f"Fetching from MinIO: {file_key}")
        response = minio_client.get_object(bucket_name=BUCKET, object_name=file_key)
        encrypted_data = response.read()
        decrypted_data = cipher.decrypt(encrypted_data)

        parquet_file = io.BytesIO(decrypted_data)
        df = pd.read_parquet(parquet_file, engine="pyarrow")
        con = duckdb.connect(":memory:")
        con.register("temp", df)
        DATASET_CACHE[cache_key] = con
        logger.info(f"Dataset {cache_key} loaded into cache")
        return con
    except Exception as e:
        logger.error(f"Failed to load dataset {dataset_id}: {e}", exc_info=True)
        raise

@api_view(['GET'])
def dataset_detail(request, dataset_id):
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
        return Response({"error": "Failed to load dataset"}, status=500)
    """
    this function is used to clear the cache of the dataset

    IT TAKES IN THE DATASET ID AND THE JWT HASH AND THEN CLEARS THE CACHE



    """

@api_view(['POST'])
def clear_dataset_cache(request, dataset_id):
    try:
        jwt_hash = get_jwt_hash(request)
        if not jwt_hash:
            return Response({"error": "Authentication required"}, status=401)
        
        cache_key = f"{dataset_id}:{jwt_hash}"
        if cache_key in DATASET_CACHE:
            del DATASET_CACHE[cache_key]
            logger.info(f"Cache cleared for {cache_key}")
            return Response({"message": "Cache cleared"}, status=200)
        return Response({"message": "No cache to clear"}, status=200)
    except Exception as e:
        logger.error(f"Error clearing cache for {dataset_id}: {e}", exc_info=True)
        return Response({"error": "Failed to clear cache"}, status=500)



"""
this function is used to analyze the dataset
the function takes in the dataset_id and the operation to be performed on the dataset
The function then performs the operation on the dataset and returns the result
TODO: Add more operations
TODO: Add more error handling AND ALSO REFACTOR THE CODE
"""
@api_view(['GET'])
def analyze_dataset(request, dataset_id):
    operation = request.GET.get("operation")
    column = request.GET.get("column")
    column1 = request.GET.get("column1")
    column2 = request.GET.get("column2")
    filter_query = request.GET.get("filter", "")

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

        if operation == "mean":
            if not column:
                return Response({"error": "Column parameter is required for mean"}, status=400)
            query = f"SELECT AVG({column}) FROM temp"
            if filter_query:
                query += f" WHERE {filter_query}"
            logger.info(f"DuckDB query: {query}")
            result = con.execute(query).fetchone()[0]
            return Response({"mean": float(result), "column": column, "filter": filter_query}, status=200)

        elif operation == "median":
            if not column:
                return Response({"error": "Column parameter is required for median"}, status=400)
            query = f"SELECT MEDIAN({column}) FROM temp"
            if filter_query:
                query += f" WHERE {filter_query}"
            logger.info(f"DuckDB query: {query}")
            result = con.execute(query).fetchone()[0]
            return Response({"median": float(result), "column": column, "filter": filter_query}, status=200)

        elif operation == "mode":
            if not column:
                return Response({"error": "Column parameter is required for mode"}, status=400)
            query = f"SELECT MODE({column}) FROM temp"
            if filter_query:
                query += f" WHERE {filter_query}"
            logger.info(f"DuckDB query: {query}")
            result = con.execute(query).fetchone()[0]
            return Response({"mode": result, "column": column, "filter": filter_query}, status=200)

        elif operation == "t_test":
            if not (column1 and column2):
                return Response({"error": "Two columns required for t-test"}, status=400)
            if filter_query:
                df = con.execute(f"SELECT {column1}, {column2} FROM temp WHERE {filter_query}").fetchdf()
            else:
                df = con.execute(f"SELECT {column1}, {column2} FROM temp").fetchdf()
            t_stat, p_value = stats.ttest_ind(df[column1].dropna(), df[column2].dropna())
            return Response({"t_stat": float(t_stat), "p_value": float(p_value), "column1": column1, "column2": column2, "filter": filter_query}, status=200)

        elif operation == "chi_square":
            if not (column1 and column2):
                return Response({"error": "Two columns required for Chi-Square"}, status=400)
            query = f"SELECT {column1}, {column2} FROM temp"
            if filter_query:
                query += f" WHERE {filter_query}"
            contingency_table = con.execute(query).fetchdf().pivot_table(index=column1, columns=column2, aggfunc='size', fill_value=0)
            chi2, p, dof, expected = stats.chi2_contingency(contingency_table)
            return Response({"chi2": float(chi2), "p_value": float(p), "degrees_of_freedom": int(dof), "column1": column1, "column2": column2, "filter": filter_query}, status=200)

        elif operation == "anova":
            if not (column1 and column2):
                return Response({"error": "Two columns required for ANOVA"}, status=400)
            query = f"SELECT {column1}, {column2} FROM temp"
            if filter_query:
                query += f" WHERE {filter_query}"
            df = con.execute(query).fetchdf()
            groups = [group[column1].dropna() for _, group in df.groupby(column2)]
            f_stat, p_value = stats.f_oneway(*groups)
            return Response({"f_stat": float(f_stat), "p_value": float(p_value), "value_column": column1, "group_column": column2, "filter": filter_query}, status=200)

        elif operation == "pearson":
            if not (column1 and column2):
                return Response({"error": "Two columns required for Pearson"}, status=400)
            query = f"SELECT {column1}, {column2} FROM temp"
            if filter_query:
                query += f" WHERE {filter_query}"
            df = con.execute(query).fetchdf()
            corr, p_value = stats.pearsonr(df[column1].dropna(), df[column2].dropna())
            return Response({"correlation": float(corr), "p_value": float(p_value), "column1": column1, "column2": column2, "filter": filter_query}, status=200)

        elif operation == "spearman":
            if not (column1 and column2):
                return Response({"error": "Two columns required for Spearman"}, status=400)
            query = f"SELECT {column1}, {column2} FROM temp"
            if filter_query:
                query += f" WHERE {filter_query}"
            df = con.execute(query).fetchdf()
            corr, p_value = stats.spearmanr(df[column1].dropna(), df[column2].dropna())
            return Response({"correlation": float(corr), "p_value": float(p_value), "column1": column1, "column2": column2, "filter": filter_query}, status=200)

        else:
            return Response({"error": f"Unsupported operation: {operation}"}, status=400)

    except Dataset.DoesNotExist:
        logger.error(f"Dataset not found: {dataset_id}")
        return Response({"error": "Dataset not found"}, status=404)
    except Exception as e:
        logger.error(f"Error in analyze_dataset: {e}", exc_info=True)
        return Response({"error": "Something went wrong"}, status=500)

@api_view(['GET'])
def all_datasets_view(request):
    """
    Fetch all datasets with related contributor and organization details.
    Returns serialized data including contributor_name and organization_name.
    """
    datasets = Dataset.objects.select_related('contributor_id__organization').all()
    serializer = DatasetSerializer(datasets, many=True)
    print(serializer.data.organization_name)
    return Response({"datasets": serializer.data}, status=status.HTTP_200_OK)