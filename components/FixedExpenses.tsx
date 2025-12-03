"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/schema/schemas";
import { z } from "zod";
import { format, subMonths, isAfter } from "date-fns";
import { ko } from "date-fns/locale";
import { 
    CalendarClock, 
    AlertCircle, 
    TrendingUp, 
    Minus, 
    ChevronDown, 
    ChevronUp,
    Info
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FixedExpensesProps {
    period: {
        startDate: Date;
        endDate: Date;
    };
}

// 한 달에 이 횟수 이상 발생하면 고정지출이 아닌 '수시 지출'로 간주 (배달음식 등 필터링)
const FREQUENCY_THRESHOLD = 3; 

// 최근 N개월 데이터를 신뢰도 판단 기준으로 사용
const RECENT_MONTHS_CHECK = 6;

export default function FixedExpenses({ period }: FixedExpensesProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const { data: transactions } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => {
            const res = await fetch("/api/transaction");
            if (!res.ok) throw new Error("Failed");
            return z.array(Transaction).parse(await res.json());
        }
    });

    const { fixedInPeriod, totalPeriodSpending, fixedTotal } = useMemo(() => {
        if (!transactions) return { fixedInPeriod: [], totalPeriodSpending: 0, fixedTotal: 0 };

        const { startDate, endDate } = period;
        
        // --- 1. 데이터 전처리 및 그룹화 ---
        const merchantStats = new Map<string, { 
            monthlyCounts: Map<string, number>, 
            allAmounts: number[],
            dates: Date[]
        }>();

        transactions.forEach(tx => {
            if (tx.amount >= 0) return;
            
            const key = tx.merchant.trim();
            const monthKey = format(tx.date, "yyyy-MM");
            const absAmount = Math.abs(tx.amount);

            if (!merchantStats.has(key)) {
                merchantStats.set(key, { 
                    monthlyCounts: new Map(), 
                    allAmounts: [],
                    dates: []
                });
            }
            
            const stats = merchantStats.get(key)!;
            stats.monthlyCounts.set(monthKey, (stats.monthlyCounts.get(monthKey) || 0) + 1);
            stats.allAmounts.push(absAmount);
            stats.dates.push(tx.date);
        });

        // --- 2. 고정지출 후보 선정 ---
        const recurringMerchants = new Set<string>();
        const variableStats = new Map<string, { min: number, max: number, avg: number, recentCount: number }>();
        const checkStartDate = subMonths(new Date(), RECENT_MONTHS_CHECK);

        merchantStats.forEach((stats, merchant) => {
            const months = Array.from(stats.monthlyCounts.keys());
            const counts = Array.from(stats.monthlyCounts.values());
            
            const isRecurring = months.length >= 2;
            const avgFrequency = counts.reduce((a, b) => a + b, 0) / months.length;
            const isTooFrequent = avgFrequency > FREQUENCY_THRESHOLD;

            if (isRecurring && !isTooFrequent) {
                recurringMerchants.add(merchant);

                const uniqueAmounts = new Set(stats.allAmounts);
                const isVariable = uniqueAmounts.size > 1;
                
                // 최근 6개월 내 발생 횟수
                const recentCount = stats.dates.filter(d => isAfter(d, checkStartDate)).length;

                if (isVariable) {
                    const min = Math.min(...stats.allAmounts);
                    const max = Math.max(...stats.allAmounts);
                    const avg = stats.allAmounts.reduce((a, b) => a + b, 0) / stats.allAmounts.length;
                    
                    variableStats.set(merchant, { min, max, avg, recentCount });
                } else {
                    variableStats.set(merchant, { min: stats.allAmounts[0], max: stats.allAmounts[0], avg: stats.allAmounts[0], recentCount });
                }
            }
        });

        // --- 3. 현재 기간 내 데이터 매핑 ---
        const periodTx = transactions.filter(t => 
            t.amount < 0 && t.date >= startDate && t.date < endDate
        );
        
        const totalPeriodSpending = periodTx.reduce((acc, cur) => acc + Math.abs(cur.amount), 0);
        
        const fixedInPeriod = periodTx
            .filter(tx => recurringMerchants.has(tx.merchant.trim()))
            .map(tx => {
                const key = tx.merchant.trim();
                const stat = variableStats.get(key)!;
                // min과 max가 다르면 변동 지출로 간주
                const isVariable = stat.min !== stat.max;
                
                return {
                    ...tx,
                    isVariable,
                    stat
                };
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        const fixedTotal = fixedInPeriod.reduce((acc, cur) => acc + Math.abs(cur.amount), 0);

        return { fixedInPeriod, totalPeriodSpending, fixedTotal };

    }, [transactions, period]);

    if (!transactions) return <Skeleton className="w-full h-[300px] rounded-xl" />;

    const fixedRatio = totalPeriodSpending > 0 ? (fixedTotal / totalPeriodSpending) * 100 : 0;

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="w-full h-full flex flex-col gap-4">
            {/* 상단 요약 */}
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">감지된 고정 지출</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="w-3.5 h-3.5 text-slate-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">월평균 {FREQUENCY_THRESHOLD}회 이하로 반복되는 지출만 포함됩니다.<br/>(잦은 배달/쇼핑 등은 제외)</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {fixedTotal.toLocaleString()}원
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-xs text-muted-foreground block mb-1">전체 중 비중</span>
                    <span className="font-bold text-blue-600 text-lg">{fixedRatio.toFixed(1)}%</span>
                </div>
            </div>

            <Progress value={fixedRatio} className="h-2" />

            {/* 리스트 영역 */}
            <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin space-y-2 mt-2">
                {fixedInPeriod.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                        <p>감지된 고정지출이 없습니다.</p>
                    </div>
                ) : (
                    fixedInPeriod.map((tx) => (
                        <div 
                            key={tx.id} 
                            onClick={() => toggleExpand(tx.id)}
                            className={`flex flex-col p-3 bg-white dark:bg-slate-950 border rounded-lg transition-all cursor-pointer
                                ${expandedId === tx.id ? 'border-blue-300 ring-1 ring-blue-100 shadow-sm' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200'}`}
                        >
                            {/* 기본 정보 행 */}
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg transition-colors ${
                                        tx.isVariable 
                                            ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300' 
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        <CalendarClock className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                                            {tx.merchant}
                                        </span>
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                            {format(tx.date, "M월 d일", { locale: ko })}
                                            <span className="w-0.5 h-2 bg-slate-300 mx-0.5"></span>
                                            최근 6개월 {tx.stat.recentCount}회 발생
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-0.5">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                        {Math.abs(tx.amount).toLocaleString()}원
                                    </span>
                                    {tx.isVariable ? (
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-orange-200 text-orange-600 bg-orange-50 gap-1">
                                            <TrendingUp className="w-3 h-3" /> 변동
                                            {expandedId === tx.id ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-slate-200 text-slate-500 bg-slate-50 gap-1">
                                            <Minus className="w-3 h-3" /> 고정
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* 확장 영역: 변동 지출 통계 */}
                            {expandedId === tx.id && tx.isVariable && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 animate-in slide-in-from-top-1 duration-200">
                                    <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 rounded p-2">
                                        <span className="text-[10px] text-slate-400 mb-1">최저 (Min)</span>
                                        <span className="text-xs font-semibold text-green-600">
                                            {tx.stat.min.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 rounded p-2">
                                        <span className="text-[10px] text-slate-400 mb-1">평균 (Avg)</span>
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {Math.round(tx.stat.avg).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 rounded p-2">
                                        <span className="text-[10px] text-slate-400 mb-1">최고 (Max)</span>
                                        <span className="text-xs font-semibold text-red-500">
                                            {tx.stat.max.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="col-span-3 text-[10px] text-slate-400 text-center mt-1">
                                        * 전체 기간 데이터 기반 통계입니다.
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}