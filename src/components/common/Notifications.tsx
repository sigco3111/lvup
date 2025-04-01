/**
 * 알림 컴포넌트
 * 
 * 레벨업, 아이템 획득 등의 알림을 표시합니다.
 */

'use client';

import * as React from 'react';
import { createContext, useContext, useState } from 'react';

// 알림 타입 정의
type NotificationType = 'success' | 'error' | 'info' | 'warning';

// 알림 아이템 타입
interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

// 알림 컨텍스트 타입
interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (message: string, type?: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
}

// 기본 컨텍스트 값
const defaultContext: NotificationContextType = {
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
};

// 알림 컨텍스트 생성
const NotificationContext = createContext<NotificationContextType>(defaultContext);

// 알림 훅
export const useNotification = () => useContext(NotificationContext);

// 알림 서비스 컴포넌트
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  // 알림 추가 함수
  const addNotification = (
    message: string, 
    type: NotificationType = 'info', 
    duration: number = 5000
  ) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    
    // 지정된 시간 후 자동 제거
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };
  
  // 알림 제거 함수
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationToasts />
    </NotificationContext.Provider>
  );
}

// 알림 토스트 컴포넌트
function NotificationToasts() {
  const { notifications, removeNotification } = useNotification();
  
  if (notifications.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map(notification => (
        <Toast 
          key={notification.id} 
          notification={notification} 
          onClose={() => removeNotification(notification.id)} 
        />
      ))}
    </div>
  );
}

// 토스트 컴포넌트
function Toast({ 
  notification, 
  onClose 
}: { 
  notification: NotificationItem; 
  onClose: () => void;
}) {
  // 타입별 스타일 설정
  const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  // 타입별 아이콘 설정
  const typeIcons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    warning: '⚠',
  };
  
  return (
    <div 
      className={`${typeStyles[notification.type]} text-white rounded-lg shadow-lg p-4 min-w-[200px] max-w-[300px] animate-slide-in`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <span className="mr-2 font-bold">{typeIcons[notification.type]}</span>
          <p>{notification.message}</p>
        </div>
        <button onClick={onClose} className="text-white ml-2">×</button>
      </div>
    </div>
  );
}

// 애니메이션 스타일 정의
const styles = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slideIn 0.3s ease-out;
  }
`;

export function NotificationStyles() {
  return <style jsx global>{styles}</style>;
}