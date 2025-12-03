
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@/schema/schemas";
import { z } from "zod";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface HourlyProps {
    period: { startDate: Date; endDate: Date; };
}

const TIME_SLOTS = [
    { label: "아침", start: 6, end: 11, color: "#fcd34d" },   // 06~11
    { label: "점심", start: 11, end: 14, color: "#fbbf24" },  // 11~14
    { label: "오후", start: 14, end: 18, color: "#f59e0b" },  // 14~18
    { label: "저녁", start: 18, end: 22, color: "#f97316" },  // 18~22
    { label: "심야", start: 22, end: 26, color: "#6366f1" },  // 22~02 (익일 2시까지)
    { label: "새벽", start: 2, end: 6, color: "#a855f7" },    // 02~06
];

export default function HourlySpendingPattern({ period }: HourlyProps) {
    const { data: transactions } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => (await fetch("/api/transaction").then(res => res.json())) as z.infer<typeof Transaction>[]
    });

    const data = useMemo(() => {
        if (!transactions) return [];

        const slotMap = TIME_SLOTS.map(slot => ({ ...slot, amount: 0 }));

        transactions.forEach(tx => {
            if (tx.amount >= 0 || tx.date < period.startDate || tx.date >= period.endDate) return;

            let hour = tx.date.getHours();
            // 심야(22~02) 처리를 위해 새벽 시간대(0~2시)는 24를 더해서 처리하거나 로직 조정
            // 여기서는 단순하게 시간 비교
            
            const targetSlot = slotMap.find(slot => {
                if (slot.label === "심야") { 
                    return hour >= 22 || hour < 2; // 22시~24시 또는 0시~2시
                }
                return hour >= slot.start && hour < slot.end;
            });

            if (targetSlot) {
                targetSlot.amount += Math.abs(tx.amount);
            }
        });

        return slotMap;
    }, [transactions, period]);

    if (!transactions) return <Skeleton className="w-full h-[200px]" />;

    // 가장 지출이 많은 시간대
    const maxSlot = data.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);

    return (
        <div className="flex flex-col h-full">
            <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <XAxis 
                            dataKey="label" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 11, fill: '#94a3b8' }} 
                        />
                        <Tooltip 
                            formatter={(value: number) => [`${value.toLocaleString()}원`, '지출']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {maxSlot.amount > 0 && (
                <div className="text-center text-xs text-slate-500 mt-2">
                    주로 <span className="font-bold text-slate-700 dark:text-slate-300">{maxSlot.label}</span> 시간에 가장 많은 소비를 합니다.
                </div>
            )}
        </div>
    );
}