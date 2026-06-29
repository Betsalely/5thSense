from rest_framework import permissions

class IsSuperAdminUser(permissions.BasePermission):
    # Check whether the user is a Super Admin.
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.user_role == 'superadmin'