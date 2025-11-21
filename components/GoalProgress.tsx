"use client";

import { Setting, Transaction } from "@/schema/schemas";
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge'; // 시각적 효과를 위해 Badge 사용 (선택사항)
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useLayoutEffect } from "react";
import z from "zod";
import SkeletonOverlay from "./SkeletonOverlay";
import { Separator } from "./ui/separator";

export default function GoalProgress() {
    // 1. 데이터 페칭
    const { data: settingData, isFetching: isSettingFetching } = useQuery({
        queryKey: ["setting"],
        queryFn: async () => {
            const res = await fetch("/api/setting", { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return Setting.parse(await res.json());
        }
    });

    const { data: transactionData, isFetching: isTransactionFetching } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => {
            const res = await fetch("/api/transaction", { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return z.array(Transaction).parse(await res.json());
        }
    });

    // 2. 날짜 계산 로직
    const dateInfo = useMemo(() => {
        if (!settingData) return null;

        const now = new Date();
        const currentDay = now.getDate();
        const startDay = settingData.startDayOfMonth;

        // 시작 월 계산
        const startMonth = currentDay < startDay ? now.getMonth() - 1 : now.getMonth();

        const startDate = new Date(now.getFullYear(), startMonth, startDay);
        const endDate = new Date(now.getFullYear(), startMonth + 1, startDay);
        endDate.setDate(endDate.getDate() - 1);

        const totalMs = endDate.getTime() - startDate.getTime();
        const passedMs = now.getTime() - startDate.getTime();

        // 올림(Math.ceil)이나 버림 대신 소수점 계산 후 +1로 'N일째' 표현
        const totalDays = Math.round(totalMs / (1000 * 60 * 60 * 24)) + 1;
        const daysPassed = Math.floor(passedMs / (1000 * 60 * 60 * 24)) + 1;

        return {
            startDate,
            endDate,
            totalDays,
            daysPassed: Math.max(1, Math.min(daysPassed, totalDays))
        };
    }, [settingData]);

    // 3. 이번 달 지출액
    const spentThisMonth = useMemo(() => {
        if (!transactionData || !dateInfo) return 0;

        return transactionData
            .filter(tx =>
                tx.date >= dateInfo.startDate &&
                tx.date <= dateInfo.endDate &&
                tx.amount < 0
            )
            .reduce((sum, tx) => sum - tx.amount, 0) + 10000;
    }, [transactionData, dateInfo]);

    // 4. 수치 계산 (요청사항 반영)
    const calculations = useMemo(() => {
        if (!settingData || !dateInfo) return null;

        const goal = settingData.goalSpending;
        const { totalDays, daysPassed } = dateInfo;

        // 실제 진행률 (지출 / 목표)
        const currentProgressPercent = goal === 0 ? 0 : (spentThisMonth / goal) * 100;

        // 기대 지출액 (하루 예산 * 지난 일수)
        const expectedSpent = (goal / totalDays) * daysPassed;

        // 기대 진행률 (날짜 기준 퍼센트)
        const expectedProgressPercent = (daysPassed / totalDays) * 100;

        const diff = spentThisMonth - expectedSpent;
        const isOverSpent = diff > 0;

        const isTotalOverSpent = spentThisMonth > goal;

        const dailyBudget = goal / totalDays;
        const remainingDays = Math.max(1, totalDays - daysPassed);
        const remainingBudget = goal - spentThisMonth;
        const remainingDailyBudget = remainingBudget / remainingDays;

        const actualDailyAverage = spentThisMonth / daysPassed;
        const projectedTotalSpending = actualDailyAverage * dateInfo.totalDays;
        const projectedTotalPercent = goal === 0 ? 0 : (projectedTotalSpending / goal) * 100;

        return {
            goal,
            totalDays,
            daysPassed,
            currentProgressPercent,
            expectedSpent,
            expectedProgressPercent, // 추가: 계획상 퍼센트
            diff,
            isOverSpent,
            isTotalOverSpent,
            dailyBudget,
            remainingDailyBudget,
            actualDailyAverage,
            remainingBudget,
            projectedTotalSpending,
            projectedTotalPercent
        };
    }, [settingData, dateInfo, spentThisMonth]);


    // 5. UI 인터랙션 (라벨 위치)
    const barRef = useRef<HTMLDivElement>(null);
    const labelRef = useRef<HTMLSpanElement>(null);

    const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

    useLayoutEffect(() => {
        const bar = barRef.current;
        const label = labelRef.current;
        if (!bar || !label || !calculations) return;

        const calc = () => {
            const barRect = bar.getBoundingClientRect();
            const labelRect = label.getBoundingClientRect();
            const barW = barRect.width;
            const labelW = labelRect.width;

            const fillW = (calculations.currentProgressPercent / 100) * barW;
            const leftPx = clamp(fillW - labelW / 2, 0, barW - labelW);

            label.style.left = `${leftPx}px`;
        };

        calc();
        const ro = new ResizeObserver(calc);
        ro.observe(bar);
        ro.observe(label);
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
                            <span className="text-muted-foreground">이번 달 기간:</span>
                            <Badge variant="secondary" className="font-normal">
                                총 {calculations.totalDays}일 중 {calculations.daysPassed}일째
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
                            <Progress value={calculations.currentProgressPercent} className="h-3" />
                        </div>

                        <span
                            ref={labelRef}
                            className="absolute top-full mt-1 text-xs font-bold tabular-nums transition-all"
                            style={{ left: 0 }}
                        >
                            {spentThisMonth.toLocaleString()}원
                        </span>
                    </div>

                    {/* 분석 텍스트 영역 */}
                    <div className="flex flex-col gap-1">
                        <Separator className="mt-0" />
                        {/* 1. 계획 대비 현재 상황 (퍼센트 추가됨) */}
                        <Label className="text-sm text-muted-foreground mt-1 gap-1">
                            <span>계획대로라면 오늘까지 <Empathed value={calculations.expectedSpent} /></span>
                            <span>({calculations.expectedProgressPercent.toFixed(1)}%)</span>사용했어야 합니다.
                        </Label>

                        <Label className="text-sm text-muted-foreground gap-1">
                            <span>실제로는 <Empathed value={spentThisMonth} /> 사용했습니다.{' '}</span>
                            <span className={calculations.isOverSpent ? "text-red-500" : "text-blue-500"}>
                                (<Empathed value={calculations.diff} /> {calculations.isOverSpent ? '초과했어요 😭' : '남았어요 👍'})
                            </span>
                        </Label>

                        <Separator />

                        {/* 2. 예산 추천 */}
                        <Label className="text-sm text-muted-foreground mt-1">
                            <span>원래 계획은 하루에 <Empathed value={calculations.dailyBudget} /> 씩 사용하는 것입니다.</span>
                        </Label>

                        <Label className="text-sm text-muted-foreground">
                            <span>여태까지는 하루에 <Empathed value={calculations.actualDailyAverage} /> 씩 사용했습니다.</span>
                        </Label>

                        <Label className={`text-sm ${calculations.isTotalOverSpent ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                            {calculations.isTotalOverSpent ? (
                                // 초과했을 경우
                                <span>
                                    이미 총 예산을 <Empathed value={calculations.remainingBudget} /> 초과하여 사용할 수 있는 예산이 없습니다.
                                </span>
                            ) : (
                                // 정상일 경우
                                <span>
                                    남은 기간 동안 하루에 <Empathed value={calculations.remainingDailyBudget} /> 씩 사용 가능해요.
                                </span>
                            )}
                        </Label>

                        <Separator />

                        <Label className="text-xl text-muted-foreground mt-2 gap-1">
                            <span>이 속도대로면 월말에 총 사용 예상 금액은 <Empathed value={calculations.projectedTotalSpending} /></span>
                            <span className={calculations.projectedTotalPercent > 100 ? "text-red-500 font-medium" : "text-blue-500"}>
                                ({calculations.projectedTotalPercent.toFixed(1)}%)
                            </span> 입니다.
                        </Label>
                    </div>
                </section>
            )}
        </SkeletonOverlay>
    );
}