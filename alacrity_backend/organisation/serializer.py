
from rest_framework import serializers
from organisation.models import Organization


from users.serializers import UserSerializer
from django.db import transaction
from datasets.serializer import DatasetSerializer

class OrganizationSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    # datasets_count = serializers.SerializerMethodField()
    is_followed = serializers.SerializerMethodField()
    bio = serializers.CharField(source='description', allow_null=True)
    website = serializers.URLField(allow_blank=True, allow_null=True)
    location = serializers.CharField(allow_blank=True, allow_null=True)
    profile_picture = serializers.URLField(allow_blank=True, allow_null=True)
    cover_image = serializers.URLField(allow_blank=True, allow_null=True)
    social_links = serializers.JSONField(allow_null=True)


    class Meta:
        model = Organization
        fields = [
            'Organization_id', 'name', 'profile_picture', 'bio', 'date_joined',
            'website', 'location', 'followers_count', 'following_count', 'cover_image',
             'is_followed', 'social_links', 
        ]
        read_only_fields = ['date_joined', 'followers_count', 'following_count']

    def get_followers_count(self, obj):
        return obj.following.count()  

    def get_following_count(self, obj):
        return obj.following.count() 



        

    def get_is_followed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.following.filter(id=request.user.id).exists()
        return False
    
class OrganizationRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=True)
    description = serializers.CharField(min_length=10, required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(max_length=15, required=True)
    address = serializers.CharField(max_length=255, required=True)
    admin = UserSerializer()
   

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
          
            admin_serializer = UserSerializer(data=admin_data)
            if not admin_serializer.is_valid():
                print(f"RegisterSerializer errors: {admin_serializer.errors}")
                raise serializers.ValidationError(admin_serializer.errors)
            admin_serializer.save()

        return organization

    def to_representation(self, instance):
        ret = OrganizationSerializer(instance).data
        admin = instance.user_set.filter(role='organization_admin').first()
        if admin:
            ret['admin'] = UserSerializer(admin).data
        return ret