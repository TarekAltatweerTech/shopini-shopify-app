/**
 * Wording is chosen per status, because the failures a merchant can hit here
 * call for different actions from them.
 */
function describe(error) {
  switch (error?.status) {
    case 401:
      return {
        heading: 'Your session expired',
        body: 'Reload the page to continue.',
      };
    case 502:
      return {
        heading: 'Could not finish connecting to Shopify',
        body: 'This is usually temporary. Try again in a moment; if it keeps happening, contact Shopini Express support.',
      };
    case 0:
      return {
        heading: 'Could not reach Shopini Express',
        body: 'Check your connection and try again.',
      };
    default:
      return {
        heading: 'Something went wrong',
        body: error?.message ?? 'Please try again.',
      };
  }
}

export default function ErrorState({ error, onRetry }) {
  const { heading, body } = describe(error);

  return (
    <s-page heading="Shopini Express">
      <s-section>
        <s-banner tone="warning" heading={heading}>
          <s-stack direction="block" gap="base">
            <s-paragraph>{body}</s-paragraph>
            {onRetry && <s-button onClick={onRetry}>Try again</s-button>}
          </s-stack>
        </s-banner>
      </s-section>
    </s-page>
  );
}
