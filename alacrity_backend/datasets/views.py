import io
from django.shortcuts import get_object_or_404, render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from minio import Minio
import pandas as pd
from rest_framework.decorators import api_view
from django.views.decorators.http import require_http_methods
from .models import Dataset
from urllib.parse import urlparse
import json
import uuid
from storages.backends.s3boto3 import S3Boto3Storage
from django.core.files.storage import default_storage 
import re
from users.decorators import role_required
from rest_framework.response import Response
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from scipy.stats import mode

default_storage = S3Boto3Storage() 

#renderer = JSONRenderer()


# this view creates the datases in the database, in future it will be updated to include the organization and user id by checking in the user who is logged in while making the request

def is_valid_url(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc, result.path])  
    except:
        return False

    



@csrf_protect
@role_required(['organization_admin', 'contributor'])
@api_view(['POST'])
def create_dataset(request):
    if request.method != 'POST':
        return Response({'error': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    # Retrieve uploaded file
    file = request.FILES.get('file')

    if not file:
        return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

    # Generate a unique filename
    file_extension = file.name.split(".")[-1]
    file1 = file.name.split(".")[0]
    unique_filename = f"{uuid.uuid4()}_{file1}.{file_extension}"

    # Save the file and get its URL
    file_name = default_storage.save(unique_filename, file)
    file_url = default_storage.url(file_name)

    print(f"File uploaded successfully: {file_url}")

    # Extract data from request
    title = request.data.get('title')
    category = request.data.get('category')
    link = file_url  # Use the uploaded file URL as the link
    description = request.data.get('description')

    # Validation
    errors = {}

    if not title:
        errors['title'] = 'Title is required'
    elif len(title) > 100:
        errors['title'] = 'Title is too long'

    if not link:
        errors['link'] = 'Link is required'
    elif not is_valid_url(link):
        errors['link'] = 'Invalid link'

    if not description:
        errors['description'] = 'Description is required'
    elif len(description) < 10:
        errors['description'] = 'Description is too short'
    elif len(description) > 1000:
        errors['description'] = 'Description is too long'

    if errors:
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

    # Create and save dataset
    dataset = Dataset(title=title, category=category, link=link, description=description)

    try:
        dataset.save()
        print(f"Dataset created successfully: {dataset}")
    except Exception as e:
        print(f"An error occurred while creating the dataset: {e}")
        return Response({'error': "An error occurred while creating the dataset"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'message': 'Dataset created successfully'}, status=status.HTTP_201_CREATED)




    


# let me test the auth with auth 

@api_view(['GET'])
@role_required(['organization_admin', 'contributor', 'researcher'])

def get_datasets(request):
    datasets = Dataset.objects.all()
    data = []
    print(datasets.values())
    for dataset in datasets:
        data.append({
            'id': dataset.dataset_id,
            'title': dataset.title,
            'category': dataset.category,
            'link': dataset.link,
            'description': dataset.description
        })
    return Response(data, status=200)

# Initialize MinIO client
minio_client = Minio(
    endpoint="10.72.98.137:9000", 
    access_key="admin",
    secret_key="Notgood1",
    secure=False  
)

def fetch_dataset_from_minio(dataset_url):
    """Fetch dataset from MinIO and return as a Pandas DataFrame"""
    bucket_name = "alacrity"
    object_name = dataset_url.split("/")[-1]

    try:
        response = minio_client.get_object(bucket_name, object_name)
        df = pd.read_csv(io.BytesIO(response.read()))
        print(f"Dataset loaded: {df.shape}")  # Debugging
        return df
    except Exception as e:
        print(f"Error fetching dataset from MinIO: {e}")
        return None


@api_view(['GET'])
def get_datasets(request):
    """Fetch all available datasets"""
    datasets = Dataset.objects.all().values("dataset_id", "title", "category", "description", "link")
    
    return JsonResponse({"datasets": list(datasets)}, safe=False)


@api_view(['GET'])
def pre_analysis(request, dataset_id):
    """Perform pre-analysis checks on selected dataset."""
    dataset = get_object_or_404(Dataset, dataset_id=dataset_id)

    df = fetch_dataset_from_minio(dataset.link)  

    if df is None:
        return Response({"error": "Dataset could not be loaded from MinIO"}, status=500)

    column_info = {col: str(df[col].dtype) for col in df.columns}

    missing_values = df.isnull().sum().to_dict()

    categorical_summary = {col: df[col].nunique() for col in df.select_dtypes(include=['object']).columns}

    duplicate_count = df.duplicated().sum()

    return Response({
        "dataset_id": dataset_id,
        "title": dataset.title,
        "category": dataset.category,
        "description": dataset.description,
        "columns": column_info,
        "missing_values": missing_values,
        "categorical_summary": categorical_summary,
        "duplicate_rows": duplicate_count
    })


@api_view(['GET'])
def descriptive_statistics(request, dataset_id):
    """Return summary statistics of the dataset"""
    dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
    df = fetch_dataset_from_minio(dataset.link)

    if df is None:
        return Response({"error": "Dataset could not be loaded from MinIO"}, status=500)

    numeric_cols = df.select_dtypes(include=['number'])

    # Mean, median and mode
    mean_values = numeric_cols.mean().to_dict()
    median_values = numeric_cols.median().to_dict()
    mode_values = {}
    for col in numeric_cols.columns:
        mode_result = mode(df[col].dropna(), keepdims=True)
        mode_values[col] = mode_result.mode[0] if mode_result.count[0] > 0 else None  

    return Response({
        "mean": mean_values,
        "median": median_values,
        "mode": mode_values
    })