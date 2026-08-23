from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Allow only authenticated users whose application role is ADMIN."""

    message = "Administrator access is required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )
