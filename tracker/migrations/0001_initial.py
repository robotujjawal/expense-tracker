import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=60, unique=True)),
                ('kind', models.CharField(choices=[('expense', 'Expense'), ('income', 'Income')], default='expense', max_length=7)),
                ('icon', models.CharField(default='💰', help_text='A single emoji shown as the category icon in the UI.', max_length=8)),
                ('color', models.CharField(default='#1B4332', help_text='Hex color used for chart segments and badges.', max_length=7)),
            ],
            options={
                'verbose_name_plural': 'Categories',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Transaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0.01)])),
                ('transaction_type', models.CharField(choices=[('expense', 'Expense'), ('income', 'Income')], default='expense', max_length=7)),
                ('date', models.DateField(default=django.utils.timezone.localdate)),
                ('notes', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='transactions', to='tracker.category')),
            ],
            options={
                'ordering': ['-date', '-created_at'],
            },
        ),
    ]
