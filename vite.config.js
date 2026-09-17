import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

/**
 * Preact, aliased so that every source file imports from 'react' and
 * 'react-dom/client' exactly as it would in a React project. The hooks, the
 * JSX and the component model are identical; only the runtime differs.
 *
 * The runtime matters here. Polaris ships as custom elements, and Preact
 * passes props through to a custom element as properties and binds `onEvent`
 * handlers with addEventListener. React's synthetic event system does not do
 * that reliably for unknown elements, which is why Shopify's own scaffolding
 * for Polaris web components is Preact.
 *
 * `@preact/preset-vite` installs the react -> preact/compat aliases itself.
 */
export default defineConfig({
  plugins: [preact()],

  build: {
    outDir: 'dist',
    sourcemap: false,
  },

  server: {
    port: 5173,
    // Reached through a tunnel, since Shopify must load the app over HTTPS
    // from its own origin. Accept whatever Host header arrives.
    host: true,
    allowedHosts: true,
  },
});
