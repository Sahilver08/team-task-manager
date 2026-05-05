from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import Task, TaskComment
from .serializers import (
    TaskSerializer, TaskListSerializer, TaskCreateSerializer,
    TaskUpdateSerializer, TaskStatusUpdateSerializer, TaskCommentSerializer,
)
from core.permissions import IsProjectMember, IsProjectAdmin, IsProjectAdminOrReadOnly
from projects.models import ProjectMember
from notifications.models import Notification


# ── Task views ────────────────────────────────────────────────────────────────

class TaskListCreateView(APIView):
    """
    GET  /api/projects/<project_id>/tasks/  → list tasks (with filters)
    POST /api/projects/<project_id>/tasks/  → create task (admin only)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsProjectAdmin()]

    def get(self, request, project_id):
        queryset = (
            Task.objects
            .filter(project_id=project_id)
            # select_related loads FK rows in a single JOIN query — prevents N+1
            .select_related('assigned_to', 'created_by')
        )

        # --- Filtering ---
        task_status = request.query_params.get('status')
        priority    = request.query_params.get('priority')
        assigned_to = request.query_params.get('assigned_to')

        if task_status:
            queryset = queryset.filter(status=task_status)
        if priority:
            queryset = queryset.filter(priority=priority)
        if assigned_to == 'me':
            queryset = queryset.filter(assigned_to=request.user)
        elif assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)

        # Use the pagination class from settings (StandardPagination)
        from core.pagination import StandardPagination
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = TaskListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @transaction.atomic
    def post(self, request, project_id):
        serializer = TaskCreateSerializer(
            data=request.data,
            context={'request': request, 'project_id': project_id},
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save(project_id=project_id, created_by=request.user)

        if task.assigned_to and task.assigned_to != request.user:
            Notification.objects.create(
                user=task.assigned_to,
                message=f"{request.user.full_name} assigned you to a new task: {task.title}"
            )

        return Response({
            "status":  "success",
            "message": "Task created successfully.",
            "data":    TaskSerializer(task).data,
        }, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    """
    GET    /api/projects/<project_id>/tasks/<task_id>/  → full detail with comments
    DELETE /api/projects/<project_id>/tasks/<task_id>/  → admin only
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsProjectAdmin()]

    def _get_task(self, project_id, task_id):
        return get_object_or_404(
            Task.objects
            .select_related('assigned_to', 'created_by')
            .prefetch_related('comments__author'),   # load comments + their authors in 2 queries total
            pk=task_id,
            project_id=project_id,
        )

    def get(self, request, project_id, task_id):
        task = self._get_task(project_id, task_id)
        return Response({
            "status":  "success",
            "message": "Task retrieved.",
            "data":    TaskSerializer(task).data,
        })

    def delete(self, request, project_id, task_id):
        task = self._get_task(project_id, task_id)
        task.delete()
        return Response({"status": "success", "message": "Task deleted."})


class TaskUpdateView(APIView):
    """
    PATCH /api/projects/<project_id>/tasks/<task_id>/
    - Admin  → can update any field
    - Member → can only update 'status' on tasks assigned to them
    Both paths require the version field (optimistic locking).
    """
    permission_classes = [IsAuthenticated, IsProjectMember]

    def patch(self, request, project_id, task_id):
        task = get_object_or_404(Task, pk=task_id, project_id=project_id)

        is_admin = ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
            role=ProjectMember.Role.ADMIN,
        ).exists()

        if is_admin:
            # Admin can update any field
            serializer = TaskUpdateSerializer(
                task,
                data=request.data,
                partial=True,
                context={'project_id': project_id},
            )
        else:
            # Member can only update status on their own assigned tasks
            if task.assigned_to != request.user:
                return Response({
                    "status":  "error",
                    "code":    "FORBIDDEN",
                    "message": "You can only update tasks assigned to you.",
                }, status=status.HTTP_403_FORBIDDEN)
            serializer = TaskStatusUpdateSerializer(task, data=request.data, partial=True)

        old_assigned_to = task.assigned_to

        serializer.is_valid(raise_exception=True)
        task = serializer.save()

        if is_admin and task.assigned_to and task.assigned_to != old_assigned_to and task.assigned_to != request.user:
            Notification.objects.create(
                user=task.assigned_to,
                message=f"{request.user.full_name} assigned you to a task: {task.title}"
            )

        return Response({
            "status":  "success",
            "message": "Task updated.",
            "data":    TaskListSerializer(task).data,
        })


# ── Comment views ─────────────────────────────────────────────────────────────

class CommentListCreateView(APIView):
    """
    GET  /api/projects/<project_id>/tasks/<task_id>/comments/
    POST /api/projects/<project_id>/tasks/<task_id>/comments/
    Any project member can read and write comments.
    """
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request, project_id, task_id):
        task     = get_object_or_404(Task, pk=task_id, project_id=project_id)
        comments = task.comments.select_related('author').all()
        return Response({
            "status": "success",
            "data":   {"results": TaskCommentSerializer(comments, many=True).data},
        })

    def post(self, request, project_id, task_id):
        task       = get_object_or_404(Task, pk=task_id, project_id=project_id)
        serializer = TaskCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(task=task, author=request.user)
        return Response({
            "status":  "success",
            "message": "Comment added.",
            "data":    TaskCommentSerializer(comment).data,
        }, status=status.HTTP_201_CREATED)
