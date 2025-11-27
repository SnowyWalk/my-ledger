"use client";

import { Setting, Transaction } from "@/schema/schemas";
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useLayoutEffect } from "react";
import z from "zod";
import SkeletonOverlay from "./SkeletonOverlay";
import { Separator } from "./ui/separator";

interface GoalProgressProps {
    period: {
        startDate: Date;
        endDate: Date;
    };
}

export default function GoalProgress({ period }: GoalProgressProps) {
    // 1. 데이터 페칭
    const { data: settingData, isFetching: isSettingFetching } = useQuery({
        queryKey: ["setting"],
        queryFn: async () => {
            const res = await fetch("/api/setting");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return Setting.parse(await res.json());
        }
    });

    const { data: transactionData, isFetching: isTransactionFetching } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => {
            const res = await fetch("/api/transaction");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return z.array(Transaction).parse(await res.json());
        }
    });

    // 2. 계산 로직 (기간 기준)
    const calculations = useMemo(() => {
        if (!settingData || !transactionData) return null;

        const { startDate, endDate } = period;
        const now = new Date();
        const goal = settingData.goalSpending;

        // 기간 내 지출액 (spentThisPeriod)
        const spentThisPeriod = transactionData
            .filter(tx =>
                tx.date >= startDate &&
                tx.date < endDate &&
                tx.amount < 0
            )
            .reduce((sum, tx) => sum - tx.amount, 0); // 음수를 양수로 변환하여 합산

        // 날짜 경과 계산 (과거/현재/미래 분기 처리)
        const totalMs = endDate.getTime() - startDate.getTime();
        const totalDays = Math.round(totalMs / (1000 * 60 * 60 * 24));
        let daysPassed = 0;

        if (now >= endDate) {
            // 이미 지난 기간 -> 전체 일수 반영
            daysPassed = totalDays;
        } else if (now < startDate) {
            // 미래 기간 -> 0일
            daysPassed = 0;
        } else {
            // 현재 진행 중인 기간 -> 시작일부터 오늘까지
            const passedMs = now.getTime() - startDate.getTime();
            daysPassed = Math.floor(passedMs / (1000 * 60 * 60 * 24)) + 1;
        }

        // 수치 계산
        const currentProgressPercent = goal === 0 ? 0 : (spentThisPeriod / goal) * 100;
        
        // 예산 대비 권장 지출액 (하루 예산 * 지난 일수)
        const expectedSpent = (goal / totalDays) * daysPassed;
        const expectedProgressPercent = (daysPassed / totalDays) * 100;

        const diff = spentThisPeriod - expectedSpent;
        const isOverSpent = diff > 0;
        const isTotalOverSpent = spentThisPeriod > goal;

        const dailyBudget = goal / totalDays;
        const remainingDays = Math.max(1, totalDays - daysPassed);
        const remainingBudget = goal - spentThisPeriod;
        const remainingDailyBudget = remainingBudget / remainingDays;

        // 현재 추세대로 갈 경우 예상 총액
        const actualDailyAverage = daysPassed > 0 ? spentThisPeriod / daysPassed : 0;
        const projectedTotalSpending = actualDailyAverage * totalDays;
        const projectedTotalPercent = goal === 0 ? 0 : (projectedTotalSpending / goal) * 100;

        return {
            goal,
            totalDays,
            daysPassed,
            currentProgressPercent,
            expectedSpent,
            expectedProgressPercent,
            diff,
            isOverSpent,
            isTotalOverSpent,
            dailyBudget,
            remainingDailyBudget,
            actualDailyAverage,
            remainingBudget,
            projectedTotalSpending,
            projectedTotalPercent,
            spentThisPeriod
        };
    }, [settingData, transactionData, period]); // period 변경 시 재계산

    // 3. UI 인터랙션 (라벨 위치)
    const barRef = useRef<HTMLDivElement>(null);
    const labelRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const bar = barRef.current;
        const label = labelRef.current;
        if (!bar || !label || !calculations) return;

        const calc = () => {
            const barRect = bar.getBoundingClientRect();
            const labelRect = label.getBoundingClientRect();
            const barW = barRect.width;
            const labelW = labelRect.width;

            // 진행률만큼 이동하되, 바깥으로 나가지 않게 clamp 처리
            const fillW = (Math.min(calculations.currentProgressPercent, 100) / 100) * barW;
            const leftPx = Math.min(Math.max(fillW - labelW / 2, 0), barW - labelW);

            label.style.left = `${leftPx}px`;
        };

        calc();
        const ro = new ResizeObserver(calc);
        ro.observe(bar);
        window.addEventListener("resize", calc);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", calc);
        };
    }, [calculations?.currentProgressPercent]);

    const Empathed = ({ value }: { value: number }) => (
        <span className="m-0 p-0 text-foreground font-semibold">
            {Math.floor(Math.abs(value)).toLocaleString()}원
        </span>
    );

    const isLoading = isSettingFetching || isTransactionFetching || !calculations;

    return (
        <SkeletonOverlay loading={isLoading} className="pb-5">
            {calculations && (
                <section>
                    {/* 상단: 날짜 정보 및 목표 표시 */}
                    <div className="flex justify-between items-end mb-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">기간 경과:</span>
                            <Badge variant="secondary" className="font-normal">
                                {calculations.daysPassed}일 / {calculations.totalDays}일
                            </Badge>
                        </div>
                        <div className="text-muted-foreground">
                            목표: {calculations.goal.toLocaleString()}원
                        </div>
                    </div>

                    {/* 메인 프로그레스 바 */}
                    <div className="relative mb-8">
                        <div ref={barRef} className="relative mb-1">
                            <div className="flex justify-center items-baseline w-full mb-2">
                                <Label className={`text-4xl font-bold ${calculations.isTotalOverSpent ? "text-red-500" : "text-blue-500"}`}>
                                    {calculations.currentProgressPercent.toFixed(1)}% <Label className="text-2xl text-muted-foreground">/ {calculations.expectedProgressPercent.toFixed(1)}%</Label>
                                </Label>
                            </div>
                            <Progress value={Math.min(calculations.currentProgressPercent, 100)} className="h-3" />
                        </div>

                        <span
                            ref={labelRef}
                            className="absolute top-full mt-1 text-xs font-bold tabular-nums transition-all"
                            style={{ left: 0 }}
                        >
                            {calculations.spentThisPeriod.toLocaleString()}원
                        </span>
                    </div>

                    {/* 분석 텍스트 영역 */}
                    <div className="flex flex-col gap-1">
                        <Separator className="mt-0" />
                        
                        <Label className="text-sm text-muted-foreground mt-1 gap-1">
                            <span>계획상 <Empathed value={calculations.expectedSpent} /></span>
                            <span>({calculations.expectedProgressPercent.toFixed(1)}%)</span>사용했어야 합니다.
                        </Label>

                        <Label className="text-sm text-muted-foreground gap-1">
                            <span>실제로는 <Empathed value={calculations.spentThisPeriod} /> 사용했습니다.{' '}</span>
                            <span className={calculations.isOverSpent ? "text-red-500" : "text-blue-500"}>
                                (<Empathed value={calculations.diff} /> {calculations.isOverSpent ? '초과 😭' : '절약 👍'})
                            </span>
                        </Label>

                        <Separator />

                        <Label className="text-sm text-muted-foreground mt-1">
                            <span>일일 권장 예산: <Empathed value={calculations.dailyBudget} /></span>
                        </Label>

                        <Label className="text-sm text-muted-foreground">
                            <span>현재 일일 평균: <Empathed value={calculations.actualDailyAverage} /></span>
                        </Label>

                        <Label className={`text-sm ${calculations.isTotalOverSpent ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                            {calculations.isTotalOverSpent ? (
                                <span>예산 초과! 더 이상 사용할 수 있는 예산이 없습니다.</span>
                            ) : (
                                <span>
                                    남은 기간 하루 예산: <Empathed value={calculations.remainingDailyBudget} />
                                </span>
                            )}
                        </Label>

                        <Separator />

                        <Label className="text-xl text-muted-foreground mt-2 gap-1">
                            <span>월말 예상 지출: <Empathed value={calculations.projectedTotalSpending} /></span>
                            <span className={calculations.projectedTotalPercent > 100 ? "text-red-500 font-medium" : "text-blue-500"}>
                                ({calculations.projectedTotalPercent.toFixed(1)}%)
                            </span>
                        </Label>
                    </div>
                </section>
            )}
        </SkeletonOverlay>
    );
}