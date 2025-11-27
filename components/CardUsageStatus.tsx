"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Transaction } from "@/schema/schemas";
import { z } from "zod";
import { CreditCard, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface CardUsageStatusProps {
    period: {
        startDate: Date;
        endDate: Date;
    };
}

export default function CardUsageStatus({ period }: CardUsageStatusProps) {
    // 1. 데이터 로드
    const { data: cards } = useQuery({
        queryKey: ["card"],
        queryFn: async () => {
            const res = await fetch("/api/card");
            if (!res.ok) throw new Error("Failed");
            return z.array(Card).parse(await res.json());
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

    // 2. 데이터 가공
    const cardStats = useMemo(() => {
        if (!cards || !transactions) return [];

        const { startDate, endDate } = period;

        // 기간 내 지출만 필터링
        const filteredTx = transactions.filter(t => 
            t.amount < 0 && t.date >= startDate && t.date < endDate
        );

        // 카드별 합산
        return cards.map(card => {
            const usedAmount = filteredTx
                .filter(tx => tx.card_id === card.id)
                .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
            
            const limit = card.limit;
            const percent = limit > 0 ? (usedAmount / limit) * 100 : 0;
            const remaining = limit - usedAmount;

            return {
                ...card,
                usedAmount,
                percent,
                remaining
            };
        }).sort((a, b) => b.percent - a.percent); // 사용률 높은 순 정렬

    }, [cards, transactions, period]);

    if (!cardStats) return <Skeleton className="w-full h-[200px] rounded-xl" />;

    return (
        <div className="w-full h-full flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-thin">
            {cardStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                    등록된 카드가 없습니다.
                </div>
            ) : (
                cardStats.map(card => (
                    <div key={card.id} className="group p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 transition-all shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${card.percent > 90 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">{card.name}</h4>
                                    <p className="text-xs text-gray-400">결제일: 매월 {card.dueDay}일</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-gray-900 text-sm">
                                    {card.usedAmount.toLocaleString()}원
                                </span>
                                <span className="text-xs text-gray-400">
                                    / {card.limit.toLocaleString()}원
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                                    card.percent > 90 ? 'bg-red-500' : 
                                    card.percent > 70 ? 'bg-yellow-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(card.percent, 100)}%` }}
                            />
                        </div>

                        {/* Footer Info */}
                        <div className="flex justify-between mt-2 text-xs">
                            <span className={`${card.percent > 90 ? 'text-red-500 font-medium' : 'text-blue-500'}`}>
                                {card.percent.toFixed(1)}% 사용
                            </span>
                            <span className="text-gray-400">
                                잔여: {card.remaining.toLocaleString()}원
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}