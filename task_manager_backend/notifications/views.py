from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        # Return only the top 50 most recent notifications to save bandwidth
        return self.request.user.notifications.all()[:50]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        # Fast unread count (not limited by the slice)
        unread_count = request.user.notifications.filter(is_read=False).count()
        return Response({
            "status": "success",
            "data": {
                "unread_count": unread_count,
                "results": serializer.data
            }
        })

class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = request.user.notifications.get(pk=pk)
            notification.is_read = True
            notification.save(update_fields=['is_read'])
            return Response({"status": "success"})
        except Notification.DoesNotExist:
            return Response({"status": "error"}, status=status.HTTP_404_NOT_FOUND)

class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.notifications.filter(is_read=False).update(is_read=True)
        return Response({"status": "success"})
