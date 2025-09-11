import { Food as FoodType } from '../screens/nutrition/types/nutrition.types';
import { Food as DBFood } from './database/repositories/FoodRepository';
import FoodRepository from './database/repositories/FoodRepository';

interface OpenFoodFactsProduct {
  product_name: string;
  brands?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
  };
  image_front_url?: string;
  quantity?: string;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

class OpenFoodFactsService {
  private readonly BASE_URL = 'https://world.openfoodfacts.org/api/v0';

  async searchByBarcode(barcode: string): Promise<FoodType | null> {
    try {
      console.log(`🔍 Searching for barcode: ${barcode}`);
      
      // まずローカルDBをチェック
      const localFood = await FoodRepository.getFoodByBarcode(barcode);
      if (localFood) {
        console.log('📦 Found in local database');
        return {
          id: localFood.food_id,
          name: localFood.name_ja,
          calories: Math.round(localFood.kcal100),
          protein: Math.round(localFood.p100 * 10) / 10,
          fat: Math.round(localFood.f100 * 10) / 10,
          carbs: Math.round(localFood.c100 * 10) / 10,
          amount: 100,
          unit: 'g',
          barcode: barcode,
          brand: localFood.brand || undefined,
        };
      }
      
      console.log('🌐 Searching Open Food Facts API...');
      
      // APIから取得（タイムアウト設定付き）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
      
      try {
        const response = await fetch(
          `${this.BASE_URL}/product/${barcode}.json`,
          {
            method: 'GET',
            headers: {
              'User-Agent': 'FitMealPartner/1.0',
            },
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.log('Product not found in API');
          return null;
        }

        const data: OpenFoodFactsResponse = await response.json();
        
        if (data.status !== 1 || !data.product) {
          return null;
        }

        const product = data.product;
        
        // データを内部フォーマットに変換
        const food: FoodType = {
          id: `off_${barcode}`,
          name: product.product_name || '商品名不明',
          calories: Math.round(product.nutriments['energy-kcal_100g'] || 0),
          protein: Math.round((product.nutriments.proteins_100g || 0) * 10) / 10,
          fat: Math.round((product.nutriments.fat_100g || 0) * 10) / 10,
          carbs: Math.round((product.nutriments.carbohydrates_100g || 0) * 10) / 10,
          amount: 100,
          unit: 'g',
          barcode: barcode,
          brand: product.brands || undefined,
        };

        // データベースに保存（バックグラウンドで実行）
        this.saveFoodToDatabase(food, barcode, product).catch(err => {
          console.warn('Failed to save to database:', err);
        });
        
        return food;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.log('API request timed out');
        } else {
          console.error('API request failed:', fetchError);
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Error in searchByBarcode:', error);
      return null;
    }
  }

  private async saveFoodToDatabase(
    food: FoodType, 
    barcode: string, 
    product: OpenFoodFactsProduct
  ): Promise<void> {
    try {
      console.log(`💾 Saving food to database: ${food.name} (ID: ${food.id})`);
      
      const dbFood: Omit<DBFood, 'created_at'> = {
        food_id: food.id,
        name_ja: food.name,
        name_en: food.name,
        barcode: barcode,
        brand: product.brands,
        category: '商品',
        p100: food.protein,
        f100: food.fat,
        c100: food.carbs,
        kcal100: food.calories,
        source: 'openfoodfacts',
        is_favorite: false,
      };

      await FoodRepository.addFood(dbFood);
      console.log('✅ Food saved to database successfully');
    } catch (error) {
      console.error('❌ Failed to save food to database:', {
        foodId: food.id,
        barcode: barcode,
        error: error instanceof Error ? error.message : error,
      });
      // エラーが発生してもアプリをクラッシュさせない
    }
  }
}

export default new OpenFoodFactsService();