import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Modal } from 'react-native';
import {
  Search,
  Plus,
  Edit3,
  Heart,
  QrCode,
  Clock,
  X
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  isFavorite?: boolean;
  amount?: number;
  unit?: string;
  meal?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time?: string;
}

interface NewFood {
  name: string;
  protein: number;
  fat: number;
  carbs: number;
}

interface AddFoodModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAddFood: (food: Food) => void;
  selectedMeal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  editingFood?: Food | null;
  onUpdateFood?: (food: Food & { amount: number; unit: string; meal: string; time: string }) => void;
  favoriteFoods?: Food[];
}

// モックデータ
const mockFoodDatabase: Food[] = [
  { id: '1', name: '鶏胸肉（皮なし）', calories: 108, protein: 22, fat: 2, carbs: 0, },
  { id: '2', name: '白米（炊飯済み）', calories: 156, protein: 3, fat: 0, carbs: 37 },
  { id: '3', name: 'ブロッコリー', calories: 33, protein: 4, fat: 0, carbs: 5 },
  { id: '4', name: 'ホエイプロテイン', calories: 117, protein: 24, fat: 2, carbs: 2 },
  { id: '5', name: 'バナナ', calories: 89, protein: 1, fat: 0, carbs: 23},
  { id: '6', name: '卵', calories: 151, protein: 12, fat: 11, carbs: 1 },
  { id: '7', name: 'サーモン', calories: 142, protein: 20, fat: 6, carbs: 0 },
  { id: '8', name: 'アーモンド', calories: 579, protein: 21, fat: 50, carbs: 22 },
];

const mockFoodHistory: Food[] = [
  { id: '1', name: '鶏胸肉（皮なし）', calories: 108, protein: 22, fat: 2, carbs: 0 },
  { id: '4', name: 'ホエイプロテイン', calories: 117, protein: 24, fat: 2, carbs: 2},
  { id: '5', name: 'バナナ', calories: 89, protein: 1, fat: 0, carbs: 23 },
];

const mockFavoritesFoods: Food[] = [
  { id: '1', name: '鶏胸肉（皮なし）', calories: 108, protein: 22, fat: 2, carbs: 0, isFavorite: true },
  { id: '4', name: 'ホエイプロテイン', calories: 117, protein: 24, fat: 2, carbs: 2, isFavorite: true },
];

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isVisible,
  onClose,
  onAddFood,
  selectedMeal,
  editingFood,
  onUpdateFood,
  favoriteFoods = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'favorites' | 'scan'>('manual');
  const [newFood, setNewFood] = useState<NewFood>({
    name: '',
    protein: 0,
    fat: 0,
    carbs: 0,
  });

  // editingFoodがある場合は初期値を設定
  useEffect(() => {
    if (editingFood) {
      setNewFood({
        name: editingFood.name,
        protein: editingFood.protein,
        fat: editingFood.fat,
        carbs: editingFood.carbs,
      });
    } else {
      setNewFood({
        name: '',
        protein: 0,
        fat: 0,
        carbs: 0,
      });
    }
  }, [editingFood]);

  const getSearchResults = (): Food[] => {
    if (!searchQuery.trim()) return [];
    return mockFoodDatabase.filter(food =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFavoritesFoods = (): Food[] => {
    return favoriteFoods.length > 0 ? favoriteFoods : mockFavoritesFoods;
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const handleOverlayClick = () => {
    setIsSearchFocused(false);
  };

  const selectSearchResult = (food: Food) => {
    onAddFood(food);
    setSearchQuery('');
    setIsSearchFocused(false);
    onClose();
  };

  const addFromHistory = (food: Food) => {
    onAddFood(food);
    onClose();
  };

  const addFood = () => {
    if (!newFood.name.trim()) {
      Alert.alert('エラー', '食材名を入力してください');
      return;
    }

    const food: Food = {
      id: Date.now().toString(),
      name: newFood.name,
      calories: Math.round(newFood.protein * 4 + newFood.fat * 9 + newFood.carbs * 4),
      protein: newFood.protein,
      fat: newFood.fat,
      carbs: newFood.carbs,
    };

    onAddFood(food);
    setNewFood({ name: '', protein: 0, fat: 0, carbs: 0 });
    onClose();
  };

  const updateFood = () => {
    if (!editingFood || !onUpdateFood) return;

    if (!newFood.name.trim()) {
      Alert.alert('エラー', '食材名を入力してください');
      return;
    }

    const updatedFood = {
      ...editingFood,
      name: newFood.name,
      calories: Math.round(newFood.protein * 4 + newFood.fat * 9 + newFood.carbs * 4),
      protein: newFood.protein,
      fat: newFood.fat,
      carbs: newFood.carbs,
      amount: editingFood.amount || 100,
      unit: editingFood.unit || 'g',
      meal: editingFood.meal || selectedMeal,
      time: editingFood.time || new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    };

    onUpdateFood(updatedFood);
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
    setActiveTab('manual');
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {editingFood ? '食材を編集' : '食材を追加'}
          </Text>
          <Text style={styles.headerDescription}>
            {editingFood ? '栄養情報を編集してください' : '検索、手入力、または履歴から選択'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.contentInner}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Search
                size={20}
                color={colors.text.tertiary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder="食材を検索..."
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            {/* Search Overlay */}
            {isSearchFocused && searchQuery.trim() && (
              <TouchableWithoutFeedback onPress={handleOverlayClick}>
                <View style={styles.searchOverlay}>
                  <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                    <View style={styles.searchResults}>
                      <ScrollView style={styles.searchResultsList}>
                        {getSearchResults().length > 0 ? (
                          <View style={styles.searchResultsContent}>
                            <Text style={styles.searchResultsTitle}>
                              検索結果 ({getSearchResults().length}件)
                            </Text>
                            {getSearchResults().map((food) => (
                              <TouchableOpacity
                                key={food.id}
                                onPress={() => selectSearchResult(food)}
                                style={styles.searchResultItem}
                              >
                                <View style={styles.searchResultContent}>
                                  <View style={styles.searchResultLeft}>
                                    <View>
                                      <Text style={styles.foodName}>{food.name}</Text>
                                      <Text style={styles.foodDetails}>
                                        {food.calories}kcal • P:{food.protein}g F:{food.fat}g C:{food.carbs}g
                                      </Text>
                                    </View>
                                  </View>
                                  <Plus size={20} color={colors.primary.main} />
                                </View>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ) : (
                          <View style={styles.noResults}>
                            <Search size={48} color={colors.text.tertiary} />
                            <Text style={styles.noResultsText}>
                              「{searchQuery}」の検索結果がありません
                            </Text>
                            <Text style={styles.noResultsSubtext}>
                              手入力タブで新しい食材を追加できます
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            )}

            {/* Content with overlay when search is focused */}
            <View style={[
              styles.mainContent,
              isSearchFocused && searchQuery.trim() && styles.overlayContent
            ]}>
              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    activeTab === 'manual' && styles.actionButtonActive
                  ]}
                  onPress={() => setActiveTab('manual')}
                >
                  <Edit3 size={20} color={activeTab === 'manual' ? colors.primary.main : colors.text.secondary} />
                  <Text style={[
                    styles.actionButtonText,
                    activeTab === 'manual' && styles.actionButtonTextActive
                  ]}>
                    手入力
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    activeTab === 'favorites' && styles.actionButtonActive
                  ]}
                  onPress={() => setActiveTab('favorites')}
                >
                  <Heart size={20} color={activeTab === 'favorites' ? colors.primary.main : colors.text.secondary} />
                  <Text style={[
                    styles.actionButtonText,
                    activeTab === 'favorites' && styles.actionButtonTextActive
                  ]}>
                    お気に入り
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    activeTab === 'scan' && styles.actionButtonActive
                  ]}
                  onPress={() => setActiveTab('scan')}
                >
                  <QrCode size={20} color={activeTab === 'scan' ? colors.primary.main : colors.text.secondary} />
                  <Text style={[
                    styles.actionButtonText,
                    activeTab === 'scan' && styles.actionButtonTextActive
                  ]}>
                    バーコード
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Manual Input Tab */}
              {activeTab === 'manual' && (
                <View style={styles.manualSection}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>食材名</Text>
                    <TextInput
                      style={styles.textInput}
                      value={newFood.name}
                      onChangeText={(text) => setNewFood(prev => ({ ...prev, name: text }))}
                      placeholder="例: チキンブレスト 100g"
                      placeholderTextColor={colors.text.tertiary}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>タンパク質 (g)</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={newFood.protein.toString()}
                        onChangeText={(text) => setNewFood(prev => ({ ...prev, protein: Number(text) || 0 }))}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.text.tertiary}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>脂質 (g)</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={newFood.fat.toString()}
                        onChangeText={(text) => setNewFood(prev => ({ ...prev, fat: Number(text) || 0 }))}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.text.tertiary}
                      />
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>炭水化物 (g)</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={newFood.carbs.toString()}
                        onChangeText={(text) => setNewFood(prev => ({ ...prev, carbs: Number(text) || 0 }))}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.text.tertiary}
                      />
                    </View>

                    <View style={styles.caloriesDisplay}>
                      <Text style={styles.caloriesLabel}>カロリー:</Text>
                      <Text style={styles.caloriesValue}>
                        {Math.round(newFood.protein * 4 + newFood.fat * 9 + newFood.carbs * 4)} kcal
                      </Text>
                    </View>
                  </View>

                  <Button
                    title={editingFood ? '更新' : '追加'}
                    onPress={editingFood ? updateFood : addFood}
                    style={styles.addButton}
                  />
                </View>
              )}

              {/* Favorites Tab */}
              {activeTab === 'favorites' && (
                <View style={styles.favoritesSection}>
                  {getFavoritesFoods().length > 0 ? (
                    <View>
                      <View style={styles.favoritesHeader}>
                        <Heart size={32} color={colors.status.error} fill={colors.status.error} />
                        <Text style={styles.favoritesTitle}>お気に入りの食材</Text>
                      </View>
                      {getFavoritesFoods().map((food) => (
                        <TouchableOpacity
                          key={food.id}
                          onPress={() => addFromHistory(food)}
                          style={styles.favoriteItem}
                        >
                          <View style={styles.favoriteContent}>
                            <View style={styles.favoriteInfo}>
                              <Text style={styles.foodName}>{food.name}</Text>
                              <Text style={styles.foodDetails}>
                                {food.calories}kcal • P:{food.protein}g F:{food.fat}g C:{food.carbs}g
                              </Text>
                            </View>
                            <View style={styles.favoriteActions}>
                              <Heart size={16} color={colors.status.error} fill={colors.status.error} />
                              <Plus size={20} color={colors.primary.main} />
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Heart size={48} color={colors.text.tertiary} />
                      <Text style={styles.emptyStateTitle}>お気に入りの食材がありません</Text>
                      <Text style={styles.emptyStateSubtext}>
                        ハートボタンを押してお気に入りに追加してください
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Scan Tab */}
              {activeTab === 'scan' && (
                <View style={styles.scanSection}>
                  <View style={styles.emptyState}>
                    <QrCode size={48} color={colors.text.tertiary} />
                    <Text style={styles.emptyStateTitle}>バーコードスキャン機能は開発中です</Text>
                    <Text style={styles.emptyStateSubtext}>
                      商品のバーコードをスキャンして栄養情報を取得できるようになります
                    </Text>
                  </View>

                  <View style={styles.featurePreview}>
                    <Text style={styles.featureTitle}>予定機能:</Text>
                    <Text style={styles.featureItem}>• カメラでバーコードスキャン</Text>
                    <Text style={styles.featureItem}>• 商品データベースから栄養情報取得</Text>
                    <Text style={styles.featureItem}>• 分量調整機能</Text>
                    <Text style={styles.featureItem}>• よく使う商品の保存</Text>
                  </View>
                </View>
              )}

              {/* History Section (only show when not favorites or scan tab) */}
              {activeTab !== 'favorites' && activeTab !== 'scan' && (
                <View style={styles.historySection}>
                  <View style={styles.sectionHeader}>
                    <Clock size={20} color={colors.text.secondary} />
                    <Text style={styles.sectionTitle}>最近の履歴</Text>
                  </View>
                  {mockFoodHistory.map((food) => (
                    <TouchableOpacity
                      key={food.id}
                      onPress={() => addFromHistory(food)}
                      style={styles.historyItem}
                    >
                      <View style={styles.historyInfo}>
                        <Text style={styles.foodName}>{food.name}</Text>
                        <Text style={styles.foodDetails}>
                          {food.calories}kcal • P:{food.protein}g F:{food.fat}g C:{food.carbs}g
                        </Text>
                      </View>
                      <Plus size={20} color={colors.primary.main} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm + 2,
    zIndex: 1,
  },
  searchInput: {
    height: 48,
    paddingLeft: spacing.xl + spacing.sm,
    paddingRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    fontSize: typography.fontSize.base,
    backgroundColor: colors.background.primary,
  },
  searchOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 50,
  },
  searchResults: {
    backgroundColor: colors.background.primary,
    marginHorizontal: spacing.sm,
    borderRadius: radius.lg,
    maxHeight: 288,
    ...shadows.lg,
  },
  searchResultsList: {
    maxHeight: 288,
  },
  searchResultsContent: {
    padding: spacing.md,
  },
  searchResultsTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  searchResultItem: {
    marginBottom: spacing.xs,
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  noResults: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  mainContent: {
    opacity: 1,
  },
  overlayContent: {
    opacity: 0.3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
    gap: spacing.xs,
  },
  actionButtonActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary[50],
  },
  actionButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  actionButtonTextActive: {
    color: colors.primary.main,
  },
  manualSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xs,
  },
  textInput: {
    height: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    fontSize: typography.fontSize.base,
    backgroundColor: colors.background.primary,
  },
  numberInput: {
    height: 40,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    backgroundColor: colors.background.primary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  caloriesDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xs,
  },
  caloriesLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
        fontWeight: 'bold',
  },
  caloriesValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
        fontWeight: 'bold',
  },
  addButton: {
    marginTop: spacing.md,
  },
  favoritesSection: {
    gap: spacing.md,
  },
  favoritesHeader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  favoritesTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  favoriteItem: {
    marginBottom: spacing.xs,
  },
  favoriteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  favoriteInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  favoriteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scanSection: {
    gap: spacing.lg,
  },
  featurePreview: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  featureItem: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  historySection: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  historyInfo: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  foodIcon: {
    fontSize: typography.fontSize.lg,
  },
  foodName: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  foodDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xxxs,
  },
});