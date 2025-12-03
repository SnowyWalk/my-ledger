"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CategoryRule, Transaction } from "@/schema/schemas";
import { z } from "zod";
import { subMonths } from "date-fns";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// 카테고리 이름 매핑 (CategorizedSpendingChart와 동일)
const CATEGORY_NAMES: Record<string, string> = {
    cat_food: '식비', cat_transport: '교통/차량', cat_shopping: '쇼핑',
    cat_fixed: '고정지출', cat_hobby: '취미/여가', cat_culture: '문화',
    cat_health: '의료/건강', cat_living: '주거/통신', uncategorized: '기타'
};

interface CategoryComparisonProps {
    period: { startDate: Date; endDate: Date; };
}

export default function CategoryComparison({ period }: CategoryComparisonProps) {
    const { data: transactions } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => (await fetch("/api/transaction").then(res => res.json())) as z.infer<typeof Transaction>[]
    });

    const { data: rules } = useQuery({
        queryKey: ["category-rules"],
        queryFn: async () => (await fetch("/api/category-manager").then(res => res.json())) as z.infer<typeof CategoryRule>[]
    });

    const comparisonData = useMemo(() => {
        if (!transactions || !rules) return [];

        // 기간 설정
        const currentStart = period.startDate;
        const currentEnd = period.endDate;
        const prevStart = subMonths(currentStart, 1);
        const prevEnd = subMonths(currentEnd, 1);

        // 카테고리 매핑 헬퍼
        const getCategoryId = (merchant: string) => {
            for (const rule of rules) {
                if (new RegExp(rule.pattern, 'i').test(merchant)) return rule.categoryId;
            }
            return 'uncategorized';
        };

        const currentMap = new Map<string, number>();
        const prevMap = new Map<string, number>();

        transactions.forEach(tx => {
            if (tx.amount >= 0) return;
            const catId = getCategoryId(tx.merchant);
            const absAmount = Math.abs(tx.amount);

            if (tx.date >= currentStart && tx.date < currentEnd) {
                currentMap.set(catId, (currentMap.get(catId) || 0) + absAmount);
            } else if (tx.date >= prevStart && tx.date < prevEnd) {
                prevMap.set(catId, (prevMap.get(catId) || 0) + absAmount);
            }
        });

        // 증감 계산
        const categories = Array.from(new Set([...currentMap.keys(), ...prevMap.keys()]));
        
        return categories.map(catId => {
            const current = currentMap.get(catId) || 0;
            const prev = prevMap.get(catId) || 0;
            const diff = current - prev;
            const percent = prev === 0 ? (current > 0 ? 100 : 0) : ((diff / prev) * 100);

            return {
                id: catId,
                name: CATEGORY_NAMES[catId] || catId,
                current,
                prev,
                diff,
                percent
            };
        })
        .filter(item => item.current > 0 || item.prev > 0) // 둘 다 0인 경우 제외
        .sort((a, b) => b.diff - a.diff) // 금액 증가폭이 큰 순서대로
        .slice(0, 5); // 상위 5개만

    }, [transactions, rules, period]);

    if (!transactions || !rules) return <Skeleton className="w-full h-[200px]" />;

    return (
        <div className="flex flex-col gap-3">
            {comparisonData.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.name}</span>
                        <span className="text-xs text-slate-400">
                            지난달 {item.prev.toLocaleString()}원
                        </span>
                    </div>
                    
                    <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {item.current.toLocaleString()}원
                        </div>
                        <div className={cn("text-xs flex items-center justify-end gap-0.5 font-medium", 
                            item.diff > 0 ? "text-red-500" : item.diff < 0 ? "text-blue-500" : "text-slate-500"
                        )}>
                            {item.diff > 0 ? <ArrowUp className="w-3 h-3" /> : item.diff < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            <span>{Math.abs(item.diff).toLocaleString()}원 ({Math.abs(item.percent).toFixed(0)}%)</span>
                        </div>
                    </div>
                </div>
            ))}
             {comparisonData.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">비교할 데이터가 충분하지 않습니다.</div>
            )}
        </div>
    );
}