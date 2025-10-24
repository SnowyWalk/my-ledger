"use client";

import { Setting, Transaction } from "@/schema/schemas";
import { Progress } from '@/components/ui/progress';
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useLayoutEffect } from "react";
import z from "zod";
import SkeletonOverlay from "./SkeletonOverlay";

export default function GoalProgress() {
    const { data: settingData, isFetching: isSettingFetching } = useQuery({
        queryKey: ["setting"],
        queryFn: async () => {
            const res = await fetch("/api/setting", { cache: "no-store" });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return Setting.parse(await res.json());
        }
    });

    const { data: transactionData, isFetching: isTransactionFetching } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => {
            const res = await fetch("/api/transaction", { cache: "no-store" });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return z.array(Transaction).parse(await res.json());
        }
    });

    const spentThisMonth = useMemo(() => {
        if (!transactionData) return 0;
        if (!settingData) return 0;

        const now = new Date();
        const startMonth: number = now.getDate() < settingData.startDayOfMonth ? now.getMonth() - 1 : now.getMonth();
        const endMonth: number = startMonth + 1;

        const startDate = new Date(now.getFullYear(), startMonth, settingData.startDayOfMonth);
        const endDate = new Date(now.getFullYear(), endMonth, settingData.startDayOfMonth);
        endDate.setDate(endDate.getDate() - 1);

        return transactionData
            .filter(tx => tx.date >= startDate && tx.date <= endDate && tx.amount < 0)
            .reduce((sum, tx) => sum - tx.amount, 0);
    }, [transactionData, settingData]);

    const goalProgress = useMemo(() => {
        if (!settingData) return 0;
        return settingData.goalSpending === 0 ? 0 : (spentThisMonth / settingData.goalSpending) * 100;
    }, [spentThisMonth, settingData]);

    const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

    const barRef = useRef<HTMLDivElement>(null);
    const labelRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const bar = barRef.current;
        const label = labelRef.current;
        if (!bar || !label) return;

        const calc = () => {
            const barRect = bar.getBoundingClientRect();
            const labelRect = label.getBoundingClientRect();
            const barW = barRect.width;
            const labelW = labelRect.width;

            const fillW = (goalProgress / 100) * barW; // pct는 0~100
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
    }, [goalProgress]); // pct가 바뀔 때 재계산

    return (
        <SkeletonOverlay loading={isSettingFetching || isTransactionFetching} className="pb-5">
            <section>
                <div className="text-xs text-right">{settingData?.goalSpending.toLocaleString() ?? '-'}</div>
                <div className="relative">
                    <div ref={barRef} className="relative">
                        <Progress value={goalProgress} />
                    </div>
                    <span ref={labelRef} className="absolute top-full mt-1 text-xs font-medium tabular-nums" style={{ left: 0 }}>
                        {spentThisMonth.toLocaleString()}
                    </span>
                </div>
            </section>
        </SkeletonOverlay>
    );
}