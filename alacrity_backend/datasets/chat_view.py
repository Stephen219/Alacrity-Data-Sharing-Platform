from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Chat, Message, Dataset
from .serializer import ChatSerializer, MessageSerializer, DatasetSerializer  # Ensure this is correct (might be 'serializers')
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
    
class ChatListView(APIView):
    serializer_class = ChatSerializer

    @role_required(['organization_admin', 'contributor', 'researcher'])
    def get(self, request, *args, **kwargs):
        print("DEBUG: ChatListView get called")
        user = request.user
        chats = (
            Chat.objects.filter(participants=user)
            .select_related('dataset')
            .prefetch_related('participants', 'messages')
            | Chat.objects.filter(dataset__contributor_id=user)
            .select_related('dataset')
            .prefetch_related('participants', 'messages')
        ).distinct()

        print(f"DEBUG: chats queryset: {chats}")
        chat_summaries = []
        for chat in chats:
            other_participant = chat.participants.exclude(id=user.id).first()
            if not other_participant:
                continue

            # Count only unread messages from others
            unread_count = chat.messages.filter(read=False).exclude(sender=user).count()
            last_message = chat.messages.last()

            chat_summaries.append({
                'dataset_id': chat.dataset.dataset_id,
                'title': chat.dataset.title,
                'organization': chat.dataset.organization_name,
                'participant': {
                    'first_name': other_participant.first_name,
                    'sur_name': other_participant.sur_name,
                    'profile_picture': other_participant.profile_picture,
                },
                'last_message': last_message.content if last_message else None,
                'last_timestamp': last_message.created_at.isoformat() if last_message else None,
                'unread_count': unread_count,
            })
        print(f"DEBUG: chat_summaries: {chat_summaries}")
        return Response(chat_summaries)

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

            if request.user != dataset.contributor_id and request.user not in chat.participants.all():
                return Response({'error': 'You are not authorized to view this chat'}, status=status.HTTP_403_FORBIDDEN)

            messages = Message.objects.filter(chat=chat).order_by('created_at')
            if not messages.exists():
                print(f"DEBUG: No messages found for chat: {chat.chat_id}")
                return Response({'messages': [], 'info': 'No messages available for this chat.'}, status=status.HTTP_200_OK)

            # Fix: Use exclude instead of sender__ne
            messages.exclude(sender=request.user).update(read=True)
            serializer = MessageSerializer(messages, many=True)
            print(f"DEBUG: Found {messages.count()} messages")
            return Response(serializer.data)
        except Dataset.DoesNotExist:
            print(f"DEBUG: No dataset found with ID: {dataset_id}")
            return Response({'error': 'Dataset not found'}, status=status.HTTP_404_NOT_FOUND)
        except Chat.DoesNotExist:
            print(f"DEBUG: No chat found for dataset: {dataset_id}")
            return Response([], status=status.HTTP_200_OK)
        


        
class DatasetDetailView(APIView):
    serializer_class = DatasetSerializer

    @role_required(['organization_admin', 'contributor', 'researcher'])
    def get(self, request, dataset_id, *args, **kwargs):
        print(f"DEBUG: GET /datasets/{dataset_id}/ by {request.user.email} with token {request.headers.get('Authorization', 'No token')}")
        try:
            dataset = Dataset.objects.get(dataset_id=dataset_id)
            print(f"DEBUG: Dataset found: {dataset.title}")
            chat = Chat.objects.filter(dataset=dataset).first()
            if request.user != dataset.contributor_id and (not chat or request.user not in chat.participants.all()):
                print(f"DEBUG: User {request.user.email} not authorized for dataset {dataset_id}")
                return Response({'error': 'You are not authorized to view this dataset'}, status=status.HTTP_403_FORBIDDEN)
            serializer = DatasetSerializer(dataset)
            print(f"DEBUG: Returning dataset data for {dataset_id}")
            return Response(serializer.data)
        except Dataset.DoesNotExist:
            print(f"DEBUG: Dataset not found: {dataset_id}")
            return Response({'error': 'Dataset not found'}, status=status.HTTP_404_NOT_FOUND)