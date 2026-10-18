import './index.css';
import './lib/leaflet-setup';
import './lib/gateway-auth';
import { ThemeProvider } from 'next-themes';
import { createRoot } from 'react-dom/client';

import App from './App.jsx';
import { GenesisRoot } from './lib/genesis.jsx';
import { setupThemeBridge } from './lib/theme-bridge';

setupThemeBridge();

createRoot(document.getElementById('root')!).render(
  <GenesisRoot>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <App />
    </ThemeProvider>
  </GenesisRoot>,
);
