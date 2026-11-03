import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fibi.app',
  appName: 'Find and Bind- FE',
  webDir: 'dist',
  // Bật server bên dưới nếu muốn debug Live-Reload trên Android Emulator (10.0.2.2:3000)
  // server: {
  //   url: 'http://10.0.2.2:3000/',
  //   cleartext: true
  // }
};

export default config;
