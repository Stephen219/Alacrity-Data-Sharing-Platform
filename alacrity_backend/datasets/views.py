from django.shortcuts import render
from django.views.decorators.csrf import csrf_protect
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Dataset
from urllib.parse import urlparse
import uuid
from storages.backends.s3boto3 import S3Boto3Storage
from django.core.files.storage import default_storage
from users.decorators import role_required

default_storage = S3Boto3Storage()

def is_valid_url(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc, result.path])
    except:
        return False

@csrf_protect
@role_required(['organization_admin', 'contributor'])
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_dataset(request):
    if request.method != 'POST':
        return Response({'error': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    data = request.data.copy()
    file = request.FILES.get('file')

    if not file:
        return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

    # Get the authenticated contributor and their organization
    contributor = request.user  # Assuming request.user is the authenticated Contributor
    organization = contributor.organization

    file_extension = file.name.split(".")[-1]
    file1 = file.name.split(".")[0]
    unique_filename = f"{uuid.uuid4()}_{file1}.{file_extension}"
    
    file_name = default_storage.save(unique_filename, file)
    file_url = default_storage.url(file_name)

    data['fileUrl'] = file_url

    # Extract data
    title = data.get('title')
    category = data.get('category')
    link = data.get('fileUrl')
    description = data.get('description')

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

    # Create dataset with organization and contributor information
    dataset = Dataset(
        title=title,
        category=category,
        link=link,
        description=description,
        orgid=organization,
        uploaderid=contributor
    )

    try:
        dataset.save()
    except Exception as e:
        return Response(
            {'error': f"An error occurred while creating the dataset: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({'message': 'Dataset created successfully'}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@role_required(['organization_admin', 'contributor', 'researcher'])
@permission_classes([IsAuthenticated])
def get_datasets(request):
    # Get datasets for the user's organization only
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
            'updated_at': dataset.updated_at
        })
    return Response(data, status=status.HTTP_200_OK)