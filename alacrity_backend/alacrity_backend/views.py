from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Test    

@api_view(['POST'])
def submit_form(request):
    if request.data:
        data = request.data
        print("Form Data Received: ", data)
        print("Form Data Received:")
        print("Dataset Title:", data.get('title'))
        print("Dataset Description:", data.get('description'))
        print("Dataset File:", data.get('dataset')) 
        print("Agreed to Terms:", data.get('agreedToTerms'))
        
        # Return success response
        return Response({"message": "Data received successfully!"}, status=status.HTTP_200_OK)
    else:
        return Response({"error": "No data received."}, status=status.HTTP_400_BAD_REQUEST)
