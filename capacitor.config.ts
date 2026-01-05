import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  "appId": "com.front.mascotai",
  "appName": "MascotAI",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "hostname": "localhost"
  },
  "plugins": {
    "GoogleAuth": {
      "scopes": ["profile", "email"],
      "androidClientId": "412244128184-507a1mt5t8lqtr0ce6sajpofb7akod2c.apps.googleusercontent.com",
      "serverClientId": "412244128184-507a1mt5t8lqtr0ce6sajpofb7akod2c.apps.googleusercontent.com",
      "forceCodeForRefreshToken": true
    },
    "CapacitorCookies": {
      "enabled": true
    }
  }
};

export default config;
