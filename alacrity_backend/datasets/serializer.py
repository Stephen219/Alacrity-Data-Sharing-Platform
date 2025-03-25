
from rest_framework import serializers
from .models import Dataset , Chat, Message , Feedback
from payments.models import DatasetPurchase

class DatasetSerializer(serializers.ModelSerializer):
    contributor_name = serializers.CharField()
    organization_name = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=True)
    hasPaid = serializers.SerializerMethodField()

# this is the data that will be returned when a dataset is queried
    class Meta:
        model = Dataset
        fields = [
            'dataset_id',
            'title',
            'contributor_name',
            'organization_name',
            'category',
            'schema',
            'analysis_link',
            'description',
            'tags',
            'view_count',
            'created_at',
            'updated_at',
            'price',
            'hasPaid',
        ]

    def validate_price(self, value):
        """Ensure price is always a valid non-negative number"""
        if value is None:
            return 0.00  # Default to Free (0.00)
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return round(value, 2)
    
    def get_hasPaid(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return DatasetPurchase.objects.filter(dataset=obj, buyer=request.user).exists()


class MessageSerializer(serializers.ModelSerializer):
    sender_first_name = serializers.CharField(source='sender.first_name', read_only=True)
    sender_sur_name = serializers.CharField(source='sender.sur_name', read_only=True)
    sender_profile_picture = serializers.URLField(source='sender.profile_picture', read_only=True)

    class Meta:
        model = Message
        fields = ['message_id', 'content', 'sender', 'created_at', 'sender_first_name', 'sender_sur_name', 'sender_profile_picture']


class ChatSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    participants = serializers.StringRelatedField(many=True)  # Show participant usernames

    class Meta:
        model = Chat
        fields = ['chat_id', 'dataset', 'participants', 'created_at', 'messages']

class FeebackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['feedback_id', 'user','comment', 'rating','created_at']