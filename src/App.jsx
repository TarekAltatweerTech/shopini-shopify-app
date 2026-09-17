import { useCallback, useEffect, useState } from 'react';

import { fetchSession, hasAppBridge } from './lib/api.js';
import Loading from './components/Loading.jsx';
import ErrorState from './components/ErrorState.jsx';
import NotEmbedded from './components/NotEmbedded.jsx';
import Onboarding from './screens/Onboarding.jsx';
import PendingApproval from './screens/PendingApproval.jsx';
import Rejected from './screens/Rejected.jsx';
import Dashboard from './screens/Dashboard.jsx';

/**
 * The whole app is a switch on one field.
 *
 * `state` comes back from /api/shopify/session and has four values. Each one
 * renders a real screen with something on it — a merchant waiting on approval
 * is an ordinary state of this app, not a failure, and none of the four is an
 * error page.
 */
export default function App() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    setSession(null);

    fetchSession().then(setSession).catch(setError);
  }, []);

  useEffect(() => {
    if (hasAppBridge()) load();
  }, [load]);

  // Opened outside the Shopify admin — no session token exists, so there is
  // nothing to retry. Say so plainly instead of failing a request.
  if (!hasAppBridge()) return <NotEmbedded />;

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!session) return <Loading />;

  switch (session.state) {
    case 'needs_onboarding':
      return <Onboarding onComplete={setSession} />;

    case 'pending_approval':
      return <PendingApproval session={session} onRefresh={load} />;

    case 'rejected':
      return <Rejected session={session} />;

    case 'active':
      return <Dashboard session={session} onRefresh={load} />;

    default:
      return <ErrorState onRetry={load} />;
  }
}
