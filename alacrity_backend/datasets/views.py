from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from rest_framework.decorators import api_view
from django.views.decorators.http import require_http_methods
from .models import Dataset
from urllib.parse import urlparse
import json


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
    if request.method == 'POST':
        # Get the data from the request
        data = request.POST

        print(data)

        # extract the data from the request
        title = data.get('title')
        print(title)    
        category = data.get('category')
        print(category) 
        link = data.get('fileUrl')
        print(link)
        description = data.get('description')
        print(description)
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
        elif len(description) > 255:
            errors['description'] = 'Description is too long'
            print(errors)   
        
        # If there are errors, return the errors
        if errors:
            return JsonResponse(errors, status=500)
        
        # Create the dataset
        dataset = Dataset(title=title, category=category, link=link, description=description)
        dataset.save()
        return JsonResponse({'message': 'Dataset created successfully'}, status=201)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)