from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, URLValidator
from nanoid import generate


def generate_id():
    return generate(size=10)

## This is the model for the dataset table in the database holding the dataset information.
class Dataset(models.Model):
    dataset_id = models.CharField(max_length=10, primary_key=True, default=generate_id , editable=False)
    # orgid = models.ForeignKey(Organization, on_delete=models.CASCADE)  # Foreign key to the Organization table, uncomment when Organization model is created
    # uploaderid = models.ForeignKey(User, on_delete=models.CASCADE)  # Foreign key to the User table, uncomment when User model is created
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
    analysis_link = models.CharField(
        max_length=255, 
        validators=[URLValidator()],
        default= None, 
        blank=True,
        null=True
    )
    description = models.TextField(
        validators=[MinLengthValidator(10)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['title', 'link'] 

        
    def __str__(self):
        return self.title  # Corrected from self.name to self.title
