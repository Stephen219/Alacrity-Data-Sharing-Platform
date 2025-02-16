from django.contrib.auth.models import AbstractUser
from django.db import models
from organisation.models import Organization

class User(AbstractUser):
    ROLE_CHOICES = [
        ('organization_admin', 'Organization Admin'),
        ('admin', 'Admin'),
        ('contributor', 'Contributor'),
        ('researcher', 'Researcher'),
        ('user', 'User'), 
    ]
    
    email = models.EmailField(
        unique=True,
        error_messages={
            'unique': "A user with that email already exists.",
        }
    )

    first_name = models.CharField(max_length=30)  
    sur_name = models.CharField(max_length=30) 
    #username = models.CharField(max_length=30)
    phone_number = models.CharField(max_length=15, unique=True, blank=True, null=True) 
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    field = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    
    #TODO PROFILE PIC 
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    # Email is used as primary field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self):
        return self.email

    def is_admin(self):
        return self.role == 'admin'

    def is_contributor(self):
        return self.role == 'contributor'

    def is_researcher(self):
        return self.role == 'researcher'
