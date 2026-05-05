from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """
    Wraps every paginated list response in our standard envelope.
    Frontend always reads response.data.data.results — consistent shape.
    """
    page_size              = 20
    page_size_query_param  = 'page_size'   # allow ?page_size=50
    max_page_size          = 100

    def get_paginated_response(self, data):
        return Response({
            "status":  "success",
            "message": "Data retrieved successfully.",
            "data": {
                "count":        self.page.paginator.count,
                "total_pages":  self.page.paginator.num_pages,
                "current_page": self.page.number,
                "next":         self.get_next_link(),
                "previous":     self.get_previous_link(),
                "results":      data,
            }
        })

    def get_paginated_response_schema(self, schema):
        return {
            'type': 'object',
            'properties': {
                'count':        {'type': 'integer'},
                'total_pages':  {'type': 'integer'},
                'current_page': {'type': 'integer'},
                'next':         {'type': 'string', 'nullable': True},
                'previous':     {'type': 'string', 'nullable': True},
                'results':      schema,
            }
        }
