from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Chat, Message
from .serializer import ChatSerializer, MessageSerializer
from rest_framework.decorators import action
from users.decorators import role_required


class ChatViewSet(viewsets.ModelViewSet):
    queryset = Chat.objects.all()
    serializer_class = ChatSerializer
    @role_required(['organization_admin', 'contributor', 'researcher'])
    
    def get_queryset(self):
        user = self.request.user
        # Fetch only the chats where the user is a participant (researcher/admin/contributor)
        return Chat.objects.filter(participants=user)

    @action(detail=True, methods=['post'])
    # This method-level decorator is optional if you already have the class-level decorator
    @role_required(['organization_admin', 'contributor', 'researcher'])
    def send_message(self, request, pk=None):
        chat = self.get_object()

        # Ensure the user is part of the chat participants before sending a message
        if request.user not in chat.participants.all():
            return Response({'error': 'You are not a participant in this chat'}, status=403)

        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(chat=chat, sender=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

# Option 1: Decorate the entire class

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    
    