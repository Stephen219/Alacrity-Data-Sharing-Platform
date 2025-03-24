from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Chat, Message , Dataset
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
    
    @role_required(['organization_admin', 'contributor', 'researcher'])
    def list(self, request, *args, **kwargs):
        dataset_id = self.kwargs.get('dataset_id')
        if not dataset_id:
            return Response({'error': 'Dataset ID is required.'}, status=400)
        
        try:
            # Add logging for debugging
            print(f"Looking for chat with dataset_id: {dataset_id}")
            
            # First check if the dataset exists
            try:
                dataset = Dataset.objects.get(dataset_id=dataset_id)
                print(f"Dataset found: {dataset.title}")
            except Dataset.DoesNotExist:
                print(f"No dataset found with ID: {dataset_id}")
                return Response({'error': 'Dataset not found.'}, status=404)
            
            # Then look for the chat
            chat = Chat.objects.get(dataset__dataset_id=dataset_id)
            print(f"Chat found: {chat.chat_id}")
            
            # Get messages
            messages = Message.objects.filter(chat=chat).order_by('created_at')
            
            if not messages.exists():
                print(f"No messages found for chat: {chat.chat_id}")
                return Response({'messages': [], 'info': 'No messages available for this chat.'}, status=200)
            
            print(f"Found {messages.count()} messages")
            serializer = self.get_serializer(messages, many=True)
            return Response(serializer.data)
            
        except Chat.DoesNotExist:
                print(f"No chat found for dataset: {dataset_id}")
                return Response([])  # Return empty list instead of 404
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response({'error': f'An error occurred: {str(e)}'}, status=500)