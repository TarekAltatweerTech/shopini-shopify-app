import { useCallback, useEffect, useState } from 'react';

import { fetchSyncLogs } from '../../lib/api.js';

const formatDate = (value) =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/**
 * Read-only feed of what the integration has been doing.
 *
 * Its job is to make "why has my order not shipped?" answerable by the
 * merchant rather than by support.
 */
export default function SyncLogs() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchSyncLogs({ page })
      .then(setResult)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(load, [load]);

  if (error) {
    return (
      <s-section heading="Sync activity">
        <s-banner tone="warning" heading="Could not load sync activity">
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
    <s-section heading="Sync activity">
      <s-stack direction="block" gap="base">
        {loading && !result ? (
          <s-spinner accessibilityLabel="Loading sync activity" />
        ) : rows.length === 0 ? (
          <s-paragraph tone="subdued">
            No activity yet. Sync events between your Shopify store and Shopini Express appear
            here.
          </s-paragraph>
        ) : (
          <>
            <s-table loading={loading || undefined}>
              <s-table-header-row>
                <s-table-header listSlot="primary">Event</s-table-header>
                <s-table-header>Direction</s-table-header>
                <s-table-header listSlot="inline">Status</s-table-header>
                <s-table-header>Details</s-table-header>
                <s-table-header>When</s-table-header>
              </s-table-header-row>

              <s-table-body>
                {rows.map((log) => (
                  <s-table-row key={log.id}>
                    <s-table-cell>
                      <s-text fontWeight="bold">{log.event ?? '—'}</s-text>
                    </s-table-cell>
                    <s-table-cell>{log.direction ?? '—'}</s-table-cell>
                    <s-table-cell>
                      <s-badge tone={log.status === 'success' ? 'success' : 'critical'}>
                        {log.status ?? 'unknown'}
                      </s-badge>
                    </s-table-cell>
                    <s-table-cell>
                      {/* Only failures carry one, and it is the reason a
                          merchant opened this tab in the first place. */}
                      {log.error_message ? (
                        <s-text tone="critical">{log.error_message}</s-text>
                      ) : (
                        '—'
                      )}
                    </s-table-cell>
                    <s-table-cell>{formatDate(log.created_at)}</s-table-cell>
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
