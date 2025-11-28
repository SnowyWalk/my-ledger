import { z } from "zod";

// 실적 구간 정의 (새로 추가)
export const PerformanceTier = z.object({
    amount: z.coerce.number().int().min(0), // 실적 기준 금액 (예: 300,000)
    benefit: z.string(),                    // 혜택 내용 (예: 1만원 할인, 5% 적립)
});
export type PerformanceTierType = z.infer<typeof PerformanceTier>;

export const Card = z.object({
    id: z.uuid(),
    name: z.string().max(100),
    limit: z.number().int().min(0),
    dueDay: z.number().int().min(1).max(31),
    // 실적 구간 리스트 추가 (기본값 빈 배열)
    performance: z.array(PerformanceTier).default([]), 
});
export type CardType = z.infer<typeof Card>;

// ... (Transaction, Setting, CategoryRule 등 나머지는 그대로 유지)
export const Transaction = z.object({
    id: z.uuid(),
    date: z.coerce.date(),
    merchant: z.string().max(100),
    amount: z.coerce.number().int(),
    card_id: z.uuid(),
    description: z.string().max(255).optional(),
});
export type TransactionType = z.infer<typeof Transaction>;

export const Setting = z.object({
    startDayOfMonth: z.coerce.number().int().min(1).max(28).default(25),
    goalSpending: z.coerce.number().int().min(0).default(100_000),
    income: z.coerce.number().int().min(0).default(200_000),
});
export type SettingType = z.infer<typeof Setting>;

export const CategoryRule = z.object({
  id: z.string(), 
  pattern: z.string(),
  categoryId: z.string(),
  subCategoryId: z.string().nullable(),
  active: z.boolean(),
});

export type CategoryRuleType = z.infer<typeof CategoryRule>;