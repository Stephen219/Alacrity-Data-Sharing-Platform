"""
This file contains the models for the database. The models are used to create the tables in the databasee
this is a test model for the root applicstion
it can be deleted
"""
from django.db import models
from nanoid import generate
from django.core.validators import MinLengthValidator, MaxLengthValidator, URLValidator

# function to generate a unique id for the test model
def generate_id():
    return generate(size=10)

class Test(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)



    def __str__(self):
        return self.name


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