from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health-check'),
    path('seminars/', views.seminars, name='seminars'),
    path('seminars/<int:seminar_id>/', views.seminars, name='seminar-detail'),
    path('participants/', views.participants, name='participants'),
    path('attendance/scan/', views.scan_attendance, name='scan-attendance'),
]
