from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q
from django.core.cache import cache

from tasks.models import Task
from projects.models import Project, ProjectMember


class DashboardView(APIView):
    """
    GET /api/dashboard/
    Returns aggregated task stats for all projects the current user belongs to.

    Performance strategy (from System Design v2, Fix 3):
      1. Single SQL query with conditional COUNT (no multiple round-trips)
      2. Result cached per user for 60 seconds — reduces DB load ~60x for active users
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache_key = f"dashboard_{request.user.id}"
        data      = cache.get(cache_key)

        if data is None:
            data = self._compute_stats(request.user)
            cache.set(cache_key, data, timeout=60)   # 60-second TTL per user

        return Response({
            "status":  "success",
            "message": "Dashboard stats retrieved.",
            "data":    data,
        })

    def _compute_stats(self, user):
        today = timezone.now().date()

        # --- Global summary (one query with conditional COUNTs) ---
        # Q objects let us add WHERE conditions inside a COUNT — no subqueries needed
        summary = Task.objects.filter(
            project__memberships__user=user
        ).aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='DONE')),
            in_progress=Count('id', filter=Q(status='IN_PROGRESS')),
            overdue=Count('id', filter=Q(due_date__lt=today) & ~Q(status='DONE')),
        )

        total     = summary['total'] or 0
        completed = summary['completed'] or 0

        # --- Tasks assigned specifically to this user ---
        my_tasks = Task.objects.filter(assigned_to=user).aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='DONE')),
            overdue=Count('id', filter=Q(due_date__lt=today) & ~Q(status='DONE')),
        )

        # --- Per-project breakdown (one query with GROUP BY) ---
        by_project = (
            Task.objects
            .filter(project__memberships__user=user)
            .values('project_id', 'project__name')          # GROUP BY these fields
            .annotate(
                total=Count('id'),
                completed=Count('id', filter=Q(status='DONE')),
                overdue=Count('id', filter=Q(due_date__lt=today) & ~Q(status='DONE')),
            )
            .order_by('project__name')
        )

        return {
            "summary": {
                "total_tasks":      total,
                "completed_tasks":  completed,
                "in_progress_tasks": summary['in_progress'] or 0,
                "overdue_tasks":    summary['overdue'] or 0,
                # Computed in Python — round to nearest integer
                "completion_rate":  round((completed / total * 100) if total > 0 else 0),
            },
            "my_assigned_tasks": {
                "total":     my_tasks['total'] or 0,
                "completed": my_tasks['completed'] or 0,
                "overdue":   my_tasks['overdue'] or 0,
            },
            "by_project": [
                {
                    "project_id":   row['project_id'],
                    "project_name": row['project__name'],
                    "total":        row['total'],
                    "completed":    row['completed'],
                    "overdue":      row['overdue'],
                }
                for row in by_project
            ],
        }
