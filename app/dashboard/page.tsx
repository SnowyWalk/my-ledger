"use client";

import { useState, useMemo } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ko } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Setting } from "@/schema/schemas";

import { ChartAreaStacked } from "@/components/ChartAreaStacked";
import GoalProgress from "@/components/GoalProgress";
import CategorizedSpendingChart from "@/components/CategorizedSpendingChart";
import { Card as CardUI, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { FrameGrid } from "@egjs/react-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CardUsageStatus from "@/components/CardUsageStatus";
import TopMerchants from "@/components/TopMerchants";
import WeeklyDayPattern from "@/components/WeeklyDayPattern";

export default function DashboardPage() {
    // 1. 기준이 되는 날짜 (초기값: 오늘)
    // 이 날짜가 포함된 '청구 주기'를 계산합니다.
    const [viewDate, setViewDate] = useState<Date>(new Date());

    // 2. 설정 로드 (시작일 계산용)
    const { data: setting, isLoading } = useQuery({
        queryKey: ["setting"],
        queryFn: async () => {
            const res = await fetch("/api/setting");
            if (!res.ok) throw new Error("Failed");
            return Setting.parse(await res.json());
        }
    });

    // 3. 정확한 기간(Range) 계산
    const period = useMemo(() => {
        if (!setting) return null;

        const startDay = setting.startDayOfMonth;
        const currentDay = viewDate.getDate();

        // viewDate가 기준일(startDay)보다 작으면, '지난 달'의 주기임
        // 예: 시작일 25일, viewDate가 11월 5일 -> 10월 25일 ~ 11월 24일
        const baseMonthDate = currentDay < startDay
            ? subMonths(viewDate, 1)
            : viewDate;

        const startDate = new Date(baseMonthDate.getFullYear(), baseMonthDate.getMonth(), startDay);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDay);
        // 종료일은 다음달 시작일 전날까지로 표기하는 것이 일반적 (예: ~24일)
        // 계산 편의를 위해 endDate는 '다음 주기 시작일(25일)'로 잡고, UI 표기나 필터링에서 조정합니다.

        return { startDate, endDate };
    }, [viewDate, setting]);

    // 핸들러: 한 달 전/후 이동
    const handlePrev = () => setViewDate(prev => subMonths(prev, 1));
    const handleNext = () => setViewDate(prev => addMonths(prev, 1));

    if (isLoading || !period) {
        return <div className="p-8 space-y-4"><Skeleton className="w-full h-12" /><Skeleton className="w-full h-[500px]" /></div>;
    }

    // UI 표시용 종료일 (하루 전 날짜)
    const displayEndDate = new Date(period.endDate);
    displayEndDate.setDate(displayEndDate.getDate() - 1);

    return (
        <section className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground text-xs">
                        가계부 현황을 한눈에 확인하세요.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-secondary/30 p-1.5 rounded-lg">
                    <Button variant="ghost" size="icon" onClick={handlePrev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="text-center min-w-[200px]">
                        <div className="text-sm font-semibold">
                            {format(period.startDate, "yyyy년 MM월 dd일")} ~ {format(displayEndDate, "MM월 dd일")}
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={handleNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <CardUI key="goalProgress" className="w-1/3 h-full">
                <CardHeader>Goal Progress</CardHeader>
                <CardContent>
                    <GoalProgress period={period} />
                </CardContent>
            </CardUI>

            <CardUI key="ChartAreaStacked" className="w-35/40 h-full">
                <CardHeader>Monthly Trend</CardHeader>
                <CardContent>
                    <ChartAreaStacked period={period} />
                </CardContent>
            </CardUI>

            <CardUI key="CategorizedSpendingChart" className="w-1/2 h-full">
                <CardHeader>Category Analysis</CardHeader>
                <CardContent>
                    <CategorizedSpendingChart period={period} />
                </CardContent>
            </CardUI>

            <CardUI key="CardUsageStatus" className="w-1/2 h-full">
                <CardHeader>
                    <CardTitle>카드별 사용 현황</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardUsageStatus period={period} />
                </CardContent>
            </CardUI>

            <CardUI key="WeeklyDayPattern" className="w-1/2 h-full">
                <CardHeader>
                    <CardTitle>요일별 지출 패턴</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]"> {/* 차트 높이 확보를 위해 h-[px] 지정 권장 */}
                    <WeeklyDayPattern period={period} />
                </CardContent>
            </CardUI>

            <CardUI key="TopMerchants" className="w-1/2 h-full">
                <CardHeader>
                    <CardTitle>최다 지출 거래처</CardTitle>
                </CardHeader>
                <CardContent>
                    <TopMerchants period={period} />
                </CardContent>
            </CardUI>
        </section >
    );
}