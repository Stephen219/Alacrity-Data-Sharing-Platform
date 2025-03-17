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
    """
    dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
    researcher = request.user  # Authenticated SaaS user

    # Ensure the user has an approved dataset request before proceeding
    dataset_request = DatasetRequest.objects.filter(
        dataset_id=dataset, researcher_id=researcher, request_status='approved'
    ).first()

    if not dataset_request:
        return Response({'error': 'Request must be approved before payment'}, status=status.HTTP_403_FORBIDDEN)

    # If the dataset is free, no payment is required
    if dataset.price == 0:
        return Response({'message': 'Dataset is free, no payment needed.'}, status=status.HTTP_200_OK)

    # Include `user_id` in PayPal return URL
    return_url = f"{settings.PAYPAL_RETURN_URL}?user_id={researcher.id}&dataset_id={dataset.dataset_id}"

    # Create a PayPal payment request
    payment = paypalrestsdk.Payment({
        "intent": "sale",
        "payer": {"payment_method": "paypal"},
        "redirect_urls": {
            "return_url": return_url,  # Modified return URL to include `user_id`
            "cancel_url": settings.PAYPAL_CANCEL_URL
        },
        "transactions": [{
            "amount": {"total": str(dataset.price), "currency": "GBP"},
            "description": f"Payment for dataset: {dataset.title}"
        }]
    })

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
    """
    payment_id = request.GET.get("paymentId")
    payer_id = request.GET.get("PayerID")
    user_id = request.GET.get("user_id")  # Retrieves user_id from the URL
    dataset_id = request.GET.get("dataset_id")  # Retrieves dataset_id from the URL

    if not payment_id or not payer_id or not user_id or not dataset_id:
        return Response({"error": "Cannot determine user account or dataset"}, status=400)

    try:
        # Retrieve payment details from PayPal
        payment = paypalrestsdk.Payment.find(payment_id)

        # Execute the payment using the payer ID
        if payment.execute({"payer_id": payer_id}):
            dataset = Dataset.objects.get(dataset_id=dataset_id)
            user = User.objects.get(id=user_id)

            # Validate that the dataset request was approved
            dataset_request = DatasetRequest.objects.filter(
                dataset_id=dataset, researcher_id=user, request_status="approved"
            ).first()
            if not dataset_request:
                return Response(
                    {"error": "You must have an approved request to access this dataset."},
                    status=403
                )

            # Ppurchase is linked to the correct SaaS user
            purchase, created = DatasetPurchase.objects.get_or_create(dataset=dataset, buyer=user)

            return redirect(f"{settings.FRONTEND_URL}/dashboard?payment=success")

        else:
            return Response({"error": "Payment execution failed"}, status=500)

    except paypalrestsdk.ResourceNotFound:
        return Response({"error": "Payment not found"}, status=404)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found"}, status=404)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


    
@api_view(['GET'])
def paypal_cancel(request):
    """
    Handles PayPal payment cancellation.
    
    - Simply returns a response indicating the payment was cancelled.
    """
    return Response({"message": "Payment cancelled."}, status=400)
