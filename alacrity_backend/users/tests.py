from django.test import TestCase

from django.test import TestCase
from django.http import HttpRequest
from django.contrib.auth import get_user_model
from django.test.client import RequestFactory
from unittest.mock import patch, MagicMock
import random
import string
from .views import generate_username, clean_data

User = get_user_model()

class GenerateUsernameTests(TestCase):
    
    @patch('random.choices')
    def test_generate_username_format(self, mock_choices):
       
        mock_choices.return_value = ['a', 'b', 'c', 'd', 'e', 'f']
        
        result = generate_username("John", "Doe")
        self.assertEqual(result, "doe_john_abcdef")
        mock_choices.assert_called_once_with(
            string.ascii_lowercase + string.digits, k=6
        )
    
    def test_generate_username_strips_whitespace(self):
        with patch('random.choices', return_value=['a', 'b', 'c', 'd', 'e', 'f']):
            result = generate_username("  John  ", "  Doe  ")
            self.assertEqual(result, "doe_john_abcdef")
    
    def test_generate_username_lowercase(self):
        with patch('random.choices', return_value=['a', 'b', 'c', 'd', 'e', 'f']):
            result = generate_username("JOHN", "DOE")
            self.assertEqual(result, "doe_john_abcdef")
    
    def test_generate_username_uniqueness(self):
        first_username = generate_username("John", "Doe")
        second_username = generate_username("John", "Doe")
        self.assertNotEqual(first_username, second_username)
        self.assertTrue(first_username.startswith("doe_john_"))
        self.assertTrue(second_username.startswith("doe_john_"))


class CleanDataTests(TestCase):

    def setUp(self):
        self.factory = RequestFactory()
    
    def test_clean_data_with_standard_keys(self):
        request_data = {
            'first_name': 'John',
            'sur_name': 'Doe',
            'phone_number': '1234567890',
            'email': 'john.doe@example.com',
            'password': 'securepassword'
        }
        
        with patch('users.views.generate_username') as mock_generate:
            mock_generate.return_value = 'doe_john_abcdef'
            cleaned = clean_data(request_data)
        
        self.assertEqual(cleaned['first_name'], 'John')
        self.assertEqual(cleaned['sur_name'], 'Doe')
        self.assertEqual(cleaned['phone_number'], '1234567890')
        self.assertEqual(cleaned['email'], 'john.doe@example.com')
        self.assertEqual(cleaned['password'], 'securepassword')
        self.assertEqual(cleaned['password2'], 'securepassword')
        self.assertEqual(cleaned['role'], 'researcher')
        self.assertEqual(cleaned['username'], 'doe_john_abcdef')
    
    def test_clean_data_with_alternate_keys(self):
        request_data = {
            'firstname': 'John',
            'surname': 'Doe',
            'phonenumber': '1234567890',
            'email': 'john.doe@example.com',
            'password': 'securepassword'
        }
        
        with patch('users.views.generate_username') as mock_generate:
            mock_generate.return_value = 'doe_john_abcdef'
            cleaned = clean_data(request_data)
        
        self.assertEqual(cleaned['first_name'], 'John')
        self.assertEqual(cleaned['sur_name'], 'Doe')
        self.assertEqual(cleaned['phone_number'], '1234567890')
        self.assertEqual(cleaned['email'], 'john.doe@example.com')
        self.assertEqual(cleaned['password'], 'securepassword')
        self.assertEqual(cleaned['password2'], 'securepassword')
        self.assertEqual(cleaned['role'], 'researcher')
        self.assertEqual(cleaned['username'], 'doe_john_abcdef')
        self.assertNotIn('firstname', cleaned)
        self.assertNotIn('surname', cleaned)
        self.assertNotIn('phonenumber', cleaned)
    
    def test_clean_data_with_mixed_keys(self):
        request_data = {
            'firstname': 'John', 
            'sur_name': 'Doe',   
            'phonenumber': '1234567890',  
            'email': 'john.doe@example.com'
        }
        
        with patch('users.views.generate_username') as mock_generate:
            mock_generate.return_value = 'doe_john_abcdef'
            cleaned = clean_data(request_data)
        
        self.assertEqual(cleaned['first_name'], 'John')
        self.assertEqual(cleaned['sur_name'], 'Doe')
        self.assertEqual(cleaned['phone_number'], '1234567890')
        self.assertEqual(cleaned['role'], 'researcher')
        self.assertEqual(cleaned['username'], 'doe_john_abcdef')
    
    def test_clean_data_with_empty_values(self):
        request_data = {
            'email': 'john.doe@example.com',
            'password': 'securepassword',
            # Missing first_name, sur_name, phone_number
        }
        
        with patch('users.views.generate_username') as mock_generate:
            mock_generate.return_value = '_abcdef'
            cleaned = clean_data(request_data)
        
        self.assertEqual(cleaned['first_name'], '')
        self.assertEqual(cleaned['sur_name'], '')
        self.assertEqual(cleaned['phone_number'], '')
        self.assertEqual(cleaned['email'], 'john.doe@example.com')
        self.assertEqual(cleaned['password'], 'securepassword')
        self.assertEqual(cleaned['password2'], 'securepassword')
        self.assertEqual(cleaned['role'], 'researcher')
        self.assertEqual(cleaned['username'], '_abcdef')
    
    def test_clean_data_calls_generate_username(self):
        request_data = {
            'first_name': 'John',
            'sur_name': 'Doe',
        }
        
        with patch('users.views.generate_username') as mock_generate:
            mock_generate.return_value = 'test_username_123'
            cleaned = clean_data(request_data)
            mock_generate.assert_called_once_with('John', 'Doe')
            self.assertEqual(cleaned['username'], 'test_username_123')



class LoginViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        self.user.is_active = True
        self.user.save()
        
        self.factory = RequestFactory()
    @patch('users.views.authenticate')
    @patch('users.views.RefreshToken')
    def test_successful_login(self, mock_refresh_token, mock_authenticate):
        mock_authenticate.return_value = self.user
        mock_token = MagicMock()
        mock_token.access_token = MagicMock()
        mock_token.access_token.__str__.return_value = 'access_token_value'
        mock_token.__str__.return_value = 'refresh_token_value'
        mock_refresh_token.for_user.return_value = mock_token
        
        # Create request
        request = self.factory.post('/users/login/', {
            'email': 'test@example.com',
            'password': 'testpassword',
            'remember_me': False
        }, content_type='application/json')
        from .views import LoginView
        view = LoginView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['message'], 'Login successful')
        self.assertEqual(response.data['user']['email'], 'test@example.com')
        self.assertEqual(response.data['access_token'], 'access_token_value')
        self.assertEqual(response.data['refresh_token'], 'refresh_token_value')



import json
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APIRequestFactory
from .views import RefreshToken, get_datasets_user_has_access
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch, MagicMock
from organisation.models import Organization  

User = get_user_model()

class BaseTestCase(TestCase):
    """Base test case with common setup for authentication testing"""
    
    def setUp(self):
        # Create a test organization
        self.organization = Organization.objects.create(
            name="Test Organization"
            # Add other required fields for Organization model if needed
        )
        
        # Create users for testing
        self.admin_user = User.objects.create_user(
            username='admin_user',
            email='admin@example.com',
            password='password123',
            first_name='Admin',
            sur_name='User',
            phone_number='1234567890',
            role='organization_admin',
        )
        self.admin_user.organization = self.organization
        self.admin_user.is_active = True
        self.admin_user.is_deleted = False
        self.admin_user.save()
        
        self.researcher_user = User.objects.create_user(
            username='researcher_user',
            email='researcher@example.com',
            password='password123',
            first_name='Researcher',
            sur_name='User',
            phone_number='1234567891',
            role='researcher',
        )
        self.researcher_user.organization = self.organization
        self.researcher_user.is_active = True
        self.researcher_user.is_deleted = False
        self.researcher_user.save()
        
        self.contributor_user = User.objects.create_user(
            username='contributor_user',
            email='contributor@example.com',
            password='password123',
            first_name='Contributor',
            sur_name='User',
            phone_number='1234567892',
            role='contributor',
        )
        self.contributor_user.organization = self.organization
        self.contributor_user.is_active = True
        self.contributor_user.is_deleted = False
        self.contributor_user.save()
        
        # Initialize API client
        self.client = APIClient()
        self.factory = APIRequestFactory()

    def authenticate_user(self, user):
        """Authenticate a user by setting the JWT token in the client headers"""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
        return refresh

    def login_and_get_token(self, email, password):
        """Mock the login process to get JWT token"""
        with patch('users.views.authenticate') as mock_auth:
            mock_auth.return_value = User.objects.get(email=email)
            
            mock_refresh = MagicMock()
            mock_refresh.access_token = MagicMock()
            mock_refresh.access_token.__str__.return_value = 'access_token_value'
            mock_refresh.__str__.return_value = 'refresh_token_value'
            
            with patch('users.views.RefreshToken.for_user', return_value=mock_refresh):
                response = self.client.post('/users/login/', {
                    'email': email,
                    'password': password,
                })
                return 'access_token_value'


class UserViewTests(BaseTestCase):
    
    def test_get_user_details(self):
        """Test GET request to retrieve user details"""
        # Authenticate as the admin user
        self.authenticate_user(self.admin_user)
        
        # Make the request
        response = self.client.get(f'/users/profile/{self.admin_user.id}/')
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['email'], 'admin@example.com')
        self.assertEqual(data['firstname'], 'Admin')
        self.assertEqual(data['lastname'], 'User')
        self.assertEqual(data['phonenumber'], '1234567890')
        self.assertEqual(data['role'], 'organization_admin')
    
    def test_update_user(self):
        """Test PUT request to update user details"""
        self.authenticate_user(self.admin_user)
        
        update_data = {
            'firstname': 'Updated',
            'lastname': 'Name',
            'phonenumber': '9876543210',
        }
        
        # Mock the UserSerializer
        with patch('users.serializers.UserSerializer') as mock_serializer:  # Fixed path
            mock_instance = MagicMock()
            mock_instance.is_valid.return_value = True
            mock_instance.data = {
                'email': 'admin@example.com',
                'firstname': 'Updated',
                'lastname': 'Name',
                'phonenumber': '9876543210',
                'role': 'organization_admin',
            }
            mock_serializer.return_value = mock_instance
            
            # Make the request
            response = self.client.put(
                f'/users/profile/{self.admin_user.id}/',
                update_data,
                format='json'
            )
            
            # Check response
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data['first_name'], 'Updated')
            self.assertEqual(data['sur_name'], 'Name')
            self.assertEqual(data['phone_number'], '9876543210')
            
           
class FollowUserViewTests(BaseTestCase):
    
    def test_follow_user_success(self):
        """Test following a user successfully"""
       
        self.authenticate_user(self.researcher_user)
        
      
        with patch.object(self.researcher_user.following, 'filter') as mock_filter:
           
            mock_filter_result = MagicMock()
            mock_filter_result.exists.return_value = False
            mock_filter.return_value = mock_filter_result
            
           
            with patch.object(self.researcher_user.following, 'add') as mock_add:
                # Setup mock for get_object_or_404
                with patch('users.views.get_object_or_404') as mock_get_object:
                    mock_get_object.return_value = self.admin_user
                    
                    # Setup mock for Notification.objects.create
                    with patch('notifications.models.Notification.objects.create') as mock_notification:
                        
                        # Make the request
                        response = self.client.post(f'/users/follow/{self.admin_user.id}/')
                        
                        # Check response
                        self.assertEqual(response.status_code, 200)
                        self.assertEqual(response.json()['detail'], 'Now following user')
                        
                        mock_notification.assert_called_once()
    
    def test_follow_user_already_following(self):
        """Test following a user you already follow"""
        # Authenticate as the researcher user
        self.authenticate_user(self.researcher_user)
        
        # Mock the filter method on the following relation
        with patch.object(self.researcher_user.following, 'filter') as mock_filter:
            # Configure the mock to return a queryset that contains the admin user
            mock_filter_result = MagicMock()
            mock_filter_result.exists.return_value = True
            mock_filter.return_value = mock_filter_result
            
            # Mock the add method
            with patch.object(self.researcher_user.following, 'add') as mock_add:
                # Setup mock for get_object_or_404
                with patch('users.views.get_object_or_404') as mock_get_object:
                    mock_get_object.return_value = self.admin_user
                    
                    # Make the request
                    response = self.client.post(f'/users/follow/{self.admin_user.id}/')
                    response = self.client.post(f'/users/follow/{self.admin_user.id}/')
                    
                    # Check response
                    self.assertEqual(response.status_code, 400)
                    self.assertEqual(response.json()['detail'], 'You already follow this user')
                    
                    # Verify the user was not added to following
                    mock_add.assert_not_called()


class UnfollowUserViewTests(BaseTestCase):
    
    def test_unfollow_user_success(self):
        """Test unfollowing a user successfully"""

        self.authenticate_user(self.researcher_user)
        with patch.object(self.researcher_user.following, 'filter') as mock_filter:
            mock_filter_result = MagicMock()
            mock_filter_result.exists.return_value = True
            mock_filter.return_value = mock_filter_result
            with patch.object(self.researcher_user.following, 'remove') as mock_remove:
                with patch('users.views.get_object_or_404') as mock_get_object:
                    mock_get_object.return_value = self.admin_user
                    response = self.client.post(f'/users/follow/{self.admin_user.id}/')
                    response = self.client.post(f'/users/unfollow/{self.admin_user.id}/')
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.json()['detail'], 'Unfollowed user')
                    
                   
    
    def test_unfollow_user_not_following(self):
        """Test unfollowing a user you don't follow"""
       
        self.authenticate_user(self.researcher_user)
        with patch.object(self.researcher_user.following, 'filter') as mock_filter:
            mock_filter_result = MagicMock()
            mock_filter_result.exists.return_value = False
            mock_filter.return_value = mock_filter_result
            with patch.object(self.researcher_user.following, 'remove') as mock_remove:
                with patch('users.views.get_object_or_404') as mock_get_object:
                    mock_get_object.return_value = self.admin_user
                    response = self.client.post(f'/users/unfollow/{self.admin_user.id}/')
                    self.assertEqual(response.status_code, 400)
                    self.assertEqual(response.json()['detail'], 'You do not follow this user')
                    mock_remove.assert_not_called()

class ProfilePictureUpdateViewTests(BaseTestCase):
    
    def test_update_profile_picture_success(self):
        """Test successful profile picture update"""
        # Authenticate as the admin user
        self.authenticate_user(self.admin_user)
        
        # Create a mock file
        mock_file = MagicMock()
        mock_file.name = 'test_image.png'
        mock_file.content_type = 'image/png'
        mock_file.size = 1024
        
        # Setup mock for minioClient
        with patch('users.views.minioClient') as mock_minio:
            with patch('users.views.MINIO_SECURE', False), \
                 patch('users.views.MINIO_URL', 'minio.example.com'), \
                 patch('users.views.MINIO_BUCKET_NAME', 'test-bucket'):
                
                # Make the request
                response = self.client.post(
                    '/users/profile_pic_update/',
                    {'profile_picture': mock_file}
                )
                self.assertEqual(response.status_code, 200)
                self.assertIn('profile_picture', response.json())
                mock_minio.put_object.assert_called_once()
                args, kwargs = mock_minio.put_object.call_args
                self.assertEqual(args[0], 'alacrity')
                self.assertTrue(args[1].startswith('profile_pictures/'))


class LogoutViewTests(BaseTestCase):
    
    def test_logout_success(self):
        """Test successful logout"""
        # Mock the RefreshToken
        with patch('users.views.RefreshToken') as mock_refresh_token:
            mock_token = MagicMock()
            mock_refresh_token.return_value = mock_token
            
            # Make the request
            response = self.client.post(
                '/users/logout/',
                {'refresh_token': 'valid_refresh_token'},
                format='json'
            )
            
            # Check response
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['message'], 'Logout successful')
            mock_token.blacklist.assert_called_once()
    
    def test_logout_error(self):
        """Test logout with error"""
        # Mock the RefreshToken to raise an exception
        with patch('users.views.RefreshToken', side_effect=Exception('Invalid token')):
            response = self.client.post(
                '/users/logout/',
                {'refresh_token': 'invalid_refresh_token'},
                format='json'
            )
            self.assertEqual(response.status_code, 500)
            self.assertIn('error', response.json())
            self.assertEqual(response.json()['details'], 'Invalid token')






class UserDashboardViewTests(BaseTestCase):
    
    @patch('users.views.AnalysisSubmission.objects.filter')
    @patch('users.views.Dataset.objects.filter')
    @patch('users.views.DatasetRequest.objects.filter')
    @patch('users.views.User.objects.filter')
    def test_admin_dashboard(self, mock_user_filter, mock_request_filter, mock_dataset_filter, mock_analysis_filter):
        """Test dashboard for organization admin"""
        # Authenticate as the admin user
        self.authenticate_user(self.admin_user)
        
        # Setup mocks for querysets
        mock_analysis_count = MagicMock()
        mock_analysis_count.count.return_value = 10
        mock_analysis_filter.return_value = mock_analysis_count
        
        mock_dataset_count = MagicMock()
        mock_dataset_count.count.return_value = 20
        mock_dataset_filter.return_value = mock_dataset_count
        
        mock_request_count = MagicMock()
        mock_request_count.select_related.return_value = mock_request_count
        mock_request_count.count.return_value = 5
        mock_request_count.values.return_value = []
        mock_request_filter.return_value = mock_request_count
        
        mock_user_count = MagicMock()
        mock_user_count.count.return_value = 15
        mock_user_filter.return_value = mock_user_count
        
        # Mock role_required decorator
        with patch('users.decorators.role_required', lambda roles: lambda func: func):
            # Make the request
            response = self.client.get('/users/dashboard/')
            
            # Check response
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            self.assertEqual(data['total_researches'], 10)
            self.assertEqual(data['total_datasets'], 20)
            self.assertEqual(data['pending_requests'], 5)
            self.assertEqual(data['total_users'], 15)
            self.assertEqual(data['pending_datasets'], [])
    
    @patch('users.views.get_datasets_user_has_access')
    @patch('users.views.DatasetRequest.objects.filter')
    def test_researcher_dashboard(self, mock_request_filter, mock_get_datasets):
        """Test dashboard for researcher"""
        # Authenticate as the researcher user
        self.authenticate_user(self.researcher_user)
        
        # Setup mocks
        mock_request_filter.return_value.count.return_value = 5
        mock_request_filter.return_value.values.return_value = []
        mock_get_datasets.return_value = []
        
        # Mock role_required decorator
        with patch('users.decorators.role_required', lambda roles: lambda func: func):
            # Make the request
            response = self.client.get('/users/dashboard/')
            
            # Check response
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            self.assertEqual(data['datasets_accessed'], 0)
            self.assertEqual(data['pending_reviews'], 5)
            self.assertEqual(data['research_submitted'], 1)


class AllOrganizationMembersViewsTests(BaseTestCase):
    
    def test_get_organization_members(self):
        """Test getting all organization members"""
        # Authenticate as the admin user
        self.authenticate_user(self.admin_user)
        
        # Setup mock for User.objects.filter
        with patch('users.models.User.objects.filter') as mock_user_filter:
            mock_user_filter.return_value.values.return_value = [
                {
                    'id': 1,
                    'email': 'admin@example.com',
                    'first_name': 'Admin',
                    'sur_name': 'User',
                    'phone_number': '1234567890',
                    'role': 'organization_admin',
                    'date_joined': timezone.now(),
                    'date_of_birth': None,
                    'profile_picture': None
                },
                {
                    'id': 2,
                    'email': 'researcher@example.com',
                    'first_name': 'Researcher',
                    'sur_name': 'User',
                    'phone_number': '1234567891',
                    'role': 'researcher',
                    'date_joined': timezone.now(),
                    'date_of_birth': None,
                    'profile_picture': None
                }
            ]
            
            # Mock role_required decorator
            with patch('users.decorators.role_required', lambda roles: lambda func: func):
                # Make the request
                response = self.client.get('/users/org_members/')
                
                # Check response
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.content)
                self.assertEqual(len(data), 2)
                self.assertEqual(data[0]['email'], 'admin@example.com')
                self.assertEqual(data[1]['email'], 'researcher@example.com')


class MemberProfileViewTests(BaseTestCase):
    
    def test_get_member_profile(self):
        """Test getting a member's profile"""
        # Authenticate as the admin user
        self.authenticate_user(self.admin_user)
        self.admin_user.role = 'organization_admin'
        self.admin_user.save()
        
        # Setup mock for User.objects.get
        with patch('users.models.User.objects.get') as mock_user_get:
            mock_user = MagicMock()
            mock_user.id = 2
            mock_user.email = 'researcher@example.com'
            mock_user.first_name = 'Researcher'
            mock_user.sur_name = 'User'
            mock_user.phone_number = '1234567891'
            mock_user.role = 'organization_admin'
            mock_user.date_joined = timezone.now()
            mock_user.date_of_birth = None
            mock_user.profile_picture = None
            mock_user_get.return_value = mock_user
            
            # Mock role_required decorator
            with patch('users.decorators.role_required', lambda roles: lambda func: func):
                # Make the request
                response = self.client.get('/users/org_members/2/')
                
                # Check response
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.content)
                self.assertEqual(data['id'], 2)
                self.assertEqual(data['email'], 'researcher@example.com')
                self.assertEqual(data['first_name'], 'Researcher')
                self.assertEqual(data['sur_name'], 'User')
    


# class GetDatasetsUserHasAccessTests(TestCase):
    
#     def test_get_datasets_user_has_access(self):
#         """Test getting datasets a user has access to"""
#         user_id = 1
        
#         # Setup mocks for DatasetRequest
#         with patch('users.views.DatasetRequest.objects.filter') as mock_request_filter:
#             mock_request1 = MagicMock()
#             mock_dataset1 = MagicMock()
#             mock_dataset1.dataset_id = 1
#             mock_dataset1.title = 'Dataset 1'
#             mock_dataset1.description = 'Description 1'
#             mock_dataset1.category = 'Category 1'
#             mock_dataset1.tags = ['tag1', 'tag2']
#             mock_dataset1.number_of_rows = 100
#             mock_dataset1.size = '1MB'
#             mock_dataset1.price = 0.0
#             mock_dataset1.contributor_id.organization.name = 'Test Organization'
#             mock_dataset1.requests.exists.return_value = True
#             mock_dataset1.requests.order_by.return_value.first.return_value.updated_at.isoformat.return_value = '2023-01-01T00:00:00'
            
#             mock_request1.dataset_id = mock_dataset1
#             mock_request_filter.return_value.select_related.return_value = [mock_request1]
            
#             # Setup mock for DatasetPurchase
#             with patch('users.views.DatasetPurchase.objects.filter') as mock_purchase_filter:
#                 mock_purchase_filter.return_value.exists.return_value = False
                
#                 # Call the function
#                 result = get_datasets_user_has_access(user_id)
                
#                 # Verify results
#                 self.assertEqual(len(result), 1)
#                 self.assertEqual(result[0]['dataset_id'], 1)
#                 self.assertEqual(result[0]['title'], 'Dataset 1')
#                 self.assertEqual(result[0]['hasPaid'], True)  # Free dataset


# # class UserAccessibleDatasetsViewTests(BaseTestCase):
    
# #     def test_get_accessible_datasets(self):
# #         """Test getting datasets accessible to the user"""
# #         # Authenticate as the researcher user
# #         self.authenticate_user(self.researcher_user)
        
# #         # Setup mocks for DatasetRequest and DatasetPurchase
# #         with patch('your_app.views.DatasetRequest.objects.filter') as mock_request_filter, \
# #              patch('your_app.views.DatasetPurchase.objects.filter') as mock_purchase_filter, \
# #              patch('your_app.views.Dataset.objects.filter') as mock_dataset_filter:
            
# #             # Mock approved datasets
# #             mock_request_filter.return_value.values_list.return_value = [1, 2]
            
# #             # Mock purchased datasets
# #             mock_purchase_filter.return_value.values_list.return_value = [2]
            
# #             # Mock accessible datasets
# #             mock_dataset1 = MagicMock()
# #             mock_dataset1.dataset_id = 1
# #             mock_dataset1.title = 'Free Dataset'
# #             mock_dataset1.description = 'Description 1'
# #             mock_dataset1.category = 'Category 1'
# #             mock_dataset1.tags = ['tag1', 'tag2']
# #             mock_dataset1.number_of_rows = 100
# #             mock_dataset1.size = '1MB'
# #             mock_dataset1.price = 0.0
# #             mock_dataset1.contributor_id.organization.name = 'Test Organization'
# #             mock_dataset1.updated_at.isoformat.return_value = '2023-01-01T00:00:00'
            
# #             mock_dataset2 = MagicMock()
# #             mock_dataset2.dataset_id = 2
# #             mock_dataset2.title = 'Paid Dataset'
# #             mock_dataset2.description = 'Description 2'
# #             mock_dataset2.category = 'Category 2'
# #             mock_dataset2.tags = ['tag3', 'tag4']
# #             mock_dataset2.number_of_rows = 200
# #             mock_dataset2.size = '2MB'
# #             mock_dataset2.price = 10.0
# #             mock_dataset2.contributor_id.organization.name = 'Test Organization'
# #             mock_dataset2.updated_at.isoformat.return_value = '2023-01-02T00:00:00'
            
# #             mock_dataset_filter.return_value.distinct.return_value = [mock_dataset1, mock_dataset2]
            
# #             # Make the request
# #             response = self.client.get('/users/accessible-datasets/')
            
# #             # Check response
# #             self.assertEqual(response.status_code, 200)
# #             data = response.json()
# #             self.assertEqual(len(data), 2)
# #             self.assertEqual(data[0]['title'], 'Free Dataset')
# #             self.assertEqual(data[0]['hasPaid'], True)
# #             self.assertEqual(data[1]['title'], 'Paid Dataset')
# #             self.assertEqual(data[1]['hasPaid'], True)

