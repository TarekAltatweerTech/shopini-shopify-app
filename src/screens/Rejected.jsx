/**
 * Operations declined the application.
 *
 * This is a dead end and the screen says so, because the alternative — leaving
 * a declined merchant on a "being reviewed" banner — means waiting forever for
 * something that is not coming. The one thing this screen owes them is a way
 * to reach a human.
 */
export default function Rejected({ session }) {
  return (
    <s-page heading="Shopini Express">
      <s-section>
        <s-banner tone="critical" heading="Your application was not approved">
          <s-paragraph>
            We were unable to approve a Shopini Express account for this store. Our support team
            can explain why and tell you whether anything can be resolved.
          </s-paragraph>
        </s-banner>
      </s-section>

      <s-section heading="Contact support">
        <s-stack direction="block" gap="base">
          <s-paragraph tone="subdued">
            Quote your store domain{' '}
            <s-text fontWeight="bold">{session?.store?.shop_domain}</s-text> when you get in touch.
          </s-paragraph>
          <s-unordered-list>
            <s-list-item>Email: support@shopini-express.com</s-list-item>
            <s-list-item>Phone: +964 000 000 0000</s-list-item>
          </s-unordered-list>
        </s-stack>
      </s-section>
    </s-page>
  );
}
