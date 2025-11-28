"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card as CardSchema, Transaction } from "@/schema/schemas";
import { z } from "zod";
import { CreditCard, Check, Lock, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardUsageStatusProps {
    period: {
        startDate: Date;
        endDate: Date;
    };
}

const ExtendedCardSchema = CardSchema.extend({
    performance: z.array(z.object({
        amount: z.number(),
        benefit: z.string()
    })).default([])
});

export default function CardUsageStatus({ period }: CardUsageStatusProps) {
    const { data: cards } = useQuery({
        queryKey: ["card"],
        queryFn: async () => {
            const res = await fetch("/api/card");
            if (!res.ok) throw new Error("Failed");
            return z.array(ExtendedCardSchema).parse(await res.json());
        }
    });

    const { data: transactions } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => {
            const res = await fetch("/api/transaction");
            if (!res.ok) throw new Error("Failed");
            return z.array(Transaction).parse(await res.json());
        }
    });

    const cardStats = useMemo(() => {
        if (!cards || !transactions) return [];

        const { startDate, endDate } = period;
        const filteredTx = transactions.filter(t => 
            t.amount < 0 && t.date >= startDate && t.date < endDate
        );

        return cards.map(card => {
            const usedAmount = filteredTx
                .filter(tx => tx.card_id === card.id)
                .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
            
            const limit = card.limit;
            const limitPercent = limit > 0 ? (usedAmount / limit) * 100 : 0;
            const remainingLimit = limit - usedAmount;

            const sortedTiers = [...(card.performance || [])].sort((a, b) => a.amount - b.amount);
            
            // 달성한 모든 티어
            const achievedTiers = sortedTiers.filter(t => usedAmount >= t.amount);
            
            // 다음 달성해야 할 단계
            const nextTier = sortedTiers.find(t => usedAmount < t.amount);
            
            const maxPerformanceTarget = sortedTiers.length > 0 
                ? (sortedTiers[sortedTiers.length - 1].amount) 
                : 0;
            
            const performancePercent = maxPerformanceTarget > 0 
                ? Math.min((usedAmount / maxPerformanceTarget) * 100, 100) 
                : 0;

            return {
                ...card,
                usedAmount,
                limitPercent,
                remainingLimit,
                sortedTiers,
                achievedTiers,
                nextTier,
                maxPerformanceTarget,
                performancePercent
            };
        }).sort((a, b) => b.limitPercent - a.limitPercent);

    }, [cards, transactions, period]);

    if (!cardStats) return <Skeleton className="w-full h-[200px] rounded-xl" />;

    return (
        <div className="w-full h-full flex flex-col gap-4 overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin">
            {cardStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                    등록된 카드가 없습니다.
                </div>
            ) : (
                cardStats.map(card => (
                    <div key={card.id} className="group p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm">
                        
                        {/* 상단: 기본 정보 */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2.5 rounded-xl transition-colors",
                                    card.limitPercent > 90 ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                )}>
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{card.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span>Limit: {card.limitPercent.toFixed(1)}%</span>
                                        <span className="w-px h-2 bg-slate-300"></span>
                                        <span>잔여 {card.remainingLimit.toLocaleString()}원</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-lg text-slate-900 dark:text-white">
                                    {card.usedAmount.toLocaleString()}원
                                </span>
                            </div>
                        </div>

                        {/* 실적 구간 시각화 */}
                        {card.sortedTiers.length > 0 ? (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-semibold text-slate-500">실적 달성 현황</span>
                                    <span className="text-[10px] text-slate-400">
                                        {card.achievedTiers.length} / {card.sortedTiers.length} 단계 달성
                                    </span>
                                </div>

                                {/* 프로그레스 바 */}
                                <div className="relative h-8 w-full mb-3 select-none">
                                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                                            style={{ width: `${card.performancePercent}%` }}
                                        />
                                    </div>
                                    {card.sortedTiers.map((tier, idx) => {
                                        const pos = (tier.amount / card.maxPerformanceTarget) * 100;
                                        const isAchieved = card.usedAmount >= tier.amount;
                                        return (
                                            <div 
                                                key={idx} 
                                                className="absolute top-0 h-full flex flex-col items-center group/marker"
                                                style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
                                            >   
                                                <div className="opacity-0 group-hover/marker:opacity-100 absolute -top-6 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded transition-opacity whitespace-nowrap z-10">
                                                    {tier.amount.toLocaleString()}원
                                                </div>
                                                <div className={cn(
                                                    "w-3 h-3 rounded-full border-2 z-10 mt-[10px] transition-colors",
                                                    isAchieved 
                                                        ? "bg-blue-500 border-white dark:border-slate-950 shadow-sm" 
                                                        : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                                                )} />
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-3">
                                    {/* 달성 혜택 목록 */}
                                    <div className={cn(
                                        "flex-1 p-3 rounded-lg border text-xs flex flex-col gap-2 transition-colors",
                                        card.achievedTiers.length > 0
                                            ? "bg-blue-50/50 border-blue-100 text-blue-900 dark:bg-blue-900/20 dark:border-blue-900 dark:text-blue-100" 
                                            : "bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-900 dark:border-slate-800"
                                    )}>
                                        <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400 mb-1">
                                            <Check className="w-3.5 h-3.5" />
                                            <span>달성 혜택 ({card.achievedTiers.length})</span>
                                        </div>
                                        
                                        {card.achievedTiers.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                                {card.achievedTiers.map((tier, idx) => (
                                                    <div key={idx} className="flex items-start gap-1.5">
                                                        <div className="mt-0.5 min-w-[10px]">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                        </div>
                                                        <div className="flex flex-col w-full">
                                                            {/* 혜택 내용 split & map */}
                                                            {tier.benefit.split('/').map((text, i) => (
                                                                <span key={i} className="font-medium leading-tight block">
                                                                    {text.trim()}
                                                                </span>
                                                            ))}
                                                            <span className="text-[10px] opacity-70 mt-0.5">
                                                                {tier.amount.toLocaleString()}원 구간
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-2 opacity-60">
                                                아직 달성한 구간이 없습니다.
                                            </div>
                                        )}
                                    </div>

                                    {/* 다음 단계 안내 */}
                                    {card.nextTier ? (
                                        <div className="flex-1 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs flex flex-col gap-2">
                                            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                                <span>다음 혜택</span>
                                            </div>
                                            
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between text-slate-500">
                                                    <span>필요 실적</span>
                                                    <span>{card.nextTier.amount.toLocaleString()}원</span>
                                                </div>
                                                <div className="flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400">
                                                    <span>남은 금액</span>
                                                    <span>{(card.nextTier.amount - card.usedAmount).toLocaleString()}원</span>
                                                </div>
                                                
                                                {/* 다음 혜택 split & map */}
                                                <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex flex-col gap-0.5">
                                                    {card.nextTier.benefit.split('/').map((text, i) => (
                                                        <div key={i} className="flex items-start gap-1">
                                                            {i === 0 ? (
                                                                <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                                                            ) : (
                                                                <div className="w-3 h-3 shrink-0" /> // 들여쓰기용 빈 박스
                                                            )}
                                                            <span className="truncate">{text.trim()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs flex flex-col items-center justify-center text-slate-400 gap-1">
                                            <span className="text-lg">🎉</span>
                                            <span>모든 실적 달성!</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 pt-2 border-t border-slate-50 dark:border-slate-900 text-center">
                                <span className="text-xs text-slate-300">등록된 실적 구간이 없습니다.</span>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}