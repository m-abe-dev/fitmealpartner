import foodCompositionData from '../data/japanese-food-composition-2023.json';

interface JapaneseFoodItem {
  food_code: string;
  name_ja: string;
  category: string;
  energy_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrate_g: number;
  water_g?: number;
}

class JapaneseFoodCompositionService {
  private foodDatabase: Map<string, JapaneseFoodItem>;
  
  constructor() {
    this.foodDatabase = new Map(
      foodCompositionData.map(item => [item.food_code, item])
    );
  }

  searchByName(query: string): JapaneseFoodItem[] {
    const normalizedQuery = query.toLowerCase().trim();
    const results: JapaneseFoodItem[] = [];
    
    for (const food of this.foodDatabase.values()) {
      if (food.name_ja.includes(query)) {
        results.push(food);
      }
    }
    
    return this.rankResults(results, query);
  }
  
  private rankResults(results: JapaneseFoodItem[], query: string): JapaneseFoodItem[] {
    return results.sort((a, b) => {
      if (a.name_ja === query) return -1;
      if (b.name_ja === query) return 1;
      
      if (a.name_ja.startsWith(query)) return -1;
      if (b.name_ja.startsWith(query)) return 1;
      
      return a.name_ja.length - b.name_ja.length;
    }).slice(0, 20);
  }

  getFoodByCode(foodCode: string): JapaneseFoodItem | undefined {
    return this.foodDatabase.get(foodCode);
  }

  searchByCategory(category: string): JapaneseFoodItem[] {
    const results: JapaneseFoodItem[] = [];
    
    for (const food of this.foodDatabase.values()) {
      if (food.category === category) {
        results.push(food);
      }
    }
    
    return results.slice(0, 20);
  }
}

export default new JapaneseFoodCompositionService();