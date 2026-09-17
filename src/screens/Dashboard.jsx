import { useState } from 'react';

import StoreSummary from '../components/StoreSummary.jsx';
import OrdersTable from './dashboard/OrdersTable.jsx';
import SyncLogs from './dashboard/SyncLogs.jsx';

export default function Dashboard({ session, onRefresh }) {
  const [view, setView] = useState('orders');

  return (
    <s-page heading="Shopini Express">
      <s-button slot="secondary-actions" onClick={onRefresh}>
        Refresh
      </s-button>

      <StoreSummary summary={session?.summary} />

      <s-section>
        <s-stack direction="inline" gap="base">
          <s-button
            variant={view === 'orders' ? 'primary' : 'secondary'}
            onClick={() => setView('orders')}
          >
            Orders
          </s-button>
          <s-button
            variant={view === 'logs' ? 'primary' : 'secondary'}
            onClick={() => setView('logs')}
          >
            Sync activity
          </s-button>
        </s-stack>
      </s-section>

      {view === 'orders' ? <OrdersTable /> : <SyncLogs />}
    </s-page>
  );
}
