#!/usr/bin/env python
"""
Script to create a Django superuser for admin access.
Run: python create_superuser.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

# Create superuser if it doesn't exist
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    print('✓ Superuser "admin" created successfully!')
    print('  Email: admin@example.com')
    print('  Password: admin')
    print('  Access: http://localhost:8000/admin/')
else:
    print('✓ Superuser "admin" already exists')
    print('  Access: http://localhost:8000/admin/')
