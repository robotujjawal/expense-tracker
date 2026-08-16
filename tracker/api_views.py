from django.db.models import Sum
from rest_framework import viewsets, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import Category, Transaction
from .serializers import CategorySerializer, TransactionSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date', 'amount', 'created_at']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Transaction.objects.all()
        if not self.request.user.is_staff:
            qs = qs.filter(owner=self.request.user)

        tx_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')

        if tx_type in ('income', 'expense'):
            qs = qs.filter(transaction_type=tx_type)
        if category:
            qs = qs.filter(category_id=category)
        if search:
            qs = qs.filter(title__icontains=search)
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class SummaryView(APIView):
    """Returns totals + a per-category breakdown, used for the receipt
    card and the spending chart on the dashboard."""

    def get(self, request):
        if request.user.is_authenticated and not request.user.is_staff:
            base_qs = Transaction.objects.filter(owner=request.user)
        else:
            base_qs = Transaction.objects.all()

        income_total = base_qs.filter(transaction_type='income').aggregate(total=Sum('amount'))['total'] or 0
        expense_total = base_qs.filter(transaction_type='expense').aggregate(total=Sum('amount'))['total'] or 0

        breakdown_qs = (
            base_qs.filter(transaction_type='expense')
            .values('category__id', 'category__name', 'category__color', 'category__icon')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        breakdown = [
            {
                'category_id': row['category__id'],
                'name': row['category__name'] or 'Uncategorized',
                'color': row['category__color'] or '#8A8371',
                'icon': row['category__icon'] or '💰',
                'total': row['total'],
            }
            for row in breakdown_qs
        ]

        return Response({
            'income_total': income_total,
            'expense_total': expense_total,
            'balance': income_total - expense_total,
            'category_breakdown': breakdown,
        })


# ShortTermInvestmentView removed — investment suggestion feature deleted per request.
