from django.db import models

class Scenario(models.Model):
    input_text = models.TextField()
    analysis_result = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.input_text[:50]
