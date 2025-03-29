from django.db import models
from django.db import models
from users.models import User
from datasets.models import Dataset  # Adjust the import path based on your project structure
from nanoid import generate

# generate_id function to generate a unique request_id
def generate_id():
    return generate(size=10)

class DatasetRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
    )
    request_id = models.CharField(max_length=100, primary_key=True, default=generate_id, editable=False)
    dataset_id = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name='requests')
    researcher_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    request_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='updated_requests', null=True, blank=True)
    


def __str__(self):
        return f"{self.user_id.first_name} {self.user_id.sur_name} - {self.dataset_id.title}"
