"""
RAPEX Core — JSON Renderer
Wraps all API responses in a consistent envelope.
"""
from rest_framework.renderers import JSONRenderer


class RapexJSONRenderer(JSONRenderer):
    """
    All RAPEX API responses follow the format:
    {
        "success": true/false,
        "message": "...",
        "data": { ... } or [ ... ],
        "errors": null or { ... }
    }
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response') if renderer_context else None

        if response is not None and response.status_code >= 400:
            envelope = {
                'success': False,
                'message': data.get('detail', 'An error occurred.') if isinstance(data, dict) else str(data),
                'data': None,
                'errors': data,
            }
        else:
            # Handle paginated responses
            if isinstance(data, dict) and 'results' in data:
                envelope = {
                    'success': True,
                    'message': 'OK',
                    'data': data['results'],
                    'count': data.get('count', 0),
                    'next': data.get('next'),
                    'previous': data.get('previous'),
                    'errors': None,
                }
            else:
                envelope = {
                    'success': True,
                    'message': data.pop('message', 'OK') if isinstance(data, dict) else 'OK',
                    'data': data,
                    'errors': None,
                }

        return super().render(envelope, accepted_media_type, renderer_context)
