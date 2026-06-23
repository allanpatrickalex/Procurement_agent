import io
import pandas as pd
from app.services.csv_service import CSVService


def test_map_columns_common_aliases():
    csv = 'Supplier,Expense Type,Invoice Amount,Invoice Date\nA,Office,100,2024-01-01'
    df = pd.read_csv(io.StringIO(csv), nrows=0)
    svc = CSVService()
    result = svc.map_columns(df)
    mapping = result.get('mapping', {})

    assert mapping['vendor'] in ('Supplier', 'supplier', 'Supplier')
    assert mapping['amount'] in ('Invoice Amount', 'invoice amount', 'Invoice Amount')
    assert mapping['category'] in ('Expense Type', 'expense type', 'Expense Type')


def test_calculate_metrics_simple_csv():
    csv = 'Vendor,Category,Amount,Date\nA,Office,100,2024-01-01\nB,IT,200,2024-01-02'
    svc = CSVService()
    content = csv.encode('utf-8')
    metrics = svc.calculate_metrics(content, 'test.csv')

    assert metrics['transaction_count'] == 2
    assert metrics['total_spend'] == 300.0
    assert 'spend_by_vendor' in metrics
