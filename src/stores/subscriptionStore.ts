import { create } from 'zustand';
import { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import RevenueCatService from '../services/RevenueCatService';

interface SubscriptionState {
  isInitialized: boolean;
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: (userId?: string) => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
  loadOfferings: () => Promise<void>;
  purchasePackage: (packageToPurchase: any) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  setUserID: (userId: string) => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isInitialized: false,
  isPro: false,
  customerInfo: null,
  offerings: [],
  isLoading: false,
  error: null,

  initialize: async (userId?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await RevenueCatService.initialize(userId);
      set({ isInitialized: true });
      
      // 初期化後に顧客情報を取得
      await get().refreshCustomerInfo();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize subscription service',
        isInitialized: false 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshCustomerInfo: async () => {
    if (!get().isInitialized) return;
    
    set({ isLoading: true, error: null });
    
    try {
      const customerInfo = await RevenueCatService.getCustomerInfo();
      const isPro = RevenueCatService.hasProAccess(customerInfo);
      
      set({ 
        customerInfo,
        isPro,
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get customer info' 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  loadOfferings: async () => {
    if (!get().isInitialized) return;
    
    set({ isLoading: true, error: null });
    
    try {
      const offerings = await RevenueCatService.getOfferings();
      set({ offerings });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load offerings' 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  purchasePackage: async (packageToPurchase: any) => {
    if (!get().isInitialized) return false;
    
    set({ isLoading: true, error: null });
    
    try {
      const customerInfo = await RevenueCatService.purchasePackage(packageToPurchase);
      const isPro = RevenueCatService.hasProAccess(customerInfo);
      
      set({ 
        customerInfo,
        isPro,
      });
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to complete purchase' 
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  restorePurchases: async () => {
    if (!get().isInitialized) return false;
    
    set({ isLoading: true, error: null });
    
    try {
      const customerInfo = await RevenueCatService.restorePurchases();
      const isPro = RevenueCatService.hasProAccess(customerInfo);
      
      set({ 
        customerInfo,
        isPro,
      });
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to restore purchases' 
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  setUserID: async (userId: string) => {
    if (!get().isInitialized) return;
    
    set({ isLoading: true, error: null });
    
    try {
      await RevenueCatService.setUserID(userId);
      // ユーザーID設定後に顧客情報を更新
      await get().refreshCustomerInfo();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to set user ID' 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  logOut: async () => {
    if (!get().isInitialized) return;
    
    set({ isLoading: true, error: null });
    
    try {
      await RevenueCatService.logOut();
      set({ 
        customerInfo: null,
        isPro: false,
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to log out' 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));