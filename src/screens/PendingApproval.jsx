import StoreSummary from '../components/StoreSummary.jsx';

/**
 * The application is in. Shopini operations approve every merchant by hand
 * before shipments can flow, so this is an ordinary, expected state of the app
 * — not a failure, and it must not read like one.
 *
 * Orders are already being received and queued while the merchant waits, so
 * the counters are shown here too: it is the most useful thing we can tell
 * them, and it makes the wait visibly productive.
 */
export default function PendingApproval({ session, onRefresh }) {
  return (
    <s-page heading="Shopini Express">
      <s-button slot="secondary-actions" onClick={onRefresh}>
        Refresh
      </s-button>

      <s-section>
        <s-banner tone="info" heading="Your application is being reviewed">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              Thank you for joining Shopini Express. Our team is reviewing your account and will
              contact you shortly.
            </s-paragraph>
            <s-paragraph>
              Your store <s-text fontWeight="bold">{session?.store?.shop_domain}</s-text> is
              connected and new orders are already being collected. They will start shipping as
              soon as your account is approved.
            </s-paragraph>
          </s-stack>
        </s-banner>
      </s-section>

      <StoreSummary summary={session?.summary} />

      <s-section heading="What happens next">
        <s-ordered-list>
          <s-list-item>A Shopini Express representative reviews your application.</s-list-item>
          <s-list-item>
            We contact you on the phone number you provided to confirm your pickup address and
            pricing.
          </s-list-item>
          <s-list-item>
            Once approved, orders from this store become shipments automatically and tracking is
            written back to Shopify.
          </s-list-item>
        </s-ordered-list>
      </s-section>
    </s-page>
  );
}
