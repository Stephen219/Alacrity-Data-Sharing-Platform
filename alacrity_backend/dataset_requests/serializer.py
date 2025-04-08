from rest_framework import serializers
from .models import DatasetRequest
from users.models import User  # Import User model
from datasets.models import Dataset  # Import Dataset model

class DatasetRequestSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='request_id',read_only=True)
    researcher_name = serializers.SerializerMethodField()  
    dataset_title = serializers.SerializerMethodField(read_only=True)
    dataset_description = serializers.SerializerMethodField(read_only=True)
    researcher_field = serializers.SerializerMethodField()  
    researcher_description = serializers.SerializerMethodField()  
    request_status = serializers.CharField()
    message = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    updated_by = serializers.PrimaryKeyRelatedField(read_only=True)  
    class Meta:
        model = DatasetRequest
        fields = [
            'id',
            'dataset_title',
            'dataset_description',
            'researcher_name',
            'researcher_id',  
            'researcher_field',
            'researcher_description',  
            'request_status',
            'message',
            'created_at',
            'updated_at',
            'updated_by',  
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
            return researcher.field  
        return "Unknown Field"

    def get_researcher_description(self, obj):
        """
        Returns the researcher's description.
        """
        researcher = obj.researcher_id
        if isinstance(researcher, User):
            return researcher.bio 
        return "No description currently available"

    def get_dataset_title(self, obj):
        """
        Returns the title of the dataset.
        """
        dataset = obj.dataset_id
        if isinstance(dataset, Dataset):
            return dataset.title
        return "Unknown Dataset"
    
    def get_dataset_description(self, obj):
        """
        Returns the description of the dataset.
        """
        dataset = obj.dataset_id
        if isinstance(dataset, Dataset):
            return dataset.description
        return "No description currently available"