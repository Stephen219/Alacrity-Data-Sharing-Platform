from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
User = get_user_model()

from datasets.models import Dataset
from dataset_requests.models import DatasetRequest
from payments.models import PendingPayment, DatasetPurchase

class CreatePaypalPaymentTest(APITestCase):
    """
    Tests for create_paypal_payment view.
    """
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        # Create a Dataset 
        self.dataset = Dataset.objects.create(
            dataset_id='DS1',
            title='Test Dataset',
            price=100,
            schema='{}',
            contributor_id=self.user 
        )
        # Create an approved DatasetRequest
        self.approved_request = DatasetRequest.objects.create(
            dataset_id=self.dataset,
            researcher_id=self.user,
            request_status='approved'
        )
        self.url = reverse('paypal-payment', kwargs={'dataset_id': self.dataset.dataset_id})
        self.client = APIClient()

    def test_create_payment_unauthenticated(self):
        """Should return 401 if no user is authenticated."""
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('paypalrestsdk.Payment.create')
    @patch('paypalrestsdk.Payment')
    def test_create_payment_success(self, mock_payment_class, mock_payment_create):
        """Payment creation succeeds and returns approval_url."""
        # Simulate a successful PayPal payment creation.
        mock_payment_instance = MagicMock()
        mock_payment_instance.id = 'PAYID-MOCK123'
        mock_payment_instance.links = [
            {'rel': 'approval_url', 'href': 'http://paypal.test/approval'}
        ]
        mock_payment_create.return_value = True
        mock_payment_class.return_value = mock_payment_instance

        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('approval_url', response.data)

        # Verify that a PendingPayment was created
        pending = PendingPayment.objects.get(paypal_payment_id='PAYID-MOCK123')
        self.assertEqual(pending.user, self.user)
        self.assertEqual(pending.dataset, self.dataset)

    def test_create_payment_no_approved_request(self):
        """Should return 403 if user does not have an approved request."""
        # Remove all dataset requests so none is approved.
        DatasetRequest.objects.all().delete()
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Request must be approved', str(response.data))

    def test_dataset_is_free(self):
        """Should return success message if dataset price == 0."""
        self.dataset.price = 0
        self.dataset.save()
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Dataset is free', str(response.data))


class PaypalSuccessTest(APITestCase):
    """
    Tests for paypal_success callback view.
    """
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='password123'
        )
        self.dataset = Dataset.objects.create(
            dataset_id='DS2',
            title='Paid Dataset',
            price=50,
            schema='{}',
            contributor_id=self.user
        )
        self.request_approved = DatasetRequest.objects.create(
            dataset_id=self.dataset,
            researcher_id=self.user,
            request_status='approved'
        )
        # Create a PendingPayment record for the test user and dataset.
        self.pending = PendingPayment.objects.create(
            paypal_payment_id='PAYID-ABC123',
            user=self.user,
            dataset=self.dataset
        )
        self.url = reverse('paypal-success')

    def test_missing_params(self):
        """Should fail if required GET params are missing."""
        response = self.client.get(self.url, {})
        self.assertEqual(response.status_code, 400)
        self.assertIn('Missing required PayPal parameters', str(response.data))

    @patch('paypalrestsdk.Payment.find')
    def test_payment_not_found_in_paypal(self, mock_payment_find):
        """Simulate PayPal ResourceNotFound error."""
        from paypalrestsdk import ResourceNotFound
        mock_payment_find.side_effect = ResourceNotFound('Payment not found')
        query_params = {
            'paymentId': 'INVALID-PAYID',
            'PayerID': 'PAYER123',
            'dataset_id': self.dataset.dataset_id
        }
        response = self.client.get(self.url, query_params)
        self.assertEqual(response.status_code, 404)
        self.assertIn('Payment not found in PayPal', str(response.data))

    @patch('paypalrestsdk.Payment.find')
    def test_no_pending_payment_record(self, mock_payment_find):
        """Test when there is no local PendingPayment record."""
        mock_payment_instance = MagicMock()
        mock_payment_instance.execute.return_value = True
        mock_payment_find.return_value = mock_payment_instance
        query_params = {
            'paymentId': 'UNKNOWN-PAYID',
            'PayerID': 'PAYER123',
            'dataset_id': self.dataset.dataset_id
        }
        response = self.client.get(self.url, query_params)
        self.assertEqual(response.status_code, 404)
        self.assertIn('No matching PendingPayment record', str(response.data))

    @patch('paypalrestsdk.Payment.find')
    def test_payment_execute_failure(self, mock_payment_find):
        """Test scenario where PayPal payment execution fails."""
        mock_payment_instance = MagicMock()
        mock_payment_instance.execute.return_value = False
        mock_payment_find.return_value = mock_payment_instance
        query_params = {
            'paymentId': self.pending.paypal_payment_id,
            'PayerID': 'PAYER123',
            'dataset_id': self.dataset.dataset_id
        }
        response = self.client.get(self.url, query_params)
        self.assertEqual(response.status_code, 500)
        self.assertIn('Payment execution failed', str(response.data))

    @patch('paypalrestsdk.Payment.find')
    def test_paypal_success_creates_dataset_purchase(self, mock_payment_find):
        """Test that a successful payment creates a DatasetPurchase and deletes PendingPayment."""
        mock_payment_instance = MagicMock()
        mock_payment_instance.execute.return_value = True
        mock_payment_find.return_value = mock_payment_instance
        query_params = {
            'paymentId': self.pending.paypal_payment_id,
            'PayerID': 'PAYER123',
            'dataset_id': self.dataset.dataset_id
        }
        response = self.client.get(self.url, query_params)
        # Expect a redirect to the dashboard.
        self.assertEqual(response.status_code, 302)
        self.assertIn('dashboard', response.url)
        # Verify that a DatasetPurchase was created.
        purchase = DatasetPurchase.objects.get(buyer=self.user, dataset=self.dataset)
        self.assertIsNotNone(purchase)
        # Verify that the PendingPayment record was deleted.
        with self.assertRaises(PendingPayment.DoesNotExist):
            PendingPayment.objects.get(paypal_payment_id=self.pending.paypal_payment_id)

    def test_no_approved_request(self):
        """Test that the view returns 403 if the user's request is not approved."""
        self.request_approved.request_status = 'pending'
        self.request_approved.save()
        query_params = {
            'paymentId': self.pending.paypal_payment_id,
            'PayerID': 'PAYER123',
            'dataset_id': self.dataset.dataset_id
        }
        with patch('paypalrestsdk.Payment.find') as mock_payment_find:
            mock_payment_instance = MagicMock()
            mock_payment_instance.execute.return_value = True
            mock_payment_find.return_value = mock_payment_instance
            response = self.client.get(self.url, query_params)
            self.assertEqual(response.status_code, 403)
            self.assertIn('User does not have an approved request', str(response.data))


class PaypalCancelTest(APITestCase):
    """
    Tests for paypal_cancel view.
    """
    def setUp(self):
        self.url = reverse('paypal-cancel')
        self.user = User.objects.create_user(
            username='dummy',
            email='dummy@example.com',
            password='password'
        )

    def test_paypal_cancel(self):
        """Test that the cancel endpoint returns a 400 status with a cancellation message."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 400)
        self.assertIn('Payment cancelled', str(response.data))
