"""
Management command to create initial SuperAdmin account.
"""
from django.core.management.base import BaseCommand

from apps.accounts.models import CustomUser, SuperAdminProfile


class Command(BaseCommand):
    help = 'Create the initial SuperAdmin account'

    def handle(self, *args, **options):
        phone = '09000000001'
        password = 'superadmin123'

        if CustomUser.objects.filter(phone=phone).exists():
            self.stdout.write(self.style.WARNING(f'SuperAdmin {phone} already exists.'))
            return

        user = CustomUser.objects.create_superuser(
            phone=phone,
            password=password,
        )
        SuperAdminProfile.objects.create(
            user=user,
            full_name='RAPEX SuperAdmin',
        )

        self.stdout.write(self.style.SUCCESS(
            f'SuperAdmin created: phone={phone}, password={password}'
        ))
