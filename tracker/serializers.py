from rest_framework import serializers

from .models import Category, Transaction


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'kind', 'icon', 'color']


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    category_icon = serializers.CharField(source='category.icon', read_only=True, default='💰')
    category_color = serializers.CharField(source='category.color', read_only=True, default='#1B4332')
    owner_username = serializers.CharField(source='owner.username', read_only=True, default=None)

    class Meta:
        model = Transaction
        fields = [
            'id', 'title', 'amount', 'transaction_type', 'category',
            'category_name', 'category_icon', 'category_color',
            'date', 'notes', 'created_at', 'owner_username',
        ]
        read_only_fields = ['created_at', 'owner_username']
