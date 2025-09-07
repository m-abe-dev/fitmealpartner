import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingData } from '../types/onboarding.types';

const ONBOARDING_DATA_KEY = '@onboarding_data';

export class OnboardingStorageService {
  static async saveOnboardingData(data: OnboardingData): Promise<void> {
    try {
      const dataToStore = {
        ...data,
        completedAt: data.completedAt || new Date(),
      };
      await AsyncStorage.setItem(
        ONBOARDING_DATA_KEY,
        JSON.stringify(dataToStore)
      );
      console.log('Saved onboarding data:', dataToStore);
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      throw error;
    }
  }

  static async getOnboardingData(): Promise<OnboardingData | null> {
    try {
      const data = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      if (!data) {
        console.log('No onboarding data found');
        return null;
      }

      const parsedData = JSON.parse(data);

      // Date型の復元
      if (parsedData.profile?.birthDate) {
        parsedData.profile.birthDate = new Date(parsedData.profile.birthDate);
      }
      if (parsedData.completedAt) {
        parsedData.completedAt = new Date(parsedData.completedAt);
      }

      return parsedData;
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
      return null;
    }
  }

  static async isOnboardingComplete(): Promise<boolean> {
    try {
      const data = await this.getOnboardingData();
      return data !== null && !!data.completedAt;
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      return false;
    }
  }

  static async clearOnboardingData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
      console.log('Cleared onboarding data');
    } catch (error) {
      console.error('Failed to clear onboarding data:', error);
      throw error;
    }
  }

  static async updateOnboardingData(
    partialData: Partial<OnboardingData>
  ): Promise<void> {
    try {
      const existingData = await this.getOnboardingData();
      const updatedData = { ...existingData, ...partialData };
      await this.saveOnboardingData(updatedData as OnboardingData);
    } catch (error) {
      console.error('Failed to update onboarding data:', error);
      throw error;
    }
  }
}
