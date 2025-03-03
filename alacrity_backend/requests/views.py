from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from users.decorators import role_required
from .models import DatasetRequest
from datasets.models import Dataset
from users.models import User

from .models import DatasetRequest


# this is a view that will be used when the user makes a request to the server

class Make_request(APIView):
    @role_required('researcher')
    def post(self, request):
        # get the dataset_id and researcher_id from the request
        dataset_id = request.data.get('dataset_id')
        researcher_id = request.user.id
        print(researcher_id, dataset_id)
        # check if the dataset_id and researcher_id exist
        if not dataset_id:
            return Response({'error': 'Please provide a dataset_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the dataset exists in the Dataset table
        try:
            dataset = Dataset.objects.get(dataset_id=dataset_id)
        except Dataset.DoesNotExist:
            return Response({'error': 'Dataset does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if the researcher exists in the User table (should normally pass if authenticated)
        try:
            researcher = User.objects.get(id=researcher_id)
        except User.DoesNotExist:
            return Response({'error': 'Researcher does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if the researcher has already requested this dataset and status is pending
        if DatasetRequest.objects.filter(
        dataset_id=dataset,
        researcher_id=researcher,
        request_status='pending'
        ).exists():
            return Response({'error': 'You have already requested this dataset'}, status=status.HTTP_400_BAD_REQUEST)
        # Create a new request
        request = DatasetRequest.objects.create(dataset_id=dataset, researcher_id=researcher)

        return Response({'message': 'Request created successfully'}, status=201)