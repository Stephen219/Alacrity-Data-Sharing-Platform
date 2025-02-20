from rest_framework import serializers
from .models import Contributor
from django.contrib.auth.hashers import make_password

class ContributorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contributor
        fields = [
            'contributor_id', 'first_name', 'last_name', 
            'email', 'phone', 'organization', 'role', 
            'password', 'profile_picture', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'organization': {'required': False},  # Organization will be set from the authenticated user
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)