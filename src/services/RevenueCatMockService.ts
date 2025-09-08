// 開発環境用のモックサービス
class RevenueCatMockService {
  private isInitialized = false;
  private mockProStatus = false; // テスト用にPro状態を管理

  async initialize(userId?: string): Promise<void> {
    console.log('RevenueCat Mock: Initialize with userId:', userId);
    this.isInitialized = true;
  }

  async getCustomerInfo(): Promise<any> {
    console.log('RevenueCat Mock: Getting customer info');
    return {
      entitlements: {
        active: this.mockProStatus ? { pro: { isActive: true } } : {}
      }
    };
  }

  async getOfferings(): Promise<any[]> {
    console.log('RevenueCat Mock: Getting offerings');
    return [
      {
        identifier: 'default',
        availablePackages: [
          {
            identifier: 'monthly',
            product: {
              price: 980,
              priceString: '¥980',
              title: 'FitMeal Pro 月額プラン'
            }
          },
          {
            identifier: 'yearly',
            product: {
              price: 9800,
              priceString: '¥9,800',
              title: 'FitMeal Pro 年額プラン'
            }
          }
        ]
      }
    ];
  }

  async purchasePackage(packageToPurchase: any): Promise<any> {
    console.log('RevenueCat Mock: Purchasing package', packageToPurchase);
    this.mockProStatus = true;
    return this.getCustomerInfo();
  }

  async restorePurchases(): Promise<any> {
    console.log('RevenueCat Mock: Restoring purchases');
    return this.getCustomerInfo();
  }

  async logIn(userId: string): Promise<void> {
    console.log('RevenueCat Mock: Login with userId:', userId);
  }

  async logOut(): Promise<void> {
    console.log('RevenueCat Mock: Logout');
    this.mockProStatus = false;
  }

  hasProAccess(customerInfo: any): boolean {
    return !!customerInfo?.entitlements?.active?.pro;
  }

  isProUser(customerInfo: any): boolean {
    return this.hasProAccess(customerInfo);
  }

  async setUserID(userId: string): Promise<void> {
    console.log('RevenueCat Mock: Set user ID:', userId);
  }

  // テスト用: Pro状態を切り替え
  toggleMockProStatus(): void {
    this.mockProStatus = !this.mockProStatus;
    console.log('RevenueCat Mock: Pro status is now', this.mockProStatus);
  }
}

export default new RevenueCatMockService();