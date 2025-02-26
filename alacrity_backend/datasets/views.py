import io
import json
import logging
import os
import re
import tempfile
import threading
import uuid
from datetime import datetime
from urllib.parse import urlparse
import boto3
import pandas as pd
from cryptography.fernet import Fernet
from django.core.cache import cache
from django.core.files.storage import default_storage
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.views.decorators.http import require_http_methods
from minio import Minio
from nanoid import generate
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.negotiation import DefaultContentNegotiation
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from scipy.stats import mode
from storages.backends.s3boto3 import S3Boto3Storage

from alacrity_backend.settings import (MINIO_ACCESS_KEY, MINIO_BUCKET_NAME,
                                     MINIO_SECRET_KEY, MINIO_URL)
from users.decorators import role_required

from .models import Dataset
from .serializer import DatasetSerializer
# from .tasks import compute_correlation, fetch_json_from_minio

default_storage = S3Boto3Storage()

logger = logging.getLogger(__name__)

def is_valid_url(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc, result.path])  
    except:
        return False




minio_client = Minio(
    endpoint="10.72.98.137:9000",
    access_key="admin",
    secret_key="Notgood1",
    secure=False  
)
BUCKET = MINIO_BUCKET_NAME

def generate_id():
    return str(uuid.uuid4())



@method_decorator(csrf_exempt, name='dispatch')
# @method_decorator(role_required(['organization_admin', 'contributor']), name='dispatch')
class CreateDatasetView(APIView):
    content_negotiation_class = DefaultContentNegotiation
    renderer_classes = [JSONRenderer]
    parser_classes = [MultiPartParser, FormParser]

    @role_required(['organization_admin', 'contributor'])

    def post(self, request, *args, **kwargs):
        print("Inside POST method")
        print(request.FILES)
        start = datetime.now()
        print("Start time:", start)

        try:
            file = request.FILES.get('file')
            if not file:
                logger.error("No file uploaded")
                return Response({"error": "No file uploaded"}, status=400)

            file_extension = file.name.split(".")[-1]
            file_basename = file.name.split(".")[0]
            unique_filename = f"{uuid.uuid4()}_{file_basename}.parquet.enc"

            # Load and compress to Parquet
            logger.info(f"Reading CSV: {file.name}")
            df = pd.read_csv(file)
            buffer = io.BytesIO()
            logger.info("Converting to Parquet with zstd")
            df.to_parquet(buffer, compression="zstd", compression_level=19, engine="pyarrow")
            buffer.seek(0)

          
            key = Fernet.generate_key()
            cipher = Fernet(key)
            logger.info("Encrypting data")
            encrypted_data = cipher.encrypt(buffer.getvalue())

            # 
            file_key = f"encrypted/{unique_filename}"
            logger.info(f"Uploading to MinIO: {file_key}")
            minio_client.put_object(
                bucket_name=BUCKET,
                object_name=file_key,
                data=io.BytesIO(encrypted_data),
                length=len(encrypted_data)
            )
            file_url = f"{MINIO_URL}/{BUCKET}/{file_key}"
            # file_url = f"s3://{BUCKET}/{file_key}"

            # Extract and validate form data
            title = request.POST.get('title')
            category = request.POST.get('category')
            description = request.POST.get('description')
            if not title or len(title) > 100:
                logger.error("Invalid title")
                return Response({"error": "Invalid title"}, status=400)
            if not description or len(description) < 10 or len(description) > 100000:
                logger.error("Invalid description")
                return Response({"error": "Invalid description"}, status=400)

            dataset_id = generate_id()
            print("Dataset ID:", dataset_id)
            print("Dataset ID:", dataset_id)
            print("Dataset ID:", dataset_id)
            schema = {col: str(t) for col, t in df.dtypes.items()}

            # Save to database
            logger.info(f"Saving dataset metadata: {dataset_id}")
            dataset = Dataset.objects.create(
                dataset_id=dataset_id,
                title=title,
                category=category,
                link=file_url,
                description=description,
                encryption_key=key.decode(),
                schema=schema
            )

            stop = datetime.now()
            print("End time:", stop)
            print("Time taken:", stop - start)
            logger.info(f"Upload completed in {stop - start}")

            return Response({"message": "Dataset created successfully", "dataset_id": dataset_id, "file_url": file_url}, status=201)

        except Exception as e:
            logger.error(f"Error: {e}", exc_info=True)
            return Response({"error": "Something went wrong"}, status=500)







# @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
minio_client = Minio(
    endpoint="10.72.98.137:9000",
    access_key="admin",
    secret_key="Notgood1",
    secure=False  
)

def fetch_dataset_from_minio(dataset_url):
    """Fetch dataset in chunks from MinIO and return a generator (iterator)."""
    bucket_name = "alacrity"
    object_name = dataset_url.split("/")[-1]

    try:
        response = minio_client.get_object(bucket_name, object_name)
        
        # Read CSV in chunks of 10,000 rows to prevent memory issues
        chunk_iterator = pd.read_csv(io.BytesIO(response.read()), chunksize=10000)
        
        return chunk_iterator 

    except Exception as e:
        print(f"Error fetching dataset from MinIO: {e}")
        return None


@api_view(['GET'])
def get_datasets(request):
    """Fetch all available datasets for selection"""
    datasets = Dataset.objects.all().values("dataset_id", "title", "category", "description", "link")
    return Response({"datasets": list(datasets)}, status=200)

@api_view(['GET', 'POST'])
def pre_analysis(request, dataset_id=None):
    """Perform pre-analysis on either the full dataset or the filtered dataset (if session_id is provided)."""
    session_id = request.GET.get('session_id', None)

    if session_id:
        dataset = cache.get(session_id)
        if dataset is None:
            print("Session expired or invalid session ID.")
            return Response({"error": "Session expired or invalid session ID"}, status=400)
        print(f"Using filtered dataset from cache (Session: {session_id})")
        df = pd.DataFrame(dataset)
    else:
        print(f"Loading FULL dataset for {dataset_id}") 
        dataset_obj = get_object_or_404(Dataset, dataset_id=dataset_id)
        chunk_iterator = fetch_dataset_from_minio(dataset_obj.link)
        if chunk_iterator is None:
            return Response({"error": "Dataset could not be loaded from MinIO"}, status=500)
        df = pd.concat(chunk_iterator, ignore_index=True)

    total_rows = len(df)
    print(f"Pre-analysis dataset size: {total_rows}")

    return Response({
        "total_rows": total_rows,
        "columns": list(df.columns),
        "duplicate_rows": df.duplicated().sum(),
        "missing_values": df.isnull().sum().to_dict(),
        "categorical_summary": {col: df[col].nunique() for col in df.select_dtypes(include=['object'])}
    })

@api_view(['GET', 'POST'])
def descriptive_statistics(request, dataset_id=None):
    """
    Return descriptive statistics on either:
    - The **filtered dataset** (if `session_id` is provided)
    - The **entire dataset** (if only `dataset_id` is provided)
    """
    session_id = request.GET.get('session_id', None)

    if session_id:
        dataset = cache.get(session_id)
        if dataset is None:
            return Response({"error": "Session expired or invalid session ID"}, status=400)
        df = pd.DataFrame(dataset)
    else:
        dataset_obj = get_object_or_404(Dataset, dataset_id=dataset_id)
        chunk_iterator = fetch_dataset_from_minio(dataset_obj.link)
        if chunk_iterator is None:
            return Response({"error": "Dataset could not be loaded from MinIO"}, status=500)
        df = pd.concat(chunk_iterator, ignore_index=True)

    numeric_cols = df.select_dtypes(include=["number"])

    if numeric_cols.empty:
        return Response({"error": "No numeric columns available for analysis"}, status=400)

    mean_values = numeric_cols.mean().to_dict()
    median_values = numeric_cols.median().to_dict()

    mode_values = {}
    for col in numeric_cols.columns:
        mode_res = mode(numeric_cols[col].dropna(), keepdims=True)
        mode_values[col] = mode_res.mode[0] if len(mode_res.mode) > 0 else None

    return Response({
        "mean": mean_values,
        "median": median_values,
        "mode": mode_values
    })


@api_view(['GET'])
def get_filter_options(request, dataset_id):
    """Efficiently extract column names and unique categorical values for filtering UI."""
    dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
    chunk_iterator = fetch_dataset_from_minio(dataset.link)

    if chunk_iterator is None:
        return Response({"error": "Dataset could not be loaded"}, status=500)

    try:
        first_chunk = next(chunk_iterator)  # Load the first 10,000 rows

        column_details = {
            col: {
                "type": "numeric" if first_chunk[col].dtype.kind in "biufc" else "categorical",
                "values": sorted(first_chunk[col].dropna().astype(str).str.strip().str.lower().unique().tolist()) 
                          if first_chunk[col].dtype == "object" else []
            }
            for col in first_chunk.columns
        }

        return Response({
            "dataset_id": dataset_id,
            "columns": column_details
        })

    except StopIteration:
        return Response({"error": "Dataset is empty"}, status=400)

    except Exception as e:
        return Response({"error": f"Server error: {str(e)}"}, status=500)
    
from django.core.cache import cache
import uuid

@api_view(['POST'])
def aggregate_dataset(request, dataset_id):
    session_id = request.GET.get('session_id', None)

    if session_id:
        dataset = cache.get(session_id)
        if dataset is None:
            return Response({"error": "Session expired or invalid session ID"}, status=400)
        df = pd.DataFrame(dataset)
    else:
        dataset_obj = get_object_or_404(Dataset, dataset_id=dataset_id)
        chunk_iterator = fetch_dataset_from_minio(dataset_obj.link)
        if chunk_iterator is None:
            return Response({"error": "Dataset could not be loaded from MinIO"}, status=500)
        df = pd.concat(chunk_iterator, ignore_index=True)

    group_by = request.data.get("group_by", [])
    aggregation_functions = request.data.get("aggregation_functions", {})

    if not group_by or not aggregation_functions:
        return Response({"error": "Group by columns and aggregation functions are required"}, status=400)

    aggregated_data = df.groupby(group_by).agg(aggregation_functions).reset_index()

    return Response({"aggregated_data": aggregated_data.to_dict(orient="records")})

@api_view(['POST'])
def filter_and_clean_dataset(request, dataset_id):
    dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
    chunk_iterator = fetch_dataset_from_minio(dataset.link)

    if chunk_iterator is None:
        return Response({"error": "Dataset could not be loaded from MinIO"}, status=500)

    filters = request.data.get("filters", [])
    selected_columns = request.data.get("columns", [])
    cleaning_options = request.data.get("cleaning_options", {})
    automated_filters = request.data.get("automated_filters", {})

    filtered_results = []
    total_before = 0
    total_after = 0

    for chunk in chunk_iterator:
        total_before += len(chunk)
        chunk.columns = chunk.columns.str.strip().str.lower()

        for filter_condition in filters:
            column = filter_condition.get("column").strip().lower()
            operator = filter_condition.get("operator")
            value = filter_condition.get("value")

            if column not in chunk.columns:
                print(f"Column '{column}' not found in dataset.")
                continue

            if chunk[column].dtype.kind in "biufc":
                try:
                    value = float(value)
                except ValueError:
                    return Response({"error": f"Invalid numeric value for column '{column}'"}, status=400)
            else:
                value = str(value).strip().lower()

            if operator == "=":
                chunk = chunk[chunk[column] == value]
            elif operator == ">":
                chunk = chunk[chunk[column] > value]
            elif operator == "<":
                chunk = chunk[chunk[column] < value]
            elif operator == ">=":
                chunk = chunk[chunk[column] >= value]
            elif operator == "<=":
                chunk = chunk[chunk[column] <= value]
            elif operator == "!=":
                chunk = chunk[chunk[column] != value]
            else:
                return Response({"error": f"Unsupported operator '{operator}'"}, status=400)

        if automated_filters.get("remove_missing_values"):
            chunk = chunk.dropna()
        if automated_filters.get("remove_duplicates"):
            chunk = chunk.drop_duplicates()
        if automated_filters.get("remove_outliers"):
            for col in chunk.select_dtypes(include=["number"]).columns:
                Q1 = chunk[col].quantile(0.25)
                Q3 = chunk[col].quantile(0.75)
                IQR = Q3 - Q1
                chunk = chunk[(chunk[col] >= (Q1 - 1.5 * IQR)) & (chunk[col] <= (Q3 + 1.5 * IQR))]

        if selected_columns:
            selected_columns = [col.strip().lower() for col in selected_columns]
            chunk = chunk[selected_columns]

        if cleaning_options.get("handle_missing_values"):
            chunk = chunk.fillna(cleaning_options["handle_missing_values"])
        if cleaning_options.get("normalize"):
            if cleaning_options["normalize"] == "min_max":
                chunk = (chunk - chunk.min()) / (chunk.max() - chunk.min())
            elif cleaning_options["normalize"] == "z_score":
                chunk = (chunk - chunk.mean()) / chunk.std()

        total_after += len(chunk)
        filtered_results.extend(chunk.to_dict(orient="records"))

    session_id = str(uuid.uuid4())
    cache.set(session_id, filtered_results, timeout=3600)

    print(f"Total rows before filtering: {total_before}")
    print(f"Filtered dataset to {total_after} rows. Session ID: {session_id}")

    return Response({"filtered_data": filtered_results, "session_id": session_id}, status=200)















# $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
# fetching the dataset for display




