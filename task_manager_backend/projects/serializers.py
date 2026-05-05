from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Project, ProjectMember
from accounts.serializers import UserBriefSerializer

User = get_user_model()


# ── Project serializers ───────────────────────────────────────────────────────

class ProjectListSerializer(serializers.ModelSerializer):
    """
    Used for the project list view.
    member_count and task_count come from annotate() in the view queryset —
    they don't exist on the model but Django makes them available as attributes.
    my_role is fetched via SerializerMethodField using the request context.
    """
    my_role      = serializers.SerializerMethodField()
    member_count = serializers.IntegerField(read_only=True)   # from annotate()
    task_count   = serializers.IntegerField(read_only=True)   # from annotate()

    class Meta:
        model  = Project
        fields = ['id', 'name', 'description', 'my_role', 'member_count', 'task_count', 'created_at']

    def get_my_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # obj.memberships is prefetch_related'd in the view — no extra DB hit
            for m in obj.memberships.all():
                if m.user_id == request.user.id:
                    return m.role
        return None


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Used for the project detail view — includes full member list."""
    my_role    = serializers.SerializerMethodField()
    created_by = UserBriefSerializer(read_only=True)
    members    = serializers.SerializerMethodField()

    class Meta:
        model  = Project
        fields = ['id', 'name', 'description', 'my_role', 'created_by', 'members', 'created_at', 'updated_at']

    def get_my_role(self, obj):
        request = self.context.get('request')
        if request:
            membership = obj.memberships.filter(user=request.user).first()
            return membership.role if membership else None
        return None

    def get_members(self, obj):
        return ProjectMemberSerializer(obj.memberships.select_related('user'), many=True).data


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Used for POST (create) and PATCH (update)."""
    class Meta:
        model  = Project
        fields = ['name', 'description']


# ── Member serializers ────────────────────────────────────────────────────────

class ProjectMemberSerializer(serializers.ModelSerializer):
    """Represents one membership row. Flattens user fields for easy frontend use."""
    id        = serializers.IntegerField(source='user.id',        read_only=True)
    full_name = serializers.CharField(source='user.full_name',    read_only=True)
    email     = serializers.CharField(source='user.email',        read_only=True)
    role      = serializers.CharField()
    joined_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model  = ProjectMember
        fields = ['id', 'full_name', 'email', 'role', 'joined_at']


class AddMemberSerializer(serializers.Serializer):
    """Validates the payload for adding a new member by email."""
    email = serializers.EmailField()
    role  = serializers.ChoiceField(choices=ProjectMember.Role.choices, default=ProjectMember.Role.MEMBER)

    def validate_email(self, value):
        try:
            self._user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(f"No user found with email {value}.")
        return value

    def validate(self, data):
        # Check duplication only after we know the user exists
        project = self.context.get('project')
        if project and hasattr(self, '_user'):
            if ProjectMember.objects.filter(project=project, user=self._user).exists():
                raise serializers.ValidationError(
                    {"email": "This user is already a member of the project."}
                )
        return data

    def get_user(self):
        return self._user


class UpdateMemberRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=ProjectMember.Role.choices)
