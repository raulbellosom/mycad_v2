import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "mx.mycad.admin",
  appName: "MyCAD Admin",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#f97316",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#f97316",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true for development
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: true,
    scrollEnabled: true,
  },
};

export default config;
