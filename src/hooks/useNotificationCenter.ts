import { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  category: 'workout' | 'nutrition' | 'announcement';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

// グローバル状態として管理
let globalNotifications: Notification[] = [
  {
    id: '1',
    category: 'workout',
    title: '今日の筋トレ予定',
    message: '上半身トレーニングの時間です！プッシュアップ・プルアップ・プランクを組み合わせて効果的に進めましょう。',
    time: '2時間前',
    isRead: false,
  },
  {
    id: '2',
    category: 'nutrition',
    title: 'タンパク質摂取目標達成',
    message: 'タンパク質摂取目標を7日連続で達成しました！この調子で筋肉合成を最適化していきましょう。',
    time: '4時間前',
    isRead: false,
  },
  {
    id: '3',
    category: 'nutrition',
    title: 'プロテイン摂取のタイミング',
    message: 'トレーニング後30分以内のプロテイン摂取が効果的です。今すぐプロテインドリンクを飲みましょう！',
    time: '6時間前',
    isRead: true,
  },
  {
    id: '4',
    category: 'announcement',
    title: '新機能: AIミール提案',
    message: 'あなたの目標に最適化されたミールプランを自動生成する機能が追加されました。栄養タブからお試しください！',
    time: '1日前',
    isRead: false,
  },
  {
    id: '5',
    category: 'workout',
    title: '今週の筋トレ実績',
    message: '今週は4回のトレーニングを完了しました。素晴らしい継続力です！来週も頑張りましょう。',
    time: '2日前',
    isRead: true,
  },
  {
    id: '6',
    category: 'announcement',
    title: 'アプリ更新のお知らせ',
    message: 'FitMeal Partnerの新しいバージョンがリリースされました。パフォーマンス向上と新機能が追加されています。',
    time: '3日前',
    isRead: true,
  },
];

// グローバル状態の変更を通知するためのリスナー
let notificationListeners: (() => void)[] = [];

export const useNotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>(globalNotifications);
  const [, forceUpdate] = useState({});

  // グローバル状態の変更を監視
  useEffect(() => {
    const listener = () => {
      setNotifications([...globalNotifications]);
      forceUpdate({});
    };

    notificationListeners.push(listener);

    return () => {
      notificationListeners = notificationListeners.filter(l => l !== listener);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    globalNotifications = globalNotifications.map((notification) =>
      notification.id === id ? { ...notification, isRead: true } : notification
    );
    
    // 全てのリスナーに通知
    notificationListeners.forEach(listener => listener());
  };

  const markAllAsRead = () => {
    globalNotifications = globalNotifications.map((notification) => ({ 
      ...notification, 
      isRead: true 
    }));
    
    // 全てのリスナーに通知
    notificationListeners.forEach(listener => listener());
  };

  const deleteNotification = (id: string) => {
    globalNotifications = globalNotifications.filter((notification) => notification.id !== id);
    
    // 全てのリスナーに通知
    notificationListeners.forEach(listener => listener());
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};