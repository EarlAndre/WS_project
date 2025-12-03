from django.db import models

# Create your models here.
class Seminar(models.Model):
	title = models.CharField(max_length=255)
	duration = models.IntegerField(null=True, blank=True)
	speaker = models.CharField(max_length=255, null=True, blank=True)
	capacity = models.IntegerField(null=True, blank=True)
	date = models.DateField(null=True, blank=True)
	start_time = models.CharField(max_length=32, null=True, blank=True)
	end_time = models.CharField(max_length=32, null=True, blank=True)
	start_datetime = models.DateTimeField(null=True, blank=True)
	end_datetime = models.DateTimeField(null=True, blank=True)
	questions = models.JSONField(null=True, blank=True)
	metadata = models.JSONField(null=True, blank=True)
	certificate_template_url = models.URLField(max_length=1024, null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"{self.title} ({self.date})"
