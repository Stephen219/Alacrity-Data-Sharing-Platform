import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.urls import reverse
from users.models import ActivationToken, User
from unittest.mock import patch
from django.utils import timezone
from organisation.models import Organization
from rest_framework_simplejwt.tokens import RefreshToken


class AddContributorsTestCase(TestCase):
    def setUp(self):
        """Set up test case with initial user and organization data."""
        User = get_user_model()
        self.user = User.objects.create_user(
        
            email='admin@example.com',
            password='adminpassword',
            username='adminuser',
            role='organization_admin'
        )
        self.org = Organization.objects.create(
            Organization_id='123',
            name='Test Organization'
        )
        
        self.user.organization = self.org
        self.user.save()
        
        self.valid_contributor_data = {
        'email': 'contributor@example.com',
        'firstname': 'Test',
        'lastname': 'Contributor',  
        'phonenumber': '1234567890'  
    }
        
        self.client = APIClient()

    def get_jwt_token(self):
        """Generate and return a JWT access token for the test user."""
        refresh = RefreshToken.for_user(self.user)
        return str(refresh.access_token)

    @patch('organisation.views.send_activation_email')
    @patch('organisation.views.generate_password')
    @patch('organisation.views.generate_username')
    def test_add_contributor_success(self, mock_generate_username, 
                                   mock_generate_password, mock_send_email):
        """Test successful addition of a contributor with valid data."""
        # Arrange
        mock_generate_username.return_value = 'contributor_test_abc123'
        mock_generate_password.return_value = 'SecurePass123!'
        mock_send_email.return_value = True
        
        token = self.get_jwt_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Act
        response = self.client.post(
            reverse('add_contributor'),
            self.valid_contributor_data,
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, 201)
        self.assertIn('username', response.data)
        self.assertEqual(response.data['username'], 'contributor_test_abc123')

    def test_add_contributor_unauthenticated(self):
        """Test adding a contributor without authentication."""
        # Act
        response = self.client.post(
            reverse('add_contributor'),
            self.valid_contributor_data,
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, 401)

    @patch('organisation.views.generate_username')
    @patch('organisation.views.generate_password')
    def test_add_contributor_invalid_role(self, mock_generate_password, mock_generate_username):
        """Test adding a contributor with an invalid role in request data."""
        # Arrange
        mock_generate_username.return_value = 'contributor_test_abc123'
        mock_generate_password.return_value = 'SecurePass123!'
        
        token = self.get_jwt_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        invalid_role_data = self.valid_contributor_data.copy()
        invalid_role_data['role'] = 'super_admin'
        
        # Act
        response = self.client.post(
            reverse('add_contributor'),
            invalid_role_data,
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid role', str(response.data['error']))

    @patch('organisation.views.generate_username')
    @patch('organisation.views.generate_password')
    def test_add_contributor_invalid_data(self, mock_generate_password, mock_generate_username):
        """Test adding a contributor with missing required data fields."""
        # Arrange
        mock_generate_username.return_value = 'contributor_test_abc123'
        mock_generate_password.return_value = 'SecurePass123!'
        
        token = self.get_jwt_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        invalid_data = {
            'first_name': 'Test',
            'sur_name': 'Contributor'
        }
        
        # Act
        response = self.client.post(
            reverse('add_contributor'),
            invalid_data,
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.data)


class ActivateContributorAccountTestCase(TestCase):
    def setUp(self):
        """Set up test case with an unactivated user and activation token."""
        User = get_user_model()
        self.user = User.objects.create_user(
            email='contributor@example.com',
            password='temppassword',
            username='contributor',
            role='contributor',
            is_active=False
        )
        
        self.token_value = str(uuid.uuid4())
        self.token = ActivationToken.objects.create(
            user=self.user,
            token=self.token_value,
            created_at=timezone.now(),
            used=False
        )
        
        self.client = APIClient()

    def test_get_activation_valid_token(self):
        """Test GET request with a valid activation token."""
        # Act
        response = self.client.get(
            reverse('activate_contributor'),
            {'token': self.token_value}
        )
        
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], 'Please set your password.')

    def test_get_activation_invalid_token(self):
        """Test GET request with an invalid activation token."""
        # Act
        response = self.client.get(
            reverse('activate_contributor'),
            {'token': str(uuid.uuid4())}
        )
        
        # Assert
        self.assertEqual(response.status_code, 404)

    def test_get_activation_used_token(self):
        """Test GET request with a previously used activation token."""
        # Arrange
        self.token.used = True
        self.token.save()
        
        # Act
        response = self.client.get(
            reverse('activate_contributor'),
            {'token': self.token_value}
        )
        
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertIn('activation Link has been used', str(response.data['error']))

    def test_post_activation_success(self):
        """Test successful account activation with valid token and password."""
        # Arrange
        data = {
            'token': self.token_value,
            'password': 'newSecurePassword123!',
            'confirm_password': 'newSecurePassword123!'
        }
        
        # Act
        response = self.client.post(
            reverse('activate_contributor'),
            data,
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], 'Account activated successfully')
        
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)
        self.token.refresh_from_db()
        self.assertTrue(self.token.used)

    def test_post_activation_passwords_dont_match(self):
        """Test account activation with mismatched passwords."""
        # Arrange
        data = {
            'token': self.token_value,
            'password': 'password1',
            'confirm_password': 'password2'
        }
        
        # Act
        response = self.client.post(
            reverse('activate_contributor'),
            data,
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertIn('Passwords do not match', str(response.data['error']))

    def test_post_activation_missing_data(self):
        """Test account activation with missing password data."""
        # Arrange
        data = {
            'token': self.token_value
        }
        
        # Act
        response = self.client.post(
            reverse('activate_contributor'),
            data,
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertIn('Token and password are required', str(response.data['error']))

    def test_post_activation_expired_token(self):
        """Test account activation with an expired/used token."""
        # Arrange
        self.token.used = True
        self.token.save()
        
        data = {
            'token': self.token_value,
            'password': 'newSecurePassword123!',
            'confirm_password': 'newSecurePassword123!'
        }
        
        # Act
        response = self.client.post(
            reverse('activate_contributor'),
            data,
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid or expired token', str(response.data['error']))
