import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3150663c77b64236949dce8d5a53590a',
  appName: 'venda-direta-hub',
  webDir: 'dist',
  server: {
    url: 'https://3150663c-77b6-4236-949d-ce8d5a53590a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION']
    }
  }
};

export default config;