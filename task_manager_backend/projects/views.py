from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Count

from .models import Project, ProjectMember
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer, ProjectCreateUpdateSerializer,
    ProjectMemberSerializer, AddMemberSerializer, UpdateMemberRoleSerializer,
)
from core.permissions import IsProjectMember, IsProjectAdmin


# ── Project views ─────────────────────────────────────────────────────────────

class ProjectListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/projects/  → list projects the current user belongs to
    POST /api/projects/  → create a new project (creator auto-becomes ADMIN)
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectCreateUpdateSerializer
        return ProjectListSerializer

    def get_queryset(self):
        return (
            Project.objects
            .filter(memberships__user=self.request.user)
            # One SQL query annotates member_count and task_count
            .annotate(
                member_count=Count('memberships', distinct=True),
                task_count=Count('tasks', distinct=True),
            )
            # Pre-load memberships so get_my_role() doesn't cause N+1
            .prefetch_related('memberships')
        )

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = ProjectCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save(created_by=request.user)

        # Creator is automatically the first ADMIN — one transaction covers both inserts
        ProjectMember.objects.create(
            project=project,
            user=request.user,
            role=ProjectMember.Role.ADMIN,
        )

        # Return the full project object using the list serializer
        out = ProjectListSerializer(
            Project.objects.annotate(
                member_count=Count('memberships', distinct=True),
                task_count=Count('tasks', distinct=True),
            ).prefetch_related('memberships').get(pk=project.pk),
            context={'request': request},
        )
        return Response({
            "status":  "success",
            "message": "Project created successfully.",
            "data":    out.data,
        }, status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    """
    GET    /api/projects/<project_id>/  → project detail (members included)
    PATCH  /api/projects/<project_id>/  → update name/description (admin only)
    DELETE /api/projects/<project_id>/  → delete project + cascade (admin only)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsProjectAdmin()]

    def _get_project(self, project_id):
        return get_object_or_404(Project, pk=project_id)

    def get(self, request, project_id):
        project = self._get_project(project_id)
        data = ProjectDetailSerializer(project, context={'request': request}).data
        return Response({"status": "success", "message": "Project retrieved.", "data": data})

    def patch(self, request, project_id):
        project    = self._get_project(project_id)
        serializer = ProjectCreateUpdateSerializer(project, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"status": "success", "message": "Project updated.", "data": serializer.data})

    def delete(self, request, project_id):
        project = self._get_project(project_id)
        project.delete()   # CASCADE removes all tasks + memberships via DB
        return Response({"status": "success", "message": "Project deleted."})


# ── Member views ──────────────────────────────────────────────────────────────

class ProjectMemberListView(APIView):
    """
    GET  /api/projects/<project_id>/members/   → list members
    POST /api/projects/<project_id>/members/   → add member by email (admin only)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsProjectAdmin()]

    def get(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)
        members = project.memberships.select_related('user').all()
        data    = ProjectMemberSerializer(members, many=True).data
        return Response({"status": "success", "data": {"results": data}})

    @transaction.atomic
    def post(self, request, project_id):
        project    = get_object_or_404(Project, pk=project_id)
        serializer = AddMemberSerializer(data=request.data, context={'project': project})
        serializer.is_valid(raise_exception=True)

        user   = serializer.get_user()
        role   = serializer.validated_data['role']
        member = ProjectMember.objects.create(project=project, user=user, role=role)

        return Response({
            "status":  "success",
            "message": f"{user.email} added to the project.",
            "data":    ProjectMemberSerializer(member).data,
        }, status=status.HTTP_201_CREATED)


class ProjectMemberDetailView(APIView):
    """
    PATCH  /api/projects/<project_id>/members/<user_id>/  → change role (admin only)
    DELETE /api/projects/<project_id>/members/<user_id>/  → remove member (admin only)
    """
    permission_classes = [IsAuthenticated, IsProjectAdmin]

    def _get_membership(self, project_id, user_id):
        return get_object_or_404(ProjectMember, project_id=project_id, user_id=user_id)

    def patch(self, request, project_id, user_id):
        membership = self._get_membership(project_id, user_id)
        serializer = UpdateMemberRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        membership.role = serializer.validated_data['role']
        membership.save()
        return Response({
            "status":  "success",
            "message": f"{membership.user.full_name}'s role updated to {membership.role}.",
        })

    @transaction.atomic
    def delete(self, request, project_id, user_id):
        membership = self._get_membership(project_id, user_id)

        # Guard: cannot remove the last admin — project would become unmanageable
        is_last_admin = (
            membership.role == ProjectMember.Role.ADMIN
            and ProjectMember.objects.filter(
                project_id=project_id,
                role=ProjectMember.Role.ADMIN
            ).count() == 1
        )
        if is_last_admin:
            return Response({
                "status":  "error",
                "code":    "VALIDATION_ERROR",
                "message": "Cannot remove the last admin. Assign another admin first.",
            }, status=status.HTTP_400_BAD_REQUEST)

        membership.delete()
        return Response({"status": "success", "message": "Member removed from project."})
