"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/schema/schemas";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { CardHeader, CardTitle } from "@/components/ui/card";

interface WeeklyDayPatternProps {
    period: {
        startDate: Date;
        endDate: Date;
    };
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function WeeklyDayPattern({ period }: WeeklyDayPatternProps) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    // 1. 데이터 로드
    const { data: transactions } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => {
            const res = await fetch("/api/transaction");
            if (!res.ok) throw new Error("Failed");
            return z.array(Transaction).parse(await res.json());
        }
    });

    // 2. 데이터 가공
    const chartData = useMemo(() => {
        if (!transactions) return [];

        const { startDate, endDate } = period;
        
        // 0(일) ~ 6(토) 초기화
        const dayStats = Array(7).fill(0).map((_, i) => ({
            day: DAYS[i],
            amount: 0,
            index: i
        }));

        // 기간 내 지출 필터링
        const filteredTx = transactions.filter(t => 
            t.amount < 0 && t.date >= startDate && t.date < endDate
        );

        // 요일별 합산
        filteredTx.forEach(tx => {
            const dayIndex = tx.date.getDay(); // 0 ~ 6
            dayStats[dayIndex].amount += Math.abs(tx.amount);
        });

        return dayStats;
    }, [transactions, period]);

    // 최대 지출 요일 찾기 (강조용)
    const maxAmount = useMemo(() => Math.max(...chartData.map(d => d.amount), 0), [chartData]);

    if (!transactions) return <Skeleton className="w-full h-[300px] rounded-xl" />;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="h-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 12 }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 11 }} 
                            tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                        />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: number) => [`${value.toLocaleString()}원`, '지출액']}
                        />
                        <Bar 
                            dataKey="amount" 
                            radius={[6, 6, 0, 0]}
                            onMouseEnter={(_, index) => setHoverIndex(index)}
                            onMouseLeave={() => setHoverIndex(null)}
                        >
                            {chartData.map((entry, index) => {
                                // 가장 많이 쓴 요일은 붉은색, 나머지는 파란색
                                const isMax = entry.amount === maxAmount && maxAmount > 0;
                                const isActive = hoverIndex === index;
                                
                                let fill = '#eff6ff'; // 기본 (매우 연한 블루)
                                if (entry.amount > 0) fill = '#3b82f6'; // 값이 있으면 블루
                                if (isMax) fill = '#ef4444'; // 최대값은 레드

                                return (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={fill} 
                                        fillOpacity={isActive ? 0.8 : 1}
                                        className="transition-all duration-300"
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center text-xs text-gray-400">
                * 이번 기간 중 <span className="font-bold text-gray-600">{chartData.find(d => d.amount === maxAmount)?.day}요일</span>에 가장 많은 지출이 발생했습니다.
            </div>
        </div>
    );
}