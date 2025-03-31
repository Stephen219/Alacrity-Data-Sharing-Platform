from django.urls import path
from .views import send_contact_email, ChatAPIView


urlpatterns = [
    path("api/contact/", send_contact_email, name="send_contact_email"),
    path("api/chat", ChatAPIView.as_view(), name="chat"),
]
