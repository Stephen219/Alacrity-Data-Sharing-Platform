from django.shortcuts import render
from django.views import View
from django.http import JsonResponse
from django.contrib.auth.hashers import make_password, check_password
from django.middleware.csrf import get_token
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.serializer import RegisterSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model, authenticate
from django.db import transaction
from rest_framework.permissions import AllowAny

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
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({
                    'error': 'No user found with this email'
                }, status=status.HTTP_404_NOT_FOUND)
            user = authenticate(request, username=email, password=password)
            
            if user is not None:
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'status': 'success',
                    'message': 'Login successful',
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'username': user.username,
                        'role': user.role,
                        'organization': user.organization.name if user.organization else None,
                        'phone_number': user.phone_number,
                    },
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh)
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid password'
                }, status=status.HTTP_401_UNAUTHORIZED)

        except Exception as e:
            return Response({
                'error': f'An error occurred: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CSRFTokenView(View):
    def get(self, request):
        return JsonResponse({"csrfToken": get_token(request)})
    

class RegisterView(APIView):
    permission_classes = [AllowAny]
    pass
    

