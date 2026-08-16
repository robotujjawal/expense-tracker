from django.db import migrations

DEFAULT_CATEGORIES = [
    {'name': 'Food & Dining', 'kind': 'expense', 'icon': '🍽️', 'color': '#A63D2F'},
    {'name': 'Transport', 'kind': 'expense', 'icon': '🚌', 'color': '#B5651D'},
    {'name': 'Shopping', 'kind': 'expense', 'icon': '🛍️', 'color': '#8A4FFF'},
    {'name': 'Bills & Utilities', 'kind': 'expense', 'icon': '💡', 'color': '#C9A227'},
    {'name': 'Rent', 'kind': 'expense', 'icon': '🏠', 'color': '#6D4C41'},
    {'name': 'Health', 'kind': 'expense', 'icon': '💊', 'color': '#D14D72'},
    {'name': 'Entertainment', 'kind': 'expense', 'icon': '🎬', 'color': '#3A6EA5'},
    {'name': 'Education', 'kind': 'expense', 'icon': '📚', 'color': '#2D6A4F'},
    {'name': 'Salary', 'kind': 'income', 'icon': '💼', 'color': '#1B4332'},
    {'name': 'Freelance', 'kind': 'income', 'icon': '🧾', 'color': '#2D6A4F'},
    {'name': 'Other Income', 'kind': 'income', 'icon': '✨', 'color': '#4C7A57'},
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model('tracker', 'Category')
    for cat in DEFAULT_CATEGORIES:
        Category.objects.get_or_create(name=cat['name'], defaults=cat)


def remove_categories(apps, schema_editor):
    Category = apps.get_model('tracker', 'Category')
    names = [c['name'] for c in DEFAULT_CATEGORIES]
    Category.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('tracker', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_categories, remove_categories),
    ]
