from django.contrib import admin
from .models import Order, OrderItem, OrderStatusHistory


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'store', 'status', 'total_amount', 'created_at']
    list_filter = ['status', 'delivery_method', 'store_type']
    search_fields = ['order_number']
    readonly_fields = ['order_number']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product_name', 'unit_price', 'quantity', 'line_total']


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['order', 'from_status', 'to_status', 'changed_by_role', 'changed_at']

