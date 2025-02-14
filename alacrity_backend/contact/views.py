from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings

@api_view(['POST'])
def send_contact_email(request):
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
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=["alacritytestingemail@gmail.com"],
            fail_silently=False,
        )
        return Response({"success": "Email sent successfully"})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
