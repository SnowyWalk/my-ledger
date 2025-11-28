"use client";

import { useState, useMemo } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
// ... (기존 import 유지)
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
        return <div className="p-8 space-y-4"><Skeleton className="w-full h-12" /><Skeleton className="w-full h-[500px]" /></div>;
    }

    const displayEndDate = new Date(period.endDate);
    displayEndDate.setDate(displayEndDate.getDate() - 1);

    return (
        <section className="space-y-4">
            {/* [수정됨] sticky 속성 추가 
              - sticky: 스크롤 시 고정
              - top-4: 화면 최상단에서 약간(1rem) 떨어진 위치에 고정 (레이아웃 여백 고려)
              - z-50: 다른 컨텐츠(차트 등)보다 위에 보이도록 설정
            */}
            <div className="sticky top-4 z-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
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

            <CardUI key="CategorizedSpendingChart" className="w-1/2 h-full min-h-[693px]">
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
                <CardContent className="h-[250px]">
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