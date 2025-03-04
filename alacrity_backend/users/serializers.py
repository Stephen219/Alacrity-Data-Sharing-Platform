
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from organisation.models import Organization

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )
    organization = serializers.CharField(
        required=False,
        allow_null=True,
        write_only=True  
    )

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'sur_name', 'phone_number',
            'role', 'organization', 'field', 'date_of_birth', 'profile_picture',
            'password', 'password2'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, attrs):
        print(f"Validating RegisterSerializer data: {attrs}")
        if 'password2' in attrs and attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        attrs.pop('password2', None)
        
        # Password strength validation
        password = attrs.get('password')
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
        if not any(char.isdigit() for char in password):
            raise serializers.ValidationError({"password": "Password must contain at least one number."})
        if not any(char.isupper() for char in password):
            raise serializers.ValidationError({"password": "Password must contain at least one uppercase letter."})
        if not any(char.islower() for char in password):
            raise serializers.ValidationError({"password": "Password must contain at least one lowercase letter."})
        if not any(char in "!@#$%^&*()+-_=[]{}|;:,.<>?" for char in password):
            raise serializers.ValidationError({"password": "Password must contain at least one special character."})

        # Handle organization as a PK
        if 'organization' in attrs and attrs['organization']:
            try:
                attrs['organization'] = Organization.objects.get(Organization_id=attrs['organization'])
            except Organization.DoesNotExist:
                raise serializers.ValidationError({"organization": "Invalid organization ID."})

        return attrs

    def create(self, validated_data):
        role = validated_data.get('role', 'researcher')
        is_active = False if role == 'contributor' else True

        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            sur_name=validated_data['sur_name'],
            username=validated_data['username'],
            password=validated_data['password'],
            role=role,
            organization=validated_data.get('organization'),
            phone_number=validated_data['phone_number'],
            date_of_birth=validated_data.get('date_of_birth'),
            field=validated_data.get('field'),
            is_active=is_active
        )
        return user

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.organization:
            ret['organization'] = instance.organization.name
        return ret

    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Phone number already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists. Please login.")
        return value