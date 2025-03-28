
from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, URLValidator
from nanoid import generate
from organisation.models import Organization
from users.models import User
from django.conf import settings

def generate_id():
    return generate(size=10)

class Dataset(models.Model):
    dataset_id = models.CharField(max_length=100, primary_key=True, default=generate_id, editable=False)
    contributor_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='datasets')
    title = models.CharField(max_length=100, validators=[MinLengthValidator(1), MaxLengthValidator(100)])
    category = models.CharField(max_length=255, validators=[MinLengthValidator(1)])
    link = models.CharField(max_length=255, validators=[URLValidator()])
    analysis_link = models.CharField(max_length=255, validators=[URLValidator()], blank=True, null=True)
    encryption_key = models.CharField(max_length=255)
    encrypted_numerical_data = models.JSONField(default=list)
    fhe_context = models.JSONField(default=list)
    description = models.TextField(validators=[MinLengthValidator(10)])
    tags = models.JSONField(default=list)
    schema = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    bookmarked_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="bookmarked_datasets", blank=True)


    view_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        unique_together = ['title', 'link']

    def __str__(self):
        return self.title

    @property
    def contributor_name(self):
        """Returns the full name of the contributor."""
        if self.contributor_id:
            return f"{self.contributor_id.first_name} {self.contributor_id.sur_name}".strip()
        return "Unknown Contributor"

    @property
    def organization_name(self):
        """Returns the name of the organization via the contributor's organization."""
        if self.contributor_id and self.contributor_id.organization:
            return self.contributor_id.organization.name
        return "No Organization"