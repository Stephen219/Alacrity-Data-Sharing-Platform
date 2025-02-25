from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from organisation.models import Organization
from users.models import User
from rest_framework_simplejwt.tokens import RefreshToken

class AddContributorTest(APITestCase):
    def setUp(self):
        # Create an organization (ensure you set the required fields for your Organization model)
        self.organization = Organization.objects.create(
            Organization_id="org123",  # Adjust according to your model's fields
            name="Test Organization"
        )
        
        # Create a user with role 'organization_admin' who is associated with the organization.
        # This user acts as the "super admin" for this test.
        self.super_admin = User.objects.create_user(
            email="admin@example.com",
            first_name="Admin",
            sur_name="User",
            username="adminuser",
            password="AdminPass1!",
            role="organization_admin",
            organization=self.organization,
            phone_number="1111111111"
        )
        
        # Set up the API client and generate a valid JWT token for the super admin.
        self.client = APIClient()
        refresh = RefreshToken.for_user(self.super_admin)
        access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Use the correct URL name defined in your urls.py
        self.url = reverse('add_contributor')

    def test_super_admin_add_contributor(self):
        # Prepare the data for the new contributor.
        data = {
            "email": "contributor@example.com",
            "first_name": "Contributor",
            "sur_name": "User",
            "username": "contributoruser",
            "password": "StrongPass1!",
            "password2": "StrongPass1!",
            "phone_number": "2222222222",
            "date_of_birth": "1990-01-01",
            "field": "Test Field"
        }
        
        # Make the POST request to add the contributor.
        response = self.client.post(self.url, data, format='json')
        
        # Assert that the response status code is HTTP 201 CREATED.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Assert that the response data contains the email we provided.
        self.assertEqual(response.data['email'], data['email'])
        
        # Retrieve the newly created user from the database.
        new_user = User.objects.get(email=data['email'])
        
        # Assert that the new user has the default role "contributor".
        self.assertEqual(new_user.role, "contributor")
        
        # Assert that the new user's organization matches the super admin's organization.
        self.assertEqual(new_user.organization, self.organization)
