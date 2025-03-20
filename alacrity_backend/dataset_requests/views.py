from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from payments.models import DatasetPurchase
from users.decorators import role_required
from .models import DatasetRequest
from datasets.models import Dataset
from users.models import User
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from .serializer import DatasetRequestSerializer
from .models import DatasetRequest
from alacrity_backend.settings import DEFAULT_FROM_EMAIL
from django.core.mail import send_mail
from django.conf import settings
from alacrity_backend.config import FRONTEND_URL
from notifications.models import Notification

def send_email_to_contributor(dataset_request):
    try:
        subject = 'New Dataset Request'
        message = (
            f'Hello {dataset_request.dataset_id.contributor_id.first_name},\n\n'
            f'You have a new request for your dataset "{dataset_request.dataset_id.title}".\n'
            f'Please login to your account to view the request.\n\n'
            f'Best regards,\nThe Alacrity Team'
        )
        send_mail(
            subject=subject,
            message=message,
            from_email=DEFAULT_FROM_EMAIL,
            recipient_list=[dataset_request.dataset_id.contributor_id.email],
            fail_silently=False,
        )
        print(f"Email sent to {dataset_request.dataset_id.contributor_id.email}")
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False
# this is a view that will be used when the user makes a request to the server

class Make_request(APIView):
    @role_required('researcher')
    def post(self, request):
    # get the dataset_id and researcher_id from the request
        dataset_id = request.data.get('dataset_id')
        researcher_id = request.user.id
        message = request.data.get('objective')  # Match frontend field name
       # print(researcher_id, dataset_id, message)
    
    # check if the dataset_id is provided
        if not dataset_id:
            return Response({'error': 'Please provide a dataset_id'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if the dataset exists in the Dataset table
        try:
            dataset = Dataset.objects.get(dataset_id=dataset_id)
        except Dataset.DoesNotExist:
            return Response({'error': 'Dataset does not exist'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if the researcher exists in the User table (should normally pass if authenticated)
        try:
            researcher = User.objects.get(id=researcher_id)
        except User.DoesNotExist:
            return Response({'error': 'Researcher does not exist'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if the researcher has already requested this dataset and status is pending
        if DatasetRequest.objects.filter(
            dataset_id=dataset,
            researcher_id=researcher,
            request_status='pending'
        ).exists():
            return Response({'error': 'You have already requested this dataset'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create a new request including the message
        dataset_request = DatasetRequest.objects.create(
            dataset_id=dataset,
            researcher_id=researcher,
            message=message  # include the message here
        )
        send_email_to_contributor(dataset_request)
        
                # notify + email all organisation admins
        org_id = dataset.contributor_id.organization_id
        if org_id:
            org_admins = User.objects.filter(organization_id=org_id, role="organization_admin")

            # Creates in-app notifications
            for admin_user in org_admins:
                Notification.objects.create(
                    user=admin_user,
                    message=f"New dataset request for '{dataset.title}' from {request.user.email}.",
                    link=f"{FRONTEND_URL}/requests/approval/{dataset_request.request_id}"
                )

            # can email admins
            email_subject = "New Dataset Request"
            email_body = (
                f"Hello,\n\n"
                f"Researcher {request.user.email} has requested access to dataset '{dataset.title}'.\n"
                f"Please log in to review this request.\n\n"
                f"Best regards,\nAlacrity Team"
            )
            for admin_user in org_admins:
                try:
                    send_mail(
                        subject=email_subject,
                        message=email_body,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[admin_user.email],
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"Failed to email {admin_user.email} about dataset request: {e}")

        return Response({'message': 'Request created successfully'}, status=201)
    



 # this is a view that will be used when the user wants to view all the requests that have been made
class ViewAllDatasetRequests(APIView):
    @role_required(['organization_admin', 'contributor'])
    def get(self, request):
        try:
            request_status = request.query_params.get('request_status', 'pending')
           # get all the requests from the DatasetRequest table according to the contributor with the same organization as the requester
            requests = DatasetRequest.objects.filter(dataset_id__contributor_id__organization=request.user.organization_id,request_status=request_status).select_related('dataset_id', 'researcher_id')
            # serialize the requests
            
            serializer = DatasetRequestSerializer(requests, many=True)
            #print(serializer.data) 
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            print(traceback.format_exc())  # Print full traceback for debugging
        return Response(
            {
            'error': str(e)  # Return the actual error message for debugging
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# a function that will be used to send emails to the user
def send_email(dataset_request):
    try:
        subject = 'Update On Your Dataset Request'
        # Initialize message as an empty string
        message = ''
        
        # Add content to the message based on request status
        if dataset_request.request_status == 'approved':
            #Todo make sure the links works
            message += (f'Your request for dataset "{dataset_request.dataset_id.title}" has been approved. You can now access the dataset at this link: {FRONTEND_URL}/analyze/{dataset_request.dataset_id.dataset_id}')
        elif dataset_request.request_status == 'denied':
            message += (f'Unfortunately, your request for dataset "{dataset_request.dataset_id.title}" has been denied.')
        
        # Get researcher email
        recipient_email = [dataset_request.researcher_id.email]
        
        # Check if recipient email exists
        if not recipient_email or recipient_email == [""]:
            print("Email not found")
            return False  # Return False if no email found
        
        # Sending the email
        send_mail(
            subject=subject,
            message=message,
            from_email=DEFAULT_FROM_EMAIL,
            recipient_list=recipient_email,
            fail_silently=False,
        )
        
        # Print the recipient email for debugging
        print(f"Email sent to: {recipient_email}")
        return True  # Return True when the email is sent successfully
    
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False  # Return False if there's an error



# this view is used to accept / reject a request when the admin is viewing all the requests
class AcceptRejectRequest(APIView):
    @role_required(['organization_admin', 'contributor'])
    def get(self, request, id):
        try:
            print(f"Received request for ID: {id}")  # Debugging
            # Fetch by request_id (not id) since request_id is the primary key
            dataset_request = get_object_or_404(
                DatasetRequest, 
                request_id=id,  # Changed from `id` to `request_id`
                dataset_id__contributor_id__organization=request.user.organization
            )
            #print(dataset_request)
            # print("I am here")
            # print("# debugging")
            serializer = DatasetRequestSerializer(dataset_request)
            print(serializer.data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except DatasetRequest.DoesNotExist:
            return Response({'error': 'Request does not exist'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    def post(self, request, id):
        request_id = id
        action = request.data.get('action')
        print(request_id, action)

        if not request_id:
            return Response({'error': 'Please provide a request_id'}, status=status.HTTP_400_BAD_REQUEST)
        if not action:
            return Response({'error': 'Please provide an action'}, status=status.HTTP_400_BAD_REQUEST)

        dataset_request = get_object_or_404(DatasetRequest, request_id=request_id)

        if action == 'accept':
            dataset_request.request_status = 'approved'
            
            # Print the dataset ID for debugging
            print(f"Dataset ID: {dataset_request.dataset_id.dataset_id}")

            try:
                # Try to get the dataset
                dataset = Dataset.objects.get(dataset_id=dataset_request.dataset_id.dataset_id)

                # Count how many requests for this dataset have been approved
                approved_count = DatasetRequest.objects.filter(
                    dataset_id=dataset_request.dataset_id.dataset_id,
                    request_status='approved'
                ).count()
                print(f"Approved count: {approved_count}")

                # Update the dataset's view_count with the approved count
                dataset.view_count = approved_count
                dataset.save()
            except Dataset.DoesNotExist:
                return Response({'error': 'Dataset does not exist'}, status=status.HTTP_404_NOT_FOUND)

            # Send email notification
            if send_email(dataset_request) == True:
                print("Email sent")
            else:
                print("Email not sent")

            Notification.objects.create(
                user=dataset_request.researcher_id,
                message=f"Your dataset request for '{dataset_request.dataset_id.title}' has been approved."
    )

        elif action == 'reject':
            dataset_request.request_status = 'denied'
            
            # Send email notification
            if send_email(dataset_request) == True:
                print("Email sent")
            else:
                print("Email not sent")

            Notification.objects.create(
                user=dataset_request.researcher_id,
                message=f"Your dataset request for '{dataset_request.dataset_id.title}' has been denied."
    )
        
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

        dataset_request.save()
        return Response({'message': f'Request {action}ed successfully'}, status=status.HTTP_200_OK)
