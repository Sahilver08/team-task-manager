from django.urls import path, include
from . import views

urlpatterns = [
    # Project list + create
    path('', views.ProjectListCreateView.as_view(), name='project-list-create'),

    # Project detail / update / delete
    path('<int:project_id>/', views.ProjectDetailView.as_view(), name='project-detail'),

    # Member management
    path('<int:project_id>/members/', views.ProjectMemberListView.as_view(), name='project-member-list'),
    path('<int:project_id>/members/<int:user_id>/', views.ProjectMemberDetailView.as_view(), name='project-member-detail'),

    # Tasks are nested under projects — their URLs live in tasks/urls.py
    path('<int:project_id>/tasks/', include('tasks.urls')),
]
