"""
Notification hooks for the order lifecycle — architecture only.

No email/SMS/WhatsApp provider is wired up here yet, on purpose (the
storefront still opens a pre-filled WhatsApp chat client-side for now —
see src/utils/whatsapp.js). This module exists so that when a real
notification channel is added, it's a new function body here plus one
new setting, not a change to views.py/serializers.py or any call site.

To add a real channel later:
  1. Implement the body of the relevant function below (e.g. call
     Twilio/WhatsApp Business API/an email backend).
  2. Everything already calls these functions at the right moments —
     no other file needs to change.
"""

import logging

logger = logging.getLogger('orders.notifications')


def notify_new_order(order):
    """Called right after an order is successfully created and stock is
    reserved. Intended future use: email/WhatsApp the customer a
    confirmation, and/or alert the admin (staff) of a new order."""
    logger.info('New order %s from %s (%s items, total %s %s)',
                order.display_id, order.customer_name, order.items.count(),
                order.total, order.currency)


def notify_status_change(order, old_status, new_status):
    """Called whenever an admin changes an order's status. Intended
    future use: notify the customer their order was confirmed/shipped/etc."""
    logger.info('Order %s status changed: %s -> %s', order.display_id, old_status, new_status)


def notify_order_cancelled(order):
    """Called when an order is cancelled (see OrderViewSet.cancel).
    Intended future use: notify the customer + confirm restock to admin."""
    logger.info('Order %s cancelled', order.display_id)
