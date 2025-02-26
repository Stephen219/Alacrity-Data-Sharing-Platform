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

#
