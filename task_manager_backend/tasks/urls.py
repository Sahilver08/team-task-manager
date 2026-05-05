from django.urls import path
from . import views

# This file is included by projects/urls.py with the prefix:
#   path('<int:project_id>/tasks/', include('tasks.urls'))
# So all these URLs become: /api/projects/<project_id>/tasks/...


urlpatterns = [
    path('',                             views.TaskListCreateView.as_view(), name='task-list-create'),
    path('<int:task_id>/',               views.TaskDetailView.as_view(),     name='task-detail'),
    path('<int:task_id>/update/',        views.TaskUpdateView.as_view(),     name='task-update'),
    path('<int:task_id>/comments/',      views.CommentListCreateView.as_view(), name='comment-list-create'),
]
