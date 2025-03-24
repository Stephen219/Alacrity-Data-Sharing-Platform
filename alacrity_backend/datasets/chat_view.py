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
    def get_queryset(self):  # Removed 'request' parameter
        user = self.request.user
        # Fetch only the chats where the user is a participant (researcher/admin/contributor)
        return Chat.objects.filter(participants=user).select_related('dataset')

    def list(self, request, *args, **kwargs):
        """
        Return a list of chat summaries for the authenticated user.
        """
        user = request.user
        chats = self.get_queryset()  # No argument needed now
        chat_summaries = [
            {
                'dataset_id': chat.dataset.dataset_id,
                'title': chat.dataset.title,
                'organization': chat.dataset.organization_name,
                'last_message': chat.messages.last().content if chat.messages.exists() else None,
                'last_timestamp': chat.messages.last().created_at.isoformat() if chat.messages.exists() else None,
            }
            for chat in chats
        ]
        return Response(chat_summaries)

    @action(detail=False, methods=['post'], url_path='start/(?P<dataset_id>[^/.]+)')
    @role_required(['organization_admin', 'contributor', 'researcher'])
    def start_chat(self, request, dataset_id=None):
        """
        Start a new chat for a given dataset_id or add user to existing chat.
        Automatically includes the dataset's contributor.
        """
        try:
            dataset = Dataset.objects.get(dataset_id=dataset_id)
            chat, created = Chat.objects.get_or_create(dataset=dataset)
            
            # Add the current user (e.g., researcher) if not already a participant
            if request.user not in chat.participants.all():
                chat.participants.add(request.user)
            
            # Add the dataset's contributor if not already a participant
            contributor = dataset.contributor_id
            if contributor and contributor not in chat.participants.all():
                chat.participants.add(contributor)
            
            # Optionally save an initial message
            content = request.data.get('content')
            if content:
                message = Message.objects.create(chat=chat, sender=request.user, content=content)
                return Response({
                    'dataset_id': dataset.dataset_id,
                    'title': dataset.title,
                    'organization': dataset.organization_name,
                    'last_message': message.content,
                    'last_timestamp': message.created_at.isoformat()
                }, status=201)
            
            # Return chat summary if no message is sent
            serializer = self.get_serializer(chat)
            return Response({
                'dataset_id': dataset.dataset_id,
                'title': dataset.title,
                'organization': dataset.organization_name,
                'last_message': chat.messages.last().content if chat.messages.exists() else None,
                'last_timestamp': chat.messages.last().created_at.isoformat() if chat.messages.exists() else None,
            }, status=200 if not created else 201)
        
        except Dataset.DoesNotExist:
            return Response({'error': 'Dataset not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=True, methods=['post'])
    @role_required(['organization_admin', 'contributor', 'researcher'])
    def send_message(self, request, pk=None):
        """
        Send a message in an existing chat.
        """
        chat = self.get_object()

        # Ensure the user is a participant
        if request.user not in chat.participants.all():
            return Response({'error': 'You are not a participant in this chat'}, status=403)

        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(chat=chat, sender=request.user)
            # Return updated chat summary
            return Response({
                'dataset_id': chat.dataset.dataset_id,
                'title': chat.dataset.title,
                'organization': chat.dataset.organization_name,
                'last_message': serializer.data['content'],
                'last_timestamp': serializer.data['created_at'],
            }, status=201)
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