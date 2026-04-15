import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.earthquakeapp.earlywarning",
  appName: "Earthquake Early Warning",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#CE0B7C",
    },
  },
};

export default config;
