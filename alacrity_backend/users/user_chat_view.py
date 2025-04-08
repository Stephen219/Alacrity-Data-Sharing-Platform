from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async  # Added missing import
from users.decorators import role_required
from .models import Conversation, User, Message
from django.shortcuts import get_object_or_404
from django.db.models import Q

class SearchUsersView(APIView):
    @role_required('researcher')
    def get(self, request):
        query = request.GET.get('q', '').strip()
        if not query:
            return Response({"error": "Search query required"}, status=400)

        users = User.objects.filter(
            Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
        ).exclude(id=request.user.id)[:10]
        return Response([
            {"id": user.id, "username": user.username, "display_name": f"{user.first_name} {user.last_name}".strip()}
            for user in users
        ])

class StartChatView(APIView):
    @role_required(['contributor', 'researcher', 'organization_admin'])
    def get(self, request, recipient_id):
        recipient = get_object_or_404(User, id=recipient_id)
        if recipient == request.user:
            return Response({"error": "Cannot chat with yourself"}, status=400)

        conversation, created = Conversation.objects.get_or_create(
            participant1=request.user,
            participant2=recipient
        )
        return Response({"conversation_id": conversation.id})

class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]
    @role_required(['contributor', 'researcher', 'organization_admin'])
    def get(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        if request.user not in (conversation.participant1, conversation.participant2):
            return Response({"error": "Unauthorized"}, status=403)
        
        participant1 = {
            "id": conversation.participant1.id,
            "first_name": conversation.participant1.first_name,
            "last_name": conversation.participant1.last_name,
            "profile_picture": conversation.participant1.profile_picture,  # String or None
        }
        participant2 = {
            "id": conversation.participant2.id,
            "first_name": conversation.participant2.first_name,
            "last_name": conversation.participant2.last_name,
            "profile_picture": conversation.participant2.profile_picture,  # String or None
        }
        return Response({
            "conversation_id": conversation.id,
            "participant1": participant1,
            "participant2": participant2,
        })
class MessageListView(APIView):
    permission_classes = [IsAuthenticated]
    @role_required('researcher')
    def get(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        if request.user not in (conversation.participant1, conversation.participant2):
            return Response({"error": "Unauthorized"}, status=403)
        
        messages = Message.objects.filter(conversation=conversation).order_by("created_at")
        return Response([
            {
                "message_id": str(msg.id),
                "sender_id": msg.sender.id,
                "message": msg.message,
                "timestamp": msg.created_at.isoformat(),
                "sender_first_name": msg.sender.first_name,
                "sender_last_name": msg.sender.last_name,
                "sender_profile_picture": msg.sender.profile_picture,  # Just the string or None
            }
            for msg in messages
        ])
    
class UserConversationsView(APIView):
    @role_required('researcher')
    def get(self, request):
        conversations = Conversation.objects.filter(
            Q(participant1=request.user) | Q(participant2=request.user)
        ).order_by('-id')
        return Response([
            {
                "conversation_id": conv.id,
                "participant": {
                    "id": conv.participant2.id if conv.participant1 == request.user else conv.participant1.id,
                    "first_name": conv.participant2.first_name if conv.participant1 == request.user else conv.participant1.first_name,
                    "last_name": conv.participant2.last_name if conv.participant1 == request.user else conv.participant1.last_name,
                    "profile_picture": (
                        conv.participant2.profile_picture if conv.participant1 == request.user 
                        else conv.participant1.profile_picture
                    ),
                },
                "last_message": conv.messages.last().message if conv.messages.exists() else "No messages yet",
                "last_timestamp": conv.messages.last().created_at.isoformat() if conv.messages.exists() else None,
                "unread_count": conv.messages.filter(
                    sender=conv.participant2 if conv.participant1 == request.user else conv.participant1,
                    is_read=False
                ).count(),
            } for conv in conversations
        ])