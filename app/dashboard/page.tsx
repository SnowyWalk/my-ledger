"use client";

import { useState, useMemo } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Setting } from "@/schema/schemas";

import { ChartAreaStacked } from "@/components/ChartAreaStacked";
import GoalProgress from "@/components/GoalProgress";
import CategorizedSpendingChart from "@/components/CategorizedSpendingChart";
import { Card as CardUI, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CardUsageStatus from "@/components/CardUsageStatus";
import TopMerchants from "@/components/TopMerchants";
import WeeklyDayPattern from "@/components/WeeklyDayPattern";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
    const [viewDate, setViewDate] = useState<Date>(new Date());

    const { data: setting, isLoading } = useQuery({
        queryKey: ["setting"],
        queryFn: async () => {
            const res = await fetch("/api/setting");
            if (!res.ok) throw new Error("Failed");
            return Setting.parse(await res.json());
        }
    });

    const period = useMemo(() => {
        if (!setting) return null;

        const startDay = setting.startDayOfMonth;
        const currentDay = viewDate.getDate();

        const baseMonthDate = currentDay < startDay
            ? subMonths(viewDate, 1)
            : viewDate;

        const startDate = new Date(baseMonthDate.getFullYear(), baseMonthDate.getMonth(), startDay);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDay);

        return { startDate, endDate };
    }, [viewDate, setting]);

    const handlePrev = () => setViewDate(prev => subMonths(prev, 1));
    const handleNext = () => setViewDate(prev => addMonths(prev, 1));

    if (isLoading || !period) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="w-full h-12 rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-[300px] rounded-xl" />
                    <Skeleton className="h-[300px] rounded-xl" />
                </div>
                <Skeleton className="w-full h-[400px] rounded-xl" />
            </div>
        );
    }

    const displayEndDate = new Date(period.endDate);
    displayEndDate.setDate(displayEndDate.getDate() - 1);

    return (
        <section className="space-y-4 pb-8">
            {/* 1. 컨트롤 바 (Sticky) */}
            <div className="sticky top-4 z-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-4 rounded-xl border shadow-sm transition-all">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground text-xs">
                        {format(period.startDate, "yyyy년 MM월 dd일")} ~ {format(displayEndDate, "MM월 dd일")}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* 2. 상단 핵심 지표 (Grid 유지 - 높이가 일정하므로) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-0">
                <CardUI className="">
                    <CardHeader className="pb-2">
                        <CardTitle className="">Goal Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <GoalProgress period={period} />
                    </CardContent>
                </CardUI>

                <CardUI className="">
                    <CardHeader className="pb-2">
                        <CardTitle className="">Weekly Pattern</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                        <WeeklyDayPattern period={period} />
                    </CardContent>
                </CardUI>
            </div>

            {/* 3. 중단 와이드 차트 (독립 배치) */}
            <CardUI className="">
                <CardHeader className="pb-2">
                    <CardTitle className="">Spending Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[600px]">
                    <ChartAreaStacked period={period} />
                </CardContent>
            </CardUI>

            {/* 4. 하단 가변 높이 영역 (Masonry - Manual Columns) */}
            {/* 좌/우 컬럼을 분리하여 각자 내부 컨텐츠 높이만큼 늘어나게 함 */}
            <div className="flex flex-col lg:flex-row gap-4 items-start">
                
                {/* 왼쪽 컬럼 (Category Analysis) */}
                <div className="w-full lg:w-1/2 flex flex-col gap-0">
                    <CardUI className="">
                        <CardHeader className="pb-2">
                            <CardTitle className="">Category Analysis</CardTitle>
                        </CardHeader>
                        {/* 높이 제한 제거 (h-auto) */}
                        <CardContent className="h-auto p-0 min-h-[400px]">
                            <CategorizedSpendingChart period={period} />
                        </CardContent>
                    </CardUI>
                </div>

                {/* 오른쪽 컬럼 (Merchants + Cards) */}
                <div className="w-full lg:w-1/2 flex flex-col gap-0">
                    {/* Top Merchants: 리스트 길이에 따라 늘어남 */}
                    <CardUI className="">
                        <CardHeader className="pb-2">
                            <CardTitle className="">Top Merchants</CardTitle>
                        </CardHeader>
                        {/* 높이 제한 제거, 스크롤 제거 */}
                        <CardContent className="h-auto p-0 px-4 pb-4">
                            <TopMerchants period={period} />
                        </CardContent>
                    </CardUI>

                    {/* Card Performance: 리스트 길이에 따라 늘어남 */}
                    <CardUI className="">
                        <CardHeader className="pb-2">
                            <CardTitle className="">Card Performance</CardTitle>
                        </CardHeader>
                        {/* 높이 제한 제거, 스크롤 제거 */}
                        <CardContent className="h-auto p-0 px-4 pb-4">
                            <CardUsageStatus period={period} />
                        </CardContent>
                    </CardUI>
                </div>
            </div>
        </section>
    );
}