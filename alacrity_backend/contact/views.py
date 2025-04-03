
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings
from alacrity_backend.settings import DEFAULT_FROM_EMAIL
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import re




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

class ChatAPIView(APIView):
    permission_classes = [AllowAny]  # Public access for chatbot

    def post(self, request):
        user_input = request.data.get("message", "").lower()
        print(f"Received input: '{user_input}'")  # Debug log
        response = {"text": "", "actions": []}

        # Initial greeting if no input yet (first message)
        if not user_input:
            response["text"] = (
                "Hello! I’m AlacrityBot, here to help you! Questions you might ask me are: "
                "'Who are we?' or 'What do we do?'"
            )
            return Response(response, status=status.HTTP_200_OK)

        # Handle "who are we"
        if re.search(r"who.*(we|you|pontiro)", user_input):
            response["text"] = (
                "Pontiro leverages privacy-enhancing tech in healthcare to enable secure data-sharing, "
                "like anonymizing NHS radiological imaging for AI analysis. "
                "Are you an organization curious about us or a researcher willing to join us?"
            )
            response["actions"] = [
                {"label": "I’m an Organization", "href": "organization"},
                {"label": "I’m a Researcher", "href": "researcher"},
            ]

        # Handle "what do we do"
        elif re.search(r"what.*(do|we do|pontiro do)", user_input):
            response["text"] = (
                "Pontiro enables secure data-sharing in healthcare using privacy tech. We help organizations "
                "share anonymized datasets and researchers analyze them with built-in tools—all safely on our platform. "
                "Want to learn more or get started?"
            )
            response["actions"] = [
                {"label": "Sign Up as Organisation", "href": "/auth/sign-up/org-sign-up"},
                {"label": "Sign Up as Researcher", "href": "/auth/sign-up"},
            ]

        # Organization flow
        elif re.search(r"organi[sz]ation|org|company", user_input):
            if not any(
                re.search(pattern, user_input)
                for pattern in [r"how.*help", r"why.*join", r"data.*protect"]
            ):
                response["text"] = (
                    "Great! How may I help you? We offer secure dataset uploads with encryption and approval workflows "
                    "to protect your data while sharing it with researchers."
                )
                response["actions"] = [
                    {"label": "Why join us?", "href": "why join"},
                ]
            elif re.search(r"data.*protect", user_input):
                response["text"] = (
                    "Your data’s safety is our priority! We use anonymization and encryption to ensure privacy, "
                    "plus you control who accesses it. Join us to share securely and track your data’s impact!"
                )
                response["actions"] = [
                    {"label": "Join us", "href": "/auth/sign-up/org-sign-up"},
                ]
            else:
                response["text"] = (
                    "Ready to join? Sign up to upload datasets securely and collaborate with researchers today!"
                )
                response["actions"] = [
                    {"label": "Sign Up as Organisation", "href": "/auth/sign-up/org-sign-up"},
                    {"label": "Learn More", "href": "/about"},
                ]

        # Handle "why join" independently for organization context
        elif re.search(r"why.*join", user_input):
            response["text"] = (
                "Your data’s safety is our priority! We use anonymization and encryption to ensure privacy, "
                "plus you control who accesses it. Join us to share securely and track your data’s impact!"
            )
            response["actions"] = [
                {"label": "Join us", "href": "/auth/sign-up/org-sign-up"},
            ]

        # Researcher flow
        elif re.search(r"researcher|res|scientist", user_input):
            if not any(
                re.search(pattern, user_input)
                for pattern in [r"how.*help", r"how.*impact", r"data.*protect"]
            ):
                response["text"] = (
                    "Nice! How may I assist you? You can analyze datasets securely with tools like t-tests and visualizations, "
                    "all while the data stays protected on our platform."
                )
                response["actions"] = [
                    {"label": "How it impacts me", "href": "how impacts"},
                ]
            else:
                response["text"] = (
                    "Ready to get started? Sign up to access datasets and start your research now!"
                )
                response["actions"] = [
                    {"label": "Sign Up as Researcher", "href": "/auth/sign-up"},
                    {"label": "Explore Datasets", "href": "/feed"},
                ]

        # Handle "how impacts" independently for researcher context
        elif re.search(r"how.*impact", user_input):
            response["text"] = (
                "Our platform helps you research your specific field with ease by providing access to anonymized datasets, "
                "built-in analysis tools, and secure collaboration options—no need to worry about data handling!"
            )
            response["actions"] = [
                {"label": "Is my data protected?", "href": "data protected"},
            ]

        # Handle "data protected" independently for researcher context
        elif re.search(r"data.*protect", user_input):
            response["text"] = (
                "Data stays safe with encryption and access controls. You can control who sees your research and who cannot. "
                "Join us to explore datasets, run analyses, and publish your findings securely!"
            )
            response["actions"] = [
                {"label": "Join us", "href": "/auth/sign-up"},
            ]

        # Default fallback for unrecognized input
        else:
            response["text"] = (
                "I’m here to assist! Are you an organization curious about secure data-sharing or a researcher "
                "looking to analyze data? Ask me 'who are we' or 'what do we do' to learn more!"
            )

        print(f"Returning response: {response}")  # Debug log
        return Response(response, status=status.HTTP_200_OK)