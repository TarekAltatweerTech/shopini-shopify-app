import { createRoot } from 'react-dom/client';

import App from './App.jsx';

/**
 * No provider and no stylesheet import.
 *
 * Polaris web components load from Shopify's CDN (see index.html), carry their
 * own styles, and pick up the merchant's admin theme — including dark mode and
 * right-to-left — without anything from this bundle.
 */
createRoot(document.getElementById('root')).render(<App />);
