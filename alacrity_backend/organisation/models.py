from django.db import models
from nanoid import generate
from django.core.validators import MinLengthValidator, MaxLengthValidator, URLValidator
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

def generate_id():
    return generate(size=10)

class Organization(models.Model):
    Organization_id = models.CharField(max_length=10, primary_key=True, default=generate_id, editable=False)  
    name = models.CharField(
        max_length=100, 
        validators=[
            MinLengthValidator(1), 
            MaxLengthValidator(100)
        ]
    )
    description = models.TextField(validators=[MinLengthValidator(10)])
    email = models.EmailField(
        unique=True,
        error_messages={
            'unique': "An organisation with that email already exists.",
        }
    )
    phone = models.CharField(max_length=15, unique=True, blank=True, null=True) 
    address = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Organization")
        verbose_name_plural = _("Organizations")


#this has been commented out because it is not needed
# it has been implemented in the user's table 
# DRY principle
# class Contributor(models.Model):
#     ROLE_CHOICES = [
#         ('contributor', 'Contributor'),
#         ('organization_admin', 'Organization Admin'),
#     ]
    
#     contributor_id = models.CharField(
#         max_length=10, 
#         primary_key=True, 
#         default=generate_id, 
#         editable=False
#     )
#     first_name = models.CharField(max_length=30)
#     last_name = models.CharField(max_length=30)
#     email = models.EmailField(
#         unique=True,
#         error_messages={
#             'unique': _("A contributor with that email already exists."),
#         }
#     )
#     phone = models.CharField(max_length=15, unique=True, blank=True, null=True)
#     organization = models.ForeignKey('Organization', on_delete=models.CASCADE)
#     role = models.CharField(
#         max_length=20, 
#         choices=ROLE_CHOICES, 
#         default='contributor'
#     )
#     password = models.CharField(max_length=128)  # Increased length for hashed passwords
#     profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def save(self, *args, **kwargs):
#         # Ensure password is hashed before saving
#         if self.pk is None or not self.password.startswith('pbkdf2_'):
#             self.password = make_password(self.password)
#         super().save(*args, **kwargs)
    
#     class Meta:
#         ordering = ['first_name', 'last_name']
#         verbose_name = _("Contributor")
#         verbose_name_plural = _("Contributors")

#     def __str__(self):
#         return f"{self.first_name} {self.last_name} - {self.organization.name}"
