from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from payments.models import DatasetPurchase
from users.decorators import role_required
from .models import DatasetRequest
from datasets.models import Dataset
from users.models import User
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
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
class ViewAllDatasetRequests(APIView):
    @role_required(['organization_admin', 'contributor'])
    def get(self, request):
        try:
           # get all the requests from the DatasetRequest table according to the contributor with the same organization as the requester
            requests = DatasetRequest.objects.filter(dataset_id__contributor_id__organization=request.user.organization).select_related('dataset_id', 'researcher_id')
            # serialize the requests
            
            serializer = DatasetRequestSerializer(requests, many=True)
            print(serializer.data) 
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            print("end o ftraceback")
            print(e)
            print("nfnjfnfnnfjf above")
            return Response(
                {
                    'error': 'An error occurred'
                 },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ViewDatasetAccess(APIView):
    """
    Handles dataset access verification for researchers.
    
    - Ensures that the dataset exists.
    - Checks if the researcher has an approved request for the dataset.
    - If the dataset is paid, verifies that payment has been completed.
    - Grants access by returning the dataset link if all conditions are met.
    """

    @role_required('researcher')  # Ensures only researchers can access this endpoint
    def get(self, request, dataset_id):
        """
        Retrieves dataset access link for an approved researcher.
        
        - Ensures the dataset exists.
        - Checks if the researcher's request has been approved.
        - If the dataset requires payment, verifies that it has been purchased.
        - Returns the dataset link if access is granted.
        """
        dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
        researcher = request.user  # The authenticated researcher requesting access

        # Check if the dataset request is approved
        dataset_request = DatasetRequest.objects.filter(
            dataset_id=dataset, researcher_id=researcher, request_status='approved'
        ).first()

        if not dataset_request:
            return Response({'error': 'You must have an approved request to access this dataset.'}, status=status.HTTP_403_FORBIDDEN)

        # If the dataset is paid, verify payment completion
        if dataset.price > 0:
            purchase = DatasetPurchase.objects.filter(dataset=dataset, buyer=researcher).exists()
            if not purchase:
                return Response({'error': 'Payment required before access'}, status=status.HTTP_403_FORBIDDEN)

        # Access granted, return dataset link - needs to be modified 
        return Response({'dataset_link': dataset.link}, status=status.HTTP_200_OK)