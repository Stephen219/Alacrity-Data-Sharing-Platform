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
from dataset_requests.models import DatasetRequest
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
                        'organization': user.organization.name if user.organization else None, # gets the organization name from the database
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
    cleaned_data['role'] = 'researcher'  

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
    


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({
                "message": "Logout successful"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "error": "An error occurred while trying to log you out",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .decorators import role_required
from datasets.models import Dataset

from .models import User


# TODO: REFACTOR THIS VIEW BUT FOR NOW I HAVE TO MAKE IT WORK

class UserDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    @role_required(["organization_admin", "researcher", "contributor"]) 
    def get(self, request):
        user = request.user
        organization = user.organization
        from research.models import AnalysisSubmission

        if user.role == "organization_admin":
            organization = user.organization
            print(organization)
            total_researches= AnalysisSubmission.objects.filter(dataset__contributor_id__organization=organization).count(), 
            print(total_researches)

            data = {
            "total_researches":AnalysisSubmission.objects.filter(dataset__contributor_id__organization=organization).count(), 
            "total_datasets": Dataset.objects.filter(contributor_id__organization=organization).count(),
            "all_datasets": Dataset.objects.count(),
            "pending_requests": DatasetRequest.objects.filter(
                dataset_id__contributor_id__organization=organization
            ).select_related('dataset_id', 'researcher_id').count(),
            "approved_requests": 2,
            "total_users": User.objects.filter(organization=organization).count(),
            "total_publishes_for_organization_data": AnalysisSubmission.objects.filter(researcher__organization=organization).count(),
        
        }
            pending_datasets = DatasetRequest.objects.filter(
            dataset_id__contributor_id__organization=organization
            # ideally this should be done in a serializer kindof way but for now this is okay
        ).select_related('dataset_id', 'researcher_id').values(
            'request_id',  
            'dataset_id_id',  
            'dataset_id__title', 
            'researcher_id_id',
            'researcher_id__first_name', 
            'researcher_id__sur_name', 
            'researcher_id__profile_picture', 
            'request_status' ,
            'created_at',
            'updated_at'

        )
            if pending_datasets:
                data['pending_datasets'] = list(pending_datasets)
            else:
                pending = []
                print(pending_datasets)
                data['pending_datasets'] = pending
        
            return JsonResponse(data)
       
        elif user.role == "researcher":
            all_requests= DatasetRequest.objects.filter(researcher_id=user).values(
                'request_id',  
                'dataset_id_id',  
                'dataset_id__title', 
                'researcher_id__profile_picture', 
                'request_status'  ,
                'request_status' ,
                'created_at',
                'updated_at'
            ) 
            datasets_having_access = Dataset.objects.filter(
            requests__researcher_id=user,  
            requests__request_status="approved"  
        ).values(
            'dataset_id',  
            'title',
            'description',
            'contributor_id__organization__name',  
            'requests__updated_at', 
            'tags',
            'category'
        )
            data = {
                "datasets_accessed": 1,
                "pending_reviews": DatasetRequest.objects.filter(researcher_id=user, request_status="pending").count(),
                "research_submitted": 1,
                "requests_approved": DatasetRequest.objects.filter(researcher_id=user, request_status="approved").count(),
                    
            }
            
            data["all_datasets_requests"] = list(all_requests)
            data["datasets_having_access"] = list(datasets_having_access)
            return JsonResponse(data)
        elif user.role == "contributor":
            pending_datasets = DatasetRequest.objects.filter(
                dataset_id__contributor_id__organization=organization
            # ideally this should be done in a serializer kindof way but for now this is okay
        ).select_related('dataset_id', 'researcher_id').values(
            'request_id',  
            'dataset_id_id',  
            'dataset_id__title', 
            'researcher_id_id',
            'researcher_id__first_name', 
            'researcher_id__sur_name', 
            'researcher_id__profile_picture', 
            'request_status' ,
            'created_at',
            'updated_at'

        )
            
            
            
            data = {
                "total_researches":AnalysisSubmission.objects.filter(dataset__contributor_id__organization=organization).count(), 
                "total_users": User.objects.filter(organization=organization).count(),
                "total_datasets": Dataset.objects.filter(contributor_id__organization=organization).count(),
                "pending_requests": DatasetRequest.objects.filter(
                dataset_id__contributor_id__organization=organization
            ).select_related('dataset_id', 'researcher_id').count(),



            }
            if pending_datasets:
                data['pending_datasets'] = list(pending_datasets)
            else:
                pending = []
                print(pending_datasets)
                data['pending_datasets'] = pending
            return JsonResponse(data)
        else:
            return Response({"error": "Invalid role"}, status=403)

    
