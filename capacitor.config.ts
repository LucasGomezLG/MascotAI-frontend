import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.front.mascotai',
  appName: 'MascotAI',
  webDir: 'dist',
  plugins: {
    // capacitor.config.ts
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // 🔄 Probá usando el ID WEB aquí también si el de Android falla
      androidClientId: '412244128184-507a1mt5t8lqtr0ce6sajpofb7akod2c.apps.googleusercontent.com',
      serverClientId: '412244128184-507a1mt5t8lqtr0ce6sajpofb7akod2c.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    CapacitorCookies: {
      enabled: true,
    },
  },
};

export default config;