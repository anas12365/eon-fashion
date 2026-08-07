from django.conf import settings
from django.db import models

from products.models import Product


class InventoryHistory(models.Model):
    """One row per stock change on a Product. Written automatically by
    InventoryViewSet.perform_update whenever `stock` actually changes —
    never created directly from the frontend."""

    product = models.ForeignKey(
        Product, related_name='inventory_history', on_delete=models.CASCADE
    )
    old_quantity = models.PositiveIntegerField()
    new_quantity = models.PositiveIntegerField()
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='inventory_changes',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Inventory history'

    def __str__(self):
        return f'{self.product.name}: {self.old_quantity} -> {self.new_quantity}'

    @property
    def delta(self):
        return self.new_quantity - self.old_quantity
