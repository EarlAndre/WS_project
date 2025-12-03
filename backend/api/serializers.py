from rest_framework import serializers
from .models import Seminar

class SeminarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seminar
        fields = '__all__'
