"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/schema/schemas";
import { z } from "zod";
import { Store, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface TopMerchantsProps {
    period: {
        startDate: Date;
        endDate: Date;
    };
}

export default function TopMerchants({ period }: TopMerchantsProps) {
    // 1. 데이터 로드
    const { data: transactions } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => {
            const res = await fetch("/api/transaction");
            if (!res.ok) throw new Error("Failed");
            return z.array(Transaction).parse(await res.json());
        }
    });

    // 2. 데이터 가공
    const rankingData = useMemo(() => {
        if (!transactions) return [];

        const { startDate, endDate } = period;
        
        // 기간 내 지출 필터링
        const filteredTx = transactions.filter(t => 
            t.amount < 0 && t.date >= startDate && t.date < endDate
        );

        const totalPeriodSpending = filteredTx.reduce((acc, cur) => acc + Math.abs(cur.amount), 0);

        // 거래처별 합산
        const merchantMap: Record<string, number> = {};
        filteredTx.forEach(tx => {
            const name = tx.merchant || "알 수 없음";
            merchantMap[name] = (merchantMap[name] || 0) + Math.abs(tx.amount);
        });

        // 정렬 및 Top 5 추출
        const sorted = Object.entries(merchantMap)
            .map(([name, amount]) => ({
                name,
                amount,
                percent: totalPeriodSpending > 0 ? (amount / totalPeriodSpending) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        return sorted;
    }, [transactions, period]);

    if (!transactions) return <Skeleton className="w-full h-[300px] rounded-xl" />;

    if (rankingData.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-sm p-8 border border-dashed border-gray-200 rounded-xl">
                <Store className="w-8 h-8 mb-2 opacity-20" />
                지출 내역이 없습니다.
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin">
            {rankingData.map((item, index) => {
                // 순위별 뱃지 스타일
                let rankStyle = "bg-gray-100 text-gray-500";
                if (index === 0) rankStyle = "bg-yellow-100 text-yellow-700 border-yellow-200"; // 금
                if (index === 1) rankStyle = "bg-slate-200 text-slate-700 border-slate-300";   // 은
                if (index === 2) rankStyle = "bg-orange-100 text-orange-800 border-orange-200"; // 동

                return (
                    <div key={item.name} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-100 transition-colors group">
                        {/* Rank Badge */}
                        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm border ${rankStyle}`}>
                            {index + 1}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-gray-700 truncate text-sm">{item.name}</span>
                                <span className="font-bold text-gray-900 text-sm">{item.amount.toLocaleString()}원</span>
                            </div>
                            
                            {/* Progress Bar & Percent */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 rounded-full opacity-80 group-hover:opacity-100 transition-all" 
                                        style={{ width: `${item.percent}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400 w-8 text-right">{item.percent.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {rankingData.length >= 5 && (
                <div className="text-center mt-2">
                   <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                       <TrendingUp className="w-3 h-3" />
                       상위 5개처가 전체의 {rankingData.reduce((acc, cur) => acc + cur.percent, 0).toFixed(0)}%를 차지합니다.
                   </span>
                </div>
            )}
        </div>
    );
}