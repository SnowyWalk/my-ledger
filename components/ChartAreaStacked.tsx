"use client"

import { useMemo } from "react"
import { Area, CartesianGrid, XAxis, YAxis, Line, ComposedChart } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { Setting, Transaction } from "@/schema/schemas"
import { z } from "zod"
import { addDays, differenceInDays, isAfter, subMonths } from "date-fns"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

export const description = "Monthly Cumulative Spending Comparison"

const chartConfig = {
  current: {
    label: "이번 주기 누적",
    color: "var(--chart-1)",
  },
  last: {
    label: "지난 주기 누적",
    color: "var(--chart-2)",
  },
  ideal: {
    label: "권장 소비선",
    color: "var(--chart-3)",
  },
  goal: {
    label: "목표 예산",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

interface ChartAreaStackedProps {
    period: {
        startDate: Date;
        endDate: Date;
    };
}

export function ChartAreaStacked({ period }: ChartAreaStackedProps) {
  // 1. 데이터 로드
  const { data: transactions, isLoading: isTxLoading } = useQuery({
    queryKey: ["transaction"],
    queryFn: async () => {
      const res = await fetch("/api/transaction");
      if (!res.ok) throw new Error("Failed");
      return z.array(Transaction).parse(await res.json());
    }
  });

  const { data: setting, isLoading: isSetLoading } = useQuery({
    queryKey: ["setting"],
    queryFn: async () => {
      const res = await fetch("/api/setting");
      if (!res.ok) throw new Error("Failed");
      return Setting.parse(await res.json());
    }
  });

  // 2. 데이터 가공
  const chartData = useMemo(() => {
    if (!transactions || !setting) return [];

    const now = new Date();
    const { startDate: currentStart, endDate: currentEnd } = period;
    // 지난 주기는 정확히 1달 전으로 계산
    const lastStart = subMonths(currentStart, 1);

    const goal = setting.goalSpending;

    // 총 일수 (이번 주기 기준)
    const totalDays = differenceInDays(currentEnd, currentStart);

    const data = [];
    let currentAcc = 0;
    let lastAcc = 0;

    for (let i = 0; i < totalDays; i++) {
      const targetDateCurrent = addDays(currentStart, i);
      const targetDateLast = addDays(lastStart, i);

      // (1) 이번 주기 지출 합산 (해당 일자)
      const dailySpentCurrent = transactions
        .filter(t => 
          t.amount < 0 && 
          t.date.getFullYear() === targetDateCurrent.getFullYear() &&
          t.date.getMonth() === targetDateCurrent.getMonth() &&
          t.date.getDate() === targetDateCurrent.getDate()
        )
        .reduce((acc, cur) => acc + Math.abs(cur.amount), 0);

      // (2) 저번 주기 지출 합산 (해당 일자)
      const dailySpentLast = transactions
        .filter(t => 
          t.amount < 0 && 
          t.date.getFullYear() === targetDateLast.getFullYear() &&
          t.date.getMonth() === targetDateLast.getMonth() &&
          t.date.getDate() === targetDateLast.getDate()
        )
        .reduce((acc, cur) => acc + Math.abs(cur.amount), 0);

      currentAcc += dailySpentCurrent;
      lastAcc += dailySpentLast;

      // 미래 날짜 처리:
      // 그래프가 뚝 떨어지는 것을 방지하기 위해, 
      // 현재 보고 있는 주기가 '진행 중(오늘 포함)'이면서 target이 미래일 때만 null 처리
      // 만약 과거 주기를 보고 있다면 끝까지 그려야 함.
      const isFuture = isAfter(targetDateCurrent, now);
      
      data.push({
        day: `${i + 1}일차`,
        current: isFuture ? null : currentAcc, 
        last: lastAcc,
        ideal: (goal / totalDays) * (i + 1), // 권장 소비선
        goalLine: goal,        // 목표 상한선
      });
    }

    return data;
  }, [transactions, setting, period]);

  if (isTxLoading || isSetLoading) {
    return <div className="h-[300px] flex items-center justify-center"><Skeleton className="w-full h-full" /></div>;
  }

  return (
    <Card className="shadow-none border-none">
      <CardHeader>
        <CardTitle>소비 추이 비교</CardTitle>
        <CardDescription>
          선택된 기간과 직전 주기의 소비 흐름을 비교합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ComposedChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd" 
              minTickGap={30}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <ChartTooltip
              cursor={true}
              content={<ChartTooltipContent indicator="dot" />}
            />
            
            {/* Last Month Area (Background) */}
            <Area
              dataKey="last"
              type="monotone"
              fill="var(--color-last)"
              fillOpacity={0.1}
              stroke="var(--color-last)"
              strokeDasharray="5 5"
            />

            {/* Current Month Area (Foreground) */}
            <Area
              dataKey="current"
              type="monotone"
              fill="var(--color-current)"
              fillOpacity={0.4}
              stroke="var(--color-current)"
              strokeWidth={2}
            />

            {/* Ideal Line */}
            <Line
              dataKey="ideal"
              type="linear"
              stroke="var(--color-ideal)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />

            {/* Goal Line */}
            <Line
              dataKey="goalLine"
              type="linear"
              stroke="var(--color-goal)"
              strokeWidth={1}
              dot={false}
            />

          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}