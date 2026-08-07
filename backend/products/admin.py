from django.contrib import admin

from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'discount', 'stock', 'low_stock_threshold', 'visible', 'updated_at')
    list_filter = ('category', 'visible')
    search_fields = ('name', 'description')
    list_editable = ('price', 'discount', 'stock', 'low_stock_threshold', 'visible')
    readonly_fields = ('created_at', 'updated_at')
