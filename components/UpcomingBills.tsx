"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/schema/schemas";
import { z } from "zod";
import { addMonths, differenceInDays, format, isSameDay, setDate, startOfDay, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarClock, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface UpcomingBillsProps {
    period: {
        startDate: Date;
        endDate: Date;
    };
}

// 고정지출 감지 임계값 (2개월 이상 등장)
const RECURRING_THRESHOLD = 2;

export default function UpcomingBills({ period }: UpcomingBillsProps) {
    const { data: transactions } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => {
            const res = await fetch("/api/transaction");
            if (!res.ok) throw new Error("Failed");
            return z.array(Transaction).parse(await res.json());
        }
    });

    const upcomingData = useMemo(() => {
        if (!transactions) return [];

        const { startDate, endDate } = period;
        const now = startOfDay(new Date());

        // 1. 거래처별 패턴 분석 (예상일, 평균금액)
        const merchantStats = new Map<string, { 
            dates: Date[], 
            amounts: number[],
            lastDate: Date 
        }>();

        transactions.forEach(tx => {
            if (tx.amount >= 0) return;
            const key = tx.merchant.trim();
            
            if (!merchantStats.has(key)) {
                merchantStats.set(key, { dates: [], amounts: [], lastDate: tx.date });
            }
            const record = merchantStats.get(key)!;
            record.dates.push(tx.date);
            record.amounts.push(Math.abs(tx.amount));
            if (tx.date > record.lastDate) record.lastDate = tx.date;
        });

        // 2. 예정된 지출 추출
        const bills = [];

        for (const [merchant, stats] of merchantStats.entries()) {
            // A. 반복성 체크 (서로 다른 달에 2회 이상)
            const uniqueMonths = new Set(stats.dates.map(d => format(d, "yyyy-MM")));
            if (uniqueMonths.size < RECURRING_THRESHOLD) continue;

            // B. 예상 결제일(일자) 계산 (최빈값 or 평균)
            // 단순하게 평균 일자로 계산
            const sumDays = stats.dates.reduce((acc, d) => acc + d.getDate(), 0);
            const avgDay = Math.round(sumDays / stats.dates.length);

            // C. 이번 주기(Period) 내의 예상 결제일 계산
            // period.startDate가 속한 달의 avgDay와, 그다음 달의 avgDay를 후보로 둠
            // 예: 기간이 10/25 ~ 11/25이고 avgDay가 1일이면 -> 11/1이 타겟
            const candidate1 = setDate(startDate, avgDay);
            const candidate2 = setDate(addMonths(startDate, 1), avgDay);
            
            let targetDate = null;
            if (candidate1 >= startDate && candidate1 < endDate) targetDate = candidate1;
            else if (candidate2 >= startDate && candidate2 < endDate) targetDate = candidate2;

            if (!targetDate) continue; // 이번 기간에 해당 일자가 포함되지 않음 (매우 드문 케이스)

            // D. 이미 결제되었는지 확인
            const isPaid = transactions.some(tx => 
                tx.amount < 0 &&
                tx.merchant.trim() === merchant &&
                tx.date >= startDate && 
                tx.date < endDate
            );

            if (!isPaid) {
                // 평균 금액
                const avgAmount = stats.amounts.reduce((a, b) => a + b, 0) / stats.amounts.length;
                
                // D-Day 계산
                const diffDays = differenceInDays(targetDate, now);

                bills.push({
                    merchant,
                    expectedDate: targetDate,
                    expectedAmount: avgAmount,
                    dDay: diffDays,
                    isOverdue: diffDays < 0
                });
            }
        }

        // 날짜순 정렬 (가까운 순)
        return bills.sort((a, b) => a.expectedDate.getTime() - b.expectedDate.getTime());

    }, [transactions, period]);

    if (!transactions) return <Skeleton className="w-full h-[200px] rounded-xl" />;

    return (
        <div className="flex flex-col gap-3 h-full">
            {upcomingData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed h-full">
                    <CheckCircle2 className="w-8 h-8 mb-2 text-green-500/50" />
                    <p>이번 달 예정된 고정지출을<br/>모두 납부했습니다! 🎉</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {/* 상단 요약 */}
                    <div className="text-xs text-muted-foreground mb-1 px-1">
                        총 {upcomingData.length}건의 예정된 지출이 있습니다.
                    </div>

                    {upcomingData.map((bill) => (
                        <div key={bill.merchant} className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg hover:border-indigo-200 transition-colors shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                    bill.isOverdue 
                                        ? 'bg-red-50 text-red-500 dark:bg-red-900/20' 
                                        : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20'
                                }`}>
                                    {bill.isOverdue ? <AlertCircle className="w-4 h-4"/> : <Clock className="w-4 h-4" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                                        {bill.merchant}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                        {format(bill.expectedDate, "M월 d일 (EEE)", { locale: ko })} 예정
                                    </span>
                                </div>
                            </div>
                            
                            <div className="text-right flex flex-col items-end gap-1">
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                    ~{Math.round(bill.expectedAmount).toLocaleString()}원
                                </span>
                                {bill.isOverdue ? (
                                    <Badge variant="destructive" className="text-[10px] h-4 px-1 py-0">
                                        연체됨 ({Math.abs(bill.dDay)}일)
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1 py-0 bg-slate-100 text-slate-500 hover:bg-slate-200">
                                        {bill.dDay === 0 ? "오늘" : `D-${bill.dDay}`}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {upcomingData.length > 0 && (
                <div className="mt-auto pt-2 text-center">
                     <p className="text-[10px] text-slate-400">
                        * 과거 결제일을 기준으로 추정한 날짜입니다.
                     </p>
                </div>
            )}
        </div>
    );
}