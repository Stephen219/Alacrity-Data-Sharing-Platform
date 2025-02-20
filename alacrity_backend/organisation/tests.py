from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Organization, Contributor
from django.urls import reverse

class ContributorTests(APITestCase):
    def setUp(self):
        # Create an organization
        self.organization = Organization.objects.create(name="Test Organization")

        # Create an admin user
        self.admin_user = get_user_model().objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="adminpassword"
        )
        self.admin_user.role = 'organization_admin'
        self.admin_user.save()

        # Create a contributor user
        self.contributor_user = get_user_model().objects.create_user(
            username="contributoruser",
            email="contributor@example.com",
            password="contributorpw"
        )
        self.contributor_user.role = 'contributor'
        self.contributor_user.save()

    # Test POST /add_contributor/ API - Add contributor
    def test_add_contributor_authenticated(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_user)  # Authenticate the admin user

        # Data for the new contributor
        data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "1234567890",
            "organization": self.organization.id,
            "role": "contributor",  # Can also leave out for default role
            "password": "password123",
        }

        # Make the POST request
        url = reverse('add_contributor')  # Make sure this is the correct URL in urls.py
        response = client.post(url, data, format="json")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['first_name'], "John")
        self.assertEqual(response.data['email'], "john.doe@example.com")
        self.assertIn('contributor_id', response.data)  # Ensure contributor ID is returned

        # Verify the contributor is actually saved
        contributor = Contributor.objects.get(contributor_id=response.data['contributor_id'])
        self.assertEqual(contributor.first_name, "John")
        self.assertEqual(contributor.organization, self.organization)

    # Test POST /add_contributor/ API - Unauthorized User
    def test_add_contributor_unauthorized(self):
        client = APIClient()
        client.force_authenticate(user=self.contributor_user)  # Authenticate the contributor (non-admin)

        # Data for the new contributor
        data = {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com",
            "phone": "9876543210",
            "role": "contributor",
            "password": "password456",
        }

        # Make the POST request
        url = reverse('add_contributor')
        response = client.post(url, data, format="json")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)  # Should be forbidden for non-admin users

    # Test GET /contributors/ API - Get contributors in an organization
    def test_get_contributors_authenticated(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_user)  # Authenticate the admin user

        # First, add a contributor
        Contributor.objects.create(
            first_name="Alice",
            last_name="Wonderland",
            email="alice@example.com",
            phone="4567891230",
            organization=self.organization,
            role="contributor",
            password="password123"
        )

        # Make the GET request
        url = reverse('get_contributors')  # Ensure this is the correct URL
        response = client.get(url, format="json")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)  # Should return at least one contributor
        self.assertEqual(response.data[0]['first_name'], "Alice")

    # Test POST /add_contributor/ API - Missing role (defaults to 'contributor')
    def test_add_contributor_missing_role(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_user)  # Authenticate the admin user

        # Data for the new contributor (role missing)
        data = {
            "first_name": "Peter",
            "last_name": "Pan",
            "email": "peter.pan@example.com",
            "phone": "1122334455",
            "organization": self.organization.id,
            "password": "password789",
        }

        # Make the POST request
        url = reverse('add_contributor')
        response = client.post(url, data, format="json")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['role'], "contributor")  # Ensure default role is assigned
