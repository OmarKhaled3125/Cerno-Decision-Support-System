from django.db import models
from django.contrib.auth.models import User
import secrets
import string
from django.utils import timezone

class OTPCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        # Valid for 10 minutes
        return timezone.now() < self.created_at + timezone.timedelta(minutes=10)

    @staticmethod
    def generate_code():
        # Secure random number generation
        return ''.join(secrets.choice(string.digits) for _ in range(6))
