import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { parse, isValid } from "date-fns";
import { ko } from "date-fns/locale";

export function parseKoreanDate(input: string): Date | null {
  // ✅ "2025년 10월 16일" → Date
  const d = parse(input.trim(), "yyyy년 M월 d일", new Date(), { locale: ko }); // ← 변경: 포맷 명시
  return isValid(d) ? d : null; // ← 변경: 유효성 체크
}