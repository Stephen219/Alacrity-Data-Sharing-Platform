



from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.test import TestCase
import json
from django.core.files.uploadedfile import SimpleUploadedFile
from datasets.models import Dataset
from datetime import datetime
# valiadtor errors
from rest_framework.exceptions import ValidationError
from datetime import datetime, timedelta

class DatasetTestCase(TestCase):
    def setUp(self):
        
        self.valid_dataset_data = {
            'title': 'Test Dataset',
            'category': 'valid category',
            'link': 'https://test.com/dataset',
            'description': 'This is a comprehensive test dataset description with more than 10 characters.'
          
        }

        # Create a user for authentication
        User = get_user_model()
        self.user = User.objects.create_user(email='testuser@example.com', password='testpassword', username='testuser', role='contributor')
        # have a role for the user
        # self.user.role = 'organization_admin'
        
        # Set up the client to simulate requests
        self.client = APIClient()

    def login_and_get_token(self):
        # Make a POST request to login and get the JWT token
        login_response = self.client.post('/users/login/', {
            'email': 'testuser@example.com',
            'password': 'testpassword',
        })
        # Extract the access token from the response
        self.assertEqual(login_response.status_code, 200)
        return login_response.data['access_token']

    def test_create_valid_dataset(self):
       
        token = self.login_and_get_token()
        
     
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        test_file = SimpleUploadedFile("test_file.txt", b"File content here", content_type="text/plain")
        self.valid_dataset_data['file'] = test_file
        response = self.client.post(
            '/datasets/create_dataset/',
            self.valid_dataset_data,
            # content_type='application/json',
            HTTP_ACCEPT='application/json'

        )
        print("S555551️⃣ Configure MinIO in Django💡 Next Stepsfvhjkljhgfxdzfvhkl;")
        print (response)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['message'], 'Dataset created successfully')

    def test_create_dataset_method_not_allowed(self):
        methods = ['get', 'put', 'delete', 'patch']
        token = self.login_and_get_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        for method in methods:
            response = getattr(self.client, method)('/datasets/create_dataset/')
            self.assertEqual(response.status_code, 405)  # Expect 405 Method Not Allowed for these methods\




            
    # def test_dataset_field_constraints(self):
    #     validation_cases = [
    #         {'field': 'title', 'invalid_values': ['', 'A' * 101]},  # Ensure title validation catches empty or long strings
    #         {'field': 'category', 'invalid_values': ['']},
    #         {'field': 'link', 'invalid_values': ['', 'invalid-url']},
    #         {'field': 'description', 'invalid_values': ['', 'Short']}
    #     ]

    #     for case in validation_cases:
    #         for value in case['invalid_values']:
    #             # Update mock data with invalid value
    #             invalid_data = {**self.valid_dataset_data, case['field']: value}

    #             # Create a Dataset instance to trigger validation
    #             dataset = Dataset(**invalid_data)
    #             with self.assertRaises(ValidationError, msg=f"Invalid {case['field']} should raise validation error"):
    #                 dataset.full_clean()  # This explicitly runs validation on the dataset


    def test_auto_timestamps(self):
        # Create a dataset and manually set the timestamps
        dataset = Dataset.objects.create(**self.valid_dataset_data)

        # Ensure created_at and updated_at are set automatically
        self.assertIsNotNone(dataset.created_at)
        self.assertIsNotNone(dataset.updated_at)
        self.assertLess(abs(dataset.created_at - dataset.updated_at), timedelta(seconds=2))
        




    
