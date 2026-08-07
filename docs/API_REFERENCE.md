# EON API Reference

## Authentication

POST /api/auth/

Handles admin authentication.

## Products

/api/products/

Operations:
- List products
- Create products
- Update products
- Delete products

## Orders

### GET /api/orders/
Purpose:
List orders. Supports `?status=`, `?search=` (name/phone/order ID),
`?date_from=`, `?date_to=`, `?ordering=`, paginated.

### GET /api/orders/<id>/
Purpose:
Retrieve a single order, including its `available_transitions` — the
valid next statuses from its current one (see Order lifecycle below).

### PATCH /api/orders/<id>/status/
Purpose:
Change order status. Validated against the order status lifecycle —
returns 400 with a message naming the allowed next status(es) if the
requested transition isn't valid.

### POST /api/orders/<id>/cancel/
Purpose:
Shortcut for `PATCH .../status/ {"status": "Cancelled"}`. Same
transition rules apply — cancelling an order that's already
Shipped/Delivered now returns 400 instead of silently succeeding.
Already-Cancelled is a no-op (200).

### PATCH /api/orders/<id>/read/
Purpose:
Mark an order as read (admin inbox).

### GET /api/orders/my-orders/?phone=
Purpose:
Public — look up orders by the phone number used at checkout (no
customer accounts exist).

### Order status lifecycle

```
Pending -> Confirmed -> Preparing -> Shipped -> Delivered
   |           |            |
   v           v            v
Cancelled  Cancelled    Cancelled
```

Delivered and Cancelled are terminal. Cancellation is only available
before an order ships — once Shipped, there's no cancel path (would
need a return/refund flow, out of scope). This table lives in one
place, `Order.ALLOWED_TRANSITIONS` (orders/models.py), and is enforced
both by `PATCH .../status/` and `POST .../cancel/`.

### Authentication

All Orders endpoints above except `POST /api/orders/` (checkout) and
`GET /api/orders/my-orders/` require:
- JWT Authentication
- Admin permission

## Inventory

### GET /api/inventory/
Purpose:
List inventory items (products with stock info). Supports `?search=`,
`?low_stock=1`, and `?out_of_stock=1`.

### GET /api/inventory/<id>/
Purpose:
Retrieve a single inventory item.

### PATCH/PUT /api/inventory/<id>/
Purpose:
Update stock quantity (and/or low_stock_threshold). Writes an
`InventoryHistory` row automatically whenever `stock` changes.

### GET /api/inventory/<id>/history/
Purpose:
Track stock changes for a single product.

### GET /api/inventory/history/
Purpose:
Track the most recent stock changes across all products.

### Authentication

Inventory endpoints require:
- JWT Authentication
- Admin permission (`IsAdminUser`)

## Customers

There is no customer-account model — "a customer" is every distinct
phone number seen across Order, aggregated on the fly. `phone` is the
identifier, not a database id.

### GET /api/customers/
Purpose:
List customers. Supports `?search=` (name or phone) and `?ordering=`
(`name`, `orders_count`, `total_spent`, `last_order_at` — prefix `-`
to reverse), paginated. Each entry: `phone`, `name`, `address`,
`orders_count` (all orders, any status), `total_spent` (excludes
Cancelled orders), `last_order_at`.

### GET /api/customers/<phone>/
Purpose:
One customer's aggregate (same shape as the list) plus `orders`: their
full order history, newest first, in the same shape as `/api/orders/`.
404 if no order has that phone number. `phone` must be
`encodeURIComponent`-ed by the caller (phone numbers can contain `+`).

### Authentication

Customers endpoints require:
- JWT Authentication
- Admin permission (`IsAdminUser`)

## Analytics

### GET /api/analytics/summary/
Purpose:
Dashboard aggregates, computed from Order/OrderItem/Product — no
stored analytics data, so nothing here can drift from the real
numbers:
```
{
  "revenue": "12345.00",        // sum of Order.total, excludes Cancelled
  "orders_count": 42,           // all orders, every status
  "orders_by_status": {"Pending": 3, "Confirmed": 1, ...},
  "customers_count": 17,        // distinct phone numbers across Order
  "products_count": 30,
  "visible_products_count": 27,
  "best_sellers": [
    {"product_id": 4, "product_name": "...", "quantity_sold": 12, "revenue": "600.00"},
    ...
  ]
}
```

### Authentication

Analytics endpoints require:
- JWT Authentication
- Admin permission (`IsAdminUser`)

## Reports

Read-only, admin-only, computed live from Order/OrderItem/Product — no
stored report data, same principle as Analytics/Customers. All date
filters (`?date_from=` / `?date_to=`) are inclusive, `YYYY-MM-DD`, and
apply to `Order.created_at` (or the parent order's `created_at` for the
Product Performance report). Omitting both returns all-time figures.

### GET /api/reports/sales/?date_from=&date_to=
Purpose:
Revenue and order totals for the range, plus a per-day trend.
```
{
  "date_from": "2026-01-01" | null,
  "date_to": "2026-01-31" | null,
  "total_revenue": "12345.00",      // excludes Cancelled
  "orders_count": 42,               // non-cancelled orders in range
  "average_order_value": "293.93",
  "trend": [
    {"date": "2026-01-01", "revenue": "500.00", "orders_count": 3},
    ...
  ]
}
```

### GET /api/reports/orders/?date_from=&date_to=
Purpose:
Order counts and status breakdown for the range.
```
{
  "date_from": ..., "date_to": ...,
  "total_orders": 42,              // all statuses, in range
  "status_breakdown": {"Pending": 3, ...},
  "completed_orders": 10,           // status = Delivered
  "cancelled_orders": 5
}
```

### GET /api/reports/inventory/
Purpose:
Current stock overview (no date filter — this is a point-in-time snapshot,
not historical).
```
{
  "total_products": 30,
  "total_stock_units": 512,
  "inventory_value": "45678.00",    // sum(price * stock)
  "low_stock_count": 4,
  "out_of_stock_count": 2,
  "low_stock_products": [
    {"id": 7, "name": "...", "category": "...", "stock": 2, "low_stock_threshold": 5},
    ...
  ]
}
```

### GET /api/reports/products/?date_from=&date_to=&limit=
Purpose:
Product performance — quantity sold and revenue per product, ordered by
quantity sold descending. Cancelled orders excluded. `limit` defaults to
50; pass `0` or `all` for every product.
```
{
  "date_from": ..., "date_to": ...,
  "products": [
    {"product_id": 4, "product_name": "...", "quantity_sold": 12, "revenue": "600.00"},
    ...
  ]
}
```

### Authentication

Reports endpoints require:
- JWT Authentication
- Admin permission (`IsAdminUser`)
