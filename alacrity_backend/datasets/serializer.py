
from rest_framework import serializers
from .models import Dataset
from payments.models import DatasetPurchase

class DatasetSerializer(serializers.ModelSerializer):
    contributor_name = serializers.CharField()
    organization_name = serializers.CharField()
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
        return value
    
    def get_hasPaid(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return DatasetPurchase.objects.filter(dataset=obj, buyer=request.user).exists()

