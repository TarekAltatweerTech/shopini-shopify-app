import { useEffect, useState } from 'react';

import { fetchOrder } from '../../lib/api.js';
import { formatDate, formatMoney, shipmentTone } from '../../lib/format.js';

function Row({ label, children }) {
  if (children === null || children === undefined || children === '') return null;

  return (
    <s-stack direction="block" gap="small-500">
      <s-text tone="subdued">{label}</s-text>
      <s-paragraph>{children}</s-paragraph>
    </s-stack>
  );
}

/**
 * Everything Shopini knows about one order.
 *
 * Grouped the way a merchant reads it: where the parcel is, who it is going to,
 * what is owed on delivery, and — when a sync failed — why.
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

  const shipment = order?.shipment;

  return (
    <s-section heading={order ? `Order ${order.shopify_order_number ?? ''}` : 'Order'}>
      <s-stack direction="block" gap="large">
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

            {shipment?.is_exception && (
              <s-banner tone="critical" heading="This shipment has an exception">
                <s-paragraph>
                  Shopini Express flagged a problem with this parcel. Our support team can tell you
                  more.
                </s-paragraph>
              </s-banner>
            )}

            {shipment?.is_return && (
              <s-banner tone="warning" heading="This shipment is a return">
                <s-paragraph>The parcel is on its way back to you.</s-paragraph>
              </s-banner>
            )}

            {/* ---------------------------------------------------------- */}

            <s-stack direction="block" gap="base">
              <s-heading>Shipment</s-heading>

              <s-grid gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="base">
                <s-stack direction="block" gap="small-500">
                  <s-text tone="subdued">Status</s-text>
                  <s-badge tone={shipmentTone(order, shipment)}>
                    {shipment?.state?.name ?? order.status}
                  </s-badge>
                </s-stack>

                <Row label="Tracking number">
                  {order.tracking_url && order.tracking_number ? (
                    <s-link href={order.tracking_url} target="_blank">
                      {order.tracking_number}
                    </s-link>
                  ) : (
                    (order.tracking_number ?? '—')
                  )}
                </Row>

                <Row label="Shipment number">
                  {shipment?.id ? `#${shipment.id}` : '—'}
                </Row>

                <Row label="Boxes">{shipment?.boxes ?? '—'}</Row>
                <Row label="Weight">{shipment?.weight ? `${shipment.weight} kg` : '—'}</Row>
              </s-grid>
            </s-stack>

            {/* ---------------------------------------------------------- */}

            <s-stack direction="block" gap="base">
              <s-heading>Payment</s-heading>

              <s-grid gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="base">
                <Row label="Payment type">{shipment?.payment_type ?? '—'}</Row>

                {shipment?.payment_type === 'COD' && (
                  <Row label="Amount to collect">
                    {formatMoney(shipment?.cod?.amount, shipment?.cod?.currency)}
                  </Row>
                )}
              </s-grid>
            </s-stack>

            {/* ---------------------------------------------------------- */}

            <s-stack direction="block" gap="base">
              <s-heading>Customer</s-heading>

              <s-grid gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="base">
                <Row label="Name">{shipment?.customer?.name ?? '—'}</Row>
                <Row label="Phone">{shipment?.customer?.phone ?? '—'}</Row>
                <Row label="City">
                  {[shipment?.customer?.city, shipment?.customer?.governorate]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </Row>
              </s-grid>

              <Row label="Address">{shipment?.customer?.address ?? '—'}</Row>
              <Row label="Notes">{shipment?.notes}</Row>
            </s-stack>

            {/* ---------------------------------------------------------- */}

            <s-stack direction="block" gap="base">
              <s-heading>Timeline</s-heading>

              <s-grid gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="base">
                <Row label="Order received">{formatDate(order.created_at)}</Row>
                <Row label="Shipment created">{formatDate(shipment?.created_at)}</Row>
                <Row label="Last updated">{formatDate(order.updated_at)}</Row>
              </s-grid>
            </s-stack>
          </>
        )}
      </s-stack>
    </s-section>
  );
}
