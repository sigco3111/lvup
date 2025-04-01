/**
 * 네비게이션 바 컴포넌트
 * 
 * 앱 하단에 고정된 네비게이션 바로, 주요 기능 화면을 이동할 수 있는 링크를 제공합니다.
 * 인벤토리 아이콘에는 새 아이템 획득 시 알림 표시 기능이 포함되어 있습니다.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Swords, Backpack, Award, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavBarProps {
  newItemsCount?: number; // 새로 획득한 아이템 수
}

export function NavBar({ newItemsCount = 0 }: NavBarProps) {
  const pathname = usePathname();
  
  // 메뉴 아이템 활성화 여부 확인
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  // 네비게이션 아이템 정의
  const navItems = [
    {
      name: '홈',
      path: '/dashboard',
      icon: Home,
      notification: 0
    },
    {
      name: '전투',
      path: '/battle',
      icon: Swords,
      notification: 0
    },
    {
      name: '인벤토리',
      path: '/inventory',
      icon: Backpack,
      notification: newItemsCount
    },
    {
      name: '캐릭터',
      path: '/character',
      icon: Award,
      notification: 0
    },
    {
      name: '더보기',
      path: '/menu',
      icon: Menu,
      notification: 0
    }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-50">
      <div className="max-w-screen-lg mx-auto">
        <div className="flex justify-between items-center">
          {navItems.map((item) => (
            <Link 
              key={item.name}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors",
                isActive(item.path) 
                  ? "text-blue-600" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
                
                {/* 알림 표시 */}
                {item.notification > 0 && (
                  <Badge 
                    className="absolute -top-1.5 -right-1.5 h-4 min-w-4 flex items-center justify-center text-[10px] p-0.5 bg-red-500"
                  >
                    {item.notification > 99 ? '99+' : item.notification}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 