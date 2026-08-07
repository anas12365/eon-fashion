from rest_framework import serializers

from products.models import Product

from .models import InventoryHistory


class InventoryProductSerializer(serializers.ModelSerializer):
    """Stock-focused view of a Product for the admin Inventory page.
    Read side shows everything needed for the table; write side only
    ever touches `stock` and `low_stock_threshold`."""

    status = serializers.ReadOnlyField(source='stock_status')
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'category',
            'image',
            'stock',
            'low_stock_threshold',
            'status',
            'updated_at',
        ]
        read_only_fields = ['id', 'name', 'category', 'image', 'status', 'updated_at']

    def get_image(self, obj):
        if not obj.images:
            return None
        first = obj.images[0]
        # Product.images has always allowed two shapes (see src/lib/images.js,
        # which every frontend consumer already resolves through):
        #   legacy:  "https://...jpg"            (plain string URL)
        #   current: {"large": "...", "thumb": "..."}
        # This serializer only ever read the current shape, so a product
        # still carrying a legacy string image crashed with AttributeError
        # on `.get('thumb')`. No change to Product.images itself — same
        # JSONField, same two shapes it always allowed.
        if isinstance(first, str):
            return first
        if isinstance(first, dict):
            return first.get('thumb') or first.get('large')
        return None


class InventoryHistorySerializer(serializers.ModelSerializer):
    changed_by = serializers.SerializerMethodField()
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = InventoryHistory
        fields = [
            'id',
            'product',
            'product_name',
            'old_quantity',
            'new_quantity',
            'delta',
            'changed_by',
            'created_at',
        ]
        read_only_fields = fields

    def get_changed_by(self, obj):
        return obj.changed_by.username if obj.changed_by else None
