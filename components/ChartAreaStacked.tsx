"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A stacked area chart"

const chartData = [
  { day: "1", income: 186, spent: 80 },
  { day: "2", income: 305, spent: 200 },
  { day: "3", income: 237, spent: 120 },
  { day: "4", income: 73, spent: 190 },
  { day: "5", income: 209, spent: 130 },
  { day: "6", income: 214, spent: 140 },
  { day: "7", income: 186, spent: 80 },
  { day: "8", income: 305, spent: 200 },
  { day: "9", income: 237, spent: 120 },
  { day: "10", income: 73, spent: 190 },
  { day: "11", income: 209, spent: 130 },
  { day: "12", income: 214, spent: 140 },
  { day: "13", income: 214, spent: 140 },
  { day: "14", income: 214, spent: 140 },
  { day: "15", income: 214, spent: 140 },
  { day: "16", income: 186, spent: 80 },
  { day: "17", income: 305, spent: 200 },
  { day: "18", income: 237, spent: 120 },
  { day: "19", income: 73, spent: 190 },
  { day: "20", income: 209, spent: 130 },
  { day: "21", income: 214, spent: 140 },
  { day: "22", income: 186, spent: 80 },
  { day: "23", income: 305, spent: 200 },
  { day: "24", income: 237, spent: 120 },
  { day: "25", income: 73, spent: 190 },
  { day: "26", income: 209, spent: 130 },
  { day: "27", income: 214, spent: 140 },
  { day: "28", income: 214, spent: 140 },
  { day: "29", income: 214, spent: 140 },
  { day: "30", income: 214, spent: 300 },
]

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-1)",
  },
  spent: {
    label: "Spent",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function ChartAreaStacked() {
  return (
    <section>
      <ChartContainer config={chartConfig}>
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Area
            dataKey="spent"
            type="natural"
            fill="var(--color-spent)"
            fillOpacity={0.4}
            stroke="var(--color-spent)"
          />
          <Area
            dataKey="income"
            type="natural"
            fill="var(--color-income)"
            fillOpacity={0.4}
            stroke="var(--color-income)"
          />
        </AreaChart>
      </ChartContainer>
    </section>
  )
}
