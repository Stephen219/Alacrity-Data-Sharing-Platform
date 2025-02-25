# from django.urls import reverse
# from rest_framework.test import APITestCase, APIClient
# from rest_framework import status
# from organisation.models import Organization
# from users.models import User

# class AddContributorTest(APITestCase):
#     def setUp(self):
#         # Create an organization (adjust required fields as needed)
#         self.organization = Organization.objects.create(
#             Organization_id="org123",  # Adjust according to your model's fields
#             name="Test Organization"
#         )
        
#         # Create a user with role 'organization_admin' associated with the organization.
#         self.super_admin = User.objects.create_user(
#             email="admin@example.com",
#             first_name="Admin",
#             sur_name="User",
#             username="adminuser",
#             password="AdminPass1!",
#             role="organization_admin",
#             organization=self.organization,
#             phone_number="1111111111"
#         )
        
#         # Initialize the APIClient for making requests.
#         self.client = APIClient()
        
#         # Log in via the login endpoint and retrieve the JWT token.
#         token = self.login_and_get_token()
        
#         # Set the token in the Authorization header (as a Bearer token).
#         self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
#         # Use the correct URL name defined in your urls.py.
#         self.url = reverse('add_contributor')

#     def login_and_get_token(self):
#         # Make a POST request to the login endpoint with the super admin's credentials.
#         login_response = self.client.post(
#             '/users/login/',
#             {
#                 'email': 'admin@example.com',
#                 'password': 'AdminPass1!'
#             },
#             format='json'
#         )
#         self.assertEqual(login_response.status_code, 200)
#         # Return the access token from the response.
#         return login_response.data['access_token']

#     def test_super_admin_add_contributor(self):
#         # Prepare the data for the new contributor.
#         data = {
#             "email": "contributor@example.com",
#             "first_name": "Contributor",
#             "sur_name": "User",
#             "username": "contributoruser",
#             "password": "StrongPass1!",
#             "password2": "StrongPass1!",
#             "phone_number": "2222222222",
#             "date_of_birth": "1990-01-01",
#             "field": "Test Field"
#         }
        
#         # Make the POST request to add the contributor.
#         response = self.client.post(self.url, data, format='json')
        
#         # Assert that the response status code is HTTP 201 CREATED.
#         self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
#         # Assert that the response data contains the provided email.
#         self.assertEqual(response.data['email'], data['email'])
        
#         # Retrieve the newly created user from the database.
#         new_user = User.objects.get(email=data['email'])
        
#         # Assert that the new user has the default role "contributor".
#         self.assertEqual(new_user.role, "contributor")
        
#         # Assert that the new user's organization matches the super admin's organization.
#         self.assertEqual(new_user.organization, self.organization)
