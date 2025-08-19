import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import DuckHuntGame from './components/DuckHuntGame';
import './App.css';

function App() {
  // Determine if we're in production or development
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Configure allowed origins based on environment
  const allowedOrigins = [];
  
  if (isDevelopment) {
    allowedOrigins.push('http://localhost:3000');
  }
  
  if (isProduction) {
    allowedOrigins.push('https://ducknads.vercel.app');
  }
  
  // Always include both for flexibility during development/testing
  allowedOrigins.push('http://localhost:3000', 'https://ducknads.vercel.app');
  
  const privyConfig = {
    // Appearance configuration
    appearance: {
      theme: 'dark',
      accentColor: '#6366f1',
      logo: 'https://ducknads.vercel.app/assets/ducknads.png', // Update with your actual logo URL
    },
    
    // Enable embedded wallets
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
      requireUserPasswordOnCreate: false,
      noPromptOnSignature: false,
    },
    
    // Cross-app configuration for Monad Games ID
    crossAppConfig: {
      enabled: true,
      apps: [{
        id: 'cmd8euall0037le0my79qpz42',
        name: 'Monad Games ID'
      }]
    },
    
    // Login methods configuration
    loginMethods: ['email', 'cross_app'],
    loginMethodsAndOrder: {
      primary: ['cross_app', 'email'],
      overflow: []
    },
    
    // Supported chains - include Monad testnet
    supportedChains: [
      {
        id: 41454,
        name: 'Monad Testnet',
        nativeCurrency: {
          name: 'MON',
          symbol: 'MON',
          decimals: 18
        },
        rpcUrls: {
          default: {
            http: ['https://testnet-rpc.monad.xyz']
          }
        },
        blockExplorers: {
          default: {
            name: 'Monad Explorer',
            url: 'https://testnet.monadexplorer.com'
          }
        },
        testnet: true
      }
    ],
    
    // Legal and compliance
    legal: {
      termsAndConditionsUrl: 'https://ducknads.vercel.app/terms',
      privacyPolicyUrl: 'https://ducknads.vercel.app/privacy'
    },
    
    // Additional configuration for production
    ...(isProduction && {
      // Production-specific settings
      mfa: {
        noPromptOnMfaRequired: false,
      }
    })
  };

  console.log('Environment:', process.env.NODE_ENV);
  console.log('Allowed origins:', allowedOrigins);
  console.log('Privy config:', privyConfig);

  return (
    <PrivyProvider
      appId="cmeep9jw40123l20bzc4n018i"
      config={privyConfig}
    >
      <div className="App">
        <DuckHuntGame />
      </div>
    </PrivyProvider>
  );
}

export default App;