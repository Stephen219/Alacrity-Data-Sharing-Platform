
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from organisation.models import Organization
from research.models import AnalysisSubmission

User = get_user_model()

class AnalysisSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisSubmission
        fields = ["id", "title", "description", "status", "submitted_at", "is_private"]

class UserSerializer(serializers.ModelSerializer):
    """
    this was inoilally named as registerserializer now userserialize but i changed it to user serializer   so incse of import issues  
    change and use the latter 
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )
    firstname = serializers.CharField(source="first_name")
    lastname = serializers.CharField(source="sur_name")
    phonenumber = serializers.CharField(source="phone_number")
    organization = serializers.CharField(
        required=False,
        allow_null=True,
        write_only=True
    )
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    researches = serializers.SerializerMethodField()
    bookmarked_researches = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()  
    following_count = serializers.SerializerMethodField()  
    is_followed = serializers.SerializerMethodField()
    follows_you = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "firstname",
            "lastname",
            "phonenumber",
            "role",
            "organization",
            "organization_name",
            "field",
            "date_joined",
            "profile_picture",
            "bio",
            "social_links",
            "researches",
            "bookmarked_researches",
            "followers_count",
            "following_count",
            "is_followed",
            "follows_you",
            "password",
            "password2",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "date_joined": {"read_only": True},
            "bio": {"required": False, "allow_null": True},
            "social_links": {"required": False, "allow_null": True},
            "profile_picture": {"required": False, "allow_null": True},
        }

    def get_researches(self, obj):
        researches = AnalysisSubmission.objects.filter(
            researcher=obj, status="published", is_private=False
        )
        return AnalysisSubmissionSerializer(researches, many=True).data

    def get_bookmarked_researches(self, obj):
        return []

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_followed(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.followers.filter(id=request.user.id).exists()
        return False

    def get_follows_you(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return request.user.followers.filter(id=obj.id).exists()
        return False

    def validate(self, attrs):
        if "password" in attrs and "password2" in attrs:
            if attrs["password"] != attrs["password2"]:
                raise serializers.ValidationError({"password": "Passwords do not match."})
            attrs.pop("password2")

        if "password" in attrs:
            password = attrs["password"]
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

        if "organization" in attrs and attrs["organization"]:
            try:
                attrs["organization"] = Organization.objects.get(Organization_id=attrs["organization"])
            except Organization.DoesNotExist:
                raise serializers.ValidationError({"organization": "Invalid organization ID."})

        return attrs

    def create(self, validated_data):
        role = validated_data.get("role", "researcher")
        is_active = False if role == "contributor" else True

        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            first_name=validated_data.get("first_name", ""),
            sur_name=validated_data.get("sur_name", ""),
            password=validated_data.get("password"),
            phone_number=validated_data.get("phone_number", ""),
            role=role,
            organization=validated_data.get("organization"),
            field=validated_data.get("field", ""),
            bio=validated_data.get("bio"),
            social_links=validated_data.get("social_links", []),
            is_active=is_active,
        )
        return user

    def update(self, instance, validated_data):
        instance.email = validated_data.get("email", instance.email)
        instance.username = validated_data.get("username", instance.username)
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.sur_name = validated_data.get("sur_name", instance.sur_name)
        instance.phone_number = validated_data.get("phone_number", instance.phone_number)
        instance.field = validated_data.get("field", instance.field)
        instance.bio = validated_data.get("bio", instance.bio)
        instance.social_links = validated_data.get("social_links", instance.social_links)
        if "organization" in validated_data:
            instance.organization = validated_data["organization"]
        if "password" in validated_data:
            instance.set_password(validated_data["password"])
        instance.save()
        return instance

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get("request")
        if not request or not request.user.is_authenticated or request.user != instance:
            ret.pop("email", None)
            ret.pop("phonenumber", None)
        if instance.organization:
            ret["organization"] = ret.pop("organization_name")
        else:
            ret["organization"] = None
        ret.pop("organization_name", None)
        return ret

    def validate_phone_number(self, value):
        if self.instance and self.instance.phone_number == value:
            return value
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Phone number already exists.")
        return value

    def validate_email(self, value):
        if self.instance and self.instance.email == value:
            return value
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value