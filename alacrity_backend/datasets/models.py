from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, URLValidator
from nanoid import generate
from organisation.models import Organization
from users.models import User


def generate_id():
    return generate(size=10)

class Dataset(models.Model):
    dataset_id = models.CharField(max_length=100, primary_key=True, default=generate_id , editable=False)
    # orgid = models.ForeignKey(Organization, on_delete=models.CASCADE)  
    # techinically an uploader has to be in an organization hence the uploaderid is the organization id
    contributor_id = models.ForeignKey(User, on_delete=models.CASCADE , related_name='contributor_id', default="1")
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
    encryption_key = models.CharField(max_length=255),
    encrypted_numerical_data = models.JSONField(default=list)
    fhe_context = models.JSONField(default=list)
    
    description = models.TextField(
        validators=[MinLengthValidator(10)]
    )


    tags = models.JSONField(default=list)
    description = models.TextField()
    encryption_key = models.CharField(max_length=255)  
    schema = models.JSONField()  


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    

    class Meta:
        unique_together = ['title', 'link'] 

        
    def __str__(self):
        return self.title  
    
    @property
    def contributor_name(self):
        """Returns the full name of the contributor."""
        return f"{self.contributor_id.first_name} {self.contributor_id.last_name}".strip()

    @property
    def organization_name(self):
        """Returns the name of the organization, if it exists."""
        return self.contributor_id.organization.name if self.contributor_id.organization else "No organization"