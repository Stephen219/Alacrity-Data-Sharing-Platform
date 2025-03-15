from rest_framework import serializers
from .models import AnalysisSubmission, PublishedResearch

class AnalysisSubmissionSerializer(serializers.ModelSerializer):
    researcher_email = serializers.EmailField(source="researcher.email", read_only=True)
    submitted_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = AnalysisSubmission  
        fields = ['id', 'title', 'description', 'raw_results', 'summary', 'status', 'researcher_email', 'submitted_at']

class PublishedResearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublishedResearch
        fields = ['research_submission', 'visibility', 'tags', 'likes_count', 'bookmarks_count', 'is_private']