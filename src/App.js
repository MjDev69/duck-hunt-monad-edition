import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import DuckHuntGame from './components/DuckHuntGame';
import './App.css';

function App() {
  return (
    <PrivyProvider
      appId="cmeep9jw40123l20bzc4n018i"
      config={{
        // Minimal config to test if cross-app works
        appearance: {
          theme: 'dark',
          accentColor: '#6366f1'
        },
        // Enable embedded wallets
        embeddedWallets: {
          createOnLogin: 'users-without-wallets'
        },
        // Try explicit cross-app configuration
        crossAppConfig: {
          enabled: true,
          apps: [{
            id: 'cmd8euall0037le0my79qpz42',
            name: 'Monad Games ID'
          }]
        }
      }}
    >
      <div className="App">
        <DuckHuntGame />
      </div>
    </PrivyProvider>
  );
}

export default App;