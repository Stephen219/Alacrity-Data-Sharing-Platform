# from django.test import TestCase

# from django.test import TestCase
# from rest_framework.test import APIClient
# from django.contrib.auth import get_user_model
# from django.urls import reverse
# from datasets.models import Dataset
# from dataset_requests.models import DatasetRequest
# from users.models import Organization
# from unittest.mock import patch

# class DatasetRequestTests(TestCase):
#     def setUp(self):
#         # Create organization
#         self.organization = Organization.objects.create(
#             name="Test Organization",
#             description="Test Description"
#         )
        
#         # Create a contributor user
#         User = get_user_model()
#         self.contributor = User.objects.create_user(
#             email='contributor@example.com',
#             password='testpassword',
#             username='contributor',
#             role='contributor',
#             organization=self.organization
#         )
        
#         # Create an organization admin user
#         self.org_admin = User.objects.create_user(
#             email='admin@example.com',
#             password='testpassword',
#             username='orgadmin',
#             role='organization_admin',
#             organization=self.organization
#         )
        
#         # Create a researcher user
#         self.researcher = User.objects.create_user(
#             email='researcher@example.com',
#             password='testpassword',
#             username='researcher',
#             role='researcher'
#         )
        
#         # Create a test dataset
#         self.dataset = Dataset.objects.create(
#             title="Test Dataset",
#             description="Test Description",
#             contributor_id=self.contributor,
#             organization=self.organization
#         )
        
#         # Initialize API client
#         self.client = APIClient()
    
#     def get_token_for_user(self, user_email, password):
#         """Helper method to get JWT token for a user"""
#         login_response = self.client.post('/users/login/', {
#             'email': user_email,
#             'password': password,
#         })
#         self.assertEqual(login_response.status_code, 200)
#         return login_response.data['access_token']
    
#     @patch('dataset_requests.views.send_email_to_contributor')
#     def test_researcher_makes_request(self, mock_send_email):
#         """Test that a researcher can make a request for a dataset"""
#         # Mock the email sending function
#         mock_send_email.return_value = True
        
#         # Get researcher's token
#         token = self.get_token_for_user('researcher@example.com', 'testpassword')
        
#         # Set token in request header
#         self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
#         # Make request for dataset
#         response = self.client.post(
#             '/dataset-requests/makerequest/',
#             {
#                 'dataset_id': self.dataset.dataset_id,
#                 'objective': 'I need this dataset for research purposes.'
#             },
#             format='json'
#         )
        
#         # Check response
#         self.assertEqual(response.status_code, 201)
#         self.assertEqual(response.data['message'], 'Request created successfully')
        
#         # Verify database record
#         self.assertTrue(DatasetRequest.objects.filter(
#             dataset_id=self.dataset,
#             researcher_id=self.researcher,
#             request_status='pending'
#         ).exists())
        
#         # Verify email was sent
#         mock_send_email.assert_called_once()
    
#     @patch('dataset_requests.views.send_email')
#     def test_contributor_approves_request(self, mock_send_email):
#         """Test that a contributor can approve a request"""
#         # Mock the email sending function
#         mock_send_email.return_value = True
        
#         # Create a pending request
#         dataset_request = DatasetRequest.objects.create(
#             dataset_id=self.dataset,
#             researcher_id=self.researcher,
#             message='I need this dataset for research purposes.'
#         )
        
#         # Get contributor's token
#         token = self.get_token_for_user('contributor@example.com', 'testpassword')
        
#         # Set token in request header
#         self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
#         # Approve the request
#         response = self.client.post(
#             f'/dataset-requests/request/{dataset_request.request_id}/',
#             {'action': 'accept'},
#             format='json'
#         )
        
#         # Check response
#         self.assertEqual(response.status_code, 200)
#         self.assertEqual(response.data['message'], 'Request accepted successfully')
        
#         # Verify database record updated
#         dataset_request.refresh_from_db()
#         self.assertEqual(dataset_request.request_status, 'approved')
        
#         # Verify dataset view count updated
#         self.dataset.refresh_from_db()
#         self.assertEqual(self.dataset.view_count, 1)
        
#         # Verify email was sent
#         mock_send_email.assert_called_once()
    
#     @patch('dataset_requests.views.send_email')
#     def test_org_admin_rejects_request(self, mock_send_email):
#         """Test that an organization admin can reject a request"""
#         # Mock the email sending function
#         mock_send_email.return_value = True
        
#         # Create a pending request
#         dataset_request = DatasetRequest.objects.create(
#             dataset_id=self.dataset,
#             researcher_id=self.researcher,
#             message='I need this dataset for research purposes.'
#         )
        
#         # Get admin's token
#         token = self.get_token_for_user('admin@example.com', 'testpassword')
        
#         # Set token in request header
#         self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
#         # Reject the request
#         response = self.client.post(
#             f'/dataset-requests/request/{dataset_request.request_id}/',
#             {'action': 'reject'},
#             format='json'
#         )
        
#         # Check response
#         self.assertEqual(response.status_code, 200)
#         self.assertEqual(response.data['message'], 'Request rejected successfully')
        
#         # Verify database record updated
#         dataset_request.refresh_from_db()
#         self.assertEqual(dataset_request.request_status, 'denied')
        
#         # Verify email was sent
#         mock_send_email.assert_called_once()
    
#     def test_unauthorized_user_cant_make_request(self):
#         """Test that an unauthorized user can't make a request"""
#         # Get contributor's token (contributors can't make requests)
#         token = self.get_token_for_user('contributor@example.com', 'testpassword')
        
#         # Set token in request header
#         self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
#         # Try to make request for dataset
#         response = self.client.post(
#             '/dataset-requests/make-request/',
#             {
#                 'dataset_id': self.dataset.dataset_id,
#                 'objective': 'I need this dataset for research purposes.'
#             },
#             format='json'
#         )
        
#         # Check response (should be 403 Forbidden)
#         self.assertEqual(response.status_code, 403)
    
#     def test_unauthorized_user_cant_approve_request(self):
#         """Test that an unauthorized user can't approve/reject requests"""
#         # Create a pending request
#         dataset_request = DatasetRequest.objects.create(
#             dataset_id=self.dataset,
#             researcher_id=self.researcher,
#             message='I need this dataset for research purposes.'
#         )
        
#         # Get researcher's token (researchers can't approve/reject)
#         token = self.get_token_for_user('researcher@example.com', 'testpassword')
        
#         # Set token in request header
#         self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
#         # Try to approve the request
#         response = self.client.post(
#             f'/dataset-requests/request/{dataset_request.request_id}/',
#             {'action': 'accept'},
#             format='json'
#         )
        
#         # Check response (should be 403 Forbidden)
#         self.assertEqual(response.status_code, 403)
# # Create your tests here.
