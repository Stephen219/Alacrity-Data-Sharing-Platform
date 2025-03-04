from django.db import models
from django.conf import settings
from nanoid import generate

def generate_id():
    return generate(size=10)

class AnalysisSubmission(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    researcher = models.ForeignKey(
        settings.AUTH_USER_MODEL,  
        on_delete=models.CASCADE
    )
    title = models.TextField(blank=True, null=True) 
    description = models.TextField(blank=True, null=True)  
    raw_results = models.TextField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='draft'
    )
    bookmarked_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="bookmarked_submissions", blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    image = models.ImageField(upload_to="submission_images/", null=True, blank=True)

    def is_deleted(self):
        return self.deleted_at is not None

    def __str__(self):
        return f"{self.title[:50]} - {self.researcher.email} ({self.status})"  
