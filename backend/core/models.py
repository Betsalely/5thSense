from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Possible roles of a user
    ROLE_CHOICES = (
        ('superadmin', 'Superadmin'), # Super admin may create admin accounts
        ('admin', 'Admin'),
    )

    user_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='admin')

    def save(self, *args, **kwargs):
        # Sync user roles with Django built-in permission flags
        if self.user_role == 'superadmin':
            self.is_superuser = True
            self.is_staff = True
        elif self.user_role == 'admin':
            self.is_superuser = False
            self.is_staff = True
        super().save(*args, **kwargs)
