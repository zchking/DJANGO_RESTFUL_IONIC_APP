import logging
from rest_framework import permissions

logger = logging.getLogger(__name__)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow product owner to edit it.
    """

    def has_object_permission(self, request, view, obj):
        print('IsOwnerOrReadOnly applied on %s (%s, %s)'
              % (obj, request.method, request.user));
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        if not hasattr(obj, 'owner'):
            return True

        # Write permissions are only allowed to the owner of the snippet.
        return obj.owner == request.user
