import io
import json
import uuid
import hashlib
from datetime import datetime
from unittest.mock import MagicMock, patch

import pandas as pd
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from organisation.models import Organization
from dataset_requests.models import DatasetRequest
from payments.models import DatasetPurchase
from .models import Dataset, DatasetAccessMetrics
from .views import CreateDatasetView, BUCKET
from .new import (
    encode_column,
    DATASET_CACHE,
    CACHE_LOCK,
    get_jwt_hash,
    has_access_to_dataset,
    load_dataset_into_cache,
)

User = get_user_model()

class DatasetViewTests(TestCase):
    def setUp(self):
        
        self.organization = Organization.objects.create(
            name="Test Organization",
            Organization_id=str(uuid.uuid4())
        )

        # Create users
        self.admin_user = User.objects.create_user(
            username='admin_user',
            email='admin@example.com',
            password='password123',
            first_name='Admin',
            sur_name='User',
            role='organization_admin',
            organization=self.organization
        )
        self.contributor_user = User.objects.create_user(
            username='contributor_user',
            email='contributor@example.com',
            password='password123',
            first_name='Contributor',
            sur_name='User',
            role='contributor',
            organization=self.organization
        )
        self.researcher_user = User.objects.create_user(
            username='researcher_user',
            email='researcher@example.com',
            password='password123',
            first_name='Researcher',
            sur_name='User',
            role='researcher',
            organization=self.organization
        )

        # Initialize API client
        self.client = APIClient()

        # Sample CSV content
        self.csv_content = b"name,age\nJohn,30\nJane,25\n"
        self.valid_dataset_data = {
            'file': SimpleUploadedFile("test.csv", self.csv_content, content_type="text/csv"),
            'title': 'Test Dataset',
            'category': 'Test Category',
            'description': 'This bis a test dataset description.',
            'price': '10.00',
            'tags': 'test, data'
        }

    def authenticate_user(self, user):
        """Authenticate a user with JWT token."""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
        return refresh

    def login_and_get_token(self, email, password):
        """Simulate login and return JWT token."""
        response = self.client.post('/users/login/', {
            'email': email,
            'password': 'password123'
        })
        self.assertEqual(response.status_code, 200)
        return response.data['access_token']

    @patch('datasets.views.minio_client.put_object')
    @patch('pandas.read_csv')
    @patch('pandas.DataFrame.to_parquet')
    def test_create_dataset_local_file_success(self, mock_to_parquet, mock_read_csv, mock_minio_put):
        """Test successful dataset creation with local file."""
        mock_df = MagicMock()
        mock_df.__len__.return_value = 2
        mock_df.dtypes.items.return_value = [('name', 'object'), ('age', 'int64')]
        mock_read_csv.return_value = mock_df
        mock_to_parquet.return_value = None

        self.authenticate_user(self.admin_user)

        response = self.client.post(
            '/datasets/create_dataset/',
            self.valid_dataset_data,
            format='multipart'
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['message'], 'Dataset created successfully')
        self.assertTrue(Dataset.objects.filter(title='Test Dataset').exists())

        dataset = Dataset.objects.get(title='Test Dataset')
        self.assertEqual(dataset.number_of_rows, 2)
        self.assertEqual(dataset.size, 0.0)  # Based on convert_to_mbs
        self.assertEqual(dataset.contributor_id, self.admin_user)
        mock_minio_put.assert_called_once()

    @patch('datasets.views.minio_client.put_object')
    @patch('pandas.read_csv')
    @patch('pandas.DataFrame.to_parquet')
    @patch('requests.get')
    def test_create_dataset_google_drive_success(self, mock_requests_get, mock_to_parquet, mock_read_csv, mock_minio_put):
        """Test successful dataset creation with Google Drive URL."""
        mock_response = MagicMock()
        mock_response.iter_content.return_value = [self.csv_content]
        mock_response.raise_for_status.return_value = None
        mock_requests_get.return_value = mock_response

        mock_df = MagicMock()
        mock_df.__len__.return_value = 2
        mock_df.dtypes.items.return_value = [('name', 'object'), ('age', 'int64')]
        mock_read_csv.return_value = mock_df
        mock_to_parquet.return_value = None

        self.authenticate_user(self.admin_user)

        data = {
            'fileUrl': 'https://drive.google.com/file/d/12345/view',
            'accessToken': 'fake-token',
            'fileName': 'test.csv',
            'title': 'Google Drive Dataset',
            'category': 'Test Category',
            'description': 'This is a test dataset from Google Drive.',
            'price': '15.00',
            'tags': 'test, data'
        }

        response = self.client.post(
            '/datasets/create_dataset/',
            data,
            format='multipart'
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['message'], 'Dataset created successfully')
        self.assertTrue(Dataset.objects.filter(title='Google Drive Dataset').exists())
        mock_minio_put.assert_called_once()

    @patch('datasets.views.minio_client.put_object')
    @patch('pandas.read_csv')
    @patch('pandas.DataFrame.to_parquet')
    @patch('requests.get')
    def test_create_dataset_dropbox_success(self, mock_requests_get, mock_to_parquet, mock_read_csv, mock_minio_put):
        """Test successful dataset creation with Dropbox URL."""
        mock_response = MagicMock()
        mock_response.iter_content.return_value = [self.csv_content]
        mock_response.raise_for_status.return_value = None
        mock_requests_get.return_value = mock_response

        mock_df = MagicMock()
        mock_df.__len__.return_value = 2
        mock_df.dtypes.items.return_value = [('name', 'object'), ('age', 'int64')]
        mock_read_csv.return_value = mock_df
        mock_to_parquet.return_value = None

        self.authenticate_user(self.admin_user)

        data = {
            'fileUrl': 'https://www.dropbox.com/s/12345/test.csv?dl=0',
            'fileName': 'test.csv',
            'title': 'Dropbox Dataset',
            'category': 'Test Category',
            'description': 'This is a test dataset from Dropbox.',
            'price': '20.00',
            'tags': 'test, data'
        }

        response = self.client.post(
            '/datasets/create_dataset/',
            data,
            format='multipart'
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['message'], 'Dataset created successfully')
        self.assertTrue(Dataset.objects.filter(title='Dropbox Dataset').exists())
        mock_minio_put.assert_called_once()

    def test_create_dataset_unauthorized(self):
        """Test dataset creation without proper role."""
        self.authenticate_user(self.researcher_user)

        response = self.client.post(
            '/datasets/create_dataset/',
            self.valid_dataset_data,
            format='multipart'
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(Dataset.objects.filter(title='Test Dataset').exists())



    def test_create_dataset_missing_fields(self):
        """Test dataset creation with missing required fields."""
        data = {
            'file': SimpleUploadedFile("test.csv", self.csv_content, content_type="text/csv"),
            'category': 'Test Category',
            'price': '10.00'
        }

        self.authenticate_user(self.admin_user)

        response = self.client.post(
            '/datasets/create_dataset/',
            data,
            format='multipart'
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'Title is required and must be under 100 characters')

    @patch('datasets.views.minio_client.put_object')
    @patch('pandas.read_csv')
    @patch('pandas.DataFrame.to_parquet')
    def test_update_dataset_success(self, mock_to_parquet, mock_read_csv, mock_minio_put):
        """Test successful dataset update."""
        mock_df = MagicMock()
        mock_df.__len__.return_value = 2
        mock_df.dtypes.items.return_value = [('name', 'object'), ('age', 'int64')]
        mock_read_csv.return_value = mock_df
        mock_to_parquet.return_value = None

        self.authenticate_user(self.admin_user)

        # Create dataset
        response = self.client.post(
            '/datasets/create_dataset/',
            self.valid_dataset_data,
            format='multipart'
        )
        dataset_id = response.data['dataset_id']

        # Update dataset
        update_data = {
            'dataset_id': dataset_id,
            'title': 'Updated Dataset',
            'description': 'Updated description.'
        }

        response = self.client.put(
            '/datasets/create_dataset/',
            update_data,
            format='multipart'
        )

        self.assertEqual(response.status_code, 200)
        dataset = Dataset.objects.get(dataset_id=dataset_id)
        self.assertEqual(dataset.title, 'Updated Dataset')
        self.assertEqual(dataset.description, 'Updated description.')

    def test_update_dataset_unauthorized(self):
        """Test dataset update by unauthorized user."""
        dataset = Dataset.objects.create(
            dataset_id=str(uuid.uuid4()),
            contributor_id=self.admin_user,
            title='Test Dataset',
            category='Test Category',
            description='Test description',
            link='http://test.com',
            encryption_key='fake-key',
            schema={'name': 'object'},
            price=10.00
            # orgid=self.organization
        )

        self.authenticate_user(self.researcher_user)

        update_data = {
            'dataset_id': dataset.dataset_id,
            'title': 'Unauthorized Update'
        }

        response = self.client.put(
            '/datasets/create_dataset/',
            update_data,
            format='multipart'
        )

        self.assertEqual(response.status_code, 403)
        dataset.refresh_from_db()
        self.assertEqual(dataset.title, 'Test Dataset')

    def test_update_dataset_invalid_data(self):
        """Test dataset update with invalid data."""
        dataset = Dataset.objects.create(
            dataset_id=str(uuid.uuid4()),
            contributor_id=self.admin_user,
            title='Test Dataset',
            category='Test Category',
            description='Test description',
            link='http://test.com',
            encryption_key='fake-key',
            schema={'name': 'object'},
            price=10.00
            # contributor_id=self.admin_user,

            # orgid=self.organization
        )

        self.authenticate_user(self.admin_user)

        update_data = {
            'dataset_id': dataset.dataset_id,
            'title': '',  # Invalid title
        }

        response = self.client.put(
            '/datasets/create_dataset/',
            update_data,
            format='multipart'
        )

        self.assertEqual(response.status_code, 400)
        dataset.refresh_from_db()
        self.assertEqual(dataset.title, 'Test Dataset')

    def test_get_datasets_success(self):
        """Test successful retrieval of datasets."""
        Dataset.objects.create(
            dataset_id=str(uuid.uuid4()),
            contributor_id=self.admin_user,
            title='Test Dataset 1',
            category='Test Category',
            description='Test description 1',
            link='http://test.com/1',
            encryption_key='fake-key',
            schema={'name': 'object'},
            price=10.00
            # orgid=self.organization
        )
        Dataset.objects.create(
            dataset_id=str(uuid.uuid4()),
            contributor_id=self.admin_user,
            title='Test Dataset 2',
            category='Test Category',
            description='Test description 2',
            link='http://test.com/2',
            encryption_key='fake-key',
            schema={'name': 'object'},
            price=20.00
            # contributor_id=self.admin_user,
            # orgid=self.organization
        )

        self.authenticate_user(self.admin_user)

        response = self.client.get('/datasets/all/')

        self.assertEqual(response.status_code, 200)
  
        self.assertTrue(len(response.data) > 0)


class DatasetCoreTests(TestCase):
    def setUp(self):
    
        self.organization = Organization.objects.create(
            name="Test Org",
            Organization_id=str(uuid.uuid4()),
            field="Technology"
        )

        # Create users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role='organization_admin',
            organization=self.organization,
            field="Technology"
        )
        self.researcher_user = User.objects.create_user(
            username='researcher',
            email='researcher@example.com',
            password='password123',
            role='researcher',
            organization=self.organization,
            field="Technology"
        )

        # Create dataset
        self.dataset = Dataset.objects.create(
            dataset_id=str(uuid.uuid4()),
            contributor_id=self.admin_user,
            title="Test Dataset",
            category="Test Category",
            description="Test Description",
            link=f"http://minio/{uuid.uuid4()}_test.parquet.enc",
            encryption_key="fake-key",
            schema={"name": "object", "age": "int64"},
            price=10.00,
            number_of_rows=100,
            size=1.0
        )

        # Initialize API client
        self.client = APIClient()

        # Sample parquet data
        self.parquet_data = io.BytesIO()
        pd.DataFrame({"name": ["Alice", "Bob"], "age": [25, 30]}).to_parquet(self.parquet_data, engine="pyarrow")
        self.parquet_data.seek(0)

    def authenticate_user(self, user):
        """Authenticate a user with JWT token."""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
        return refresh






    def test_has_access_to_dataset_no_access(self):
        """Test has_access_to_dataset with no access."""
        self.assertFalse(has_access_to_dataset(self.researcher_user.id, self.dataset.dataset_id))


    @patch('datasets.new.minio_client.get_object')
    def test_load_dataset_into_cache_no_access(self, mock_minio_get):
        """Test load_dataset_into_cache with no access."""
        request = MagicMock()
        request.user.id = self.researcher_user.id
        request.headers = {"Authorization": "Bearer fake-token"}

        response = load_dataset_into_cache(request, self.dataset.dataset_id)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["error"], "You do not have access to this dataset")

    def test_encode_column_categorical(self):
        """Test encode_column for categorical data."""
        values = ["apple", "banana", "apple", None]
        result = encode_column(values, "object")
        self.assertEqual(result, [0.0, 1.0, 0.0, 0.0])

    def test_encode_column_numeric(self):
        """Test encode_column for numeric data."""
        values = [1, 2, None, 4]
        result = encode_column(values, "int64")
        self.assertEqual(result, [1.0, 2.0, 0.0, 4.0])

  

    @patch('datasets.new.load_dataset_into_cache')
    def test_clear_dataset_cache_success(self, mock_load_dataset):
        """Test clear_dataset_cache success."""
        mock_con = MagicMock()
        mock_load_dataset.return_value = mock_con

        DatasetRequest.objects.create(
            dataset_id=self.dataset,
            researcher_id=self.researcher_user,
            request_status='approved'
        )
        self.authenticate_user(self.researcher_user)

        request = MagicMock()
        request.user.id = self.researcher_user.id
        request.headers = {"Authorization": "Bearer fake-token"}
        load_dataset_into_cache(request, self.dataset.dataset_id)

        response = self.client.post(f"/datasets/clear_cache/{self.dataset.dataset_id}/")
        self.assertEqual(response.status_code, 200)
       
        cache_key = f"{self.dataset.dataset_id}:{hashlib.sha256('fake-token'.encode()).hexdigest()}"
        self.assertNotIn(cache_key, DATASET_CACHE)




 

    def test_all_datasets_view(self):
        """Test all_datasets_view."""
        self.client.credentials()  
        response = self.client.get("/datasets/all/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["datasets"]), 1)
        self.assertEqual(response.data["datasets"][0]["title"], "Test Dataset")

    def test_dataset_view_success(self):
        """Test dataset_view success."""
        self.client.credentials()  
        response = self.client.get(f"/datasets/{self.dataset.dataset_id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "Test Dataset")

    def test_dataset_view_not_found(self):
        """Test dataset_view with non-existent dataset."""
        self.client.credentials()
        response = self.client.get(f"/datasets/{uuid.uuid4()}/view/")  
        self.assertEqual(response.status_code, 404)
        content = response.content.decode()
        if content:
            try:
                self.assertEqual(json.loads(content)["error"], "Dataset not found")
            except json.JSONDecodeError:
                self.assertIn("not found", content.lower())
        else:
            self.assertEqual(response.status_code, 404)



    def test_download_dataset_no_access(self):
        """Test download_dataset with no access."""
        self.authenticate_user(self.researcher_user)
        response = self.client.get(f"/datasets/download/{self.dataset.dataset_id}/")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.content.decode())["error"], "You do not have access to this dataset")