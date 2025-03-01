
from rest_framework import serializers
from organisation.models import Organization


from users.serializers import RegisterSerializer
from django.db import transaction

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['Organization_id', 'name', 'description', 'email', 'phone', 'address']

    def validate_email(self, value):
        if Organization.objects.filter(email=value).exists():
            raise serializers.ValidationError("An organization with this email already exists.")
        return value

    def validate_phone(self, value):
        if Organization.objects.filter(phone=value).exists():
            raise serializers.ValidationError("An organization with this phone number already exists.")
        return value
    
class OrganizationRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=True)
    description = serializers.CharField(min_length=10, required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(max_length=15, required=True)
    address = serializers.CharField(max_length=255, required=True)
    admin = RegisterSerializer()

    def validate(self, attrs):
        admin_data = attrs.get('admin', {})
        admin_data.pop('organization', None)  
        print(f"Validated attrs: {attrs}")
        return attrs

    def create(self, validated_data):
        admin_data = validated_data.pop('admin')
        admin_data['role'] = 'organization_admin'
        # this one has to be done in a transaction because we need to save the organization first and use it as a fk to 
        # the user    

        with transaction.atomic(): 
            
            org_serializer = OrganizationSerializer(data=validated_data)
            org_serializer.is_valid(raise_exception=True)
            organization = org_serializer.save()
            print(f"Saved organization: {organization.Organization_id}")

            
            admin_data['organization'] = organization.Organization_id
          
            admin_serializer = RegisterSerializer(data=admin_data)
            if not admin_serializer.is_valid():
                print(f"RegisterSerializer errors: {admin_serializer.errors}")
                raise serializers.ValidationError(admin_serializer.errors)
            admin_serializer.save()

        return organization

    def to_representation(self, instance):
        ret = OrganizationSerializer(instance).data
        admin = instance.user_set.filter(role='organization_admin').first()
        if admin:
            ret['admin'] = RegisterSerializer(admin).data
        return ret