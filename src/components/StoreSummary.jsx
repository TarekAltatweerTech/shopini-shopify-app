function Tile({ label, value, tone }) {
  return (
    <s-box padding="base" background="subdued" borderRadius="base">
      <s-stack direction="block" gap="small-500">
        <s-text tone="subdued">{label}</s-text>
        <s-heading tone={tone}>{value}</s-heading>
      </s-stack>
    </s-box>
  );
}

/**
 * The five counters from `summary`.
 *
 * Shown on the dashboard and, deliberately, on the pending-approval screen
 * too: a merchant waiting for approval can see their orders arriving and
 * queueing, which is the most useful thing to tell them while they wait.
 */
export default function StoreSummary({ summary }) {
  if (!summary) return null;

  return (
    <s-section heading="Orders">
      <s-grid gridTemplateColumns="repeat(auto-fit, minmax(140px, 1fr))" gap="base">
        <Tile label="Total" value={summary.total ?? 0} />
        <Tile label="Pending" value={summary.pending ?? 0} />
        <Tile label="Synced" value={summary.synced ?? 0} tone="success" />
        <Tile label="Cancelled" value={summary.cancelled ?? 0} tone="subdued" />
        <Tile label="Failed" value={summary.failed ?? 0} tone="critical" />
      </s-grid>
    </s-section>
  );
}
