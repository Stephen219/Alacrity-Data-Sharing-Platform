import paypalrestsdk
from django.conf import settings
from django.shortcuts import get_object_or_404, redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from datasets.models import Dataset
from payments.models import DatasetPurchase
from dataset_requests.models import DatasetRequest
import paypalrestsdk
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from django.contrib.auth import get_user_model

#references authenticated users 
User = get_user_model()

# Configures PayPal SDK using Django settings.py values
paypalrestsdk.configure({
    "mode": settings.PAYPAL_MODE, 
    "client_id": settings.PAYPAL_CLIENT_ID, 
    "client_secret": settings.PAYPAL_SECRET,
})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_paypal_payment(request, dataset_id):
    """
    Initiates a PayPal payment process for a dataset purchase.
    
    - Verifies that the dataset exists.
    - Ensures the authenticated user has an approved dataset request.
    - If the dataset is free, returns a success message immediately.
    - Otherwise, creates a PayPal payment and returns an approval URL.
    """
    dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
    researcher = request.user  # The authenticated user making the request


    # Ensure that the user has an approved dataset request before proceeding
    dataset_request = DatasetRequest.objects.filter(
        dataset_id=dataset, researcher_id=researcher, request_status='approved'
        ).first()

    if not dataset_request:
        return Response({'error': 'Request must be approved before payment'}, status=status.HTTP_403_FORBIDDEN)
    
    # If the dataset is free, no payment is required
    if dataset.price == 0:
        return Response({'message': 'Dataset is free, no payment needed.'}, status=status.HTTP_200_OK)
    
    # Create a PayPal payment request
    payment = paypalrestsdk.Payment({
        "intent": "sale",
        "payer": {"payment_method": "paypal"},
        "redirect_urls": {
            "return_url": settings.PAYPAL_RETURN_URL, # URL to redirect after successful payment
            "cancel_url": settings.PAYPAL_CANCEL_URL # URL to redirect if the user cancels
        },
        "transactions": [{
            "amount": {"total": str(dataset.price), "currency": "GBP"},
            "description": f"Payment for dataset: {dataset.title}"
        }]
    })
    
    # Check if the payment was successfully created
    if payment.create():
        approval_url = next(link["href"] for link in payment.links if link["rel"] == "approval_url")
        return Response({"approval_url": approval_url}, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Failed to create PayPal payment", "details": payment.error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def paypal_success(request):
    """
    Handles successful PayPal payments and grants access to the purchased dataset.
    
    - Validates payment ID and payer ID from PayPal.
    - Executes the PayPal transaction.
    - Confirms that the dataset request was approved.
    - Ensures that the payment corresponds to a valid dataset purchase.
    - Grants access to the dataset upon successful verification.
    """

    payment_id = request.GET.get("paymentId")
    payer_id = request.GET.get("PayerID")

    # Validate PayPal response parameters
    if not payment_id or not payer_id:
        return Response({"error": "Missing paymentId or PayerID"}, status=400)

    try:
        # Retrieve payment details from PayPal
        payment = paypalrestsdk.Payment.find(payment_id)

        # Execute the payment using the payer ID
        if payment.execute({"payer_id": payer_id}):
            dataset_title = payment.transactions[0].description.split(": ")[1]
            dataset = Dataset.objects.get(title=dataset_title)

            # Validate that the dataset request was approved before granting access
            dataset_request = DatasetRequest.objects.filter(dataset_id=dataset, request_status="approved").first()

            if not dataset_request:
                return Response({"error": "You must have an approved request to access this dataset."}, status=403)

            user = dataset_request.researcher_id  # Correct researcher from dataset request

            # Verify that a purchase record exists for this dataset and user
            purchase = DatasetPurchase.objects.filter(dataset=dataset, buyer=user).exists()

            if not purchase:
                return Response({"error": "Payment required before access"}, status=403)

            return Response({"message": "Payment successful. Dataset access granted."}, status=200)
        else:
            return Response({"error": "Payment execution failed"}, status=500)

    except paypalrestsdk.ResourceNotFound:
        return Response({"error": "Payment not found"}, status=404)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

    
@api_view(['GET'])
def paypal_cancel(request):
    """
    Handles PayPal payment cancellation.
    
    - Simply returns a response indicating the payment was cancelled.
    """
    return Response({"message": "Payment cancelled."}, status=400)
