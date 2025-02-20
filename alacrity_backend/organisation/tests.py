from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.urls import reverse
from .models import Organization, Contributor
from django.contrib.auth import get_user_model

class ContributorTests(APITestCase):
    def setUp(self):
        # Create an organization using your custom primary key (Organization_id)
        self.organization = Organization.objects.create(
            name="Test Organization",
            description="Test description for the organization.",
            email="test@organization.com",
            phone="1234567890",
            address="123 Test Address"
        )

        User = get_user_model()

        # Create an admin user (from the user model) for organization admins.
        self.admin_user = User.objects.create_user(
            email='testuser@example.com',
            password='testpassword',
            username='testuser',
            role='organization_admin'
        )
        # Link the admin user to the organization and patch the attribute expected by the view.
        self.admin_user.organization = self.organization
        setattr(self.admin_user, 'Organization_id', self.organization.Organization_id)
        self.admin_user.save()

        # Create a non-admin user for testing unauthorized access.
        self.non_admin_user = User.objects.create_user(
            email='nonadmin@example.com',
            password='nonadminpassword',
            username='nonadmin',
            role='contributor'
        )
        self.non_admin_user.organization = self.organization
        setattr(self.non_admin_user, 'Organization_id', self.organization.Organization_id)
        self.non_admin_user.save()

        # (Optional) Create a Contributor instance if needed, but for authentication tests we use the user model.
        self.contributor_instance = Contributor.objects.create(
            first_name="Contributor",
            last_name="User",
            email="contributor@organization.com",
            organization=self.organization,
            role="contributor",
            password="contributorpw"
        )

        # Initialize the APIClient for making requests.
        self.client = APIClient()

    def login_and_get_token(self, email, password):
        """
        Logs in via the login endpoint and returns the access token.
        Adjust the endpoint and payload as needed.
        """
        login_url = '/users/login/'
        response = self.client.post(login_url, {
            'email': email,
            'password': password,
        })
        self.assertEqual(response.status_code, 200)
        return response.data['access_token']

    # Test POST /api/add_contributor/ API - Add contributor (authenticated as admin)
    def test_add_contributor_authenticated(self):
        token = self.login_and_get_token('testuser@example.com', 'testpassword')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "1234567890",
            "organization": self.organization.Organization_id,  # Using your custom primary key
            "role": "contributor",
            "password": "password123",
        }

        url = reverse('add_contributor')  # Make sure this matches your urls.py
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['first_name'], "John")
        self.assertEqual(response.data['email'], "john.doe@example.com")
        self.assertIn('contributor_id', response.data)

        # Verify that the contributor was saved with the proper organization.
        contributor = Contributor.objects.get(contributor_id=response.data['contributor_id'])
        self.assertEqual(contributor.first_name, "John")
        self.assertEqual(contributor.organization, self.organization)

    # Test POST /api/add_contributor/ API - Unauthorized user (non-admin)
    def test_add_contributor_unauthorized(self):
        token = self.login_and_get_token('nonadmin@example.com', 'nonadminpassword')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        data = {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com",
            "phone": "9876543210",
            "role": "contributor",
            "password": "password456",
        }

        url = reverse('add_contributor')
        response = self.client.post(url, data, format="json")
        # Non-admin users should be forbidden from adding a contributor.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test GET /api/contributors/ API - Retrieve contributors for an organization (authenticated as admin)
    def test_get_contributors_authenticated(self):
        token = self.login_and_get_token('testuser@example.com', 'testpassword')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Add an additional contributor to the organization.
        Contributor.objects.create(
            first_name="Alice",
            last_name="Wonderland",
            email="alice@example.com",
            phone="4567891230",
            organization=self.organization,
            role="contributor",
            password="password123"
        )

        # Confirm that contributors exist in the database.
        self.assertEqual(Contributor.objects.filter(organization=self.organization).count(), 3)

        url = reverse('get_contributors')
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        self.assertTrue(any(contrib['first_name'] == "Alice" for contrib in response.data))

    # Test POST /api/add_contributor/ API - Missing role (should default to 'contributor')
    def test_add_contributor_missing_role(self):
        token = self.login_and_get_token('testuser@example.com', 'testpassword')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        data = {
            "first_name": "Peter",
            "last_name": "Pan",
            "email": "peter.pan@example.com",
            "phone": "1122334455",
            "organization": self.organization.Organization_id,
            "password": "password789",
        }

        url = reverse('add_contributor')
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['role'], "contributor")
