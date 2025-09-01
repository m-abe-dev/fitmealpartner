import FoodRepository from './database/repositories/FoodRepository';
import { Food as DBFood } from './database/repositories/FoodRepository';
import { Food } from '../screens/nutrition/types/nutrition.types';

interface FoodData {
  barcode: string;
  name: string;
  brand?: string;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  serving?: {
    size: number;
    unit: string;
  };
}

class FoodDatabaseService {
  async searchByBarcode(barcode: string): Promise<Food | null> {
    try {
      const localFood = await FoodRepository.getFoodByBarcode(barcode);
      if (localFood) {
        return this.formatLocalFood(localFood);
      }

      const japaneseFood = await this.searchJapaneseDatabase(barcode);
      if (japaneseFood) {
        await this.saveToLocalDB(japaneseFood);
        return this.formatFoodData(japaneseFood);
      }

      const internationalFood = await this.searchInternationalDatabase(barcode);
      if (internationalFood) {
        await this.saveToLocalDB(internationalFood);
        return this.formatFoodData(internationalFood);
      }

      return null;
    } catch (error) {
      console.error('Barcode search error:', error);
      return null;
    }
  }

  private async searchJapaneseDatabase(barcode: string): Promise<FoodData | null> {
    if (!barcode.startsWith('45') && !barcode.startsWith('49')) {
      return null;
    }

    try {
      const mockJapaneseDB: { [key: string]: FoodData } = {
        '4901306024102': {
          barcode: '4901306024102',
          name: 'カップヌードル',
          brand: '日清食品',
          nutrition: {
            calories: 353,
            protein: 10.5,
            fat: 14.6,
            carbs: 44.5
          },
          serving: { size: 78, unit: 'g' }
        },
        '4902102072458': {
          barcode: '4902102072458',
          name: 'プロテインバー チョコ味',
          brand: 'SAVAS',
          nutrition: {
            calories: 120,
            protein: 15.0,
            fat: 2.8,
            carbs: 6.2
          },
          serving: { size: 35, unit: 'g' }
        },
        '4901001234567': {
          barcode: '4901001234567',
          name: 'サラダチキン（プレーン）',
          brand: 'セブンイレブン',
          nutrition: {
            calories: 98,
            protein: 21.7,
            fat: 0.8,
            carbs: 0.1
          },
          serving: { size: 115, unit: 'g' }
        },
      };

      return mockJapaneseDB[barcode] || null;
    } catch (error) {
      console.error('Japanese DB search error:', error);
      return null;
    }
  }

  private async searchInternationalDatabase(barcode: string): Promise<FoodData | null> {
    try {
      return null;
    } catch (error) {
      console.error('International DB search error:', error);
      return null;
    }
  }

  private async saveToLocalDB(foodData: FoodData): Promise<void> {
    const servingSize = foodData.serving?.size || 100;
    const ratio = 100 / servingSize;

    await FoodRepository.addFood({
      food_id: `barcode_${foodData.barcode}`,
      name_ja: foodData.name,
      name_en: foodData.name,
      brand: foodData.brand,
      barcode: foodData.barcode,
      category: '商品',
      p100: foodData.nutrition.protein * ratio,
      f100: foodData.nutrition.fat * ratio,
      c100: foodData.nutrition.carbs * ratio,
      kcal100: foodData.nutrition.calories * ratio,
      source: 'barcode',
      is_favorite: false
    });
  }

  private formatLocalFood(food: DBFood): Food {
    return {
      id: food.food_id,
      name: food.name_ja,
      calories: Math.round(food.kcal100),
      protein: Math.round(food.p100 * 10) / 10,
      fat: Math.round(food.f100 * 10) / 10,
      carbs: Math.round(food.c100 * 10) / 10,
    };
  }

  private formatFoodData(foodData: FoodData): Food {
    const servingSize = foodData.serving?.size || 100;
    const ratio = 100 / servingSize;

    return {
      id: `barcode_${foodData.barcode}`,
      name: foodData.name,
      calories: Math.round(foodData.nutrition.calories * ratio),
      protein: Math.round(foodData.nutrition.protein * ratio * 10) / 10,
      fat: Math.round(foodData.nutrition.fat * ratio * 10) / 10,
      carbs: Math.round(foodData.nutrition.carbs * ratio * 10) / 10,
    };
  }
}

export default new FoodDatabaseService();