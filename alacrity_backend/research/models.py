from django.db import models
from django.conf import settings
from nanoid import generate

def generate_id():
    return generate(size=10)

class AnalysisSubmission(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
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
 
    dataset = models.ForeignKey(
        'datasets.Dataset', 
        on_delete=models.PROTECT,  # Prevents deletion if dataset has related submissions
        related_name='submissions',
        null=True,  # Allows dataset to be NULL if deleted
        blank=True
    )

    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='draft'
    )
    bookmarked_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="bookmarked_submissions", blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    image = models.ImageField(upload_to="submission_images/", null=True, blank=True)

    # For private/public status
    is_private = models.BooleanField(default=False)

    def is_deleted(self):
        return self.deleted_at is not None

    def __str__(self):
        return f"{self.title[:50]} - {self.researcher.email} ({self.status})"  

class PublishedResearch(models.Model):
    research_submission = models.OneToOneField(
        AnalysisSubmission, 
        on_delete=models.CASCADE, 
        related_name="published_research"
    )
    visibility = models.CharField(max_length=20, choices=[('public', 'Public'), ('private', 'Private')], default='public')
    tags = models.JSONField(default=list)  # Store tags as a JSON array
    likes_count = models.PositiveIntegerField(default=0)
    bookmarks_count = models.PositiveIntegerField(default=0)
    is_private = models.BooleanField(default=False)

    def __str__(self):
        return f"Published Research for {self.research_submission.title}"
