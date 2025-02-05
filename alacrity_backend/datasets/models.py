from django.db import models
from nanoid import generate


def generate_id():
    return generate(size=10)

## This is the model for the dataset table in the database holding the dataset information.
class Dataset(models.Model):
    id = models.TextField(max_length=10, primary_key=True, default=generate_id, editable=False)
   #orgid = models.ForeignKey(Organization, on_delete=models.CASCADE) this is the foreign key to the organization table it will be uncommented when the organization table is created
   #uploaderid = models.ForeignKey(User, on_delete=models.CASCADE) this is the foreign key to the user table it will be uncommented when the user table is created 
    title = models.TextField(max_length=100, null=False)
    category = models.TextField(max_length=255, null=False)
    link = models.TextField(max_length=255, null=False)
    description = models.TextField(null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return self.name


# TODO add organisation and user id to the dataset