/**
 * 캐릭터 생성 폼 컴포넌트
 * 
 * 새 캐릭터 생성을 위한 직업 선택 및 생성 폼입니다.
 */

'use client';

import { useState } from 'react';
import { GameJob } from '@/lib/types/character';
import { Card } from '@/components/ui/card';
import { createCharacterAction } from '@/actions/character';
import { useNotification } from '@/components/common/Notifications';
import { useRouter } from 'next/navigation';

interface CreateCharacterFormProps {
  jobs: GameJob[];
}

export function CreateCharacterForm({ jobs }: CreateCharacterFormProps) {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();
  const router = useRouter();
  
  // 직업 선택 핸들러
  const handleJobSelect = (jobId: number) => {
    setSelectedJobId(jobId);
  };
  
  // 캐릭터 생성 핸들러
  const handleCreateCharacter = async () => {
    if (!selectedJobId) {
      addNotification('직업을 선택해주세요.', 'warning');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await createCharacterAction({ jobId: selectedJobId });
      
      if (result.success) {
        addNotification(result.message, 'success');
        // 캐릭터 생성 후 대시보드로 이동
        router.push('/dashboard');
        router.refresh();
      } else {
        addNotification(result.message, 'error');
      }
    } catch (error) {
      addNotification('캐릭터 생성 중 오류가 발생했습니다.', 'error');
      console.error('캐릭터 생성 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">캐릭터 생성</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">직업 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {jobs.map(job => (
            <Card
              key={job.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedJobId === job.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => handleJobSelect(job.id)}
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  {/* 직업 아이콘 - 직업별로 다른 이모지 표시 */}
                  <span className="text-3xl">
                    {job.name === '전사' ? '⚔️' : 
                     job.name === '마법사' ? '🧙' : 
                     job.name === '궁수' ? '🏹' : 
                     job.name === '도적' ? '🗡️' : '👤'}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{job.name}</h3>
                <p className="text-sm text-gray-600 text-center mb-3">
                  {job.description || '직업 설명이 없습니다.'}
                </p>
                
                {/* 기본 스탯 정보 */}
                <div className="grid grid-cols-2 gap-2 w-full text-sm">
                  <div className="flex items-center">
                    <span className="mr-1">💪</span>
                    <span className="text-gray-700">힘: {job.baseStats.strength}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">🏃</span>
                    <span className="text-gray-700">민첩: {job.baseStats.dexterity}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">🧠</span>
                    <span className="text-gray-700">지능: {job.baseStats.intelligence}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">❤️</span>
                    <span className="text-gray-700">체력: {job.baseStats.vitality}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          className={`px-6 py-3 rounded-lg text-white font-semibold ${
            selectedJobId && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          disabled={!selectedJobId || isLoading}
          onClick={handleCreateCharacter}
        >
          {isLoading ? '생성 중...' : '캐릭터 생성'}
        </button>
      </div>
    </div>
  );
}