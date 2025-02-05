from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from .models import Dataset
import json
from django.test import Client

class DatasetModelTest(TestCase):
    def setUp(self):
        self.valid_dataset_data = {
            'title': 'Test Dataset',
            'category': 'Test Category',
            'link': 'https://test.com/dataset',
            'description': 'This is a comprehensive test dataset description with more than 10 characters.'
        }

    def test_create_valid_dataset(self):
        dataset = Dataset.objects.create(**self.valid_dataset_data)
        
        self.assertEqual(dataset.title, self.valid_dataset_data['title'])
        self.assertEqual(dataset.category, self.valid_dataset_data['category'])
        self.assertEqual(dataset.link, self.valid_dataset_data['link'])
        self.assertEqual(dataset.description, self.valid_dataset_data['description'])
        
        self.assertTrue(dataset.created_at)
        self.assertTrue(dataset.updated_at)
        self.assertTrue(len(dataset.id) == 10)

    def test_dataset_field_constraints(self):
        validation_cases = [
            {'field': 'title', 'invalid_values': ['', 'A' * 101]},
            {'field': 'category', 'invalid_values': ['']},
            {'field': 'link', 'invalid_values': ['', 'invalid-url']},
            {'field': 'description', 'invalid_values': ['', 'Short']}
        ]

        for case in validation_cases:
            for value in case['invalid_values']:
                with self.assertRaises(ValidationError, msg=f"Invalid {case['field']} should raise validation error"):
                    Dataset.objects.create(**{**self.valid_dataset_data, case['field']: value}).full_clean()

    # def test_unique_constraints(self):
    #     Dataset.objects.create(**self.valid_dataset_data)
        
    #     with self.assertRaises(Exception):
    #         Dataset.objects.create(**self.valid_dataset_data)

    def test_auto_timestamps(self):
        dataset = Dataset.objects.create(**self.valid_dataset_data)
        
        self.assertIsNotNone(dataset.created_at)
        self.assertIsNotNone(dataset.updated_at)
        self.assertEqual(dataset.created_at, dataset.updated_at)

class DatasetViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.valid_dataset_data = {
            'title': 'Test Dataset',
            'category': 'Test Category',
            'link': 'https://test.com/dataset',
            'description': 'This is a comprehensive test dataset description with more than 10 characters.'
        }

    # def test_create_dataset_success(self):
    #     response = self.client.post(
    #         '/datasets/create_dataset/',
    #         json.dumps(self.valid_dataset_data),
    #         content_type='application/json'
    #     )
        
    #     self.assertEqual(response.status_code, 201)
    #     self.assertEqual(response.json()['message'], 'Dataset created successfully')
    #     self.assertTrue(Dataset.objects.filter(title=self.valid_dataset_data['title']).exists())

    def test_create_dataset_invalid_data(self):
        invalid_cases = [
            {'data': {**self.valid_dataset_data, 'title': ''}, 'error_key': 'title'},
            {'data': {**self.valid_dataset_data, 'link': 'invalid-url'}, 'error_key': 'link'},
            {'data': {**self.valid_dataset_data, 'description': 'Short'}, 'error_key': 'description'},
            {'data': {**self.valid_dataset_data, 'category': ''}, 'error_key': 'category'}
        ]

        for case in invalid_cases:
            response = self.client.post(
                '/datasets/create_dataset/',
                json.dumps(case['data']),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 400)
            self.assertIn(case['error_key'], response.json())

    def test_create_dataset_method_not_allowed(self):
        methods = ['get', 'put', 'delete', 'patch']
        
        for method in methods:
            response = getattr(self.client, method)('/datasets/create_dataset/')
            self.assertEqual(response.status_code, 405)
