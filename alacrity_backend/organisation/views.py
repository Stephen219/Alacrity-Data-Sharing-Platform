from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import User, ActivationToken  
from users.serializers import RegisterSerializer
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.exceptions import ValidationError
from users.decorators import role_required
import random
import string
from alacrity_backend.config import FRONTEND_URL
from django.core.mail import send_mail
from alacrity_backend.settings import DEFAULT_FROM_EMAIL

from django.shortcuts import get_object_or_404
from django.core.mail import send_mail

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

def generate_password():
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    pwd = [random.choice(string.ascii_uppercase), random.choice(string.ascii_lowercase),
           random.choice(string.digits), random.choice("!@#$%^&*")]
    pwd += [random.choice(chars) for _ in range(5)]
    random.shuffle(pwd)
    return ''.join(pwd)


def send_activation_email(recipient_email, recipient_name, link):
    """
    Sends an activation email to the user with a single-use token link.
    
    Args:
        recipient_email (str): The email address of the recipient.
        recipient_name (str): The name of the recipient for personalization.
        token (str): The activation token to include in the link.
    
    Returns:
        bool: True if email was sent successfully, False otherwise.
    """
    try:
        # Construct the activation link
        
        
        subject = 'Activate Your Account'
        message = (
            f'Hello {recipient_name},\n\n'
            f'Click the link to activate your account: {link}\n'
            f'This link expires in 30 days.\n\n'
            f'Best regards,\nYour Team'
        )
        
        # Send the email using settings from EMAIL_CONFIG
        send_mail(
            subject=subject,
            message=message,
            from_email= DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,  

        )
        
        print(f"Activation email sent to {recipient_email}: {link}")
        return True
    
    except Exception as e:
        print(f"Failed to send activation email to {recipient_email}: {str(e)}")
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
        
        # Set role default to "contributor" if not provided.
        # Validate that the role is either "contributor" or "organization_admin".
        if 'role' not in data:
            data['role'] = 'contributor'
        elif data['role'] not in ['contributor', 'organization_admin']:
            return Response(
                {'error': 'Invalid role. Must be either "contributor" or "organization_admin".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            serializer = RegisterSerializer(data=data)
        except ValidationError as e:
            print (e)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        print (serializer
        )
      
        print (serializer.is_valid())
        print (serializer.errors)
        if serializer.is_valid():

            try:
                new_user = serializer.save()
                token = token = ActivationToken.objects.create(user=new_user)
                activation_path = '/organisation/contributors/activate/'
                activation_link = f"{FRONTEND_URL}{activation_path}?token={token.token}"
                link = activation_link
                send_activation_email(new_user.email, new_user.first_name, link)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


 


class ActivateContributorAccount(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        token = request.GET.get('token')
        activation_token = get_object_or_404(ActivationToken, token=token)
        
        if not activation_token.is_valid():
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'message': 'Token valid. Please set your password.'}, status=status.HTTP_200_OK)
    
    
    permission_classes = [AllowAny]
    def post(self, request):
        token = request.data.get('token')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')  #
        
        if not token or not password:
            return Response({'error': 'Token and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Optional: Server-side password confirmation check
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