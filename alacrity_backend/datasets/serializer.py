
from rest_framework import serializers
from .models import Dataset

class DatasetSerializer(serializers.ModelSerializer):
    contributor_name = serializers.CharField()
    organization_name = serializers.CharField()

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
            'created_at',
            'updated_at'
        ]