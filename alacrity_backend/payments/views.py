import paypalrestsdk
from django.conf import settings
from django.shortcuts import get_object_or_404, redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist

from django.contrib.auth import get_user_model
User = get_user_model()

from datasets.models import Dataset
from dataset_requests.models import DatasetRequest
from payments.models import DatasetPurchase, PendingPayment

# Configures PayPal SDK from Django settings
paypalrestsdk.configure({
    "mode": settings.PAYPAL_MODE,
    "client_id": settings.PAYPAL_CLIENT_ID,
    "client_secret": settings.PAYPAL_SECRET,
})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_paypal_payment(request, dataset_id):
    """
<<<<<<< Updated upstream
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
=======
    Initiates a PayPal payment process for a dataset purchase,
    and creates a PendingPayment record to link the PayPal paymentId
    with the authenticated user + dataset.
    """
    dataset = get_object_or_404(Dataset, dataset_id=dataset_id)
    researcher = request.user  # Authenticated user

    # Ensures the user has an approved dataset request before proceeding
    dataset_request = DatasetRequest.objects.filter(
        dataset_id=dataset,
        researcher_id=researcher,
        request_status='approved'
    ).first()
    if not dataset_request:
        return Response({'error': 'Request must be approved before payment'}, status=status.HTTP_403_FORBIDDEN)

    # If the dataset is free, payment isnt required
    if dataset.price == 0:
        return Response({'message': 'Dataset is free, no payment needed.'}, status=status.HTTP_200_OK)

    # Return URL includes only dataset_id. Relies on PendingPayment to find the user.
    return_url = f"{settings.PAYPAL_RETURN_URL}?dataset_id={dataset.dataset_id}"
    cancel_url = settings.PAYPAL_CANCEL_URL

    # Create PayPal payment object
>>>>>>> Stashed changes
    payment = paypalrestsdk.Payment({
        "intent": "sale",
        "payer": {"payment_method": "paypal"},
        "redirect_urls": {
<<<<<<< Updated upstream
            "return_url": settings.PAYPAL_RETURN_URL, # URL to redirect after successful payment
            "cancel_url": settings.PAYPAL_CANCEL_URL # URL to redirect if the user cancels
=======
            "return_url": return_url,
            "cancel_url": cancel_url
>>>>>>> Stashed changes
        },
        "transactions": [{
            "amount": {"total": str(dataset.price), "currency": "GBP"},
            "description": f"Payment for dataset: {dataset.title}"
        }]
    })
<<<<<<< Updated upstream
    
    # Check if the payment was successfully created
=======

    # Attempts to create the payment in PayPal
>>>>>>> Stashed changes
    if payment.create():
        # Stores paymentId locally, so we know which user & dataset it belongs to
        PendingPayment.objects.create(
            paypal_payment_id=payment.id,
            user=researcher,
            dataset=dataset
        )

        approval_url = next(link["href"] for link in payment.links if link["rel"] == "approval_url")
        return Response({"approval_url": approval_url}, status=status.HTTP_200_OK)
    else:
<<<<<<< Updated upstream
        return Response({"error": "Failed to create PayPal payment", "details": payment.error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
=======
        return Response(
            {"error": "Failed to create PayPal payment", "details": payment.error},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
>>>>>>> Stashed changes

@api_view(['GET'])
@permission_classes([AllowAny]) 
def paypal_success(request):
    """
<<<<<<< Updated upstream
    Handles successful PayPal payments and grants access to the purchased dataset.
    
    - Validates payment ID and payer ID from PayPal.
    - Executes the PayPal transaction.
    - Confirms that the dataset request was approved.
    - Creates a purchase record if one does not already exist.
    - Grants access to the dataset upon successful verification.
    """
    payment_id = request.GET.get("paymentId")
    payer_id = request.GET.get("PayerID")

    # Validate PayPal response parameters
    if not payment_id or not payer_id:
        return Response({"error": "Missing paymentId or PayerID"}, status=400)
=======
    PayPal calls this URL upon successful payment.
    We do NOT rely on request.user here. Instead, we look up the
    PendingPayment record by paymentId to find the correct user & dataset.
    """
    payment_id = request.GET.get("paymentId")
    payer_id = request.GET.get("PayerID")
    dataset_id = request.GET.get("dataset_id")

    if not payment_id or not payer_id or not dataset_id:
        return Response({"error": "Missing required PayPal parameters or dataset_id"}, status=400)
>>>>>>> Stashed changes

    try:
        # Confirms this payment in PayPal
        payment = paypalrestsdk.Payment.find(payment_id)
<<<<<<< Updated upstream

        # Execute the payment using the payer ID
        if payment.execute({"payer_id": payer_id}):
            # Assume the description contains "Payment for dataset: <dataset title>"
            dataset_title = payment.transactions[0].description.split(": ")[1]
            dataset = Dataset.objects.get(title=dataset_title)

            # Validate that the dataset request was approved before granting access
            dataset_request = DatasetRequest.objects.filter(
                dataset_id=dataset, request_status="approved"
            ).first()
            if not dataset_request:
                return Response(
                    {"error": "You must have an approved request to access this dataset."},
                    status=403
                )

            user = dataset_request.researcher_id  # Correct researcher from dataset request

            # Create the purchase record if it doesn't exist already
            purchase, created = DatasetPurchase.objects.get_or_create(dataset=dataset, buyer=user)

            return redirect(f"{settings.FRONTEND_URL}/dashboard?payment=success")
        else:
=======
        if not payment.execute({"payer_id": payer_id}):
>>>>>>> Stashed changes
            return Response({"error": "Payment execution failed"}, status=500)

        # Looks who initiated the payment
        pending = PendingPayment.objects.get(paypal_payment_id=payment_id)
        user = pending.user
        dataset = pending.dataset

        # Checks the user had an approved request
        dataset_request = DatasetRequest.objects.filter(
            dataset_id=dataset,
            researcher_id=user,
            request_status='approved'
        ).first()
        if not dataset_request:
            return Response(
                {"error": "User does not have an approved request for this dataset."},
                status=403
            )

        # Creates the purchase record
        DatasetPurchase.objects.get_or_create(
            dataset=dataset,
            buyer=user
        )

        # Optionally delete the pending payment record
        pending.delete()

        # Redirect user to dashboard
        return redirect(f"{settings.FRONTEND_URL}/dashboard?payment=success")

    except paypalrestsdk.ResourceNotFound:
        return Response({"error": "Payment not found in PayPal"}, status=404)
    except PendingPayment.DoesNotExist:
        return Response({"error": "No matching PendingPayment record"}, status=404)
    except Dataset.DoesNotExist:
        return Response({"error": "Dataset not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def paypal_cancel(request):
    """
    Handles PayPal payment cancellation (user clicks 'Cancel' on PayPal site).
    """
    return Response({"message": "Payment cancelled."}, status=400)
