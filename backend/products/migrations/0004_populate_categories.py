from django.db import migrations


def populate_categories(apps, schema_editor):
    """Derive Category rows from the distinct values already sitting in
    Product.category, then point each Product's new category_relation FK
    at the matching row.

    Matching is case-insensitive (`"Shoes"` and `"shoes"` collapse to one
    Category) since the old CharField never enforced casing or
    uniqueness. Blank/empty category values are left alone — a product
    with no category becomes a product with category_relation=None,
    not an invented "Uncategorized" row.

    Written so re-running it after a partial run (e.g. migration was
    interrupted) is a no-op for anything already correct: existing
    Category rows are reused by name instead of being recreated, and a
    product already pointing at the right Category is skipped.
    """
    Product = apps.get_model('products', 'Product')
    Category = apps.get_model('products', 'Category')

    by_lower_name = {c.name.strip().lower(): c for c in Category.objects.all()}

    distinct_names = (
        Product.objects.exclude(category='')
        .exclude(category__isnull=True)
        .values_list('category', flat=True)
        .distinct()
    )
    for raw_name in distinct_names:
        name = raw_name.strip()
        if not name:
            continue
        key = name.lower()
        if key not in by_lower_name:
            by_lower_name[key] = Category.objects.create(name=name)

    to_update = []
    for product in Product.objects.exclude(category='').exclude(category__isnull=True):
        category = by_lower_name.get(product.category.strip().lower())
        if category and product.category_relation_id != category.id:
            product.category_relation_id = category.id
            to_update.append(product)

    if to_update:
        Product.objects.bulk_update(to_update, ['category_relation'])


def detach_category_relation(apps, schema_editor):
    # Reverse migration intentionally only detaches the FK — it does not
    # delete the Category rows created above. Deleting them here would be
    # destructive if anyone has since edited/renamed categories through
    # the Django admin; the old `category` CharField (untouched by this
    # whole migration) remains the source of truth to re-derive from if
    # this ever needs to run forward again.
    Product = apps.get_model('products', 'Product')
    Product.objects.filter(category_relation__isnull=False).update(category_relation=None)


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0003_category_and_product_fk'),
    ]

    operations = [
        migrations.RunPython(populate_categories, detach_category_relation),
    ]
