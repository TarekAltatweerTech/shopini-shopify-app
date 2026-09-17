export default function Loading({ label = 'Loading' }) {
  return (
    <s-page heading="Shopini Express">
      <s-section>
        <s-stack direction="block" gap="base" alignItems="center">
          <s-spinner accessibilityLabel={label} />
        </s-stack>
      </s-section>
    </s-page>
  );
}
