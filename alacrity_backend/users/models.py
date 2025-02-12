from django.contrib.auth.models import AbstractUser
from django.db import models

class Organization(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name





class User(AbstractUser):
    ROLE_CHOICES = [
        ('organization_admin', 'Organization Admin'),
        ('admin', 'Admin'),

        ('contributor', 'Contributor'),
        ('researcher', 'Researcher'),
    ]
    
    # Make email required and unique
    email = models.EmailField(
        ('email address'),
        unique=True,
        error_messages={
            'unique': ("A user with that email already exists."),
        }
    )
    
    # Your existing fields
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    organization = models.ForeignKey('Organization', on_delete=models.SET_NULL, null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    # Use email as the username field for authentication
    USERNAME_FIELD = 'email'
    
    # Remove email from REQUIRED_FIELDS since it's already required by USERNAME_FIELD
    REQUIRED_FIELDS = ['username', 'role']  # Add any other fields you want to be required during user creation

    class Meta:
        verbose_name = ('user')
        verbose_name_plural = ('users')

    def __str__(self):
        return self.email

    def is_admin(self):
        return self.role == 'admin'

    def is_contributor(self):
        return self.role == 'contributor'

    def is_researcher(self):
        return self.role == 'researcher'
