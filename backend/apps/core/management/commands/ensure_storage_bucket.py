"""Ensure S3/MinIO bucket exists for media uploads."""
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Ensure configured S3/MinIO media bucket exists.'

    def handle(self, *args, **options):
        use_s3 = getattr(settings, 'USE_S3', False)
        if not use_s3:
            self.stdout.write('USE_S3 is disabled. Skipping bucket readiness check.')
            return

        bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '')
        endpoint_url = getattr(settings, 'AWS_S3_ENDPOINT_URL', '')
        access_key = getattr(settings, 'AWS_ACCESS_KEY_ID', '')
        secret_key = getattr(settings, 'AWS_SECRET_ACCESS_KEY', '')

        if not bucket_name:
            raise CommandError('AWS_STORAGE_BUCKET_NAME is not configured.')

        if not endpoint_url:
            raise CommandError('AWS_S3_ENDPOINT_URL is not configured.')

        if not access_key or not secret_key:
            raise CommandError('Storage credentials are not configured.')

        try:
            import boto3
            from botocore.client import Config
            from botocore.exceptions import ClientError
        except Exception as exc:
            raise CommandError('boto3/botocore is required for bucket initialization.') from exc

        client = boto3.client(
            's3',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            endpoint_url=endpoint_url,
            region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1'),
            use_ssl=str(endpoint_url).startswith('https://'),
            config=Config(signature_version=getattr(settings, 'AWS_S3_SIGNATURE_VERSION', 's3v4')),
        )

        try:
            client.head_bucket(Bucket=bucket_name)
            self.stdout.write(self.style.SUCCESS(f'Storage bucket ready: {bucket_name}'))
            return
        except ClientError as exc:
            error_code = str(exc.response.get('Error', {}).get('Code', ''))
            if error_code not in {'404', 'NoSuchBucket', 'NotFound'}:
                raise CommandError(f'Unable to access storage bucket {bucket_name}: {exc}') from exc

        try:
            client.create_bucket(Bucket=bucket_name)
            self.stdout.write(self.style.SUCCESS(f'Created storage bucket: {bucket_name}'))
        except Exception as exc:
            raise CommandError(f'Failed to create storage bucket {bucket_name}: {exc}') from exc
