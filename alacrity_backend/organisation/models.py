from django.db import models
from nanoid import generate
from django.core.validators import MinLengthValidator, MaxLengthValidator, URLValidator

def generate_id():
    return generate(size=10)

# creating a model for the organization table
# this model will be used to create the organization table in the database 
# the organization table will store the details of the organization which will be linked to the user table
class Organization(models.Model):
    Organization_id = models.CharField(max_length=10, primary_key=True, default=generate_id, editable=False)  
    name = models.e = models.CharField(
        max_length=100, 
        validators=[
            MinLengthValidator(1), 
            MaxLengthValidator(100)
        ]
    )
    description = models.TextField( 
        validators=[MinLengthValidator(10)])
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
