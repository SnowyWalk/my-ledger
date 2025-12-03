"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Installment } from "@/schema/schemas";
import { z } from "zod";
import { differenceInMonths, addMonths, format } from "date-fns";
import { ko } from "date-fns/locale";
import { CreditCard, Calendar, PackageCheck, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstallmentTracker() {
    // 할부 데이터 로드
    const { data: installments } = useQuery({
        queryKey: ["installments"],
        queryFn: async () => {
            const res = await fetch("/api/installment");
            if (!res.ok) return []; // 데이터 없으면 빈 배열
            return z.array(Installment).parse(await res.json());
        }
    });

    // 카드 정보 로드 (카드 이름 표시용)
    const { data: cards } = useQuery({
        queryKey: ["card"],
        queryFn: async () => {
            const res = await fetch("/api/card");
            if (!res.ok) return [];
            return z.array(Card).parse(await res.json());
        }
    });

    if (!installments || !cards) return <Skeleton className="w-full h-[200px]" />;

    // 데이터 가공
    const activeInstallments = installments.map(inst => {
        const now = new Date();
        const start = new Date(inst.startDate);
        
        // 경과 개월 수 계산 (시작월 포함 1회차라고 가정)
        // 예: 1월 시작, 현재 3월 -> 1월(1), 2월(2), 3월(3) -> difference + 1
        let monthsPassed = differenceInMonths(now, start) + (now.getDate() >= start.getDate() ? 1 : 0);
        if (monthsPassed < 1) monthsPassed = 1; // 최소 1회차
        
        const isFinished = monthsPassed > inst.months;
        const currentRound = Math.min(monthsPassed, inst.months);
        
        const monthlyAmount = Math.floor(inst.totalAmount / inst.months);
        const paidAmount = monthlyAmount * currentRound;
        const remainingAmount = inst.totalAmount - paidAmount;
        const progress = (currentRound / inst.months) * 100;
        
        const endDate = addMonths(start, inst.months);
        const cardName = cards.find(c => c.id === inst.card_id)?.name || "Unknown Card";

        return { ...inst, currentRound, isFinished, paidAmount, remainingAmount, progress, endDate, cardName, monthlyAmount };
    }).filter(inst => !inst.isFinished); // 완료된 할부는 제외 (필요시 포함 가능)

    // 총 남은 할부금 계산
    const totalRemaining = activeInstallments.reduce((acc, cur) => acc + cur.remainingAmount, 0);
    const totalMonthly = activeInstallments.reduce((acc, cur) => acc + cur.monthlyAmount, 0);

    return (
        <div className="flex flex-col gap-4">
            {/* 요약 헤더 */}
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">남은 할부 원금</span>
                    <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {totalRemaining.toLocaleString()}원
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-xs text-muted-foreground block mb-1">이번 달 나갈 돈</span>
                    <span className="font-bold text-red-500 text-lg">
                        -{totalMonthly.toLocaleString()}원
                    </span>
                </div>
            </div>

            {/* 리스트 */}
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                {activeInstallments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed">
                        <PackageCheck className="w-8 h-8 mb-2 opacity-50" />
                        <p>진행 중인 할부가 없습니다. 👏</p>
                    </div>
                ) : (
                    activeInstallments.map(item => (
                        <div key={item.id} className="p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg hover:border-indigo-200 transition-colors shadow-sm">
                            
                            {/* 상단: 이름 & 카드 & D-Day */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                                        <CreditCard className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{item.merchant}</span>
                                        <span className="text-[10px] text-slate-400">{item.cardName}</span>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 font-normal">
                                    {format(item.endDate, "yyyy.MM")} 종료
                                </Badge>
                            </div>

                            {/* 진행률 바 & 회차 정보 */}
                            <div className="space-y-1.5 mb-2">
                                <div className="flex justify-between text-xs">
                                    <span className="font-medium text-indigo-600">
                                        {item.currentRound}회차 <span className="text-slate-400">/ {item.months}개월</span>
                                    </span>
                                    <span className="text-slate-500">{item.progress.toFixed(0)}%</span>
                                </div>
                                <Progress value={item.progress} className="h-1.5" />
                            </div>

                            {/* 금액 정보 */}
                            <div className="flex justify-between items-end text-xs pt-1 border-t border-slate-50 dark:border-slate-900">
                                <div className="flex flex-col text-slate-400">
                                    <span>월 납부액</span>
                                    <span className="font-medium text-slate-600 dark:text-slate-300">
                                        {item.monthlyAmount.toLocaleString()}원
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-slate-400">남은 금액</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                        {item.remainingAmount.toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}