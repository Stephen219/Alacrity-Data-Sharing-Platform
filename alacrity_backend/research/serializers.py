from rest_framework import serializers
from .models import ResearchSubmission, PublishedResearch

class ResearchSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchSubmission
        fields = ['submission_id', 'research_name', 'description', 'raw_results', 'summary', 'status', 'is_bookmarked', 'is_private']

class PublishedResearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublishedResearch
        fields = ['research_submission', 'visibility', 'tags', 'likes_count', 'bookmarks_count', 'is_private']