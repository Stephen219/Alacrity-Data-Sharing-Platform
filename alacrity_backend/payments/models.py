from django.db import models
from datasets.models import Dataset
from users.models import User

class DatasetPurchase(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
    buyer = models.ForeignKey(User, on_delete=models.CASCADE)
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('dataset', 'buyer')

    def __str__(self):
        return f"{self.buyer.email} purchased {self.dataset.title}"
