from rest_framework import permissions

class IsSuperAdminOrMapOwner(permissions.BasePermission):
    # Check whether the user has access to a map

    # Any Super Admin or Admin may view and upload maps
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    # Super Admin may edit or remove any entries, while Admin may only edit or remove the map they created
    def has_object_permission(self, request, view, obj):
        if request.user.user_role == 'superadmin':
            return True
        return obj.created_by == request.user