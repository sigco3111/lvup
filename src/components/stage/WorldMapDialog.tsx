/**
 * 월드 맵 다이얼로그 컴포넌트
 * 
 * 전체 월드와 지역 구성을 보여주는 다이얼로그입니다.
 * 클리어한 지역, 현재 진행 중인 지역, 잠긴 지역을 구분하여 표시합니다.
 */

'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, MapPin, Check } from 'lucide-react';
import { useStage } from './StageContext';
import { Region, World } from '@/lib/types/stage';

// 지역 상태 타입 정의
type RegionStatus = 'current' | 'unlocked' | 'locked';

interface WorldMapDialogProps {
  worlds: World[];
  regions: Region[];
  currentRegionId?: string;
  clearedStages: number[];
  unlockedRegions: string[];
  onRegionSelect?: (regionId: string) => void;
}

export default function WorldMapDialog({
  worlds,
  regions,
  currentRegionId,
  clearedStages,
  unlockedRegions,
  onRegionSelect
}: WorldMapDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  
  // 월드별 지역 그룹화
  const regionsByWorld = regions.reduce((acc, region) => {
    if (!acc[region.worldId]) {
      acc[region.worldId] = [];
    }
    acc[region.worldId].push(region);
    return acc;
  }, {} as Record<string, Region[]>);
  
  // 지역 상태 확인
  const getRegionStatus = (regionId: string): RegionStatus => {
    if (regionId === currentRegionId) return 'current';
    if (unlockedRegions.includes(regionId)) return 'unlocked';
    return 'locked';
  };
  
  // 지역 클릭 핸들러
  const handleRegionSelect = (regionId: string) => {
    if (getRegionStatus(regionId) === 'locked') return;
    
    if (onRegionSelect) {
      onRegionSelect(regionId);
      setOpen(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MapPin className="h-4 w-4 mr-2" />
          월드 맵
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>월드 맵</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {/* 월드 선택 탭 */}
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            {worlds.map((world) => (
              <Button
                key={world.id}
                variant={selectedWorldId === world.id ? "default" : "outline"}
                onClick={() => setSelectedWorldId(world.id)}
                size="sm"
              >
                {world.name}
              </Button>
            ))}
          </div>
          
          {/* 선택된 월드의 지역 목록 */}
          {selectedWorldId && regionsByWorld[selectedWorldId] && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regionsByWorld[selectedWorldId].map((region) => {
                const status = getRegionStatus(region.id);
                return (
                  <Card 
                    key={region.id} 
                    className={`
                      cursor-pointer hover:shadow-md transition-shadow
                      ${status === 'current' ? 'border-blue-500 border-2' : ''}
                      ${status === 'locked' ? 'opacity-70' : ''}
                    `}
                    onClick={() => handleRegionSelect(region.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex justify-between items-center">
                        <span>{region.name}</span>
                        {status === 'locked' && <Lock className="h-4 w-4" />}
                        {status === 'current' && (
                          <Badge variant="outline" className="text-blue-500">
                            현재
                          </Badge>
                        )}
                        {status === 'unlocked' && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-500">
                        {status === 'locked' 
                          ? '아직 해금되지 않은 지역입니다.'
                          : '탐험 가능한 지역입니다.'}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          {/* 선택된 월드가 없거나 해당 월드에 지역이 없는 경우 */}
          {(!selectedWorldId || !regionsByWorld[selectedWorldId]) && (
            <div className="text-center py-4 text-gray-500">
              월드를 선택하여 지역을 확인하세요.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 