from rest_framework import serializers
from .models import DatasetRequest
from users.models import User  # Import User model

class DatasetRequestSerializer(serializers.ModelSerializer):
    researcher_name = serializers.SerializerMethodField()  
    dataset_title = serializers.CharField(source='dataset_id.title', read_only=True)
    researcher_field = serializers.SerializerMethodField()  
    researcher_description = serializers.SerializerMethodField()  # Fixed typo
    request_status = serializers.CharField()
    message = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    class Meta:
        model = DatasetRequest
        fields = [
            'dataset_title',
            'researcher_name',
            'researcher_field',
            'researcher_description',  # Fixed typo
            'request_status',
            'message',
            'created_at',
            'updated_at'
        ]

    def get_researcher_name(self, obj):
        """
        Returns the full name of the researcher (first name + last name).
        """
        researcher = obj.researcher_id
        if isinstance(researcher, User):
            return f"{researcher.first_name} {researcher.sur_name}".strip()
        return "Unknown Researcher"

    def get_researcher_field(self, obj):
        """
        Returns the research field of the researcher.
        """
        researcher = obj.researcher_id
        if isinstance(researcher, User):
            return researcher.research_field  # Assuming this is a field in the User model
        return "Unknown Field"

    def get_researcher_description(self, obj):
        """
        Returns the researcher's description.
        """
        researcher = obj.researcher_id
        if isinstance(researcher, User):
            return researcher.description  # Assuming this is a field in the User model
        return "No description currently available"
