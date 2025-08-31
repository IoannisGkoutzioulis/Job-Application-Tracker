# config/utils.py

from rest_framework.response import Response
import traceback
import logging
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from collections import OrderedDict

logger = logging.getLogger(__name__)

def api_response(data=None, message=None, status_code=200, errors=None):
    """
    Standardize API responses across the application.
    
    Args:
        data: The data to return (can be serialized objects, lists, etc.)
        message: A message describing the response
        status_code: HTTP status code (defaults to 200)
        errors: Any error details when applicable
    
    Returns:
        A consistent REST framework Response object
    """
    response_data = {
        "status": "success" if status_code < 400 else "error",
        "message": message,
        "data": data
    }
    
    # Add errors if provided
    if errors:
        response_data["errors"] = errors
    
    # For empty responses (like 204 No Content), don't include data
    if data is None and not message and not errors:
        response_data = None
    
    return Response(response_data, status=status_code)

def log_error(error, message=None):
    """
    Log an error with detailed traceback.
    
    Args:
        error: The exception object
        message: Optional context message
    """
    error_msg = f"{message}: {str(error)}" if message else str(error)
    logger.error(error_msg)
    logger.error(traceback.format_exc())

class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination class for all list views."""
    
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """Customize the response format when using pagination."""
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('results', data)
        ]))


def get_paginated_response(paginator, data, message="", status_code=200, errors=None):
    """
    Return paginated response in standard format.
    
    Args:
        paginator: The pagination instance
        data: The paginated data
        message: Optional message
        status_code: HTTP status code
        errors: Any error details
        
    Returns:
        A consistent REST framework Response with pagination
    """
    response_data = {
        "status": "success" if status_code < 400 else "error",
        "message": message,
        "data": OrderedDict([
            ('count', paginator.page.paginator.count),
            ('next', paginator.get_next_link()),
            ('previous', paginator.get_previous_link()),
            ('results', data)
        ])
    }
    
    # Add errors if provided
    if errors:
        response_data["errors"] = errors
    
    return Response(response_data, status=status_code)

# Add to config/utils.py
class PaginationMixin:
    """Mixin that adds pagination functionality to APIView."""
    
    @property
    def paginator(self):
        """The paginator instance associated with the view, or `None`."""
        if not hasattr(self, '_paginator'):
            self._paginator = self.pagination_class()
        return self._paginator
    
    def paginate_queryset(self, queryset):
        """Return a single page of results, or `None` if pagination is disabled."""
        if self.paginator is None:
            return None
        return self.paginator.paginate_queryset(queryset, self.request, view=self)