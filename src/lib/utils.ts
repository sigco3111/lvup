import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * CSS 클래스 이름을 병합하는 유틸리티 함수
 * clsx와 tailwind-merge를 함께 사용하여 클래스명 충돌을 방지하고 깔끔하게 병합
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 