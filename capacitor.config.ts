import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fibi.app',
  appName: 'Find and Bind- FE',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.3:3000',
    cleartext: true
  }
};

export default config;
