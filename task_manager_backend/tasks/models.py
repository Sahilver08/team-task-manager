from django.conf import settings
from django.db import models


class Task(models.Model):

    class Status(models.TextChoices):
        TODO        = 'TODO',        'To Do'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        IN_REVIEW   = 'IN_REVIEW',   'In Review'
        DONE        = 'DONE',        'Done'

    class Priority(models.TextChoices):
        LOW    = 'LOW',    'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH   = 'HIGH',   'High'

    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')

    project     = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='tasks')
    created_by  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tasks')
    # SET_NULL: if the assignee's account is deleted, the task remains (just unassigned)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_tasks',
    )

    status   = models.CharField(max_length=20, choices=Status.choices,   default=Status.TODO)
    priority = models.CharField(max_length=10, choices=Priority.choices,  default=Priority.MEDIUM)
    due_date = models.DateField(null=True, blank=True)

    # Optimistic locking field (from System Design v2, Fix 1)
    # Sent by client on every PATCH; backend rejects if it doesn't match current DB value
    version = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']
        indexes  = [
            # Powers the Kanban board — most common query
            models.Index(fields=['project', 'status'],   name='idx_task_project_status'),
            # Powers "my tasks" filter
            models.Index(fields=['assigned_to'],         name='idx_task_assigned_to'),
            # Powers overdue detection on dashboard
            models.Index(fields=['due_date', 'status'], name='idx_task_due_status'),
        ]

    def __str__(self):
        return f"[{self.status}] {self.title}"


class TaskComment(models.Model):
    task       = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    content    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'task_comments'
        ordering = ['created_at']
        indexes  = [
            models.Index(fields=['task'], name='idx_comment_task'),
        ]

    def __str__(self):
        return f"Comment by {self.author.email} on Task {self.task_id}"
