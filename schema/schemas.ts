import { z } from "zod";

export const Card = z.object({
    id: z.uuid(),
    name: z.string().max(100),
    limit: z.number().int().min(0),
    dueDay: z.number().int().min(1).max(31),
});
export type CardType = z.infer<typeof Card>;

export const Transaction = z.object({
    id: z.uuid(),
    date: z.date(),
    merchant: z.string().max(100),
    amount: z.number().int(),
    card_id: z.uuid(),
    description: z.string().max(255).optional(),
});
export type TransactionType = z.infer<typeof Transaction>;

export const Settings = z.object({
    startDayOfMonth: z.number().int().min(1).max(28).default(25),
    goalSpending: z.number().int().min(0).default(100_000),
    income: z.number().int().min(0).default(200_000),
});
export type SettingsType = z.infer<typeof Settings>;