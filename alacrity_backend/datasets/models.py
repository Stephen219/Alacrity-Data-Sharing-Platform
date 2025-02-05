from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, URLValidator
from nanoid import generate


def generate_id():
    return generate(size=10)

## This is the model for the dataset table in the database holding the dataset information.
class Dataset(models.Model):
    id = models.CharField(max_length=10, primary_key=True, default=generate_id, editable=False)
   #orgid = models.ForeignKey(Organization, on_delete=models.CASCADE) this is the foreign key to the organization table it will be uncommented when the organization table is created
   #uploaderid = models.ForeignKey(User, on_delete=models.CASCADE) this is the foreign key to the user table it will be uncommented when the user table is created 
    title = models.CharField(
        max_length=100, 
        validators=[
            MinLengthValidator(1), 
            MaxLengthValidator(100)
        ]
    )
    category = models.CharField(
        max_length=255, 
        validators=[MinLengthValidator(1)]
    )
    link = models.CharField(
        max_length=255, 
        validators=[URLValidator()]
    )
    description = models.TextField(
        validators=[MinLengthValidator(10)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['title', 'link']  # Ensure unique combination of title and link

        
    def __str__(self):
        return self.name


# TODO add organisation and user id to the dataset