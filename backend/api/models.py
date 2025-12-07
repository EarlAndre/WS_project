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
	semester = models.CharField(max_length=10, null=True, blank=True, default="1")
	questions = models.JSONField(null=True, blank=True)
	metadata = models.JSONField(null=True, blank=True)
	certificate_template_url = models.URLField(max_length=1024, null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"{self.title} ({self.date})"


class JoinedParticipant(models.Model):
	seminar = models.ForeignKey(Seminar, on_delete=models.CASCADE, related_name='joined_participants')
	participant_email = models.EmailField()
	participant_name = models.CharField(max_length=255, null=True, blank=True)
	metadata = models.JSONField(null=True, blank=True)
	joined_at = models.DateTimeField(auto_now_add=True)
	present = models.BooleanField(default=False)
	check_in = models.DateTimeField(null=True, blank=True)
	check_out = models.DateTimeField(null=True, blank=True)

	def __str__(self):
		return f"{self.participant_email} - {self.seminar.title}"

	class Meta:
		unique_together = ('seminar', 'participant_email')


class Attendance(models.Model):
	seminar = models.ForeignKey(Seminar, on_delete=models.CASCADE, related_name='attendance')
	participant_email = models.EmailField()
	time_in = models.DateTimeField(null=True, blank=True)
	time_out = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.participant_email} - {self.seminar.title}"

	class Meta:
		unique_together = ('seminar', 'participant_email')


class Evaluation(models.Model):
	seminar = models.ForeignKey(Seminar, on_delete=models.CASCADE, related_name='evaluations')
	participant_email = models.EmailField()
	answers = models.JSONField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Evaluation - {self.participant_email} ({self.seminar.title})"

	class Meta:
		unique_together = ('seminar', 'participant_email')


class Certificate(models.Model):
	seminar = models.ForeignKey(Seminar, on_delete=models.CASCADE, related_name='certificates')
	participant_email = models.EmailField()
	participant_name = models.CharField(max_length=255, null=True, blank=True)
	file_url = models.URLField(max_length=1024, null=True, blank=True)
	issued_at = models.DateTimeField(auto_now_add=True)
	certificate_number = models.CharField(max_length=255, unique=True)

	def __str__(self):
		return f"Certificate - {self.participant_email} ({self.seminar.title})"

	class Meta:
		unique_together = ('seminar', 'participant_email')
