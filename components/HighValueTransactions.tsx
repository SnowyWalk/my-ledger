"use client";

import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/schema/schemas";
import { z } from "zod";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface HighValueProps {
    period: { startDate: Date; endDate: Date; };
}

export default function HighValueTransactions({ period }: HighValueProps) {
    const { data: transactions } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => (await fetch("/api/transaction").then(res => res.json())) as z.infer<typeof Transaction>[]
    });

    const highValueList = transactions
        ?.filter(t => 
            t.amount <= -50000 && // 5만원 이상 지출 (음수이므로 작거나 같음)
            t.date >= period.startDate && 
            t.date < period.endDate
        )
        .sort((a, b) => a.amount - b.amount) // 지출이 큰 순서 (음수 오름차순)
        .slice(0, 5); // Top 5

    if (!transactions) return <Skeleton className="w-full h-[200px]" />;

    return (
        <div className="flex flex-col gap-2">
            {highValueList && highValueList.length > 0 ? (
                highValueList.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors rounded-md">
                        <div className="flex flex-col gap-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                                    {tx.merchant}
                                </span>
                                {Math.abs(tx.amount) >= 300000 && (
                                    <Badge variant="destructive" className="text-[10px] h-4 px-1 py-0">High</Badge>
                                )}
                            </div>
                            <span className="text-xs text-slate-400">
                                {format(tx.date, "M월 d일 HH:mm", { locale: ko })}
                            </span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">
                            {Math.abs(tx.amount).toLocaleString()}원
                        </span>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                    5만원 이상 고액 지출이 없습니다. 👏
                </div>
            )}
        </div>
    );
}