// 開発環境ではモックを使用、本番環境では実際のサービスを使用
const RevenueCatService = __DEV__ 
  ? require('./RevenueCatMockService').default
  : require('./RevenueCatActualService').default;

export default RevenueCatService;