from django.contrib import admin
from .models import Seminar, Attendance, JoinedParticipant, Certificate, Evaluation


@admin.register(Seminar)
class SeminarAdmin(admin.ModelAdmin):
    list_display = ('title', 'speaker', 'date', 'capacity', 'duration', 'created_at')
    list_filter = ('date', 'created_at')
    search_fields = ('title', 'speaker')
    ordering = ('-created_at',)


@admin.register(JoinedParticipant)
class JoinedParticipantAdmin(admin.ModelAdmin):
    list_display = ('participant_email', 'participant_name', 'seminar', 'joined_at', 'present')
    list_filter = ('seminar', 'joined_at', 'present')
    search_fields = ('participant_email', 'participant_name')
    ordering = ('-joined_at',)


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('participant_email', 'seminar', 'time_in', 'time_out', 'created_at')
    list_filter = ('seminar', 'created_at')
    search_fields = ('participant_email',)
    ordering = ('-created_at',)


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ('participant_email', 'seminar', 'created_at')
    list_filter = ('seminar', 'created_at')
    search_fields = ('participant_email',)
    ordering = ('-created_at',)


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('participant_email', 'participant_name', 'seminar', 'certificate_number', 'issued_at')
    list_filter = ('seminar', 'issued_at')
    search_fields = ('participant_email', 'certificate_number')
    ordering = ('-issued_at',)
