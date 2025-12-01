"use client"

import { useMemo } from "react"
import { Area, CartesianGrid, XAxis, YAxis, Line, ComposedChart } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { Setting, Transaction } from "@/schema/schemas"
import { z } from "zod"
import { addDays, differenceInDays, isAfter, subMonths } from "date-fns"

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
    const lastStart = subMonths(currentStart, 1);
    const goal = setting.goalSpending;
    const totalDays = differenceInDays(currentEnd, currentStart);

    const data = [];
    let currentAcc = 0;
    let lastAcc = 0;

    for (let i = 0; i < totalDays; i++) {
      const targetDateCurrent = addDays(currentStart, i);
      const targetDateLast = addDays(lastStart, i);

      const dailySpentCurrent = transactions
        .filter(t => 
          t.amount < 0 && 
          t.date.getFullYear() === targetDateCurrent.getFullYear() &&
          t.date.getMonth() === targetDateCurrent.getMonth() &&
          t.date.getDate() === targetDateCurrent.getDate()
        )
        .reduce((acc, cur) => acc + Math.abs(cur.amount), 0);

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

      const isFuture = isAfter(targetDateCurrent, now);
      
      data.push({
        day: `${i + 1}일차`,
        current: isFuture ? null : currentAcc, 
        last: lastAcc,
        ideal: (goal / totalDays) * (i + 1),
        goalLine: goal,
      });
    }

    return data;
  }, [transactions, setting, period]);

  if (isTxLoading || isSetLoading) {
    return <Skeleton className="w-full h-full min-h-[200px]" />;
  }

  return (
    // 수정됨: 내부 Card 제거 및 aspect-auto h-full w-full 적용하여 부모 컨테이너에 맞춤
    <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
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
  )
}