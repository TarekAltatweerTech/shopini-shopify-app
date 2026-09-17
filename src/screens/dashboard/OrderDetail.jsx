import { useEffect, useState } from 'react';

import { fetchOrder } from '../../lib/api.js';

const TONES = {
  synced: 'success',
  pending: 'warning',
  failed: 'critical',
  cancelled: 'neutral',
};

function Row({ label, children }) {
  return (
    <s-stack direction="block" gap="small-500">
      <s-text tone="subdued">{label}</s-text>
      <s-paragraph>{children ?? '—'}</s-paragraph>
    </s-stack>
  );
}

/**
 * One order's detail.
 *
 * The reason this screen exists is `last_error`: when a sync fails, it is the
 * only place a merchant can find out why without contacting support.
 */
export default function OrderDetail({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setOrder(null);
    setError(null);

    fetchOrder(orderId)
      .then((response) => setOrder(response.data))
      .catch(setError);
  }, [orderId]);

  return (
    <s-section heading={order ? `Order ${order.shopify_order_number ?? ''}` : 'Order'}>
      <s-stack direction="block" gap="base">
        <s-button variant="tertiary" onClick={onBack}>
          Back to orders
        </s-button>

        {error ? (
          <s-banner tone="warning" heading="Could not load this order">
            <s-paragraph>{error.message}</s-paragraph>
          </s-banner>
        ) : !order ? (
          <s-spinner accessibilityLabel="Loading order" />
        ) : (
          <>
            {order.status === 'failed' && order.last_error && (
              <s-banner tone="critical" heading="This order could not be synced">
                <s-paragraph>{order.last_error}</s-paragraph>
              </s-banner>
            )}

            <Row label="Status">
              <s-badge tone={TONES[order.status]}>{order.status}</s-badge>
            </Row>

            <Row label="Shopify order">{order.shopify_order_number}</Row>
            <Row label="Shopini shipment">{order.shipment_id}</Row>

            <Row label="Tracking number">
              {order.tracking_url ? (
                <s-link href={order.tracking_url} target="_blank">
                  {order.tracking_number}
                </s-link>
              ) : (
                order.tracking_number
              )}
            </Row>

            <Row label="Created">
              {order.created_at ? new Date(order.created_at).toLocaleString() : null}
            </Row>
            <Row label="Last updated">
              {order.updated_at ? new Date(order.updated_at).toLocaleString() : null}
            </Row>
          </>
        )}
      </s-stack>
    </s-section>
  );
}
