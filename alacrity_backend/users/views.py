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
from django.db import models
from django.db.models import F, ExpressionWrapper, DurationField
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Sum
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework.permissions import AllowAny
from rest_framework import status
from .serializers import UserSerializer , TopResearcherSerializer
from django.utils import timezone
from dataset_requests.models import DatasetRequest
from research.models import AnalysisSubmission
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .decorators import role_required
from datasets.models import Dataset , ViewHistory
from payments.models import DatasetPurchase
from django.db.models import Q
from django.db.models.functions import TruncMonth
from django.db.models import Count
from .models import User
import traceback
from datetime import timedelta
from django.utils.timezone import now
import datetime
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()
from alacrity_backend.settings import MINIO_URL, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET_NAME, MINIO_SECURE
from minio import Minio, S3Error

from rest_framework import status
from  notifications.models import Notification

from datasets.serializer import DatasetSerializer
from organisation.serializer import OrganizationSerializer
from organisation.models import Organization 



minioClient = Minio(
    MINIO_URL,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

class ChangePasswordView(APIView):
    """
    Logged in user can change their password and receive a confirmation email.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Retrieve password fields from request data
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        # Ensure all fields are provided
        if not old_password or not new_password or not confirm_password:
            return Response(
                {"error": "Old password, new password, and confirm password are all required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the old password is correct
        if not request.user.check_password(old_password):
            return Response(
                {"error": "Old password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure the new password and confirmation match
        if new_password != confirm_password:
            return Response(
                {"error": "New password and confirm password do not match."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update the password with proper hashing
        request.user.set_password(new_password)
        request.user.save()

        # Prepare and send confirmation email
        subject = "Your password has been changed"
        email_message = (
            f"Hi {request.user.first_name},\n\n"
            "Your password has been successfully changed.\n"
            "If you did not initiate this change, please contact our support team immediately.\n\n"
            "Best regards,\n"
            "The Support Team"
        )
        send_mail(
            subject,
            email_message,
            settings.DEFAULT_FROM_EMAIL,
            [request.user.email],
            fail_silently=False,
        )

        # Return a success response with an extra note about the email
        return Response(
            {"message": "Password updated successfully. A confirmation email has been sent."},
            status=status.HTTP_200_OK
        )

    
class ForgotPasswordView(APIView):
    """
    If user exists, generate a token and email them the reset password link.
    """
    permission_classes = [AllowAny] 

    def post(self, request):
        try:
            email = request.data.get('email', '')
            if not email:
                return Response({'error': 'Email field is required.'}, status=status.HTTP_400_BAD_REQUEST)

           
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                
                return Response({"message": "If that email is recognised, a reset link will be sent."},
                                status=status.HTTP_200_OK)

           
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)

            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

           
            frontend_reset_url = f"{settings.FRONTEND_URL}/reset-password?uidb64={uidb64}&token={token}"

            # Sends email
            subject = "Password Reset Requested"
            message = (
                f"Hi {user.first_name},\n\n"
                f"You (or someone else) requested a password reset for your account.\n\n"
                f"Please click the link below to reset your password:\n"
                f"{frontend_reset_url}\n\n"
                f"If you did not request a password reset, kindly ignore this email."
            )
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL, 
                [user.email],
                fail_silently=False,
            )

            return Response(
                {"message": "If that email is recognised, a reset link will be sent."},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            traceback.print_exc()
            return Response(
                {"error": "Something went wrong while requesting password reset."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResetPasswordView(APIView):
    """
    Validate the token; if valid, set the new password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            uidb64 = request.data.get('uidb64', '')
            token = request.data.get('token', '')
            new_password = request.data.get('password', '')

            if not (uidb64 and token and new_password):
                return Response({"error": "uidb64, token, and password are all required."},
                                status=status.HTTP_400_BAD_REQUEST)

            # Decodes user PK from uidb64
            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
            except (ValueError, User.DoesNotExist):
                return Response({"error": "Invalid user identifier."},
                                status=status.HTTP_400_BAD_REQUEST)

            # Checks token
            token_generator = PasswordResetTokenGenerator()
            if not token_generator.check_token(user, token):
                return Response({"error": "Invalid or expired token."},
                                status=status.HTTP_400_BAD_REQUEST)

            # If token is valid, set the new password
            user.set_password(new_password)
            user.save()

            Notification.objects.create(
                user=user,
                message="Your password has been reset successfully.",
                is_read=False
            )

            return Response({"message": "Password reset successful."},
                            status=status.HTTP_200_OK)

        except Exception as e:
            traceback.print_exc()
            return Response(
                {"error": "Something went wrong while resetting the password."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class WeeklyActivityView(APIView):
    """
    Aggregates weekly activity data:
    - Datasets: number of dataset uploads per day
    - Reports: number of submission approvals per day
    - returns weekly data based off these things
    """
    permission_classes = [AllowAny]

    def get(self, request):
        now_time = timezone.now()
        # Week starts on Monday. Normalise start_week to midnight.
        start_week = now_time - datetime.timedelta(days=now_time.weekday())
        start_week = start_week.replace(hour=0, minute=0, second=0, microsecond=0)

        days = []
        dataset_counts = []
        approval_counts = []
        # Loops through each day of the week
        for i in range(7):
            day_start = start_week + datetime.timedelta(days=i)
            day_end = day_start + datetime.timedelta(days=1)
            day_label = day_start.strftime("%a") 
            days.append(day_label)

            # Counts dataset uploads made on this day
            dataset_count = Dataset.objects.filter(
                created_at__gte=day_start, created_at__lt=day_end
            ).count()
            dataset_counts.append(dataset_count)

            # Counts submission approvals on this day.
            approval_count = AnalysisSubmission.objects.filter(
                status="published", submitted_at__gte=day_start, submitted_at__lt=day_end
            ).count()
            approval_counts.append(approval_count)

        data = {
            "days": days,            
            "datasets": dataset_counts,  
            "reports": approval_counts, 
        }
        return Response(data, status=200)

    
class MonthlyUsersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            User = get_user_model()

            # Fetch users by last_login month
            org_users = list(
                User.objects.filter(role="organization_admin", last_login__isnull=False)
                .annotate(month=TruncMonth("last_login"))
                .values("month")
                .annotate(count=Count("id", distinct=True))
                .order_by("month")
            )

            researcher_users = list(
                User.objects.filter(role__in=["researcher", "contributor"], last_login__isnull=False)
                .annotate(month=TruncMonth("last_login"))
                .values("month")
                .annotate(count=Count("id", distinct=True))
                .order_by("month")
            )

         
            months_list = [(now() - timedelta(days=30 * i)).strftime("%b") for i in range(6)]
            months_list.reverse()  

          
            def get_data(users):
                return {entry["month"].strftime("%b"): entry["count"] for entry in users}

            org_data = get_data(org_users)
            researcher_data = get_data(researcher_users)

            # Ensure all months in `months_list` appear in the data
            final_org_data = [org_data.get(month, 0) for month in months_list]
            final_researcher_data = [researcher_data.get(month, 0) for month in months_list]

            data = {
                "months": months_list,
                "organizations": final_org_data,
                "researchers": final_researcher_data,
            }

            print("API Response:", data)  

            return Response(data, status=200)

        except Exception as e:
            print("Error in MonthlyUsersView:", e)
            traceback.print_exc() 
            return Response(data, status=200)
    

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            remember_me = request.data.get('remember_me', False)

            print(email, password, remember_me)

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
                user.save()
                refresh = RefreshToken.for_user(user)
                if remember_me == True:
                    refresh.lifetime=timedelta(days=7)
                else:
                    refresh.set_exp(lifetime=timedelta(days=1))

                print(refresh.check_exp)
                print(refresh.check_exp)
                print(refresh.access_token.current_time)
                print(refresh.lifetime)
               
                
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
    cleaned_data['first_name'] = cleaned_data.get('firstname', cleaned_data.get('first_name', ''))
    cleaned_data['sur_name'] = cleaned_data.get('surname', cleaned_data.get('sur_name', ''))
    cleaned_data['phone_number'] = cleaned_data.get('phonenumber', cleaned_data.get('phone_number', ''))
    cleaned_data.pop('firstname', None)
    cleaned_data.pop('surname', None)
    cleaned_data.pop('phonenumber', None)
    cleaned_data['role'] = 'researcher'
    cleaned_data['password2'] = cleaned_data.get('password', cleaned_data.get('password2', ''))
    cleaned_data['username'] = generate_username(cleaned_data['first_name'], cleaned_data['sur_name'])
    return cleaned_data




class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print(f"Received data: {request.data}")
        mapped_data = clean_data(request.data)
        print("#############################################3")
        print(f"Mapped data: {mapped_data}")
        serializer = UserSerializer(data=mapped_data)
        print("serializer")
        print(serializer)
        try:
            if serializer.is_valid():
                user = serializer.save()
                response_data = {
                    "message": "User registered successfully",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "firstname": user.first_name,  
                        "surname": user.sur_name,     
                        "phonenumber": user.phone_number, 
                        "role": user.role,
                        "organization": user.organization.name if user.organization else None,
                        "field": user.field,
                    }
                }
                return Response(response_data, status=status.HTTP_201_CREATED)
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Exception: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": "Registration failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )







class LoggedInUser(APIView):
    def get(self, request):
        user = request.user
        researchers = list(AnalysisSubmission.objects.filter(researcher=user, status="published",
        is_private=False)
                           .values('id', 'title', 'description', 'status', 'submitted_at'))
        bookmarked_researches = []
    
        return Response({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "firstname": user.first_name,
            "lastname": user.sur_name,
            "profile_picture": user.profile_picture,
            "date_joined": user.date_joined,
            "date_of_birth": user.date_of_birth,
            "bio": user.bio,


            "phonenumber": user.phone_number,
            "role": user.role,

            "organization": user.organization.name if user.organization else None,
            # here we have to use fkey to get the organization id
            "organization_id":  user.organization.Organization_id if user.organization else None,
            "field": user.field,
            "researches": researchers,
            "bookmarked_researches": bookmarked_researches
        }, status=status.HTTP_200_OK)







class UserView(APIView):
    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        
        # i odont know why the phone number is not being returned in the serializer
        # so i will add it manually to the data for now
        serializer = UserSerializer(user, context={"request": request})
        data = serializer.data
        data['phone_number'] = user.phone_number
       
        first_name = data['first_name']
        sur_name = data['sur_name']
        phone_number = data['phone_number']
        data.pop('first_name', None)
        data.pop('sur_name', None)
        data.pop('phone_number', None)
        data['firstname'] = first_name
        data['lastname'] = sur_name
        data['phonenumber'] = phone_number
        return Response(data, status=status.HTTP_200_OK)

    def put(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        print(request.data)
        print(request.data)

        if not request.user.is_authenticated or request.user.id != user.id:
            return Response({"detail": "Not authorized to update this profile"}, status=status.HTTP_403_FORBIDDEN)
        first_name = request.data.get('firstname', None)
        sur_name = request.data.get('lastname', None)
        phone_number = request.data.get('phonenumber', None)
        data = request.data.copy()
        data.pop('firstname', None)
        data.pop('surname', None)
        data.pop('phonenumber', None)

        data['first_name'] = first_name
        data['sur_name'] = sur_name
        data['phone_number'] = phone_number
        serializer = UserSerializer(user, data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, user_id):
        pass

class FollowUserView(APIView):
    def post(self, request, user_id):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        target_user = get_object_or_404(User, id=user_id)
        if target_user == request.user:
            return Response({"detail": "You cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.following.filter(id=target_user.id).exists():
            return Response({"detail": "You already follow this user"}, status=status.HTTP_400_BAD_REQUEST)

        request.user.following.add(target_user)

        Notification.objects.create(
            user=target_user,
            message=f"{request.user.first_name} {request.user.sur_name} has followed you.",
            is_read=False
        )
       
        return Response({"detail": "Now following user"}, status=status.HTTP_200_OK)

class UnfollowUserView(APIView):
    def post(self, request, user_id):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        target_user = get_object_or_404(User, id=user_id)
        if not request.user.following.filter(id=target_user.id).exists():
            return Response({"detail": "You do not follow this user"}, status=status.HTTP_400_BAD_REQUEST)

        request.user.following.remove(target_user)
        return Response({"detail": "Unfollowed user"}, status=status.HTTP_200_OK)
        
    
    





class ProfilePictureUpdateView(APIView):
    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        user = request.user
        profile_picture = request.FILES.get('profile_picture')

        if not profile_picture:
            return Response({"detail": "No profile picture provided"}, status=status.HTTP_400_BAD_REQUEST)

        if not profile_picture.content_type.startswith('image/'):
            return Response({"detail": "Only image files are allowed"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file_extension = profile_picture.name.split('.')[-1] if '.' in profile_picture.name else 'png'
            object_name = f"profile_pictures/{user.id}/profile_picture.{file_extension}"

            minioClient.put_object(
                settings.MINIO_BUCKET_NAME,
                object_name,
                profile_picture.file,
                length=profile_picture.size,
                content_type=profile_picture.content_type
            )

            if MINIO_SECURE:
                user.profile_picture = f"https://{MINIO_URL}/{MINIO_BUCKET_NAME}/{object_name}"
            else:
                user.profile_picture = f"http://{MINIO_URL}/{MINIO_BUCKET_NAME}/{object_name}"
            user.save()
            return Response({"profile_picture": user.profile_picture}, status=status.HTTP_200_OK)

        except S3Error as e:
            return Response({"error": f" error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"error": f"Error uploading profile picture: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
        


# TODO: REFACTOR THIS VIEW BUT FOR NOW I HAVE TO MAKE IT WORK

class UserDashboardView(APIView):
    """
    This view is used to get the user dashboard data
    IT returns the total number of researches, datasets, pending requests, approved requests, total users, total publishes for organization data
    now it is being used by the organization admin, researcher and contributor but i will refactor it 

    """
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
            datasets_having_access = get_datasets_user_has_access(user.id)
            data = {
                "datasets_accessed": len(datasets_having_access),
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

        


class AllOrganizationMembersViews(APIView):
    """
    This view is used to get all the members of the organization
    @return: a list of all the members of the organization

    """
    permission_classes = [IsAuthenticated]
    @role_required(["organization_admin"])
    def get(self, request):
        user = request.user
        organization = user.organization
        employees = User.objects.filter(organization=organization).values(
            'id', 'email', 'first_name', 'sur_name', 'phone_number', 'role', 'date_joined', 'date_of_birth', 'profile_picture'
        )
        return JsonResponse(list(employees), safe=False)
    



class MemberProfileView(APIView):
    permission_classes = [IsAuthenticated]
    """
    This view is used to get, update, block or delete a member of the organization
    @param member_id: the id of the member
    @return: a json response of the member data
    

    TECHNICALLY THIS SHPULS BE IN THE ORGANIZATION VIEWS BUT I AM PUTTING IT HERE FOR NOW   I CAN MOOVE IT LATTER 
    IN THE MEBERS PROFUILE THE REQUESTS PROCESSED IS ALSO ADDED BUTIT IS IN ORGANIZATION VIEWS SO I WILL NOT ADD IT HERE FOR NOW 
    
        
    """

    @role_required(["organization_admin","contributor"])
    def get(self, request, member_id):
        print(member_id)
        user = request.user
        try:
            member = User.objects.get(id=member_id, organization=user.organization)
            member_data = {
                'id': member.id,
                'email': member.email,
                'first_name': member.first_name,
                'sur_name': member.sur_name,
                'phone_number': member.phone_number,
                'role': member.role,
                'date_joined': member.date_joined.isoformat(),
                'date_of_birth': member.date_of_birth.isoformat() if member.date_of_birth else None,
                'profile_picture': member.profile_picture,
                # Add requests_processed if you have a related model
                # 'requests_processed': list(member.requests_processed.values('id', 'title', 'date_processed', 'status'))
            }
            return JsonResponse(member_data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)

    @role_required(["organization_admin"])
    def patch(self, request, member_id):
        user = request.user
        try:
            member = User.objects.get(id=member_id, organization=user.organization)
            is_blocked = request.data.get('is_blocked', False)
            member.is_active = not is_blocked # TODO: NOT WORKING YET
            member.save()
            return JsonResponse({'message': 'Block status updated'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)

    @role_required(["organization_admin"])
    def delete(self, request, member_id):
        user = request.user
        try:
            member = User.objects.get(id=member_id, organization=user.organization)
            member.delete()
            return JsonResponse({'message': 'Member removed'}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)
        
def get_datasets_user_has_access(user_id):
    """
    Return all datasets that the user has an *approved* request for,
    plus a 'hasPaid' flag so the frontend can show "Pay" or "Analyze."
    """
    from datasets.models import Dataset
    from dataset_requests.models import DatasetRequest

    approved_requests = DatasetRequest.objects.filter(
        researcher_id=user_id,
        request_status='approved'
    ).select_related('dataset_id')

    # Builds a list of dictionaries
    results = []
    for req in approved_requests:
        ds = req.dataset_id

        purchased = DatasetPurchase.objects.filter(dataset=ds, buyer_id=user_id).exists()

        results.append({
            "dataset_id": ds.dataset_id,
            "title": ds.title,
            "description": ds.description,
            "category": ds.category,
            "tags": ds.tags,
            "entries": ds.number_of_rows,
            "size": ds.size,
            "contributor_id__organization__name":
                ds.contributor_id.organization.name if ds.contributor_id and ds.contributor_id.organization else None,
            "requests__updated_at":
                ds.requests.order_by('-updated_at').first().updated_at.isoformat()
                if ds.requests.exists() else None,
            "price": float(ds.price),
            # hasPaid = True if the dataset is free OR the user purchased it
            "hasPaid": (ds.price == 0.0) or purchased,
        })
    return results


class UserAccessibleDatasetsView(APIView):
    """
    Returns datasets that the user has access to:
    - Approved and Free datasets
    - Approved and Paid-for datasets
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.user.id

        # Gets dataset IDs where user has an approved request
        approved_datasets = list(DatasetRequest.objects.filter(
            researcher_id=user_id, request_status="approved"
        ).values_list("dataset_id", flat=True))

        # Gets dataset IDs the user has paid for
        purchased_datasets = list(DatasetPurchase.objects.filter(
            buyer_id=user_id
        ).values_list("dataset_id", flat=True))

        # Fetch datasets that are:
        # 1. Approved AND Free
        # 2. Approved AND Paid
        accessible_datasets = Dataset.objects.filter(
            Q(dataset_id__in=approved_datasets, price=0.0) |
            (Q(dataset_id__in=approved_datasets) & Q(dataset_id__in=purchased_datasets))
        ).distinct()


        dataset_list = []
        for dataset in accessible_datasets:
            has_paid = dataset.price == 0.0 or dataset.dataset_id in purchased_datasets

            dataset_list.append({
                "dataset_id": dataset.dataset_id,
                "title": dataset.title,
                "description": dataset.description,
                "category": dataset.category,
                "tags": dataset.tags,
                "organization": dataset.contributor_id.organization.name
                if dataset.contributor_id and dataset.contributor_id.organization
                else None,
                "price": float(dataset.price),
                "hasPaid": has_paid,
                "entries": dataset.number_of_rows,
                "size": dataset.size,

                "updated_at": dataset.updated_at.isoformat(),
            })

        return Response(dataset_list, status=200)



class DatasetWithAccessView(APIView):
    permission_classes = [IsAuthenticated]
    @role_required(["researcher"])
    def get(self, request):
        user = request.user

        accessible_datasets_view = UserAccessibleDatasetsView()
        response = accessible_datasets_view.get(request)

        return JsonResponse(response.data, safe=False)
    

class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]
    @role_required(["organization_admin" , "contributor", "researcher"])
    def get(self, request):
        user = request.user
        query = request.GET.get('query', '')
        if not query:
            return JsonResponse([], safe=False)
        users = User.objects.filter(
            Q(first_name__icontains=query) | Q(sur_name__icontains=query),
            organization=user.organization
        ).values(
            'id', 'email', 'first_name', 'sur_name', 'phone_number', 'role', 'date_joined', 'date_of_birth', 'profile_picture'
        )
        return JsonResponse(list(users), safe=False)
    

class most_followed_users(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        user = request.user
        users = User.objects.filter(role='researcher').annotate(
            followers_count=Count('followers')
        ).order_by('-followers_count')[:3]
        serializer = TopResearcherSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class top_researchers(APIView):
    permission_classes = [IsAuthenticated]
    @role_required(["organization_admin" , "contributor", "researcher"])
    def get(self, request):
        user = request.user
        field = user.field  # Assuming 'field' is a field on your User model
        if not field:
            return Response({"error": "User has no field specified"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Fetch top researchers in the same field
        users = User.objects.filter(role='researcher', field=field).annotate(
            followers_count=Count('followers')
        ).order_by('-followers_count')[:3]
        
        serializer = TopResearcherSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class SearchView(APIView):
    permission_classes = [IsAuthenticated] # ensures the user is authentiacted

    @role_required(["organization_admin" , "contributor", "researcher"])
    def get(self, request):
        query = request.query_params.get('q' , '').strip()
        if not query:
            return Response({"error": "Search query is required"}, status=status.HTTP_400_BAD_REQUEST)
        

        # searching for datasets 
        datasets = Dataset.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query) | Q(tags__icontains=query))
        dataset_serializer = DatasetSerializer(datasets, many=True, context={'request': request})

        # searching for organizations
        organizations = Organization.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)) 
        organization_serializer = OrganizationSerializer(organizations, many=True, context={'request': request})

        # searching for users
        users = User.objects.filter(
            Q(first_name__icontains=query) | Q(sur_name__icontains=query) | Q(email__icontains=query), role='researcher')
        user_serializer = UserSerializer(users, many=True, context={'request': request})

        return Response({
            "datasets": dataset_serializer.data,
            "organizations": organization_serializer.data,
            "users": user_serializer.data
        }, status=status.HTTP_200_OK)

class TrendingUsersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Define a short period (e.g., last 7 days)
        time_threshold = timezone.now() - timedelta(days=7)
        
        # Filter researchers joined in the last 7 days and order by follower count
        trending_users = User.objects.filter(
            date_joined__gte=time_threshold,
            role='researcher'  # Only researchers
        ).annotate(
            follower_count=models.Count('followers')
        ).order_by('-follower_count')[:3]
        
        serializer = UserSerializer(trending_users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


    
