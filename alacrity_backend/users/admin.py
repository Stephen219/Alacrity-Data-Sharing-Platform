from django.contrib import admin
from .models import User


# Register your models here.

@admin.register(User)

class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'sur_name', 'phone_number', 'role', 'organization', 'field', 'date_of_birth', 'profile_picture')
    search_fields = ('email', 'first_name', 'sur_name', 'phone_number', 'role', 'organization', 'field', 'date_of_birth', 'profile_picture')
    
    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser