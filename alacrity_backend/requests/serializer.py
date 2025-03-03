from rest_framework import serializers
from .models import DatasetRequest
from users.models import User  # Import User model

class DatasetRequestSerializer(serializers.ModelSerializer):
    researcher_name = serializers.SerializerMethodField()  # Use method field
    dataset_title = serializers.CharField()
    request_status = serializers.CharField()
    message = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    class Meta:
        model = DatasetRequest
        fields = [
            'dataset_title',
            'researcher_name',
            'request_status',
            'message',
            'created_at',
            'updated_at'
        ]

    def get_researcher_name(self, obj):
        """
        Returns the full name of the researcher (first name + sur_name).
        """
        researcher = obj.user_id  # Assuming researcher_id is a FK to User
        if isinstance(researcher, User):
            return f"{researcher.first_name} {researcher.sur_name}".strip()
        return "Unknown Researcher"
