import StoreSummary from '../components/StoreSummary.jsx';
import OrdersTable from './dashboard/OrdersTable.jsx';

export default function Dashboard({ session, onRefresh }) {
  return (
    <s-page heading="Shopini Express">
      <s-button slot="secondary-actions" onClick={onRefresh}>
        Refresh
      </s-button>

      <StoreSummary summary={session?.summary} />

      <OrdersTable />
    </s-page>
  );
}
