from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from rest_framework.decorators import api_view
from django.views.decorators.http import require_http_methods
from .models import Dataset
from urllib.parse import urlparse
import json
import uuid
from storages.backends.s3boto3 import S3Boto3Storage
from django.core.files.storage import default_storage
default_storage = S3Boto3Storage()  
import re
from users.decorators import role_required
from rest_framework.response import Response
from rest_framework import status
# from rest_framework.renderers import JSONRenderer

# renderer = JSONRenderer()


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