
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.decorators import role_required
from .models import Conversation, User
from django.shortcuts import get_object_or_404

class user_chat(APIView):
    
    @role_required('researcher')
    def get(self, request, recipient_id):
        recipient = get_object_or_404(User, id=recipient_id)
        conversation, created = Conversation.objects.get_or_create(
            participant1=request.user,
            participant2=recipient
        )
        return Response({
            'conversation_id': conversation.id,
            'recipient_email': recipient.email,
        })

