/**
 * `window.shopify` is undefined.
 *
 * In production this means the page was opened directly instead of from the
 * Shopify admin. There is no session token to be had, so retrying cannot help
 * and this screen offers no retry.
 *
 * In development it almost always means one of three things: a Shopify script
 * is missing from index.html, app-bridge.js is not the first script in <head>,
 * or VITE_SHOPIFY_API_KEY is empty so the meta tag rendered blank.
 */
export default function NotEmbedded() {
  return (
    <s-page heading="Shopini Express">
      <s-section heading="Open this app from your Shopify admin">
        <s-paragraph>
          Shopini Express runs inside the Shopify admin. Go to <s-text fontWeight="bold">Apps</s-text>{' '}
          in your store and open Shopini Express from there.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
