import random
import string
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer

def generate_username(first_name: str, last_name: str) -> str:
    """
    Generates a unique username based on the first name and last name.
    It appends a random string to ensure uniqueness.
    """
  
    first_name = first_name.strip().lower()
    last_name = last_name.strip().lower()
 
 
    random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
 
    
    username = f"{last_name}_{first_name}_{random_string}"
 
    return username

def clean_data(request_data):
    cleaned_data = request_data.copy()
    cleaned_data['first_name'] = cleaned_data.get('firstname', cleaned_data.get('first_name'))
    cleaned_data['sur_name'] = cleaned_data.get('surname', cleaned_data.get('sur_name'))
    cleaned_data['phone_number'] = cleaned_data.get('phonenumber', cleaned_data.get('phone_number'))
   
    cleaned_data.pop('firstname', None)
    cleaned_data.pop('surname', None)
    cleaned_data.pop('phonenumber', None)
 
    
    cleaned_data['role'] = 'contributor'  
   
    cleaned_data['password2'] = cleaned_data.get('password', cleaned_data.get('password2'))
   
    cleaned_data['username'] = generate_username(cleaned_data.get('first_name'), cleaned_data.get('sur_name'))
 
    return cleaned_data

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        mapped_data = clean_data(request.data)

        data1 = request.data
        print (data1)
        request_data = request.data.copy()

        serializer = RegisterSerializer(data=mapped_data)

        try:
            if serializer.is_valid():
                user = serializer.save()
                response_data = {
                    "message": "User registered successfully",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "firstname": user.first_name,
                        "surname": user.last_name,
                        "phonenumber": user.phone_number,
                        "role": user.role,
                        "organization": user.organization.name if user.organization else None,
                        "field": user.field,
                    }
                }
                return Response(response_data, status=status.HTTP_201_CREATED)
            print (23456789)
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("we are here")
            print(e)
            return Response(
                {"error": "Registration failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        

