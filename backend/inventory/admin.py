from django.contrib import admin

from .models import InventoryHistory


@admin.register(InventoryHistory)
class InventoryHistoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'old_quantity', 'new_quantity', 'changed_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('product__name',)
    readonly_fields = ('product', 'old_quantity', 'new_quantity', 'changed_by', 'created_at')

    def has_add_permission(self, request):
        # History rows are only ever written by InventoryViewSet.perform_update.
        return False
