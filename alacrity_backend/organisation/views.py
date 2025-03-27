from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import User, ActivationToken  
from users.serializers import UserSerializer
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.exceptions import ValidationError
from users.decorators import role_required
import random
import string
from alacrity_backend.config import FRONTEND_URL
from django.core.mail import send_mail
from alacrity_backend.settings import DEFAULT_FROM_EMAIL
from django.db import transaction   
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.db import transaction
from .models import Organization
from .serializer import OrganizationSerializer
from datasets.models import Dataset
from datasets.serializer import DatasetSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from minio import Minio
from alacrity_backend.settings import MINIO_ACCESS_KEY , MINIO_SECRET_KEY, MINIO_BUCKET_NAME, MINIO_URL, MINIO_SECURE
import uuid

minio_client = Minio(
        endpoint=MINIO_URL,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE

    )




def generate_username(first_name: str, last_name: str) -> str:
    """
    Generates a unique username based on the first name and last name.
    It appends a random string to ensure uniqueness.
    The total length is capped at 10 characters.
    """
    first_name = first_name.strip().lower()
    last_name = last_name.strip().lower()
    random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=3)) 
    max_name_length = 10 - len(random_string) - 1 
    half_length = max_name_length // 2
    first_name = first_name[:half_length]
    last_name = last_name[:max_name_length - len(first_name)]
    username = f"{last_name}_{random_string}"
    return username


def generate_password():
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    pwd = [random.choice(string.ascii_uppercase), random.choice(string.ascii_lowercase),
           random.choice(string.digits), random.choice("!@#$%^&*")]
    pwd += [random.choice(chars) for _ in range(5)]
    random.shuffle(pwd)
    return ''.join(pwd)

def send_activation_email(recipient_email, recipient_name, link):
    try:
        subject = 'Activate Your Account'
        message = (
            f'Hello {recipient_name},\n\n'
            f'Click the link to activate your account: {link}\n'
            f'This link expires in 30 days.\n\n'
            f'Best regards,\nYour Team'
        )
        send_mail(
            subject=subject,
            message=message,
            from_email=DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        print(f"Activation email sent to {recipient_email}")
        return True
    except Exception as e:
        
        # import traceback
        # traceback.print_exc()
        # print(f"Failed to send email: {str(e)}")
        return False
    

class AddContributors(APIView):
    permission_classes = [IsAuthenticated]

    """
    Add a new contributor to the organization.

    """

    @role_required('organization_admin')
    def post(self, request):
        
        data = request.data.copy()
        organization = request.user.organization
        data['organization_id'] = organization.Organization_id  
        data['username'] = generate_username(data.get('first_name'), data.get('sur_name'))
        data['password'] = generate_password()
        data['password2'] = data['password']
        if getattr(request.user, 'organization', None):
            data['organization'] = request.user.organization.Organization_id
        else:
            return Response(
                {'error': 'Authenticated user does not have an associated organization.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if 'role' not in data:
            data['role'] = 'contributor'
        elif data['role'] not in ['contributor', 'organization_admin']:
            return Response(
                {'error': 'Invalid role. Must be either "contributor" or "organization_admin".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            serializer = UserSerializer(data=data)
        except ValidationError as e:
            import traceback
            traceback.print_exc()
            print (e)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
      
        print (serializer.is_valid())
        print (serializer.errors)
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    new_user = serializer.save()
                    token = ActivationToken.objects.create(user=new_user)
                    activation_path = '/organisation/contributors/activate/'
                    activation_link = f"{FRONTEND_URL}{activation_path}?token={token.token}"
                    print(f"Generated activation link: {activation_link}")

                    email_sent = send_activation_email(new_user.email, new_user.first_name, activation_link)
                    if not email_sent:
                        raise Exception("Failed to send activation email and user was not saved.")

                return Response(serializer.data, status=status.HTTP_201_CREATED)

            except Exception as e:
                return Response(
                    {
                        'error': f"Failed to add contributor: {str(e)}"
                        }
                        ,
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


 


class ActivateContributorAccount(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        token = request.GET.get('token')
        activation_token = get_object_or_404(ActivationToken, token=token)
        
        if not activation_token.is_valid():
            return Response({'error': 'The activation Link has been used. Please contact your admin'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Please set your password.'}, status=status.HTTP_200_OK)
    

    permission_classes = [AllowAny]
    def post(self, request):
        token = request.data.get('token')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')  #
        if not token or not password:
            return Response({'error': 'Token and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        if confirm_password and password != confirm_password:
            return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
        activation_token = get_object_or_404(ActivationToken, token=token)
        if not activation_token.is_valid():
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
        user = activation_token.user
        user.set_password(password)
        user.is_active = True
        user.save()
        activation_token.used = True
        activation_token.save()
        return Response({'message': 'Account activated successfully'}, status=status.HTTP_200_OK)
    



class RegisterOrganizationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()
        data['admin']['username'] = generate_username(data['admin']['first_name'], data['admin']['sur_name'])
        data['admin']['password2'] = data['admin']['password']
        

        serializer = OrganizationSerializer(data=data)

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    organization = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                print(f"Error during save: {str(e)}")
                import traceback
                traceback.print_exc()
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        print(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    







        



class OrganizationProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, org_id):
        try:
            organization = Organization.objects.get(Organization_id=org_id)
            serializer = OrganizationSerializer(organization, context={'request': request})
            serializer_data = serializer.data
            serializer_data['datasets_count'] =  Dataset.objects.filter(contributor_id_id__organization=organization).count()
            return Response(serializer_data, status=status.HTTP_200_OK)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)

    parser_classes = (MultiPartParser, FormParser)

    def put(self, request, org_id):
            
            try:
                print(request.user)
                #print the request data
                print(request.data)
                
                organization = Organization.objects.get(Organization_id=org_id)
                
                if not request.user.is_authenticated or request.user.role != 'organization_admin':
                    return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)


                if 'profile_picture' in request.FILES:
                    file_obj = request.FILES['profile_picture']
                    file_extension = file_obj.name.split('.')[-1]
                    file_name = f"profile_pictures/{org_id}/profile_picture.{file_extension}"
                    minio_client.put_object(
                        MINIO_BUCKET_NAME,
                        file_name,
                        file_obj,
                        length=file_obj.size,
                        content_type=file_obj.content_type
                    )
                    url = f"http://{MINIO_URL}/{MINIO_BUCKET_NAME}/{file_name}"
                    organization.profile_picture = url
                if 'cover_image' in request.FILES:
                    file_obj = request.FILES['cover_image']
                    file_extension = file_obj.name.split('.')[-1]
                    file_name = f"profile_pictures/cover/{org_id}/cover_image.{file_extension}"
                    minio_client.put_object(
                        MINIO_BUCKET_NAME,
                        file_name,
                        file_obj,
                        length=file_obj.size,
                        content_type=file_obj.content_type
                    )
                    url = f"http://{MINIO_URL}/{MINIO_BUCKET_NAME}/{file_name}"
                    organization.cover_image = url

                data = request.data.copy()
                data.pop('profile_picture', None)
                data.pop('cover_image', None)
                data['profile_picture'] = organization.profile_picture
                data['cover_image'] = organization.cover_image
                serializer = OrganizationSerializer(
                    organization,
                    data=data,
                    partial=True,
                    context={'request': request}
                )
                if serializer.is_valid():

                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_200_OK)
                print(f"Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            except Organization.DoesNotExist:
                return Response({"error": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                print(f"Error during update: {str(e)}")
                import traceback
                traceback.print_exc()
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrganizationDatasetsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, org_id):
        try:
            organization = Organization.objects.get(Organization_id=org_id)
            limit = int(request.query_params.get('limit', 6))
            datasets = Dataset.objects.filter(
                contributor_id__organization=organization
            ).order_by('-created_at')[:limit]
            serializer = DatasetSerializer(datasets, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)

class FollowOrganizationView(APIView):
    permission_classes = [IsAuthenticated]
    """
    Follow an organization.
    """

    def post(self, request, org_id):
        try:
            organization = Organization.objects.get(Organization_id=org_id)
            if organization.following.filter(id=request.user.id).exists():
                return Response({"error": "You are already following this organization"}, status=status.HTTP_400_BAD_REQUEST)
            organization.following.add(request.user)
            return Response({"message": "Successfully followed organization"}, status=status.HTTP_201_CREATED)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)

class UnfollowOrganizationView(APIView):
    """
    Unfollow an organization.
    THIS   POST REQUEST  IS USED TO UNFOLLOW AN ORGANIZATION when the user is authenticated
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, org_id):
        try:
            organization = Organization.objects.get(Organization_id=org_id)
            if not organization.following.filter(id=request.user.id).exists():
                return Response({"error": "You are not following this organization"}, status=status.HTTP_400_BAD_REQUEST)
            organization.following.remove(request.user)
            return Response({"message": "Successfully unfollowed organization"}, status=status.HTTP_200_OK)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found"}, status=status.HTTP_404_NOT_FOUND)