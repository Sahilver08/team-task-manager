from rest_framework import serializers
from django.utils import timezone

from .models import Task, TaskComment
from accounts.serializers import UserBriefSerializer


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserBriefSerializer(read_only=True)

    class Meta:
        model  = TaskComment
        fields = ['id', 'content', 'author', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    """
    Full task representation — used for list and detail responses.
    is_overdue is computed in Python (not stored in DB) to stay always accurate.
    """
    assigned_to = UserBriefSerializer(read_only=True)
    created_by  = UserBriefSerializer(read_only=True)
    is_overdue  = serializers.SerializerMethodField()
    comments    = TaskCommentSerializer(many=True, read_only=True)   # only on detail view

    class Meta:
        model  = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'due_date', 'is_overdue', 'version',
            'assigned_to', 'created_by',
            'created_at', 'updated_at',
            'comments',
        ]

    def get_is_overdue(self, obj):
        if obj.due_date and obj.status != Task.Status.DONE:
            return obj.due_date < timezone.now().date()
        return False


class TaskListSerializer(TaskSerializer):
    """Excludes comments for list view — avoids loading all comments per task."""
    class Meta(TaskSerializer.Meta):
        fields = [f for f in TaskSerializer.Meta.fields if f != 'comments']


class TaskCreateSerializer(serializers.ModelSerializer):
    """
    Used for POST. assigned_to_id lets the client send an integer ID.
    Validation ensures the assignee is a project member.
    """
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model  = Task
        fields = ['title', 'description', 'status', 'priority', 'due_date', 'assigned_to_id']

    def validate_due_date(self, value):
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Due date cannot be in the past.")
        return value

    def validate_assigned_to_id(self, value):
        if value is None:
            return value
        # Ensure the assignee is a member of the project
        project_id = self.context.get('project_id')
        from projects.models import ProjectMember
        if not ProjectMember.objects.filter(project_id=project_id, user_id=value).exists():
            raise serializers.ValidationError("Assignee must be a member of this project.")
        return value


class TaskUpdateSerializer(serializers.ModelSerializer):
    """
    Used for PATCH.
    - version field implements optimistic locking.
    - assigned_to_id lets the client change the assignee.
    """
    version        = serializers.IntegerField()
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model  = Task
        fields = ['title', 'description', 'status', 'priority', 'due_date', 'assigned_to_id', 'version']

    def validate_assigned_to_id(self, value):
        if value is None:
            return value
        project_id = self.context.get('project_id')
        from projects.models import ProjectMember
        if not ProjectMember.objects.filter(project_id=project_id, user_id=value).exists():
            raise serializers.ValidationError("Assignee must be a member of this project.")
        return value

    def validate(self, data):
        # Optimistic lock check — if version doesn't match, someone else has edited the task
        if self.instance and self.instance.version != data.get('version'):
            from core.exceptions import ConflictError
            raise ConflictError("This task was modified by someone else. Please refresh and try again.")
        return data

    def update(self, instance, validated_data):
        # Remove version from update fields — we manage it ourselves
        validated_data.pop('version', None)
        # Increment version so the next editor gets the updated number
        validated_data['version'] = instance.version + 1
        return super().update(instance, validated_data)


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Restricted serializer for Members — they can only update status on their assigned tasks.
    Still requires the version field for optimistic locking.
    """
    version = serializers.IntegerField()

    class Meta:
        model  = Task
        fields = ['status', 'version']

    def validate(self, data):
        if self.instance and self.instance.version != data.get('version'):
            from core.exceptions import ConflictError
            raise ConflictError("This task was modified by someone else. Please refresh and try again.")
        return data

    def update(self, instance, validated_data):
        validated_data.pop('version', None)
        validated_data['version'] = instance.version + 1
        return super().update(instance, validated_data)
