
from rest_framework import serializers
from .models import Dataset

class DatasetSerializer(serializers.ModelSerializer):
    contributor_name = serializers.CharField()
    organization_name = serializers.CharField()

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
        ]

    def validate_price(self, value):
        """Ensure price is always a valid non-negative number"""
        if value is None:
            return 0.00  # Default to Free (0.00)
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

