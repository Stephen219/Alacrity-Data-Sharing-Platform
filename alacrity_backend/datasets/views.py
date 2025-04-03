import io
import json
import logging
import os
import re
import tempfile
import threading
import uuid

from datetime import datetime
from django.utils import timezone

from datetime import datetime, timedelta
from typing import Any, Dict, List

from urllib.parse import urlparse

import boto3
import pandas as pd
import requests
from charset_normalizer import detect
from cryptography.fernet import Fernet
from minio import Minio
from nanoid import generate
from scipy.stats import mode
from storages.backends.s3boto3 import S3Boto3Storage

from django.core.cache import cache
from django.core.files.storage import default_storage
from django.db.models import Avg, Count, F, Q, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.views.decorators.http import require_http_methods

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.negotiation import DefaultContentNegotiation
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from alacrity_backend.settings import (
    MINIO_ACCESS_KEY,
    MINIO_BUCKET_NAME,
    MINIO_SECRET_KEY,
    MINIO_URL,
    MINIO_SECURE,
)
from dataset_requests.models import DatasetRequest
from payments.models import DatasetPurchase
from research.models import AnalysisSubmission, PublishedResearch
from users.decorators import role_required
from .models import Dataset , Feedback ,  ViewHistory
from organisation.models import FollowerHistory
from .serializer import DatasetSerializer , randomSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from random import choice
from datetime import timedelta
from django.db.models import F, ExpressionWrapper, DurationField, Sum


from .models import Dataset, DatasetAccessMetrics, Feedback, Chat, Message
from .serializer import DatasetSerializer


# from django.http import JsonResponse



default_storage = S3Boto3Storage()

logger = logging.getLogger(__name__)

def is_valid_url(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc, result.path])
    except:
        return False

minio_client = Minio(
    endpoint= MINIO_URL,
    access_key=MINIO_ACCESS_KEY,
    secret_key= MINIO_SECRET_KEY,
    secure= MINIO_SECURE
    )


BUCKET = MINIO_BUCKET_NAME



def generate_id():
    """Generate a unique ID for the dataset."""
    return str(uuid.uuid4())
def convert_to_mbs(size_in_bytes):
    """Convert bytes to megabytes. 
    Args:
        size_in_bytes (int): Size in bytes.
    Returns:
        float: Size in megabytes. to the nearest 2 decimal places
    """
    return round(size_in_bytes / (1024 * 1024), 2)

@method_decorator(csrf_exempt, name='dispatch')
class CreateDatasetView(APIView):
    renderer_classes = [JSONRenderer]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @role_required(['organization_admin', 'contributor'])
    def post(self, request, *args, **kwargs):

        """Handle the dataset upload and processing."""
        
        file_size = 0
        number_of_rows = 0
        
        start_time = datetime.now()
        logger.info(f"Processing upload request at {start_time}")
        local_file = request.FILES.get('file')
        file_url = request.POST.get('fileUrl')
        file_name = request.POST.get('fileName', 'uploaded_file')
        access_token = request.POST.get('accessToken')
        try:
            if local_file:
                logger.info(f"Processing local file: {local_file.name}")
                file_buffer = io.BytesIO(local_file.read())
                base_name = local_file.name.split('.')[0]
                file_size = convert_to_mbs(local_file.size)
                
                
                logger.info(f"Local file size: {file_size} bytes")
            elif file_url:
                logger.info(f"Processing cloud URL: {file_url}")
                if "drive.google.com" in file_url:
                    logger.info("Downloading from Google Drive")
                    if not access_token:
                        logger.error("Google Drive access token is missing")
                        return Response({"error": "Google Drive access token required"}, status=400)
                    file_buffer = self._download_from_google_drive(file_url, access_token)
                    file_size = convert_to_mbs(file_buffer.getbuffer().nbytes)

                    logger.info(f"Google Drive file size: {file_size} bytes")
                elif "dropbox.com" in file_url or "dl.dropboxusercontent.com" in file_url:
                    logger.info("Downloading from Dropbox")
                    file_buffer = self._download_from_dropbox(file_url)
                    file_size = convert_to_mbs(file_buffer.getbuffer().nbytes)
                    logger.info(f"Dropbox file size: {file_size} bytes")
                else:
                    logger.error("Unsupported cloud provider")
                    return Response({"error": "Unsupported cloud provider"}, status=400)
                base_name = file_name.split('.')[0] if '.' in file_name else file_name
            else:
                logger.error("No file or URL provided")
                return Response({"error": "No file or URL provided"}, status=400)
            file_buffer.seek(0)
            raw_data = file_buffer.read()
            if not raw_data:
                logger.error("Uploaded file is empty")
                return Response({"error": "Uploaded file is empty"}, status=400)
            detection = detect(raw_data)
            detected_encoding = detection.get('encoding', 'utf-8')
            confidence = detection.get('confidence', 0)
            logger.info(f"Detected encoding: {detected_encoding} with confidence: {confidence}")

            if detected_encoding is None or confidence < 0.8:
                logger.warning("Low confidence in encoding detection, attempting common encodings")
                encodings_to_try = ['utf-8', 'latin1', 'windows-1252']
            else:
                encodings_to_try = [detected_encoding, 'latin1', 'windows-1252']
            df = None
            file_buffer.seek(0)
            for encoding in encodings_to_try:
                try:
                    logger.info(f"Attempting to read CSV with encoding: {encoding}")
                    file_buffer.seek(0)
                    df = pd.read_csv(file_buffer, encoding=encoding)
                    number_of_rows = len(df)
                    logger.info(f"Number of rows in CSV: {number_of_rows}")
                    logger.info(f"Successfully read CSV with encoding: {encoding}")
                    break
                except UnicodeDecodeError as e:
                    logger.warning(f"Failed to read CSV with encoding {encoding}: {str(e)}")
                    continue
                except pd.errors.ParserError as e:
                    logger.error(f"Invalid CSV format: {str(e)}")
                    return Response({"error": "Invalid CSV file format"}, status=400)

            if df is None:
                logger.error("Unable to read CSV with any supported encoding")
                return Response({"error": "Unable to read the file: unsupported or invalid encoding"}, status=400)
            parquet_buffer = io.BytesIO()
            df.to_parquet(parquet_buffer, compression="zstd", compression_level=19, engine="pyarrow")
            parquet_buffer.seek(0)
            encryption_key = Fernet.generate_key()
            cipher = Fernet(encryption_key)
            encrypted_data = cipher.encrypt(parquet_buffer.getvalue())
            unique_filename = f"{uuid.uuid4()}_{base_name}.parquet.enc"
            minio_key = f"encrypted/{unique_filename}"
            logger.info(f"Uploading to MinIO: {minio_key}")
            minio_client.put_object(
                bucket_name=BUCKET,
                object_name=minio_key,
                data=io.BytesIO(encrypted_data),
                length=len(encrypted_data)
            )
            #store the url and add http:// or https:// to the url depending on the minio secure value
            if MINIO_SECURE:
                stored_url = f"https://{MINIO_URL}/{BUCKET}/{minio_key}"
            else:
                stored_url = f"http://{MINIO_URL}/{BUCKET}/{minio_key}"

            # stored_url = f"{MINIO_URL}/{BUCKET}/{minio_key}"
            title = request.POST.get('title')
            category = request.POST.get('category')
            tags = request.POST.get('tags', '')
            description = request.POST.get('description')
            price = request.POST.get('price', '0.00')

            if not title or len(title) > 100:
                logger.error("Invalid title")
                return Response({"error": "Title is required and must be under 100 characters"}, status=400)
            if not description or not (10 <= len(description) <= 100000):
                logger.error("Invalid description")
                return Response({"error": "Description must be 10-100,000 characters"}, status=400)

            try:
                price = float(price)
                if price < 0:
                    logger.error("Price cannot be negative")
                    return Response({"error": "Price cannot be negative"}, status=400)
            except ValueError:
                logger.error("Invalid price format")
                return Response({"error": "Price must be a valid number"}, status=400)
            dataset_id = generate_id()
            schema = {col: str(dtype) for col, dtype in df.dtypes.items()}
            dataset = Dataset.objects.create(
                dataset_id=dataset_id,
                contributor_id=request.user,
                title=title,
                tags=tags,
                category=category,
                link=stored_url,
                description=description,
                encryption_key=encryption_key.decode(),
                schema=schema,
                price=price

            )

       
            dataset.number_of_rows = number_of_rows
            dataset.size = file_size
           

            dataset.save()

            end_time = datetime.now()
            logger.info(f"Upload completed in {end_time - start_time}")
            return Response({
                "message": "Dataset created successfully",
                "dataset_id": dataset_id,
                "file_url": stored_url
            }, status=201)

        except pd.errors.ParserError as e:
            logger.error(f"Invalid CSV format: {str(e)}")
            return Response({"error": "Invalid CSV file format"}, status=400)
        except Exception as e:
            logger.error(f"Upload failed: {str(e)}", exc_info=True)
            return Response({"error": f"Upload failed: {str(e)}"}, status=500)

    def _download_from_google_drive(self, file_url, access_token):
        """Download file from Google Drive using the provided access token."""
        try:
            file_id = file_url.split("/d/")[1].split("/")[0] if "/d/" in file_url else file_url.split("id=")[1].split("&")[0]
            download_url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
            headers = {"Authorization": f"Bearer {access_token}"}
            logger.info(f"Attempting to download Google Drive file with ID: {file_id}")
            response = requests.get(download_url, headers=headers, stream=True)
            response.raise_for_status()
            buffer = io.BytesIO()
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    buffer.write(chunk)
            buffer.seek(0)
            logger.info("Google Drive file downloaded successfully")
            return buffer
        except requests.RequestException as e:
            logger.error(f"Google Drive download failed: {str(e)}")
            raise Exception(f"Failed to download from Google Drive: {str(e)}")

    def _download_from_dropbox(self, file_url):
        """Download file from Dropbox."""
        try:
            if "?dl=0" in file_url:
                file_url = file_url.replace("?dl=0", "?dl=1")
            elif "dropbox.com" in file_url and "?dl=1" not in file_url:
                file_url += "?dl=1"

            logger.info(f"Attempting to download Dropbox file from URL: {file_url}")
            response = requests.get(file_url, stream=True)
            response.raise_for_status()
            buffer = io.BytesIO()
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    buffer.write(chunk)
            buffer.seek(0)
            logger.info("Dropbox file downloaded successfully")
            return buffer
        except requests.RequestException as e:
            logger.error(f"Dropbox download failed: {str(e)}")
            raise Exception(f"Failed to download from Dropbox: {str(e)}")
        

    @role_required(['organization_admin', 'contributor'])
    def put(self, request, *args, **kwargs):
        dataset_id = request.data.get('dataset_id')
        print(f"Dataset ID:" , request.data.get('dataset_id'))
        print(f"Request data:", request.data)
           

        dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
        print(f"Dataset ", dataset)
        print (dataset.contributor_id.organization.Organization_id)
    
        if (request.user.role not in ['organization_admin', 'contributor'] or 
            str(request.user.organization.Organization_id) != str(dataset.contributor_id.organization.Organization_id)):
            return Response({"error": "You are not authorized to edit this dataset"}, status=403)
        
        print("Request data:")

        serializer = DatasetSerializer(dataset, data=request.data, partial=True)
        print("serializer", serializer)


        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=200)
        return Response(serializer.errors, status=400)

@api_view(['GET'])
@role_required(['organization_admin', 'contributor', 'researcher'])

def get_datasets(request):
  
    organization = request.user.organization
    datasets = Dataset.objects.filter(orgid=organization)
    
    data = []
    for dataset in datasets:
        data.append({
            'id': dataset.dataset_id,
            'title': dataset.title,
            'category': dataset.category,
            'link': dataset.link,
            'description': dataset.description,
            'uploader': f"{dataset.uploaderid.first_name} {dataset.uploaderid.last_name}",
            'created_at': dataset.created_at,
            'updated_at': dataset.updated_at,
            'price': dataset.price,
        })
    return Response(data, status=200)



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

##bookmarks

class ToggleBookmarkDatasetView(APIView):
    """
    API endpoint to enable bookmarking datasets.
    """
    permission_classes = [IsAuthenticated]

    @role_required(['contributor', 'researcher', 'organization_admin'])
    def post(self, request, dataset_id):

        user = request.user
        dataset = get_object_or_404(Dataset, dataset_id=dataset_id)

        if dataset.bookmarked_by.filter(id=user.id).exists():
            # Remove the bookmark if it already exists
            dataset.bookmarked_by.remove(user)
            logger.info(f"Bookmark removed for dataset {dataset_id} by user {user.username}")
            return JsonResponse({"message": "Bookmark removed", "bookmarked": False})
        else:
            # Add the bookmark if it doesn't exist
            dataset.bookmarked_by.add(user)
            logger.info(f"Bookmark added for dataset {dataset_id} by user {user.username}")
            return JsonResponse({"message": "Bookmarked successfully", "bookmarked": True})



class UserBookmarkedDatasetsView(APIView):
    permission_classes = [IsAuthenticated]
    @role_required(['contributor', 'researcher', 'organization_admin'])

    def get(self, request):
        """
        Retrieve all datasets bookmarked by the logged-in user.
        """
        user = request.user
        print(f"User requesting bookmarks: {user.username}") 

        # Fetch only the datasets the user has bookmarked
        bookmarked_datasets = user.bookmarked_datasets.all().values(
            "dataset_id", "title", "description", "category", "created_at"
        )

        print("Bookmarked datasets:", list(bookmarked_datasets))

        return Response(list(bookmarked_datasets))
    

class DatasetListView(APIView):
    def get(self, request):
        # Get org query parameter
        org_id = request.query_params.get("org", None)
        
        # Base queryset with select_related for optimization
        datasets = Dataset.objects.select_related("contributor_id__organization").all()

        # Filter by organization if org_id is provided
        if org_id:
            datasets = datasets.filter(contributor_id__organization__Organization_id=org_id)
            if not datasets.exists():
                return Response(
                    {"detail": f"No datasets found for organization ID {org_id}"},
                    status=status.HTTP_404_NOT_FOUND
                )

        serializer = DatasetSerializer(datasets, many=True, context={"request": request})
        return Response({"datasets": serializer.data}, status=status.HTTP_200_OK)

    def put(self, request):
        # Restrict to organization admins
        if not request.user.is_authenticated or request.user.role != "organization_admin":
            return Response(
                {"detail": "Only organization admins can edit datasets"},
                status=status.HTTP_403_FORBIDDEN
            )

        dataset_id = request.data.get("dataset_id")
        if not dataset_id:
            return Response(
                {"detail": "Dataset ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        dataset = get_object_or_404(Dataset, dataset_id=dataset_id)

        # Check if admin belongs to the dataset's contributor's organization
        if (
            dataset.contributor_id.organization
            and request.user.organization != dataset.contributor_id.organization
        ):
            return Response(
                {"detail": "You can only edit datasets from your organization"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = DatasetSerializer(dataset, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# feedback will be taking in the dataset_id and the feedback from the user
class FeedbackView(APIView):
    """
    API endpoint to submit and retrieve feedback on datasets.
    """
    @role_required(['contributor', 'researcher', 'organization_admin'])
    def get(self, request, dataset_id):
        try:
            dataset = Dataset.objects.get(dataset_id=dataset_id)
            feedback = dataset.feedbacks.all().values("user__username", "rating","title", "comment", "created_at")
            return Response(list(feedback))
        except Dataset.DoesNotExist:
            return Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching feedback: {e}", exc_info=True)
            return Response({"error": "Failed to fetch feedback"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    """View for submitting feedback on a dataset."""
    @role_required("researcher")
    def post(self, request, dataset_id):
        """Submit feedback for a dataset."""
        try:
            dataset = Dataset.objects.get(dataset_id=dataset_id)
            rating = request.data.get("rating")
            title = request.data.get("title")
            comments = request.data.get("comments")
            if not rating or not comments:
                return Response({"error": "Rating and comments are required"}, status=status.HTTP_400_BAD_REQUEST)
            rating = int(rating)  # Ensure rating is an integer
            if not 1 <= rating <= 5:
                return Response({"error": "Rating must be between 1 and 5"}, status=status.HTTP_400_BAD_REQUEST)
            feedback = Feedback.objects.create(
                dataset=dataset,
                user=request.user,
                rating=rating,
                title=title,
                comment=comments  # Match model field (assuming typo in your original)
            )
            return Response({"message": "Feedback submitted"}, status=status.HTTP_201_CREATED)
        except Dataset.DoesNotExist:
            return Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({"error": "Rating must be a number"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error submitting feedback: {e}", exc_info=True)
            return Response({"error": "Failed to submit feedback"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # takes back the comments and the rating of the dataset to a given dataset_id
        # this will be used to give feedback to the dataset

class TrendingDatasetsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Define a short period (e.g., last 7 days)
        time_threshold = timezone.now() - timedelta(days=7)
        
        # Datasets with most views in the last 7 days since creation
        trending_datasets = Dataset.objects.filter(
            created_at__gte=time_threshold ,is_active=True
        ).order_by('-view_count')
        
        serializer = DatasetSerializer(trending_datasets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
