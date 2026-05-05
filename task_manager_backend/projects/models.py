from django.conf import settings
from django.db import models


class Project(models.Model):
    name        = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    created_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_projects'
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)     # auto-set on every save

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    class Role(models.TextChoices):
        ADMIN  = 'ADMIN',  'Admin'
        MEMBER = 'MEMBER', 'Member'

    project   = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='memberships')
    user      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    role      = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_members'
        # DB-level uniqueness: one membership row per (project, user) pair
        unique_together = [('project', 'user')]
        indexes = [
            models.Index(fields=['project', 'user']),  # membership existence check
            models.Index(fields=['user']),              # "my projects" query
        ]

    def __str__(self):
        return f"{self.user.email} → {self.project.name} [{self.role}]"
