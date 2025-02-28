import random
import string
from django.shortcuts import render
from django.views import View
from django.http import JsonResponse
from django.contrib.auth.hashers import make_password, check_password
from django.middleware.csrf import get_token
from django.contrib.auth import authenticate, get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework.permissions import AllowAny
from rest_framework import status
from .serializers import RegisterSerializer
from django.utils import timezone
class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            print(email, password)

            if not email or not password:
                return Response({
                    'error': 'Please provide both email and password'
                }, status=status.HTTP_400_BAD_REQUEST)
            User = get_user_model()
            print(User)
            
            try:
                user = User.objects.get(email=email)
                print(user)
                if user.is_active == False:
                    return Response({
                        'error': 'your account is not active, please contact the admin'
                    }, status=status.HTTP_401_UNAUTHORIZED)
            except User.DoesNotExist:
                return Response({
                    'error': 'No user found with this email'
                }, status=status.HTTP_404_NOT_FOUND)
            user = authenticate(request, username=email, password=password)
            print("we are here")
            
            if user is not None:
                user.last_login = timezone.now()
                # user.save()
                refresh = RefreshToken.for_user(user)

                print(refresh)
                return Response({
                    'status': 'success',
                    'message': 'Login successful',
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'username': user.username,
                        'role': user.role,
                        'organization': user.organization if user.organization else None,
                        'phone_number': user.phone_number,
                    },
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh)
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid password or email combination'
                }, status=status.HTTP_401_UNAUTHORIZED)

        except Exception as e:
            print(e)
            import traceback
            print(traceback.format_exc())
            return Response({

                'error': 'An error occurred while trying to log you in',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CSRFTokenView(View):
    def get(self, request):
        return JsonResponse({"csrfToken": get_token(request)})
    

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
    cleaned_data['role'] = 'organization_admin'  

    cleaned_data['password2'] = cleaned_data.get('password', cleaned_data.get('password2'))
   
    cleaned_data['username'] = generate_username(cleaned_data.get('first_name'), cleaned_data.get('sur_name'))

    return cleaned_data

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        mapped_data = clean_data(request.data)
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
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(e)
            return Response(
                {"error": "Registration failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        





class UserView(APIView):
    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "firstname": user.first_name,
            "lastname": user.last_name,

            "phonenumber": user.phone_number,
            "role": user.role,
            "organization": user.organization.name if user.organization else None,
            "field": user.field,
        }, status=status.HTTP_200_OK)