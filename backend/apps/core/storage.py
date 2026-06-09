"""Shared storage path + URL helpers for RAPEX uploads."""
import os
import posixpath
import re
import uuid
from typing import Iterable
from urllib.parse import unquote, urlparse

from django.conf import settings
from django.core.files.storage import default_storage
from django.utils.text import get_valid_filename

ABSOLUTE_URL_PREFIXES = ('http://', 'https://')
SAFE_SEGMENT_RE = re.compile(r'[^a-zA-Z0-9._-]+')

ROLE_DIRECTORY_MAP = {
    'USER': 'user',
    'MERCHANT': 'merchant',
    'RIDER': 'rider',
    'ADMIN': 'admin',
    'SUPERADMIN': 'superadmin',
}


def is_absolute_url(value: str) -> bool:
    return isinstance(value, str) and value.startswith(ABSOLUTE_URL_PREFIXES)


def safe_segment(value: str, fallback: str = 'file') -> str:
    cleaned = SAFE_SEGMENT_RE.sub('-', str(value or '').strip())
    cleaned = cleaned.strip('.-_')
    return cleaned or fallback


def _extract_extension(filename: str) -> str:
    _, extension = os.path.splitext(filename or '')
    extension = (extension or '').lower().strip()
    if not extension:
        return ''

    if len(extension) > 12:
        return ''

    if not re.match(r'^\.[a-z0-9]+$', extension):
        return ''

    return extension


def build_upload_path(*segments: str, stem: str, original_name: str = '') -> str:
    normalized_segments = [safe_segment(item) for item in segments if item]

    valid_name = get_valid_filename(original_name or stem)
    extension = _extract_extension(valid_name)
    filename = f"{safe_segment(stem)}-{uuid.uuid4().hex}{extension}"

    return posixpath.join(*normalized_segments, filename)


def save_upload(upload_file, *segments: str, stem: str) -> str:
    path = build_upload_path(*segments, stem=stem, original_name=getattr(upload_file, 'name', '') or stem)
    return default_storage.save(path, upload_file)


def normalize_storage_path(value: str) -> str:
    """Normalize values into storage paths when they point to this project's storage."""
    raw = (value or '').strip()
    if not raw:
        return ''

    if not is_absolute_url(raw):
        media_prefix = (settings.MEDIA_URL or '/media/').strip('/ ')
        normalized = raw.lstrip('/ ')
        if media_prefix and normalized.startswith(f'{media_prefix}/'):
            return normalized[len(media_prefix) + 1 :]
        return normalized

    parsed = urlparse(raw)
    path = unquote(parsed.path or '').lstrip('/ ')
    if not path:
        return raw

    # Match MinIO/S3 endpoint URLs like http://minio:9000/<bucket>/<path>
    endpoint = (getattr(settings, 'AWS_S3_ENDPOINT_URL', '') or '').strip()
    bucket = (getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '') or '').strip('/ ')
    if endpoint and bucket:
        endpoint_host = urlparse(endpoint).netloc
        if endpoint_host and parsed.netloc == endpoint_host:
            bucket_prefix = f'{bucket}/'
            if path == bucket:
                return ''
            if path.startswith(bucket_prefix):
                return path[len(bucket_prefix) :]

    return raw


def resolve_storage_url(value: str, request=None) -> str:
    raw = (value or '').strip()
    if not raw:
        return ''

    normalized = normalize_storage_path(raw)
    if not normalized:
        return ''

    if is_absolute_url(normalized):
        return normalized

    try:
        resolved = default_storage.url(normalized)
    except Exception:
        resolved = normalized

    if request and resolved.startswith('/'):
        return request.build_absolute_uri(resolved)
    return resolved


def resolve_storage_values(values: Iterable[str], request=None) -> list[str]:
    return [resolve_storage_url(value, request=request) for value in (values or []) if value]


def role_directory(role: str) -> str:
    return ROLE_DIRECTORY_MAP.get(str(role or '').upper(), 'user')
