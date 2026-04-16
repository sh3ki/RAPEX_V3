"""
RAPEX Database Seeder
Seeds the database with test data:
  - 1 SuperAdmin
  - 5 Admins (varied sub-roles)
  - 10 Merchants (with stores & products)
  - 20 Riders (with wallets)
  - 25 Users (with wallets, loyalty points, referral codes)
  - Platform settings, markup tiers, commission tiers
  - Delivery fare configs

Usage: python manage.py seed [--flush]
"""
import random
import string
from decimal import Decimal

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone


PASSWORD = 'rapex2026'


class Command(BaseCommand):
    help = 'Seed the database with test data for development/testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush', action='store_true',
            help='Flush the database before seeding',
        )

    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write(self.style.WARNING('Flushing database...'))
            call_command('flush', '--noinput')
            self.stdout.write(self.style.SUCCESS('Database flushed.'))

        with transaction.atomic():
            self._seed_platform_settings()
            self._seed_delivery_fare_configs()
            sa = self._seed_superadmin()
            admins = self._seed_admins()
            merchants = self._seed_merchants()
            riders = self._seed_riders()
            users = self._seed_users()

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('ΓòÉ' * 55))
        self.stdout.write(self.style.SUCCESS('  RAPEX SEED COMPLETE'))
        self.stdout.write(self.style.SUCCESS('ΓòÉ' * 55))
        self.stdout.write(f'  SuperAdmin : 1   (phone: 09000000001)')
        self.stdout.write(f'  Admins     : {len(admins)}   (phones: 09100000001-{len(admins):03d})')
        self.stdout.write(f'  Merchants  : {len(merchants)}  (phones: 09200000001-{len(merchants):03d})')
        self.stdout.write(f'  Riders     : {len(riders)}  (phones: 09300000001-{len(riders):03d})')
        self.stdout.write(f'  Users      : {len(users)}  (phones: 09400000001-{len(users):03d})')
        self.stdout.write(f'  Password   : {PASSWORD}')
        self.stdout.write(self.style.SUCCESS('ΓòÉ' * 55))

    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    # Platform Settings
    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    def _seed_platform_settings(self):
        self.stdout.write('Loading platform settings...')
        call_command('load_initial_settings')

    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    # Delivery Fare Configs
    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    def _seed_delivery_fare_configs(self):
        from apps.delivery.models import DeliveryFareConfig

        configs = [
            ('BICYCLE', Decimal('30.00'), Decimal('10.00'), Decimal('0.00'), Decimal('8.00'), Decimal('3.00')),
            ('MOTORCYCLE', Decimal('40.00'), Decimal('15.00'), Decimal('5.00'), Decimal('10.00'), Decimal('3.00')),
            ('4_WHEELS', Decimal('60.00'), Decimal('20.00'), Decimal('10.00'), Decimal('15.00'), Decimal('5.00')),
        ]
        count = 0
        for vtype, base, std, saver, surcharge, coverage in configs:
            _, created = DeliveryFareConfig.objects.get_or_create(
                vehicle_type=vtype,
                defaults={
                    'base_fare': base,
                    'standard_addon': std,
                    'saver_addon': saver,
                    'surcharge_per_km': surcharge,
                    'base_coverage_km': coverage,
                },
            )
            if created:
                count += 1
        self.stdout.write(f'  Delivery fare configs: {count} created')

    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    # SuperAdmin
    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    def _seed_superadmin(self):
        from apps.accounts.models import CustomUser, SuperAdminProfile

        phone = '09000000001'
        email = 'superadmin@rapex.ph'
        if CustomUser.objects.filter(phone=phone).exists():
            user = CustomUser.objects.get(phone=phone)
            if not user.email:
                user.email = email
                user.save(update_fields=['email'])
            self.stdout.write(f'  SuperAdmin {phone} already exists ΓÇö skipping')
            return user

        user = CustomUser.objects.create_superuser(phone=phone, password=PASSWORD)
        user.email = email
        user.save(update_fields=['email'])
        SuperAdminProfile.objects.create(user=user, full_name='RAPEX SuperAdmin')
        self.stdout.write(self.style.SUCCESS(f'  SuperAdmin created: {phone} / {email}'))
        return user

    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    # Admins
    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    def _seed_admins(self):
        from apps.accounts.models import AdminProfile, CustomUser

        sub_roles = ['OPERATIONS', 'SUPPORT', 'FINANCE', 'COMPLIANCE', 'LOGISTICS']
        first_names = ['Maria', 'Juan', 'Jose', 'Ana', 'Carlo']
        last_names = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Ramos']
        admins = []
        for i in range(5):
            phone = f'0910000000{i + 1}'
            if CustomUser.objects.filter(phone=phone).exists():
                admins.append(CustomUser.objects.get(phone=phone))
                continue

            user = CustomUser.objects.create_user(
                phone=phone, password=PASSWORD, role='ADMIN',
                email=f'admin{i + 1}@rapex.ph',
                is_verified=True, is_staff=True,
            )
            full_name = f'{first_names[i]} {last_names[i]}'
            AdminProfile.objects.create(
                user=user,
                full_name=full_name,
                sub_role=sub_roles[i],
                permissions={
                    'can_approve_kyc': True,
                    'can_manage_orders': True,
                    'can_view_reports': True,
                    'can_manage_fraud': sub_roles[i] in ('COMPLIANCE', 'OPERATIONS'),
                },
            )
            admins.append(user)
        self.stdout.write(self.style.SUCCESS(f'  Admins created: {len(admins)}'))
        return admins

    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    # Merchants (10)
    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    def _seed_merchants(self):
        from apps.accounts.models import CustomUser, MerchantProfile
        from apps.merchant.models import MerchantStore

        merchant_data = [
            ('Aling Nena\'s Sari-Sari', 'SHOP', 14.5995, 120.9842),
            ('Kuya Ben Fresh Market', 'FRESH_MARKET', 14.6010, 120.9860),
            ('Lutong Bahay ni Ate Luz', 'READY_TO_EAT', 14.5980, 120.9830),
            ('Second Chance Preloved', 'PRELOVED', 14.6020, 120.9870),
            ('Super Grocery Express', 'SHOP', 14.5970, 120.9810),
            ('Farm Fresh Palengke', 'FRESH_MARKET', 14.6050, 120.9890),
            ('Mang Tomas Grill House', 'READY_TO_EAT', 14.5940, 120.9800),
            ('Benta Ukay Hub', 'PRELOVED', 14.6060, 120.9880),
            ('Metro Convenience Store', 'SHOP', 14.5950, 120.9850),
            ('Isla Seafood Market', 'FRESH_MARKET', 14.6030, 120.9840),
        ]

        first_names = [
            'Nena', 'Ben', 'Luz', 'Miguel', 'Rosa',
            'Pedro', 'Tomas', 'Cynthia', 'Ramon', 'Elena',
        ]
        last_names = [
            'Delos Santos', 'Magbanua', 'Villanueva', 'Tan', 'Lorenzo',
            'Bautista', 'Aquino', 'Mendoza', 'Castillo', 'Salvador',
        ]

        merchants = []
        for i in range(10):
            phone = f'092000000{i + 1:02d}'
            if CustomUser.objects.filter(phone=phone).exists():
                merchants.append(CustomUser.objects.get(phone=phone))
                continue

            biz_name, primary_store_type, lat, lng = merchant_data[i]

            user = CustomUser.objects.create_user(
                phone=phone, password=PASSWORD, role='MERCHANT',
                email=f'merchant{i + 1}@rapex.ph', is_verified=True,
            )
            profile = MerchantProfile.objects.create(
                user=user,
                full_name=f'{first_names[i]} {last_names[i]}',
                birthday=timezone.datetime(1985 + i % 10, (i % 12) + 1, 15).date(),
                business_name=biz_name,
                business_address=f'{100 + i} Sample St, Manila, PH',
                business_lat=Decimal(str(lat)),
                business_lng=Decimal(str(lng)),
                kyc_status='APPROVED',
            )

            # Create primary store
            store = MerchantStore.objects.create(
                merchant=profile,
                store_type=primary_store_type,
                display_name=biz_name,
                description=f'Welcome to {biz_name}!',
                is_open=True,
                is_visible=True,
                tags=[primary_store_type.lower().replace('_', '-')],
            )
            self._seed_store_products(store, primary_store_type)

            # Give some merchants a second store type
            if i < 3:
                secondary_types = {
                    'SHOP': 'FRESH_MARKET',
                    'FRESH_MARKET': 'READY_TO_EAT',
                    'READY_TO_EAT': 'SHOP',
                }
                sec_type = secondary_types.get(primary_store_type, 'SHOP')
                sec_store = MerchantStore.objects.create(
                    merchant=profile,
                    store_type=sec_type,
                    display_name=f'{biz_name} ({sec_type.replace("_", " ").title()})',
                    is_open=True,
                    is_visible=True,
                )
                self._seed_store_products(sec_store, sec_type)

            merchants.append(user)

        self.stdout.write(self.style.SUCCESS(f'  Merchants created: {len(merchants)}'))
        return merchants

    def _seed_store_products(self, store, store_type):
        if store_type == 'SHOP':
            self._seed_shop_products(store)
        elif store_type == 'FRESH_MARKET':
            self._seed_fresh_market_products(store)
        elif store_type == 'READY_TO_EAT':
            self._seed_ready_to_eat_products(store)
        elif store_type == 'PRELOVED':
            self._seed_preloved_items(store)

    def _seed_shop_products(self, store):
        from apps.shop.models import ShopCategory, ShopProduct

        categories = [
            ('Beverages', [
                ('Coca-Cola 1.5L', Decimal('75.00')),
                ('Nestle Pure Life 500ml', Decimal('15.00')),
                ('Red Horse Beer 500ml', Decimal('55.00')),
            ]),
            ('Snacks', [
                ('Jack n Jill Piattos', Decimal('22.00')),
                ('Oishi Prawn Crackers', Decimal('18.00')),
                ('SkyFlakes Crackers', Decimal('12.00')),
            ]),
            ('Canned Goods', [
                ('Century Tuna 155g', Decimal('32.00')),
                ('Argentina Corned Beef 175g', Decimal('42.00')),
                ('555 Sardines 155g', Decimal('18.00')),
            ]),
        ]
        for cat_name, products in categories:
            cat = ShopCategory.objects.create(store=store, name=cat_name)
            for name, price in products:
                ShopProduct.objects.create(
                    store=store, category=cat, name=name,
                    base_price=price, markup_rate=Decimal('5.00'),
                    has_inventory=True, stock_qty=random.randint(10, 100),
                )

    def _seed_fresh_market_products(self, store):
        from apps.fresh_market.models import FreshMarketCategory, FreshMarketProduct

        categories = [
            ('Vegetables', [
                ('Kangkong (bundle)', 'VEGETABLE', 'PER_BUNDLE', Decimal('15.00')),
                ('Tomato', 'VEGETABLE', 'PER_KILO', Decimal('80.00')),
                ('Eggplant', 'VEGETABLE', 'PER_KILO', Decimal('60.00')),
            ]),
            ('Meats', [
                ('Pork Belly', 'RAW_MEAT', 'PER_KILO', Decimal('320.00')),
                ('Chicken Whole', 'POULTRY', 'PER_PIECE', Decimal('180.00')),
            ]),
            ('Seafood', [
                ('Bangus (Milkfish)', 'SEAFOOD', 'PER_KILO', Decimal('200.00')),
                ('Shrimp Medium', 'SEAFOOD', 'PER_KILO', Decimal('450.00')),
            ]),
        ]
        for cat_name, products in categories:
            cat = FreshMarketCategory.objects.create(store=store, name=cat_name)
            for name, ptype, pmode, price in products:
                FreshMarketProduct.objects.create(
                    store=store, category=cat, name=name,
                    product_type=ptype, pricing_mode=pmode,
                    base_price=price, markup_rate=Decimal('8.00'),
                    freshness_status='FRESH_TODAY',
                )

    def _seed_ready_to_eat_products(self, store):
        from apps.ready_to_eat.models import (
            MenuCategory, MenuItem, MenuItemAddon, MenuItemVariant,
            ReadyToEatStoreSettings,
        )

        ReadyToEatStoreSettings.objects.get_or_create(
            store=store, defaults={'default_prep_time_minutes': 15},
        )

        categories = [
            ('Rice Meals', [
                ('Chicken Adobo', [('Solo', Decimal('85.00')), ('Family', Decimal('250.00'))],
                 [('Extra Rice', Decimal('15.00')), ('Egg', Decimal('20.00'))]),
                ('Pork Sinigang', [('Solo', Decimal('95.00')), ('Family', Decimal('280.00'))],
                 [('Extra Rice', Decimal('15.00'))]),
            ]),
            ('Grilled', [
                ('Inihaw na Liempo', [('Regular', Decimal('120.00')), ('Large', Decimal('180.00'))],
                 [('Java Rice', Decimal('20.00'))]),
            ]),
        ]
        for cat_name, items in categories:
            cat = MenuCategory.objects.create(store=store, name=cat_name)
            for item_name, variants, addons in items:
                item = MenuItem.objects.create(
                    store=store, category=cat, name=item_name,
                )
                for var_name, var_price in variants:
                    MenuItemVariant.objects.create(
                        menu_item=item, name=var_name,
                        base_price=var_price, markup_rate=Decimal('5.00'),
                    )
                for addon_name, addon_price in addons:
                    MenuItemAddon.objects.create(
                        menu_item=item, name=addon_name, price=addon_price,
                    )

    def _seed_preloved_items(self, store):
        from apps.preloved.models import PrelovedCategory, PrelovedItem

        categories = [
            ('Electronics', [
                ('Samsung Galaxy S21 (Used)', 'GOOD', Decimal('12000.00'), True),
                ('JBL Flip 5 Speaker', 'LIKE_NEW', Decimal('3500.00'), True),
            ]),
            ('Clothing', [
                ('Nike Air Max (Size 10)', 'GOOD', Decimal('2500.00'), True),
                ('Uniqlo Polo Shirt', 'NEW', Decimal('400.00'), False),
            ]),
            ('Furniture', [
                ('IKEA Desk Lamp', 'LIKE_NEW', Decimal('800.00'), True),
            ]),
        ]
        for cat_name, items in categories:
            cat = PrelovedCategory.objects.create(store=store, name=cat_name)
            for title, condition, price, negotiable in items:
                PrelovedItem.objects.create(
                    store=store, category=cat,
                    title=title, description=f'Pre-loved {title}. Good condition.',
                    condition=condition, base_price=price,
                    markup_rate=Decimal('5.00'),
                    is_negotiable=negotiable,
                )

    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    # Riders (20)
    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    def _seed_riders(self):
        from apps.accounts.models import CustomUser, RiderProfile
        from apps.wallet.models import RapexWallet, WalletTransaction

        vehicle_types = ['MOTORCYCLE', 'MOTORCYCLE', 'BICYCLE', '4_WHEELS']
        first_names = [
            'Mark', 'Jerome', 'Ryan', 'Kenneth', 'Jerico',
            'Ariel', 'Dennis', 'Francis', 'Gilbert', 'Harold',
            'Ivan', 'Jason', 'Kevin', 'Leo', 'Manuel',
            'Nelson', 'Oscar', 'Patrick', 'Quincy', 'Rodel',
        ]
        last_names = [
            'Dela Cruz', 'Santos', 'Reyes', 'Bautista', 'Gonzales',
            'Lopez', 'Martinez', 'Rodriguez', 'Hernandez', 'Perez',
            'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz',
            'Morales', 'Jimenez', 'Ortiz', 'Gutierrez', 'Castillo',
        ]

        riders = []
        for i in range(20):
            phone = f'093000000{i + 1:02d}'
            if CustomUser.objects.filter(phone=phone).exists():
                riders.append(CustomUser.objects.get(phone=phone))
                continue

            user = CustomUser.objects.create_user(
                phone=phone, password=PASSWORD, role='RIDER',
                email=f'rider{i + 1}@rapex.ph', is_verified=True,
            )
            vtype = vehicle_types[i % len(vehicle_types)]
            RiderProfile.objects.create(
                user=user,
                full_name=f'{first_names[i]} {last_names[i]}',
                birthday=timezone.datetime(1990 + i % 10, (i % 12) + 1, 10).date(),
                home_address=f'{200 + i} Rider St, Manila, PH',
                home_lat=Decimal('14.5995') + Decimal(str(random.uniform(-0.01, 0.01))),
                home_lng=Decimal('120.9842') + Decimal(str(random.uniform(-0.01, 0.01))),
                emergency_contact_name=f'{last_names[(i + 1) % 20]} Family',
                emergency_contact_phone=f'0990000{i + 1:04d}',
                vehicle_type=vtype,
                vehicle_plate=f'M{random.choice(string.ascii_uppercase)}{random.randint(1000, 9999)}' if vtype != 'BICYCLE' else '',
                vehicle_model=self._random_vehicle_model(vtype),
                kyc_status='APPROVED',
                is_online=i < 10,  # first 10 riders are online
                current_lat=Decimal('14.5995') + Decimal(str(random.uniform(-0.005, 0.005))) if i < 10 else None,
                current_lng=Decimal('120.9842') + Decimal(str(random.uniform(-0.005, 0.005))) if i < 10 else None,
            )

            # Create wallet with Γé▒500 initial load
            wallet = RapexWallet.objects.create(
                owner_id=user.id, owner_type='RIDER',
                balance=Decimal('500.00'),
            )
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='INITIAL_LOAD',
                amount=Decimal('500.00'),
                balance_after=Decimal('500.00'),
                note='Initial wallet load on KYC approval',
                performed_by_role='SYSTEM',
            )

            riders.append(user)

        self.stdout.write(self.style.SUCCESS(f'  Riders created: {len(riders)}'))
        return riders

    def _random_vehicle_model(self, vtype):
        models = {
            'MOTORCYCLE': ['Honda Click 150i', 'Yamaha Nmax', 'Honda Beat', 'Suzuki Raider 150'],
            'BICYCLE': ['Mountain Bike', 'Road Bike', 'Folding Bike'],
            '4_WHEELS': ['Toyota Vios', 'Honda City', 'Mitsubishi Mirage'],
        }
        return random.choice(models.get(vtype, ['Unknown']))

    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    # Users (25)
    # ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    def _seed_users(self):
        from apps.accounts.models import CustomUser, UserProfile
        from apps.referrals.models import ReferralCode
        from apps.wallet.models import RapexWallet, UserLoyaltyPoints

        first_names = [
            'Sofia', 'Isabella', 'Mia', 'Olivia', 'Emma',
            'Charlotte', 'Amelia', 'Luna', 'Chloe', 'Ella',
            'Gabriel', 'Daniel', 'Lucas', 'Nathan', 'Ethan',
            'Noah', 'Liam', 'James', 'Alexander', 'Benjamin',
            'Victoria', 'Camille', 'Julia', 'Andrea', 'Patricia',
        ]
        last_names = [
            'Mercado', 'Villanueva', 'Mendoza', 'Ramos', 'Garcia',
            'Cruz', 'Santos', 'Reyes', 'Bautista', 'Gonzales',
            'Torres', 'Flores', 'Rivera', 'Lopez', 'Martinez',
            'Rodriguez', 'Hernandez', 'Perez', 'Jimenez', 'Morales',
            'Castillo', 'Ortiz', 'Gutierrez', 'Diaz', 'Gomez',
        ]

        users = []
        for i in range(25):
            phone = f'094000000{i + 1:02d}'
            if CustomUser.objects.filter(phone=phone).exists():
                users.append(CustomUser.objects.get(phone=phone))
                continue

            user = CustomUser.objects.create_user(
                phone=phone, password=PASSWORD, role='USER',
                email=f'user{i + 1}@rapex.ph', is_verified=True,
            )
            UserProfile.objects.create(
                user=user,
                full_name=f'{first_names[i]} {last_names[i]}',
                birthday=timezone.datetime(1992 + i % 10, (i % 12) + 1, 5).date(),
                home_address=f'{300 + i} User Ave, Manila, PH',
                home_lat=Decimal('14.5995') + Decimal(str(random.uniform(-0.02, 0.02))),
                home_lng=Decimal('120.9842') + Decimal(str(random.uniform(-0.02, 0.02))),
                kyc_status='APPROVED' if i < 20 else 'PENDING',
            )

            # Wallet
            RapexWallet.objects.create(
                owner_id=user.id, owner_type='USER',
                balance=Decimal('0.00'),
            )

            # Loyalty points
            UserLoyaltyPoints.objects.create(
                user=user,
                total_points=random.randint(0, 100) if i < 20 else 0,
                lifetime_earned=random.randint(0, 200) if i < 20 else 0,
            )

            # Referral code
            code = f'RAPEX-{first_names[i][:3].upper()}{random.randint(1000, 9999)}'
            ReferralCode.objects.create(
                owner_id=user.id, owner_role='USER', code=code,
            )

            users.append(user)

        self.stdout.write(self.style.SUCCESS(f'  Users created: {len(users)}'))
        return users

