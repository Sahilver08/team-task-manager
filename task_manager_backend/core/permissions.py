from rest_framework.permissions import BasePermission
from projects.models import ProjectMember


class IsProjectMember(BasePermission):
    """
    Allows access to any user who is a member of the project
    (regardless of role). Gets project_id from URL kwargs.
    """
    message = "You are not a member of this project."

    def has_permission(self, request, view):
        project_id = view.kwargs.get('project_id')
        if not project_id:
            return False
        # .exists() is the most efficient check — no data fetched, just COUNT(1)
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user
        ).exists()


class IsProjectAdmin(BasePermission):
    """
    Allows access only to users with ADMIN role in this project.
    Used for destructive / write operations.
    """
    message = "You must be a project admin to perform this action."

    def has_permission(self, request, view):
        project_id = view.kwargs.get('project_id')
        if not project_id:
            return False
        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
            role=ProjectMember.Role.ADMIN
        ).exists()


class IsProjectAdminOrReadOnly(BasePermission):
    """
    GET/HEAD/OPTIONS → any project member can access.
    POST/PUT/PATCH/DELETE → only project admins.
    Used on list views where reading is open but writing is restricted.
    """
    SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')
    message = "Only project admins can perform write operations."

    def has_permission(self, request, view):
        project_id = view.kwargs.get('project_id')
        if not project_id:
            return False

        if request.method in self.SAFE_METHODS:
            return ProjectMember.objects.filter(
                project_id=project_id,
                user=request.user
            ).exists()

        return ProjectMember.objects.filter(
            project_id=project_id,
            user=request.user,
            role=ProjectMember.Role.ADMIN
        ).exists()
