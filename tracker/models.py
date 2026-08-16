from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class Category(models.Model):
    """A spending or income category, e.g. Food, Rent, Salary."""

    CATEGORY_KIND = (
        ('expense', 'Expense'),
        ('income', 'Income'),
    )

    name = models.CharField(max_length=60, unique=True)
    kind = models.CharField(max_length=7, choices=CATEGORY_KIND, default='expense')
    icon = models.CharField(
        max_length=8, default='💰',
        help_text='A single emoji shown as the category icon in the UI.'
    )
    color = models.CharField(
        max_length=7, default='#1B4332',
        help_text='Hex color used for chart segments and badges.'
    )

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Transaction(models.Model):
    """A single income or expense entry in the ledger."""

    TRANSACTION_TYPE = (
        ('expense', 'Expense'),
        ('income', 'Income'),
    )

    title = models.CharField(max_length=200)
    # Owner of the transaction (nullable for existing records).
    from django.conf import settings
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions',
        null=True,
        blank=True,
    )

    amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    transaction_type = models.CharField(
        max_length=7, choices=TRANSACTION_TYPE, default='expense'
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='transactions'
    )
    date = models.DateField(default=timezone.localdate)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.title} - {self.amount}'
