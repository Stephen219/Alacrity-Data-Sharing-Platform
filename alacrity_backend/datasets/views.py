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

# def is_valid_url(url):
#     try:
#         result = urlparse(url)
#         return all([result.scheme, result.netloc, result.path])  
#     except:
#         return False

    




@csrf_protect
@role_required(['organization_admin', 'contributor'])
@api_view(['POST'])
def create_dataset(request):
    if request.method != 'POST':
        return Response({'error': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    file = request.FILES.get('file')  # ✅ FIXED

    if not file:
        return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

    file_extension = file.name.split(".")[-1]
    file1 = file.name.split(".")[0]
    unique_filename = f"{uuid.uuid4()}_{file1}.{file_extension}"

    file_name = default_storage.save(unique_filename, file)
    file_url = default_storage.url(file_name)

    print(f"File uploaded successfully: {file_url}")

    # Extract data
    title = request.data.get('title')
    category = request.data.get('category')
    link = file_url  # ✅ FIXED
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

##analysis 

# Initialize MinIO client
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
def get_datasetss(request):
    try:
        datasets = Dataset.objects.all().values("dataset_id", "title", "category", "description", "link")
        return JsonResponse({"datasets": list(datasets)}, safe=False)
    except Exception as e:
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)


@api_view(['GET'])
def pre_analysis(request, dataset_id):
    """Perform pre-analysis checks on the entire dataset efficiently."""
    dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
    chunk_iterator = fetch_dataset_from_minio(dataset.link)

    if chunk_iterator is None:
        return Response({"error": "Dataset could not be loaded from MinIO"}, status=500)

    column_info = {}
    missing_values = {}
    categorical_summary = {}
    duplicate_count = 0
    total_rows = 0

    try:
        for chunk in chunk_iterator:
            total_rows += len(chunk)

            for col in chunk.columns:
                dtype = str(chunk[col].dtype)
                column_info[col] = dtype 

                missing_values[col] = missing_values.get(col, 0) + chunk[col].isnull().sum()

                if dtype == "object":
                    categorical_summary[col] = categorical_summary.get(col, set()) | set(chunk[col].dropna().unique())

            duplicate_count += chunk.duplicated().sum()

        categorical_summary = {col: len(vals) for col, vals in categorical_summary.items()}

        return Response({
            "dataset_id": dataset_id,
            "total_rows": total_rows,
            "columns": column_info,
            "missing_values": missing_values,
            "categorical_summary": categorical_summary,
            "duplicate_rows": duplicate_count
        })

    except Exception as e:
        return Response({"error": f"Server error: {str(e)}"}, status=500)


@api_view(['GET'])
def descriptive_statistics(request, dataset_id):
    """Return summary statistics for numerical columns."""
    dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
    chunk_iterator = fetch_dataset_from_minio(dataset.link)

    if chunk_iterator is None:
        return Response({"error": "Dataset could not be loaded from MinIO"}, status=500)

    mean_values = {}
    median_values = {}
    mode_values = {}
    column_counts = {}

    try:
        for chunk in chunk_iterator:
            numeric_cols = chunk.select_dtypes(include=['number'])

            for col in numeric_cols.columns:
                # Update mean
                mean_values[col] = mean_values.get(col, 0) + chunk[col].sum()
                column_counts[col] = column_counts.get(col, 0) + len(chunk[col].dropna())

                # Update median
                median_values[col] = median_values.get(col, []) + chunk[col].dropna().tolist()

                # Update mode
                mode_res = mode(chunk[col].dropna(), keepdims=True)
                mode_values[col] = mode_values.get(col, []) + list(mode_res.mode)

        # mean
        mean_values = {col: (mean_values[col] / column_counts[col]) for col in mean_values}

        # median
        median_values = {col: sorted(median_values[col])[len(median_values[col]) // 2] for col in median_values}

        # mode
        mode_values = {col: max(set(mode_values[col]), key=mode_values[col].count) for col in mode_values}

        return Response({
            "mean": mean_values,
            "median": median_values,
            "mode": mode_values
        })

    except Exception as e:
        return Response({"error": f"Server error: {str(e)}"}, status=500)


    
@api_view(['GET'])
def get_filter_options(request, dataset_id):
    """Efficiently extract column names and unique categorical values for filtering UI."""
    dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
    chunk_iterator = fetch_dataset_from_minio(dataset.link)

    if chunk_iterator is None:
        return Response({"error": "Dataset could not be loaded"}, status=500)

    try:
        first_chunk = next(chunk_iterator) 

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


@api_view(['POST'])
def filter_and_clean_dataset(request, dataset_id):
    """Apply user-defined filters without modifying the original MinIO file."""
    dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
    chunk_iterator = fetch_dataset_from_minio(dataset.link)

    if chunk_iterator is None:
        return Response({"error": "Dataset could not be loaded from MinIO"}, status=500)

    filters = request.data.get("filters", [])
    selected_columns = request.data.get("columns", [])  

    print(f"Applying the filters: {filters}")

    filtered_results = []  # Stores the filtered data

    for chunk in chunk_iterator:
        for col in chunk.select_dtypes(include=["object"]).columns:
            chunk[col] = chunk[col].astype(str).str.strip().str.lower()

        for filter_condition in filters:
            column = filter_condition.get("column").strip()
            operator = filter_condition.get("operator")
            value = filter_condition.get("value")

            if column not in chunk.columns:
                return Response({"error": f"Column '{column}' not found in dataset"}, status=400)

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

        if selected_columns:
            chunk = chunk[selected_columns]

        filtered_results.extend(chunk.to_dict(orient="records"))

    print(f"Filtered dataset to {len(filtered_results)} rows")

    return Response({"filtered_data": filtered_results}, status=200)
