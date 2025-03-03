from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from users.decorators import role_required

from .models import DatasetRequest


# this is a view that will be used when the user makes a request to the server

class Make_request(APIView):
    @role_required('researcher')
    def post(self, request):
        print(request.user)
        dataset_id = request.data.get('dataset_id')
        researcher_id = request.data.get('user_id')
        # check if the dataset_id and researcher_id exist
        if not dataset_id or not researcher_id:
            return Response({'error': 'Please provide a dataset_id and researcher_id'}, status=400)

        # check if the dataset_id and researcher_id exist
        if not DatasetRequest.objects.filter(dataset_id=dataset_id, researcher_id=researcher_id).exists():
            return Response({'error': 'Dataset or Researcher does not exist'}, status=400)
        # create the request
        DatasetRequest.objects.create(
            dataset_id=dataset_id,
            researcher_id=researcher_id,
        )

        return Response({'message': 'Request created successfully'}, status=201)