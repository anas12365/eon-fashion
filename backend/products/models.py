from django.db import models


class Category(models.Model):
    """New Django-owned category table (Phase 1 of the Firebase-categories
    migration). Mirrors the shape of the old Firestore `categories`
    collection (`src/lib/db/categories.js`): just a unique name and a
    creation timestamp — nothing else was stored there.

    `Product.category` (the legacy CharField) is left in place during this
    phase; `Product.category_relation` is an additive, nullable FK that
    exists alongside it. See Product.category_relation below.
    """

    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Product(models.Model):
    # --- core fields requested ---
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.PositiveIntegerField(default=0)  # percent, 0-100
    category = models.CharField(max_length=100, blank=True, default='')
    # --- category migration (Phase 1) -------------------------------
    # Additive, nullable FK living alongside the legacy `category` text
    # field above — intentionally NOT named `category` yet, so nothing
    # about the existing field or the API response shape changes. A data
    # migration backfills this from the distinct values already in
    # `category`. `SET_NULL` so deleting a Category never deletes or
    # blocks deletion of a Product (the old text field never could
    # either). Only after the frontend (Phase 2) is migrated and
    # verified does a later migration drop `category` and rename this
    # field in its place.
    category_relation = models.ForeignKey(
        Category,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='products',
    )
    sizes = models.JSONField(default=list, blank=True)   # e.g. ["S", "M", "L"]
    colors = models.JSONField(default=list, blank=True)  # e.g. ["Black", "White"]
    stock = models.PositiveIntegerField(default=0)
    # Below this (and above 0) a product shows as "low stock" in the
    # admin Inventory page. 0 stock is always "out of stock" regardless
    # of this value. Reuses the existing `stock` field rather than
    # adding a redundant `stock_quantity` column.
    low_stock_threshold = models.PositiveIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # --- parity fields ---
    # The current Firestore documents also carry these; keeping the same
    # shape here means `src/lib/db/products.js`'s `normalize()` needs zero
    # changes when the frontend is pointed at this API instead of Firebase.
    tag = models.CharField(max_length=100, blank=True, default='')
    currency = models.CharField(max_length=10, default='EGP')
    visible = models.BooleanField(default=True)
    details = models.JSONField(default=list, blank=True)
    # Same two-shape image format already handled by src/lib/images.js:
    #   [{"large": "url", "thumb": "url"}, ...]
    images = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def stock_status(self):
        if self.stock <= 0:
            return 'out_of_stock'
        if self.stock <= self.low_stock_threshold:
            return 'low_stock'
        return 'in_stock'

    @property
    def effective_price(self):
        """Price after discount — mirrors withEffectivePrice() on the frontend."""
        if self.discount and self.discount > 0:
            return round(float(self.price) * (1 - self.discount / 100), 2)
        return float(self.price)
