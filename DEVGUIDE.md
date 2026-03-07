# RAPEX Technologies OPC — DEVELOPER GUIDE

> **Version:** 1.0 · March 2026  
> **Audience:** Backend Engineers, Frontend Engineers, Mobile Engineers  
> **Stack:** Django 5.x · Next.js 14+ · React Native (Expo) · PostgreSQL 16 · Redis 7

---

## TABLE OF CONTENTS

1. [Project Structure](#1-project-structure)
2. [Backend Development (Django)](#2-backend-development-django)
3. [Frontend Development (Next.js)](#3-frontend-development-nextjs)
4. [Mobile Development (React Native / Expo)](#4-mobile-development-react-native--expo)
5. [How to Add a New Module](#5-how-to-add-a-new-module)
6. [Coding Standards](#6-coding-standards)
7. [Git Workflow](#7-git-workflow)
8. [Testing Guide](#8-testing-guide)
9. [Environment Configuration](#9-environment-configuration)
10. [Deployment](#10-deployment)
11. [Troubleshooting](#11-troubleshooting)
12. [Docker Development](#12-docker-development)

---

## 1. PROJECT STRUCTURE

```
RAPEX_V3/
├── backend/                          ← Django project root
│   ├── config/                       ← Project settings + URLs + ASGI/WSGI
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── apps/                         ← All 19 Django modules
│   │   ├── core/
│   │   ├── accounts/
│   │   ├── superadmin/
│   │   ├── admin_panel/
│   │   ├── merchant/
│   │   ├── shop/
│   │   ├── fresh_market/
│   │   ├── ready_to_eat/
│   │   ├── preloved/
│   │   ├── orders/
│   │   ├── delivery/
│   │   ├── rider/
│   │   ├── wallet/
│   │   ├── notifications/
│   │   ├── messaging/
│   │   ├── referrals/
│   │   ├── reports/
│   │   ├── fraud/
│   │   └── settings_module/
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt
│   │   └── production.txt
│   ├── Dockerfile                    ← Backend Docker image
│   ├── .dockerignore
│   ├── .env.example
│   └── manage.py
│
├── frontend/                         ← 5 Next.js apps (Nx or separate repos)
│   ├── user-app/                     ← port 3000 — User/Customer
│   ├── merchant-dashboard/           ← port 3001 — Merchant
│   ├── rider-dashboard/              ← port 3002 — Rider
│   ├── admin-dashboard/              ← port 3003 — Admin
│   └── superadmin-dashboard/         ← port 3004 — SuperAdmin
│
├── mobile/                           ← React Native Expo project
│   ├── app/                          ← Expo Router file-based routing
│   ├── components/
│   ├── lib/
│   ├── store/
│   └── .env.example
│
├── docker-compose.yml                ← Development compose (with hot-reload)
├── docker-compose.prod.yml           ← Production compose (pre-built images)
└── .env.example                      ← Root env template (Docker reads this)
```

### Per-module structure (consistent across all 19 apps)

```
apps/[module]/
├── __init__.py
├── admin.py                          ← Django admin registration
├── apps.py
├── constants.py                      ← Module-level enums + constants
├── exceptions.py                     ← Module-specific exceptions
├── filters.py                        ← django-filter FilterSet classes
├── mixins.py                         ← View/Serializer mixins
├── models.py                         ← ORM models
├── permissions.py                    ← DRF permission classes
├── serializers.py                    ← DRF serializers
├── services.py                       ← Business logic layer
├── signals.py                        ← Django signals
├── tasks.py                          ← Celery tasks
├── urls.py                           ← URL patterns
├── views.py                          ← DRF views/viewsets
└── tests/
    ├── __init__.py
    ├── test_models.py
    ├── test_serializers.py
    ├── test_views.py
    └── test_services.py
```

---

## 2. BACKEND DEVELOPMENT (DJANGO)

### Prerequisites

```
Python 3.12+
PostgreSQL 16
Redis 7
```

### Local Setup

```bash
# Clone and enter backend dir
cd backend/

# Create virtualenv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements/development.txt

# Copy and configure .env
cp .env.example .env

# Database setup
createdb rapex_dev
python manage.py migrate
python manage.py createsuperuser

# Load initial platform settings
python manage.py load_initial_settings

# Run development server
python manage.py runserver 0.0.0.0:8000

# Run Celery worker (separate terminal)
celery -A config worker -l info

# Run Celery beat scheduler (separate terminal)
celery -A config beat -l info

# Run Daphne ASGI (WebSocket support)
daphne -b 0.0.0.0 -p 8001 config.asgi:application
```

---

### Models

**Rules:**
1. All models inherit from `core.models.BaseModel` (provides `id`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`)
2. Never use `id = AutoField` — always UUID
3. Soft deletes: use `is_deleted` flag, never `Model.objects.delete()`
4. Monetary fields: always `DecimalField(max_digits=12, decimal_places=2)`
5. Status fields: always `CharField` with defined `choices` using `TextChoices`
6. Coordinates: `lat = DecimalField(max_digits=10, decimal_places=8)`, `lng = DecimalField(max_digits=11, decimal_places=8)`

```python
# CORRECT model pattern
from django.db import models
from apps.core.models import BaseModel


class Order(BaseModel):
    
    class Status(models.TextChoices):
        PENDING_MERCHANT = 'PENDING_MERCHANT', 'Pending Merchant'
        MERCHANT_ACCEPTED = 'MERCHANT_ACCEPTED', 'Merchant Accepted'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'
    
    class StoreType(models.TextChoices):
        SHOP = 'SHOP', 'Shop'
        FRESH_MARKET = 'FRESH_MARKET', 'Fresh Market'
        READY_TO_EAT = 'READY_TO_EAT', 'Ready to Eat'
        PRELOVED = 'PRELOVED', 'Pre-Loved'
    
    order_number = models.CharField(max_length=20, unique=True)
    user = models.ForeignKey(
        'accounts.UserProfile',
        on_delete=models.PROTECT,
        related_name='orders'
    )
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING_MERCHANT,
        db_index=True
    )
    store_type = models.CharField(max_length=20, choices=StoreType.choices)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    class Meta:
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['user', 'created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.order_number} — {self.status}"
    
    @property
    def is_cancellable(self):
        return self.status in [self.Status.PENDING_MERCHANT, self.Status.MERCHANT_ACCEPTED]
```

---

### Serializers

**Rules:**
1. Read serializers are separate from Write serializers when fields differ
2. Validate monetary input: ensure positive values
3. Never expose sensitive fields (password hash, device_id, session tokens)
4. Use `SerializerMethodField` for computed properties
5. Nested serializers are read-only by default (use nested create/update only when necessary)

```python
from rest_framework import serializers
from .models import Order


class OrderListSerializer(serializers.ModelSerializer):
    merchant_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'status', 'status_display',
                  'merchant_name', 'total_amount', 'created_at']
    
    def get_merchant_name(self, obj):
        return obj.store.merchant.business_name


class OrderCreateSerializer(serializers.Serializer):
    """Validated input for placing a new order."""
    store_id = serializers.UUIDField()
    delivery_method = serializers.ChoiceField(choices=['DELIVERY', 'PICKUP'])
    delivery_address = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    points_to_redeem = serializers.IntegerField(min_value=0, default=0)
    special_notes = serializers.CharField(
        max_length=300, required=False, allow_blank=True
    )
    
    def validate_items(self, items):
        for item in items:
            if 'product_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError("Each item needs product_id and quantity.")
        return items
```

---

### Views

**Rules:**
1. Use `GenericAPIView` or `ModelViewSet` — no function-based views unless for one-off cases
2. All views require explicit `permission_classes`
3. Pagination: use `core.pagination.StandardPagination` (50 per page default)
4. Filtering: use `django-filter` + `SearchFilter` + `OrderingFilter`
5. Error responses: use `core.exceptions.RapexAPIException` for custom error codes
6. Never put business logic in views — use `services.py`

```python
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.pagination import StandardPagination
from apps.core.permissions import IsUser
from .serializers import OrderListSerializer, OrderCreateSerializer
from .services import OrderService


class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsUser]
    pagination_class = StandardPagination
    filterset_fields = ['status', 'store_type']
    search_fields = ['order_number', 'store__display_name']
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderListSerializer
    
    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user.userprofile,
            is_deleted=False
        ).select_related('store__merchant')
    
    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order = OrderService.place_order(
            user=request.user.userprofile,
            validated_data=serializer.validated_data
        )
        
        return Response(
            OrderListSerializer(order).data,
            status=status.HTTP_201_CREATED
        )
```

---

### Services

Business logic lives exclusively in `services.py`. Views call services; models call nothing.

```python
from django.db import transaction
from apps.notifications.tasks import send_notification_async
from apps.orders.models import Order, OrderItem


class OrderService:
    
    @staticmethod
    @transaction.atomic
    def place_order(user, validated_data):
        """
        Full order placement logic.
        - Validates store is open and accepting delivery
        - Calculates delivery fare
        - Checks rider wallet requirements
        - Creates Order + OrderItems (price snapshot)
        - Schedules 3-minute timeout task
        - Sends merchant notification
        """
        store = OrderService._get_open_store(validated_data['store_id'])
        items_data = OrderService._validate_and_price_items(
            store, validated_data['items']
        )
        delivery_fee = OrderService._calculate_delivery_fee(
            store, user, validated_data
        )
        points_discount = OrderService._calculate_points_discount(
            user, validated_data['points_to_redeem']
        )
        
        order = Order.objects.create(
            user=user,
            store=store,
            merchant=store.merchant,
            store_type=store.store_type,
            subtotal=items_data['subtotal'],
            delivery_fee=delivery_fee,
            points_discount=points_discount,
            total_amount=items_data['subtotal'] + delivery_fee - points_discount,
            merchant_accept_deadline=timezone.now() + timedelta(minutes=3),
            **{k: validated_data[k] for k in ['delivery_method', 'delivery_address', 'special_notes']}
        )
        
        OrderItem.objects.bulk_create([
            OrderItem(order=order, **item) for item in items_data['items']
        ])
        
        # Schedule auto-cancel
        from apps.orders.tasks import cancel_order_if_not_accepted
        cancel_order_if_not_accepted.apply_async(
            args=[str(order.id)],
            countdown=180,
            task_id=f"order_timeout_{order.id}"
        )
        
        # Notify merchant
        send_notification_async.delay(
            recipient_id=str(store.merchant.user_id),
            recipient_role='MERCHANT',
            event_type='order.new',
            data={'order_id': str(order.id)}
        )
        
        return order
```

---

### Celery Tasks

```python
from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name='orders.cancel_order_if_not_accepted',
    max_retries=3,
    default_retry_delay=10
)
def cancel_order_if_not_accepted(self, order_id: str):
    """Auto-cancel order if merchant doesn't respond in 3 minutes."""
    from apps.orders.models import Order
    from apps.orders.services import OrderService
    
    try:
        order = Order.objects.get(id=order_id)
        if order.status == Order.Status.PENDING_MERCHANT:
            OrderService.cancel_order(
                order=order,
                cancelled_by_role='SYSTEM',
                reason='Merchant did not respond within 3 minutes'
            )
            logger.info(f"Order {order.order_number} auto-cancelled due to timeout.")
    except Order.DoesNotExist:
        logger.warning(f"Order {order_id} not found during auto-cancel check.")
    except Exception as exc:
        self.retry(exc=exc)
```

---

### Permissions

```python
# apps/core/permissions.py
from rest_framework.permissions import BasePermission


class IsUser(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'USER'
        )


class IsMerchant(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'MERCHANT'
        )


class IsRider(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'RIDER'
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'SUPERADMIN'
        )


class IsAdminWithPermission(BasePermission):
    """Checks specific permission key in AdminProfile.permissions JSON."""
    required_permission = None
    
    def has_permission(self, request, view):
        if not (request.user.is_authenticated and request.user.role == 'ADMIN'):
            return False
        profile = request.user.adminprofile
        return profile.permissions.get(self.required_permission, False)
```

---

### URL Patterns

```python
# apps/orders/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListCreateView.as_view(), name='order-list-create'),
    path('<uuid:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<uuid:pk>/accept/', views.OrderAcceptView.as_view(), name='order-accept'),
    path('<uuid:pk>/reject/', views.OrderRejectView.as_view(), name='order-reject'),
    path('<uuid:pk>/cancel/', views.OrderCancelView.as_view(), name='order-cancel'),
]

# config/urls.py
from django.urls import path, include

urlpatterns = [
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/superadmin/', include('apps.superadmin.urls')),
    path('api/v1/admin/', include('apps.admin_panel.urls')),
    path('api/v1/merchant/', include('apps.merchant.urls')),
    path('api/v1/rider/', include('apps.rider.urls')),
    path('api/v1/user/orders/', include('apps.orders.urls')),
    path('api/v1/user/wallet/', include('apps.wallet.urls')),
    path('api/v1/chat/', include('apps.messaging.urls')),
    # ... all other modules
]
```

---

### WebSocket Consumers

```python
# apps/orders/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer


class OrderConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        user = self.scope['user']
        if not user.is_authenticated:
            await self.close()
            return
        
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.group_name = f'order_{self.order_id}'
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
    
    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
    
    # Handler for group_send events of type "order.status_changed"
    async def order_status_changed(self, event):
        await self.send(text_data=json.dumps({
            'type': 'order.status_changed',
            'order_id': event['order_id'],
            'new_status': event['new_status'],
            'timestamp': event['timestamp'],
        }))
```

---

## 3. FRONTEND DEVELOPMENT (NEXT.JS)

### UI Framework: Apex Dashboard

Reference: https://apex-dashboard.pages.dev/

All UI is based on the Apex Dashboard design system. Components are copied exactly — colors, spacing, sidebar layout, card styles, data table styles, modal patterns.

**Design tokens:**
```css
--color-primary: #FF6B00;        /* Orange */
--color-secondary: #7C3AED;      /* Purple */
--color-background: #0F172A;     /* Dark blue-black (dark mode default) */
--color-surface: #1E293B;        /* Card background */
--color-border: #334155;
--color-text-primary: #F1F5F9;
--color-text-secondary: #94A3B8;
```

---

### Folder Structure (per app)

```
frontend/user-app/
├── app/                          ← Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            ← Sidebar + topbar
│   │   ├── page.tsx              ← Dashboard home
│   │   ├── orders/
│   │   │   ├── page.tsx          ← Orders list
│   │   │   └── [id]/page.tsx     ← Order detail
│   │   ├── wallet/page.tsx
│   │   └── profile/page.tsx
│   ├── layout.tsx                ← Root layout (fonts, providers)
│   └── globals.css
├── components/
│   ├── ui/                       ← Primitive components (Button, Input, Badge, Modal)
│   ├── layout/                   ← Sidebar, Topbar, PageHeader
│   ├── charts/                   ← Dashboard chart wrappers
│   ├── orders/                   ← Order-specific components
│   └── wallet/                   ← Wallet-specific components
├── lib/
│   ├── api.ts                    ← Axios instance + interceptors
│   ├── auth.ts                   ← Auth helpers (token storage, refresh)
│   └── utils.ts                  ← Currency formatting, date helpers
├── hooks/
│   ├── useAuth.ts
│   ├── useWebSocket.ts
│   └── useOrders.ts
├── store/
│   └── index.ts                  ← Zustand global state
├── types/
│   └── index.ts                  ← TypeScript interfaces
└── .env.local
```

---

### Component Conventions

All components use **functional React** with TypeScript. No class components.

```tsx
// components/orders/OrderStatusBadge.tsx
import { cn } from '@/lib/utils';

type OrderStatus = 'PENDING_MERCHANT' | 'MERCHANT_ACCEPTED' | 'DELIVERED' | 'CANCELLED';

const STATUS_MAP: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_MERCHANT: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400' },
  MERCHANT_ACCEPTED: { label: 'Accepted', className: 'bg-blue-500/20 text-blue-400' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-500/20 text-green-400' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400' },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = STATUS_MAP[status];
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
```

---

### API Client (Axios)

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // for httpOnly cookie refresh tokens
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue: any[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const { data } = await api.post('/auth/token/refresh/');
        localStorage.setItem('access_token', data.access);
        processQueue(null, data.access);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### Data Fetching Pattern

Use **React Query** (TanStack Query) for all server state:

```tsx
// hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Order } from '@/types';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get<{ results: Order[]; count: number }>('/user/orders/');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId: string) =>
      api.post(`/user/orders/${orderId}/cancel/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
```

---

### WebSocket Hook

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';

export function useWebSocket(
  url: string,
  onMessage: (data: any) => void
) {
  const ws = useRef<WebSocket | null>(null);
  
  const connect = useCallback(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}${url}`;
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    ws.current.onclose = () => {
      setTimeout(connect, 3000);  // reconnect after 3s
    };
  }, [url, onMessage]);
  
  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);
  
  return ws;
}
```

---

## 4. MOBILE DEVELOPMENT (REACT NATIVE / EXPO)

### Setup

```bash
cd mobile/
npm install
npx expo start          # development with Expo Go
npx expo run:android    # build and run on Android
```

### Folder Structure

```
mobile/
├── app/                             ← Expo Router file-based routing
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── otp-verify.tsx
│   ├── (user)/
│   │   ├── _layout.tsx             ← Tab Navigator (Home, Orders, Wallet, Profile)
│   │   ├── index.tsx               ← Discovery feed / nearby merchants
│   │   ├── merchants/[id].tsx      ← Merchant storefront view
│   │   ├── orders/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx            ← Order tracking with live map
│   │   ├── wallet.tsx
│   │   └── profile.tsx
│   ├── (rider)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx               ← Rider home screen (online/offline toggle)
│   │   ├── orders/[id].tsx         ← Active delivery screen
│   │   ├── wallet.tsx
│   │   └── profile.tsx
│   ├── (merchant)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx               ← Merchant dashboard
│   │   ├── orders/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── products/index.tsx
│   │   └── store.tsx
│   └── _layout.tsx                 ← Root layout (auth gate, providers)
├── components/
│   ├── ui/
│   ├── maps/
│   └── orders/
├── lib/
│   ├── api.ts
│   ├── storage.ts                  ← Expo SecureStore helpers
│   └── location.ts                 ← expo-location helpers
├── store/
│   └── index.ts                    ← Zustand state
└── .env
```

### Key Libraries

| Purpose | Library |
|---|---|
| Navigation | Expo Router 3.x (file-based) |
| Maps | react-native-maps (Google Maps Android SDK) |
| Push (FCM) | expo-notifications + Firebase |
| Secure Storage | expo-secure-store |
| OTA Updates | expo-updates |
| Location | expo-location |
| Camera | expo-camera |
| Image Picker | expo-image-picker |
| WebSocket | Native WebSocket API |
| State | Zustand |
| HTTP Client | Axios |
| Server State | TanStack Query |

### Navigation Pattern

Role-based routing is handled at the root `_layout.tsx`:

```tsx
// app/_layout.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store';

export default function RootLayout() {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect href="/(auth)/login" />;
  
  if (user.role === 'USER') return <Redirect href="/(user)/" />;
  if (user.role === 'RIDER') return <Redirect href="/(rider)/" />;
  if (user.role === 'MERCHANT') return <Redirect href="/(merchant)/" />;
  
  return <Redirect href="/(auth)/login" />;
}
```

---

## 5. HOW TO ADD A NEW MODULE

Follow these steps exactly when creating a new feature module:

### Step 1: Create the Django App

```bash
cd backend/
python manage.py startapp [module_name] apps/[module_name]
```

### Step 2: Register in Settings

```python
# config/settings/base.py
LOCAL_APPS = [
    ...
    'apps.[module_name]',
]
```

### Step 3: Create the Model

In `apps/[module_name]/models.py`, inherit from `BaseModel`.

### Step 4: Create Migration

```bash
python manage.py makemigrations [module_name]
python manage.py migrate
```

### Step 5: Write Services

The business logic goes in `apps/[module_name]/services.py`.

### Step 6: Write Serializers

In `apps/[module_name]/serializers.py`.

### Step 7: Write Views + URL Routes

In `apps/[module_name]/views.py` and `apps/[module_name]/urls.py`.

### Step 8: Register URLs

```python
# config/urls.py
path('api/v1/[resource]/', include('apps.[module_name].urls')),
```

### Step 9: Add Frontend Integration

In the relevant Next.js app(s):
1. Add API call function in `lib/api/[module].ts`
2. Add React Query hooks in `hooks/use[Module].ts`
3. Create page under `app/(dashboard)/[module]/page.tsx`
4. Create components in `components/[module]/`
5. Add sidebar nav item in `components/layout/Sidebar.tsx`

### Step 10: Write Tests

```bash
python manage.py test apps.[module_name]
```

---

## 6. CODING STANDARDS

### Python / Django

- **PEP 8** — enforced via `flake8` + `black` (100 char line length)
- **isort** for import ordering (`isort .`)
- No bare `except:` — always specify exception types
- Docstrings: Google-style for services and utility functions
- Type hints: required for all service functions and celery tasks
- Use `logging.getLogger(__name__)` — never `print()`
- All DB queries that run in a loop: use `select_related` / `prefetch_related`
- Never expose raw tracebacks to API consumers — use exception handlers

### TypeScript / React

- **ESLint + Prettier** — run `npm run lint` before commits
- Props interfaces defined explicitly (no `any`)
- `useCallback` / `useMemo` only when profiler shows performance issue
- No inline styles — use Tailwind CSS classes
- Component file = PascalCase (`OrderCard.tsx`)
- Hook file = camelCase starting with `use` (`useOrders.ts`)
- Page file = `page.tsx` (Next.js App Router convention)
- Types file: all shared types in `types/index.ts`

### Currency Display

```typescript
// ALWAYS use this helper — never raw Decimal
export function formatPeso(amount: number | string): string {
  return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}
```

### Error Handling

```python
# apps/core/exceptions.py
from rest_framework.exceptions import APIException
from rest_framework import status


class RapexAPIException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    
    def __init__(self, detail: str, code: str = 'error', status_code: int = None):
        self.detail = detail
        self.code = code
        if status_code:
            self.status_code = status_code


class InsufficientBalanceError(RapexAPIException):
    def __init__(self):
        super().__init__(
            detail="Insufficient wallet balance to complete this transaction.",
            code="insufficient_balance",
            status_code=402
        )


class OrderAlreadyCancelled(RapexAPIException):
    def __init__(self):
        super().__init__(
            detail="This order has already been cancelled.",
            code="order_already_cancelled"
        )
```

---

## 7. GIT WORKFLOW

### Branch Strategy

```
main         ← Production code only. Protected. No direct pushes.
develop      ← Integration branch. Merge features here first.
feature/*    ← New feature development. Branch from develop.
fix/*        ← Bug fixes. Branch from develop.
hotfix/*     ← Critical prod fixes. Branch from main, merged to main + develop.
release/*    ← Release candidates. Branch from develop.
```

### Branch Naming

```
feature/merchant-product-upload
feature/rider-wallet-remittance
fix/order-3min-timer-not-revoking
hotfix/wallet-double-credit-bug
release/v1.0.0-mvp
```

### Commit Message Format (Conventional Commits)

```
type(scope): short description

feat(orders): add 3-minute auto-cancel timeout with Celery
fix(wallet): prevent double-credit on concurrent top-up requests
refactor(accounts): extract OTP verification into service layer
docs(devguide): add module creation steps
test(notifications): add FCM delivery failure retry test
chore(deps): upgrade Django to 5.1.2
```

### PR Rules

1. All PRs target `develop` (except hotfixes)
2. PR title follows commit format
3. Must include description of what changed + how to test
4. At least 1 approval required before merge
5. All tests must pass
6. No merge conflicts

---

## 8. TESTING GUIDE

### Backend Testing

```bash
# Run all tests
python manage.py test

# Run tests for a specific module
python manage.py test apps.orders

# Run specific test class
python manage.py test apps.orders.tests.test_services.OrderServiceTest

# With coverage report
coverage run manage.py test
coverage report
coverage html  # generates htmlcov/index.html
```

#### Test Patterns

```python
# apps/orders/tests/test_services.py
from django.test import TestCase
from apps.orders.services import OrderService
from apps.orders.models import Order
from tests.factories import UserProfileFactory, MerchantStoreFactory


class OrderServiceTest(TestCase):
    
    def setUp(self):
        self.user = UserProfileFactory()
        self.store = MerchantStoreFactory(is_open=True)
    
    def test_place_order_creates_order_record(self):
        """Order.place_order() creates an Order with PENDING_MERCHANT status."""
        data = {
            'store_id': str(self.store.id),
            'delivery_method': 'DELIVERY',
            'delivery_address': '123 Test St.',
            'items': [{'product_id': '...', 'quantity': 1}]
        }
        order = OrderService.place_order(self.user, data)
        
        self.assertEqual(order.status, Order.Status.PENDING_MERCHANT)
        self.assertEqual(order.user, self.user)
    
    def test_order_auto_times_out(self):
        """Order is cancelled if merchant doesn't respond in 3 minutes."""
        from apps.orders.tasks import cancel_order_if_not_accepted
        order = Order.objects.create(
            status=Order.Status.PENDING_MERCHANT,
            ...
        )
        cancel_order_if_not_accepted(str(order.id))
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.TIMEOUT_CANCELLED)
```

#### Test Factories (using `factory_boy`)

```python
# tests/factories.py
import factory
from apps.accounts.models import CustomUser, UserProfile


class CustomUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CustomUser
    
    phone = factory.Sequence(lambda n: f"09{n:09d}")
    role = 'USER'
    is_active = True
    is_verified = True


class UserProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserProfile
    
    user = factory.SubFactory(CustomUserFactory)
    full_name = factory.Faker('name')
```

---

### Frontend Testing (Jest + React Testing Library)

```bash
cd frontend/user-app/
npm test
npm run test:coverage
npm run test:e2e    # Playwright E2E tests
```

---

## 9. ENVIRONMENT CONFIGURATION

### Backend `.env` (Development)

```dotenv
# Django
DJANGO_SETTINGS_MODULE=config.settings.development
SECRET_KEY=your-dev-secret-key-minimum-50-chars
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://rapex_user:password@localhost:5432/rapex_dev

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# JWT
JWT_SECRET_KEY=jwt-dev-secret-key
JWT_ACCESS_EXPIRY_MINUTES=15
JWT_REFRESH_EXPIRY_DAYS=7

# SMS — Semaphore
SEMAPHORE_API_KEY=your-semaphore-api-key
SEMAPHORE_SENDER_NAME=RAPEX

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-server-key

# Firebase FCM
FIREBASE_CREDENTIALS_PATH=firebase-service-account.json

# Storage
USE_S3=False
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=rapex-media
MINIO_USE_SSL=False
```

### Frontend `.env.local`

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8001/ws
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your-browser-restricted-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Mobile `.env`

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1  # Android emulator → localhost
EXPO_PUBLIC_WS_URL=ws://10.0.2.2:8001/ws
EXPO_PUBLIC_GOOGLE_MAPS_KEY=your-android-restricted-key
```

---

## 10. DEPLOYMENT

### Production Checklist

Before deployment:

- [ ] `DEBUG=False` in production settings
- [ ] `ALLOWED_HOSTS` set to actual domain(s)
- [ ] Database password rotated from dev
- [ ] All secret keys minimum 50 characters
- [ ] SSL certificate installed (Let's Encrypt via Certbot)
- [ ] Nginx config reviewed — static files served from `/static/`
- [ ] Celery worker runs as systemd service
- [ ] Daphne runs as systemd service
- [ ] PostgreSQL backups configured (daily)
- [ ] Redis persistence enabled (`appendonly yes`)
- [ ] MinIO configured with domain + SSL
- [ ] FCM service account key in secure location
- [ ] Semaphore API key stored in `.env` only
- [ ] `python manage.py collectstatic` run

### Nginx Config (abbreviated)

```nginx
server {
    listen 443 ssl http2;
    server_name api.rapex.ph;
    
    ssl_certificate /etc/letsencrypt/live/rapex.ph/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rapex.ph/privkey.pem;
    
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /static/ {
        alias /home/rapex/backend/staticfiles/;
    }
}

server {
    listen 443 ssl http2;
    server_name ws.rapex.ph;
    
    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Systemd Services

```ini
# /etc/systemd/system/rapex-gunicorn.service
[Unit]
Description=RAPEX Gunicorn
After=network.target

[Service]
User=rapex
WorkingDirectory=/home/rapex/backend
ExecStart=/home/rapex/venv/bin/gunicorn config.wsgi:application \
    --workers 4 \
    --worker-class gthread \
    --threads 2 \
    --bind 127.0.0.1:8000 \
    --log-file /var/log/rapex/gunicorn.log
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 11. TROUBLESHOOTING

### Common Backend Issues

| Problem | Diagnosis | Fix |
|---|---|---|
| `psycopg2.OperationalError` | DB not running or wrong credentials | Check `DATABASE_URL` in `.env`, confirm PostgreSQL is running |
| `redis.exceptions.ConnectionError` | Redis not running | `redis-server --daemonize yes` |
| `WebSocket connection failed` | Daphne not running or ASGI not configured | Check `ASGI_APPLICATION` in settings, restart Daphne |
| Celery tasks never execute | Worker not running | `celery -A config worker -l info` in separate terminal |
| `CORS error` on frontend | `CORS_ALLOWED_ORIGINS` missing | Add frontend URL to `CORS_ALLOWED_ORIGINS` in settings |
| OTP not received | Semaphore API issue | Check Semaphore API key + balance, test with Postman |
| File upload fails | MinIO unreachable | Confirm MinIO is running, bucket exists, credentials correct |

### Database Migrations

```bash
# Show migration state
python manage.py showmigrations

# Squash migrations (after stable feature)
python manage.py squashmigrations [app_name] [start_migration] [end_migration]

# Fake migration (sync after manual DB change)
python manage.py migrate --fake [app_name] [migration_name]
```

### Wallet Double-Credit Prevention

All wallet operations use `select_for_update()` inside `transaction.atomic()`. If a double-credit is detected:
1. Check `WalletTransaction` records for duplicate `reference_number`
2. Check if the view was protected with `IsAuthenticated` on both endpoints
3. Verify the React Query mutation doesn't call the endpoint twice (check `StrictMode` in React and request deduplication)

---

*End of RAPEX Developer Guide — v1.0 MVP*

---

## 12. DOCKER DEVELOPMENT

Docker is the recommended way to run RAPEX locally and in production. All 14 services (backend, frontends, database, cache, queue workers, storage, proxy) start with a single command.

### Quick Start

```bash
# First time setup
cp .env.example .env
# Fill in: GOOGLE_MAPS_API_KEY, FIREBASE credentials, SEMAPHORE_API_KEY

# Build and start everything
docker compose up --build

# Run DB migrations (first time only)
docker compose exec backend python manage.py migrate

# Create the superadmin account (first time only)
docker compose exec backend python manage.py create_superadmin

# Load initial data fixtures
docker compose exec backend python manage.py loaddata fixtures/initial_settings.json
```

### Backend Dockerfile (`backend/Dockerfile`)

```dockerfile
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc build-essential netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements/base.txt requirements/base.txt
RUN pip install --no-cache-dir -r requirements/base.txt

COPY . .

# Default command (overridden per service in docker-compose.yml)
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

### Development `docker-compose.yml` (abbreviated)

```yaml
version: "3.9"

services:

  # ─── Infrastructure ───────────────────────────────
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: rapex_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: rapex_db
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASE_URL: postgres://rapex_user:${DB_PASSWORD}@postgres:5432/rapex_db
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 100
    ports:
      - "6432:5432"
    depends_on: [postgres]

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio-data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  # ─── Django Backend ───────────────────────────────
  backend:
    build: ./backend
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --reload
    volumes:
      - ./backend:/app           # hot-reload via --reload
      - static-files:/app/staticfiles
    env_file: .env
    ports:
      - "8000:8000"
    depends_on: [postgres, redis]

  daphne:
    build: ./backend
    command: daphne -b 0.0.0.0 -p 8001 config.asgi:application
    volumes:
      - ./backend:/app
    env_file: .env
    ports:
      - "8001:8001"
    depends_on: [redis]

  celery-worker:
    build: ./backend
    command: celery -A config worker -l info --concurrency 4
    volumes:
      - ./backend:/app
    env_file: .env
    depends_on: [redis, postgres]

  celery-beat:
    build: ./backend
    command: celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    volumes:
      - ./backend:/app
    env_file: .env
    depends_on: [redis, postgres]

  # ─── Next.js Frontends ────────────────────────────
  user-app:
    build:
      context: ./frontend/user-app
      dockerfile: Dockerfile
    volumes:
      - ./frontend/user-app:/app
      - /app/node_modules
      - /app/.next
    env_file: ./frontend/user-app/.env.local
    ports:
      - "3000:3000"

  merchant-dashboard:
    build:
      context: ./frontend/merchant-dashboard
      dockerfile: Dockerfile
    volumes:
      - ./frontend/merchant-dashboard:/app
      - /app/node_modules
    ports:
      - "3001:3001"

  rider-dashboard:
    build:
      context: ./frontend/rider-dashboard
      dockerfile: Dockerfile
    volumes:
      - ./frontend/rider-dashboard:/app
      - /app/node_modules
    ports:
      - "3002:3002"

  admin-dashboard:
    build:
      context: ./frontend/admin-dashboard
      dockerfile: Dockerfile
    volumes:
      - ./frontend/admin-dashboard:/app
      - /app/node_modules
    ports:
      - "3003:3003"

  superadmin-dashboard:
    build:
      context: ./frontend/superadmin-dashboard
      dockerfile: Dockerfile
    volumes:
      - ./frontend/superadmin-dashboard:/app
      - /app/node_modules
    ports:
      - "3004:3004"

  # ─── Nginx ────────────────────────────────────────
  nginx:
    image: nginx:1.25-alpine
    volumes:
      - ./nginx/dev.conf:/etc/nginx/conf.d/default.conf
      - static-files:/static
    ports:
      - "80:80"
    depends_on: [backend, daphne]

volumes:
  postgres-data:
  redis-data:
  minio-data:
  static-files:
```

### Common Docker Commands

```bash
# Start all services (detached)
docker compose up -d

# Start with rebuild
docker compose up --build

# Stream logs (all services)
docker compose logs -f

# Stream logs for one service
docker compose logs -f backend
docker compose logs -f celery-worker

# Run a management command
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py shell
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py collectstatic --noinput

# Access PostgreSQL shell
docker compose exec postgres psql -U rapex_user -d rapex_db

# Access Redis CLI
docker compose exec redis redis-cli -a $REDIS_PASSWORD

# Stop all services (preserve volumes)
docker compose down

# Stop and wipe all data (DANGER)
docker compose down -v

# Rebuild a single service
docker compose up --build backend

# Production deploy
docker compose -f docker-compose.prod.yml up --build -d
```

### Notes

- **Hot reload:** In development, source code is volume-mounted into all containers. Django reloads on `.py` file changes (via Gunicorn `--reload`). Next.js uses `next dev` which has built-in HMR.
- **Mobile:** React Native / Expo is NOT in Docker. Run `npx expo start` from your machine and point `API_BASE_URL` to `http://localhost:8000`.
- **Static files:** `collectstatic` output is stored in the `static-files` shared volume, served by Nginx — not proxied through Django.
- **Production (`docker-compose.prod.yml`):** Removes volume mounts, uses `--workers 8`, enables Redis password, enforces `DJANGO_SETTINGS_MODULE=config.settings.production`.

---

*End of RAPEX Developer Guide — v1.0 MVP*
