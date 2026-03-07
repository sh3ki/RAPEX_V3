from django.contrib import admin
from .models import Notification, FCMToken


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'recipient_role', 'delivery_status', 'created_at']
    list_filter = ['event_type', 'delivery_status', 'recipient_role']
    search_fields = ['event_type', 'title']


@admin.register(FCMToken)
class FCMTokenAdmin(admin.ModelAdmin):
    list_display = ['owner_id', 'owner_role', 'device_id', 'is_active', 'last_active']

