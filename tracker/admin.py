from django.contrib import admin

from .models import Category, Transaction


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'kind', 'icon', 'color']
    list_filter = ['kind']
    search_fields = ['name']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['title', 'amount', 'transaction_type', 'category', 'date']
    list_filter = ['transaction_type', 'category', 'date']
    search_fields = ['title', 'notes']
    date_hierarchy = 'date'
