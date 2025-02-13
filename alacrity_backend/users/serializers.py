from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True
        # validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('email', 'first_name', 'sur_name','username', 'password', 'password2', 'role', 
                  'organization', 'phone_number', 'date_of_birth', 'field')
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({"password": "Passwords do not match."})

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

        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            sur_name=validated_data['sur_name'],
            username=validated_data['username'],
            password=validated_data['password'],  
            role=validated_data.get('role'),
            organization=validated_data.get('organization'),
            phone_number=validated_data.get('phone_number'),
         
            date_of_birth=validated_data.get('date_of_birth'),
            field=validated_data.get('field')
        )
        return user
    
    def validate_phone_number(self, value): 
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Phone number already exists.")
        return value

    def validate_email(self, value): 
        if User.objects.filter(email=value).exists():             
            raise serializers.ValidationError("Email already exists. Please login.")
        return value
    
 