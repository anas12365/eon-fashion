# No custom model here on purpose.
#
# The spec calls for admin-only authentication with no customer accounts.
# Django's built-in `auth.User` with `is_staff=True` already models that
# exactly (create admins with `python manage.py createsuperuser`), so
# adding a parallel model would just be duplication. If admin-specific
# fields are ever needed (e.g. a role, a last-login IP), extend via a
# OneToOne "AdminProfile" model here rather than a custom user model —
# swapping AUTH_USER_MODEL after the first migration is a much bigger
# change than adding a profile table.
