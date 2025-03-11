from django.contrib.auth.models import AbstractUser
from django.db import models
from organisation.models import Organization
import uuid
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('organization_admin', 'Organization Admin'),
        ('admin', 'Admin'),
        ('contributor', 'organization_employee'), 
        ('researcher', 'Researcher'), # default role
    ]
    
    email = models.EmailField(
        unique=True,
        error_messages={
            'unique': "A user with that email already exists.",
        }
    )

    first_name = models.CharField(max_length=30)  
    sur_name = models.CharField(max_length=30) 
    username = models.CharField(max_length=30, unique=True)
    phone_number = models.CharField(max_length=15, unique=True, blank=True, null=True) 
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    # organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    field = models.TextField(blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    bio = models.TextField(blank=True, null=True, default='No bio provided')
    date_of_birth = models.DateField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)  # Corrected spelling
    
    #TODO PROFILE PIC  but as a url
    profile_picture = models.URLField(blank=True, null=True)

    # Email is used as primary field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']

    @property
    # If organization is a ForeignKey or field, no need for @property
    def get_organization(self):
        return self.organization if self.organization else None


    class Meta:
        verbose_name = "user"


        verbose_name_plural = "users"
        

    def __str__(self):
        return self.email

    def is_admin(self):
        return self.role == 'admin'

    def is_contributor(self):
        return self.role == 'employee'

    def is_researcher(self):
        return self.role == 'researcher'


class ActivationToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='activation_token')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=30) 
        super().save(*args, **kwargs)

    def is_valid(self):
        return not self.used and self.expires_at > timezone.now()

    def __str__(self):
        return f"Token for {self.user.email} - {self.token}"
    



