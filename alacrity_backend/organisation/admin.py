from django.contrib import admin
from django.http import HttpResponseForbidden
from .models import Organization

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'address')
    search_fields = ('name', 'email')

    def has_add_permission(self, request):
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser
