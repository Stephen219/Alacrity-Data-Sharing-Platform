from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from rest_framework.decorators import api_view
from django.views.decorators.http import require_http_methods
from .models import Dataset
from urllib.parse import urlparse
import json
import uuid
from django.core.files.storage import default_storage
import re


# this view creates the datases in the database, in future it will be updated to include the organization and user id by checking in the user who is logged in while making the request

def is_valid_url(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc, result.path])  # Check if the url is valid
    except:
        return False
# Create your views here.
@csrf_protect
@api_view(['POST'])
def create_dataset(request):
    if request.method == 'POST':    #
        # Get the data from the request
        data = request.data # if any error   use data2 = request.dat  // removed post because i need the file
        file = request.FILES.get('file')
        if not file:
            return JsonResponse({'error': 'No file uploaded'}, status=400)
        file_extension = file.name.split(".")[-1]
        file1 = file.name.split(".")[0]
        unique_filename = f"{uuid.uuid4()}_{file1}.{file_extension}"
        file_name = default_storage.save(unique_filename, file)
        file_url = default_storage.url(file_name)
        print(f"File uploaded successfully: {type(file_url)}") 
        cleaned_minio_url = re.sub(r'^https?://', '', file_url)
        print(cleaned_minio_url)
        data['fileUrl'] = file_url
    

        # extract the data from the request
        title = data.get('title')
          
        category = data.get('category')
       
        link = data.get('fileUrl')
       
        description = data.get('description')
      
        # TODO: Add organization and user id to the dataset

        # validating the data 
        errors = {} # This will hold the errors

        # Check if the title is empty
        if not title:
            errors['title'] = 'Title is required'
            print(errors)
        elif len(title) > 100:
            errors['title'] = 'Title is too long'
            print(errors)
        # validate the link
        if not link:
            errors['link'] = 'Link is required'
            print(errors)   
        elif not is_valid_url(link):
            errors['link'] = 'Invalid link'
            print(errors)   
        
        # validate the description
        if not description:
            errors['description'] = 'Description is required'
            print(errors)
        elif len(description) < 10:
            errors['description'] = 'Description is too short'
            print(errors)   
        elif len(description) > 255545678:
            errors['description'] = 'Description is too long'
            print(errors)   
        
        # If there are errors, return the errors
        if errors:
            return JsonResponse(errors, status=500)
        
        
        dataset = Dataset(title=title, category=category, link=link, description=description)

        try:
            dataset.save()
        except Exception as e:
            print(e)
            return JsonResponse({'error': "An error occurred while creating the dataset"}, status=500)
        
        
        return JsonResponse({'message': 'Dataset created successfully'}, status=201)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    


### This view is for the sign up of the user testing whether the user is able to sign up or not
## delete please pretty please lol

@csrf_exempt
@api_view(['POST'])
def sign_up(request):
    if request.method == 'POST':
        data = request.data
        print("Received Data:", data)  # Debugging
        return JsonResponse({'message': 'User created successfully'}, status=201)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)
