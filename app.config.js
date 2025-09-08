export default {
  expo: {
    name: "FitMealPartner",
    slug: "fitmealpartner",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.fitmealpartner.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.fitmealpartner.app"
    },
    // プラグイン設定を一時的にコメントアウト
    // plugins: [
    //   [
    //     "react-native-purchases",
    //     {
    //       apiKey: {
    //         ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    //         android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
    //       }
    //     }
    //   ]
    // ]
  }
};