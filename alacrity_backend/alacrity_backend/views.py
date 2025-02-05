# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework import status
# from .models import Test    

# @api_view(['POST'])
# def submit_form(request):
#     if request.data:
#         data = request.data
#         print("Form Data Received: ", data)
#         print("Form Data Received:")
#         print("Dataset Title:", data.get('title'))
#         print("Dataset Description:", data.get('description'))
#         print("Dataset File:", data.get('dataset')) 
#         print("Agreed to Terms:", data.get('agreedToTerms'))
#         file = request.FILES.get('file')  # Ensure the key matches the name in the form
#         if file:
#             print("Dataset File:", file.name)
        
#         # Return success response
#         return Response({"message": "Data received successfully!"}, status=status.HTTP_200_OK)
#     else:
#         return Response({"error": "No data received."}, status=status.HTTP_400_BAD_REQUEST)




from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from minio import Minio
from django.conf import settings
import uuid  # For unique file names

# Initialize MinIO Client
minio_client = Minio(
    settings.MINIO_ENDPOINT.replace("https://", "").replace("http://", ""),  
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=True  # Set to False if MinIO is running without SSL
)

@api_view(['POST'])
def submit_form(request):
    if request.FILES:  # Check if a file is uploaded
        data = request.data
        file = request.FILES.get("file")  # Ensure this matches the form key in React

        if not file:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate a unique file name
        file_extension = file.name.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"

        try:
            # Upload file to MinIO
            minio_client.put_object(
                bucket_name="umbwa",
                object_name=unique_filename,
                data=file,
                length=file.size,
                content_type=file.content_type
            )

            # Generate file URL
            file_url = f"{settings.MINIO_ENDPOINT}/buckets/{settings.MINIO_BUCKET_NAME}/admin/prefix/{unique_filename}"
            print(f"File uploaded successfully: {file_url}")

            # Return response with MinIO file URL
            return Response({"message": "File uploaded successfully!", "fileUrl": file_url}, status=status.HTTP_200_OK)

        except Exception as e:
            print("MinIO Upload Error:", str(e))
            return Response({"error": "Failed to upload file to MinIO."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({"error": "No data received."}, status=status.HTTP_400_BAD_REQUEST)
