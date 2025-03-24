from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Chat, Message, Dataset
from .serializer import ChatSerializer, MessageSerializer  # Ensure this is correct (might be 'serializers')
from users.decorators import role_required

class ChatListView(APIView):
    """List all chat summaries for the authenticated user."""
    serializer_class = ChatSerializer

    @role_required(['organization_admin', 'contributor', 'researcher'])
    def get(self, request, *args, **kwargs):
        print("DEBUG: ChatListView get called")
        user = request.user
        # Include chats where user is a participant OR the dataset contributor
        chats = Chat.objects.filter(
            participants=user
        ).select_related('dataset') | Chat.objects.filter(
            dataset__contributor_id=user
        ).select_related('dataset')
        chats = chats.distinct()  # Remove duplicates if user is both participant and contributor
        print(f"DEBUG: chats queryset: {chats}")
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
        print(f"DEBUG: chat_summaries: {chat_summaries}")
        return Response(chat_summaries)
    
class ChatStartView(APIView):
    """Start a new chat or add user to an existing chat."""
    serializer_class = ChatSerializer

    @role_required(['organization_admin', 'contributor', 'researcher'])
    def post(self, request, dataset_id, *args, **kwargs):
        try:
            dataset = Dataset.objects.get(dataset_id=dataset_id)
            chat, created = Chat.objects.get_or_create(dataset=dataset)

            if request.user not in chat.participants.all():
                chat.participants.add(request.user)

            contributor = dataset.contributor_id
            if contributor and contributor not in chat.participants.all():
                chat.participants.add(contributor)

            content = request.data.get('content')
            if content:
                message = Message.objects.create(chat=chat, sender=request.user, content=content)
                return Response({
                    'dataset_id': dataset.dataset_id,
                    'title': dataset.title,
                    'organization': dataset.organization_name,
                    'last_message': message.content,
                    'last_timestamp': message.created_at.isoformat()
                }, status=status.HTTP_201_CREATED)

            return Response({
                'dataset_id': dataset.dataset_id,
                'title': dataset.title,
                'organization': dataset.organization_name,
                'last_message': chat.messages.last().content if chat.messages.exists() else None,
                'last_timestamp': chat.messages.last().created_at.isoformat() if chat.messages.exists() else None,
            }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

        except Dataset.DoesNotExist:
            return Response({'error': 'Dataset not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SendMessageView(APIView):
    """Send a message in an existing chat."""
    serializer_class = MessageSerializer

    @role_required(['organization_admin', 'contributor', 'researcher'])
    def post(self, request, pk, *args, **kwargs):
        try:
            chat = Chat.objects.get(pk=pk)
        except Chat.DoesNotExist:
            return Response({'error': 'Chat not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in chat.participants.all():
            return Response({'error': 'You are not a participant in this chat'}, status=status.HTTP_403_FORBIDDEN)

        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(chat=chat, sender=request.user)
            return Response({
                'dataset_id': chat.dataset.dataset_id,
                'title': chat.dataset.title,
                'organization': chat.dataset.organization_name,
                'last_message': serializer.data['content'],
                'last_timestamp': serializer.data['created_at'],
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MessageListView(APIView):
    """List messages for a chat by dataset_id."""
    serializer_class = MessageSerializer

    @role_required(['organization_admin', 'contributor', 'researcher'])
    def get(self, request, dataset_id, *args, **kwargs):
        if not dataset_id:
            return Response({'error': 'Dataset ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            print(f"DEBUG: Looking for chat with dataset_id: {dataset_id}")
            dataset = Dataset.objects.get(dataset_id=dataset_id)
            print(f"DEBUG: Dataset found: {dataset.title}")
            chat = Chat.objects.get(dataset__dataset_id=dataset_id)
            print(f"DEBUG: Chat found: {chat.chat_id}")
            messages = Message.objects.filter(chat=chat).order_by('created_at')

            if not messages.exists():
                print(f"DEBUG: No messages found for chat: {chat.chat_id}")
                return Response({'messages': [], 'info': 'No messages available for this chat.'}, status=status.HTTP_200_OK)

            print(f"DEBUG: Found {messages.count()} messages")
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data)

        except Dataset.DoesNotExist:
            print(f"DEBUG: No dataset found with ID: {dataset_id}")
            return Response({'error': 'Dataset not found'}, status=status.HTTP_404_NOT_FOUND)
        except Chat.DoesNotExist:
            print(f"DEBUG: No chat found for dataset: {dataset_id}")
            return Response([], status=status.HTTP_200_OK)
        except Exception as e:
            print(f"DEBUG: Unexpected error: {str(e)}")
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)