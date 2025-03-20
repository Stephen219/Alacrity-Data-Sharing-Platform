from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    link = models.URLField(blank=True, null=True)

    def mark_as_read(self):
        self.is_read = True
        self.save()
    
    def __str__(self):
        return f"Notification for {self.user.email}: {self.message[:50]}"
