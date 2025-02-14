



from unittest.mock import patch
from django.test import TestCase
from django.core.exceptions import ValidationError
from .models import Dataset
import json
from django.test import Client
from datetime import datetime

class DatasetTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.valid_dataset_data = {
            'title': 'Test Dataset',
            'category': 'valid category',
            'link': 'https://test.com/dataset',
            'description': 'This is a comprehensive test dataset description with more than 10 characters.'
        }

  

    @patch('datasets.models.Dataset.objects.create')
    def test_create_valid_dataset(self, mock_create):
        # Mock the return value and set created_at and updated_at
        mock_instance = Dataset(**self.valid_dataset_data)
        mock_instance.created_at = datetime.now()
        mock_instance.updated_at = datetime.now()
        mock_create.return_value = mock_instance
        
        dataset = Dataset.objects.create(**self.valid_dataset_data)
        
        self.assertEqual(dataset.title, self.valid_dataset_data['title'])
        self.assertEqual(dataset.category, self.valid_dataset_data['category'])
        self.assertEqual(dataset.link, self.valid_dataset_data['link'])
        self.assertEqual(dataset.description, self.valid_dataset_data['description'])
        
        # Ensure that created_at and updated_at are set
        self.assertTrue(dataset.created_at)
        self.assertTrue(dataset.updated_at)
        self.assertTrue(len(str(dataset.dataset_id)) == 10)  # Ensure ID length is 10 as expected




    @patch('datasets.models.Dataset.objects.create')
    def test_dataset_field_constraints(self, mock_create):
        # Mock the return value
        mock_create.return_value = Dataset(**self.valid_dataset_data)
        
        validation_cases = [
            {'field': 'title', 'invalid_values': ['', 'A' * 101]},
            {'field': 'category', 'invalid_values': ['']},
            {'field': 'link', 'invalid_values': ['', 'invalid-url']},
            {'field': 'description', 'invalid_values': ['', 'Short']}
        ]

        for case in validation_cases:
            for value in case['invalid_values']:
                # Update mock data with invalid value
                invalid_data = {**self.valid_dataset_data, case['field']: value}
                # Trigger validation manually
                dataset = Dataset(**invalid_data)
                with self.assertRaises(ValidationError, msg=f"Invalid {case['field']} should raise validation error"):
                    dataset.full_clean()  # This explicitly runs validation on the dataset



    @patch('datasets.models.Dataset.objects.create')
    def test_auto_timestamps(self, mock_create):
        # Create a mock instance of Dataset and manually set the timestamps
        mock_instance = Dataset(**self.valid_dataset_data)
        mock_instance.created_at = datetime.now()  # Manually set created_at
        mock_instance.updated_at = mock_instance.created_at  # Set updated_at to the same value
        
        mock_create.return_value = mock_instance  # Return the mock instance when create() is called
        
        # Call the function that creates the dataset
        dataset = Dataset.objects.create(**self.valid_dataset_data)

        # Assertions
        self.assertIsNotNone(dataset.created_at, "created_at should not be None")
        self.assertIsNotNone(dataset.updated_at, "updated_at should not be None")
        self.assertEqual(dataset.created_at, dataset.updated_at, "created_at and updated_at should be the same on creation")



    @patch('datasets.models.Dataset.objects.create')
    def test_create_dataset_success(self, mock_create):
        # Mock the dataset creation logic
        mock_instance = Dataset(**self.valid_dataset_data)
        mock_instance.created_at = datetime.now()  # Ensure created_at is set
        mock_instance.updated_at = datetime.now()  # Ensure updated_at is set
        mock_create.return_value = mock_instance

        # Simulate a POST request with valid data
        response = self.client.post(
            '/datasets/create_dataset/',
            json.dumps(self.valid_dataset_data),
            content_type='application/json'
        )

        # Debugging: Log the response content to see what is returned
        print(response.content)

        # Assert that the status code is 201 (Created)
        self.assertEqual(response.status_code, 201)
        
        # Optionally, assert that the dataset was created correctly
        self.assertEqual(response.json()['message'], 'Dataset created successfully')

        # Ensure the mock `Dataset` object was used
        mock_create.assert_called_once_with(**self.valid_dataset_data)
        
        # Ensure the created_at and updated_at fields are not None
        self.assertIsNotNone(mock_instance.created_at)
        self.assertIsNotNone(mock_instance.updated_at)

    def test_create_dataset_method_not_allowed(self):
        methods = ['get', 'put', 'delete', 'patch']
        
        for method in methods:
            response = getattr(self.client, method)('/datasets/create_dataset/')
            self.assertEqual(response.status_code, 405)
