import { useCallback, useEffect, useState } from 'react';

import { fetchOrders } from '../../lib/api.js';
import OrderDetail from './OrderDetail.jsx';

const FILTERS = [
  { id: 'all', label: 'All', value: undefined },
  { id: 'pending', label: 'Pending', value: 'pending' },
  { id: 'synced', label: 'Synced', value: 'synced' },
  { id: 'failed', label: 'Failed', value: 'failed' },
  { id: 'cancelled', label: 'Cancelled', value: 'cancelled' },
];

const TONES = {
  synced: 'success',
  pending: 'warning',
  failed: 'critical',
  cancelled: 'neutral',
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function OrdersTable() {
  const [filter, setFilter] = useState(0);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openOrderId, setOpenOrderId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchOrders({ status: FILTERS[filter].value, page })
      .then(setResult)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(load, [load]);

  const selectFilter = useCallback((index) => {
    setFilter(index);
    setPage(1); // A filter change invalidates the current page number.
  }, []);

  if (openOrderId) {
    return <OrderDetail orderId={openOrderId} onBack={() => setOpenOrderId(null)} />;
  }

  if (error) {
    return (
      <s-section heading="Orders">
        <s-banner tone="warning" heading="Could not load orders">
          <s-stack direction="block" gap="base">
            <s-paragraph>{error.message}</s-paragraph>
            <s-button onClick={load}>Try again</s-button>
          </s-stack>
        </s-banner>
      </s-section>
    );
  }

  const rows = result?.data ?? [];

  return (
    <s-section heading="Orders">
      <s-stack direction="block" gap="base">
        <s-stack direction="inline" gap="small-300">
          {FILTERS.map((item, index) => (
            <s-button
              key={item.id}
              variant={filter === index ? 'primary' : 'tertiary'}
              onClick={() => selectFilter(index)}
            >
              {item.label}
            </s-button>
          ))}
        </s-stack>

        {loading && !result ? (
          <s-spinner accessibilityLabel="Loading orders" />
        ) : rows.length === 0 ? (
          <s-paragraph tone="subdued">
            No orders yet. Orders placed in your Shopify store appear here once they are paid and
            turned into Shopini Express shipments.
          </s-paragraph>
        ) : (
          <>
            <s-table loading={loading || undefined}>
              <s-table-header-row>
                <s-table-header listSlot="primary">Order</s-table-header>
                <s-table-header>Shipment</s-table-header>
                <s-table-header>Tracking</s-table-header>
                <s-table-header listSlot="inline">Status</s-table-header>
                <s-table-header>Created</s-table-header>
                <s-table-header>{''}</s-table-header>
              </s-table-header-row>

              <s-table-body>
                {rows.map((order) => (
                  <s-table-row key={order.id}>
                    <s-table-cell>
                      <s-text fontWeight="bold">{order.shopify_order_number ?? '—'}</s-text>
                    </s-table-cell>
                    <s-table-cell>{order.shipment_id ?? '—'}</s-table-cell>
                    <s-table-cell>
                      {order.tracking_url ? (
                        // Opens the public tracking page in a new tab.
                        // target="_blank" is safe; target="_top" would navigate
                        // the admin frame away from Shopify.
                        <s-link href={order.tracking_url} target="_blank">
                          {order.tracking_number}
                        </s-link>
                      ) : (
                        (order.tracking_number ?? '—')
                      )}
                    </s-table-cell>
                    <s-table-cell>
                      <s-badge tone={TONES[order.status]}>{order.status}</s-badge>
                    </s-table-cell>
                    <s-table-cell>{formatDate(order.created_at)}</s-table-cell>
                    <s-table-cell>
                      <s-button variant="tertiary" onClick={() => setOpenOrderId(order.id)}>
                        View
                      </s-button>
                    </s-table-cell>
                  </s-table-row>
                ))}
              </s-table-body>
            </s-table>

            {result?.last_page > 1 && (
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-button disabled={page <= 1 || undefined} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </s-button>
                <s-text tone="subdued">
                  Page {result.current_page} of {result.last_page}
                </s-text>
                <s-button
                  disabled={page >= result.last_page || undefined}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </s-button>
              </s-stack>
            )}
          </>
        )}
      </s-stack>
    </s-section>
  );
}
