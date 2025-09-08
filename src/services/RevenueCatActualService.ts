import Purchases, { CustomerInfo, PurchasesOffering, PurchasesError } from 'react-native-purchases';
import { Platform } from 'react-native';

class RevenueCatService {
  private static instance: RevenueCatService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
        android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
      });

      if (!apiKey) {
        throw new Error('RevenueCat API key not configured for this platform');
      }

      await Purchases.configure({
        apiKey,
        appUserID: userId,
      });

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }
    
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Failed to get offerings:', error);
      throw error;
    }
  }

  async purchasePackage(packageToPurchase: any): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('Purchase successful:', customerInfo);
      return customerInfo;
    } catch (error) {
      if ((error as PurchasesError).userCancelled) {
        console.log('Purchase cancelled by user');
        throw new Error('Purchase cancelled');
      }
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      return await Purchases.restorePurchases();
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  async setUserID(userId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('Failed to set user ID:', error);
      throw error;
    }
  }

  async logOut(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Failed to log out:', error);
      throw error;
    }
  }

  isProUser(customerInfo: CustomerInfo): boolean {
    return Object.keys(customerInfo.entitlements.active).length > 0;
  }

  hasProAccess(customerInfo: CustomerInfo): boolean {
    const proEntitlement = customerInfo.entitlements.active['pro'];
    return proEntitlement?.isActive === true;
  }
}

export default RevenueCatService.getInstance();