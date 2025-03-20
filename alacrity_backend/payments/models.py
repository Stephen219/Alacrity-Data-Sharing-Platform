from django.db import models
from datasets.models import Dataset
from users.models import User
from django.conf import settings

class PendingPayment(models.Model):
    """
    Stores a link between a PayPal paymentId and
    the user/dataset who initiated the payment, to
    securely retrieve them when PayPal calls back.
    """
    paypal_payment_id = models.CharField(max_length=255, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PendingPayment {self.paypal_payment_id} for {self.user.email}"

class DatasetPurchase(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
    buyer = models.ForeignKey(User, on_delete=models.CASCADE)
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('dataset', 'buyer')

    def __str__(self):
        return f"{self.buyer.email} purchased {self.dataset.title}"
