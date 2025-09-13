const fs = require('fs');
const path = require('path');

// CSVファイルを読み込み
const csvPath = path.join(
  __dirname,
  '../src/data/raw/food_composition_2023.csv'
);
const csvData = fs.readFileSync(csvPath, 'utf-8');

// 行ごとに分割
const lines = csvData.split('\n');

// データ行（8行目以降）を抽出
const dataLines = lines
  .slice(7)
  .filter(line => line.trim() && !line.startsWith(',,,,,'));

// データを変換
const foodData = [];
let validCount = 0;

dataLines.forEach((line, index) => {
  const columns = line.split(',');

  // 必要なカラムのみ抽出（位置ベース）
  const foodGroup = columns[0] || '';
  const foodNumber = columns[1] || '';
  const indexNumber = columns[2] || '';
  const foodName = columns[3] || '';
  const wasteRate = columns[4] || '';
  const energyKJ = columns[5] || '';
  const energyKcal = columns[6] || '';
  const water = columns[7] || '';
  const proteinAAC = columns[8] || '';
  const protein = columns[9] || '';
  const fatTAG = columns[10] || '';
  const cholesterol = columns[11] || '';
  const fat = columns[12] || '';
  const carbAvailable = columns[13] || '';
  const carbSugar = columns[14] || '';
  const carbStarch = columns[15] || '';
  const carbOther = columns[16] || '';

  // データの有効性チェック
  if (
    !foodName ||
    !energyKcal ||
    energyKcal === '-' ||
    energyKcal === 'Tr' ||
    energyKcal === '(0)'
  ) {
    return;
  }

  // 数値変換用のヘルパー関数
  const parseNum = val => {
    if (
      !val ||
      val === '-' ||
      val === 'Tr' ||
      val === '(0)' ||
      val.includes('(') ||
      val === ''
    )
      return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const kcal = parseNum(energyKcal);
  const proteinValue = parseNum(protein);
  const fatValue = parseNum(fat);
  const carbValue = parseNum(carbAvailable);

  // 最低限の栄養データがある食品のみ
  if (kcal > 0) {
    const food = {
      food_code: foodNumber || `food_${validCount + 1}`,
      name_ja: foodName.trim(),
      category: foodGroup || '未分類',
      energy_kcal: kcal,
      protein_g: proteinValue,
      fat_g: fatValue,
      carbohydrate_g: carbValue,
      water_g: parseNum(water),
    };

    foodData.push(food);
    validCount++;
  }
});

// Debug info removed

// JSONファイルとして保存
const outputPath = path.join(
  __dirname,
  '../src/data/japanese-food-composition-2023.json'
);
fs.writeFileSync(outputPath, JSON.stringify(foodData, null, 2), 'utf-8');

// Conversion completed
