export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

/**
 * COD amounts arrive as strings from the backend's decimal columns. Group the
 * digits, drop the fraction — Iraqi dinar has no minor unit in practice — and
 * append the currency symbol.
 */
export function formatMoney(amount, currency) {
  if (amount === null || amount === undefined || amount === '') return '—';

  const value = Number(amount);
  if (Number.isNaN(value)) return '—';

  const formatted = value.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return currency ? `${formatted} ${currency}` : formatted;
}

/**
 * Badge colour for the Shopify-side status — whether this order became a
 * Shopini shipment at all. This is what the filter buttons act on.
 */
export function syncTone(status) {
  switch (status) {
    case 'synced':
      return 'success';
    case 'failed':
      return 'critical';
    case 'cancelled':
      return 'neutral';
    default: // pending
      return 'warning';
  }
}

/**
 * Badge colour for the Shopini-side status — where the parcel actually is.
 *
 * Two different things can be wrong and they need different colours: a sync
 * that failed (no shipment was ever created) and a shipment that hit an
 * exception or came back as a return.
 */
export function shipmentTone(order, shipment) {
  if (order.status === 'failed') return 'critical';
  if (order.status === 'cancelled') return 'neutral';

  if (shipment?.is_exception) return 'critical';
  if (shipment?.is_return) return 'warning';

  if (!shipment) return 'warning'; // pending: queued, not yet a shipment

  return 'success';
}
