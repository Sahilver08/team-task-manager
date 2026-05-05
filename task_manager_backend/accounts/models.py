from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user  = self.model(email=email, full_name=full_name)
        user.set_password(password)   # hashes with PBKDF2 — never stores plaintext
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password):
        user              = self.create_user(email, full_name, password)
        user.is_staff     = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model using email as the login identifier.
    Must be defined BEFORE the first migration and referenced in
    settings.py → AUTH_USER_MODEL = 'accounts.User'.
    """
    email       = models.EmailField(unique=True)
    full_name   = models.CharField(max_length=255)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD  = 'email'        # login field
    REQUIRED_FIELDS = ['full_name']  # prompted by createsuperuser command

    objects = UserManager()

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email
