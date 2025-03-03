from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from users.decorators import role_required
from .models import DatasetRequest
from datasets.models import Dataset
from users.models import User
from rest_framework.decorators import api_view
from .serializer import DatasetRequestSerializer

from .models import DatasetRequest


# this is a view that will be used when the user makes a request to the server

class Make_request(APIView):
    @role_required('researcher')
    def post(self, request):
    # get the dataset_id and researcher_id from the request
        dataset_id = request.data.get('dataset_id')
        researcher_id = request.user.id
        message = request.data.get('objective')  # Match frontend field name
        print(researcher_id, dataset_id, message)
    
    # check if the dataset_id is provided
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
    
    # Create a new request including the message
        dataset_request = DatasetRequest.objects.create(
            dataset_id=dataset,
            researcher_id=researcher,
            message=message  # include the message here
        )

        return Response({'message': 'Request created successfully'}, status=201)


# this is a view that will be used when the user wants to view all the requests that have been made
@role_required(['organization_admin', 'contributor'])
@api_view(['GET'])
def view_requests(request):
    # get all the requests from the DatasetRequest table according to the contributor with the same organization as the requester
    requests = DatasetRequest.objects.filter(dataset_id__organization_id=request.user.organization_id)
    # serialize the requests
    serializer = DatasetRequestSerializer(requests, many=True)
    print(serializer.data)
    return Response(serializer.data, status=status.HTTP_200_OK)
    