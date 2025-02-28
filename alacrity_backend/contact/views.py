
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings
from alacrity_backend.settings import DEFAULT_FROM_EMAIL




@api_view(['POST'])
@permission_classes([AllowAny])

def send_contact_email(request):
    permission_classes = [AllowAny]
    
    """
    Handle contact form submissions and send an email.
    """
    email = request.data.get('email')
    subject = request.data.get('subject')
    message = request.data.get('message')

    if not email or not subject or not message:
        return Response({"error": "All fields are required"}, status=400)

    try:
        send_mail(
            subject=f"Message from {email}: {subject}",
            message=message,
            from_email=DEFAULT_FROM_EMAIL,
            recipient_list=["alacritytestingemail@gmail.com"],
            fail_silently=False,
        )

        return Response({"success": "Email sent successfully"})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
