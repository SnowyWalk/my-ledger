"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Setting } from "@/schema/schemas";
import { CardContent, Card as CardUI } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import SkeletonOverlay from "@/components/SkeletonOverlay";
import CardsSection from "@/components/CardsSection";

export default function SettingPage() {
    const queryClient = useQueryClient();
    const goalSpendingRef = useRef<HTMLInputElement>(null);
    const incomeRef = useRef<HTMLInputElement>(null);
    const startDayOfMonthRef = useRef<HTMLInputElement>(null);

    const { data, isFetching, refetch } = useQuery({
        queryKey: ["setting"],
        queryFn: async () => {
            const res = await fetch("/api/setting", { cache: "no-store" });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return Setting.parse(await res.json());
        },
        staleTime: 10,
    });

    async function saveSetting() {
        const res = await fetch("/api/setting", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                goalSpending: goalSpendingRef.current?.value,
                income: incomeRef.current?.value,
                startDayOfMonth: startDayOfMonthRef.current?.value,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            console.log("Error saving setting:", data);
            throw new Error(data);
        }
        else {
            queryClient.invalidateQueries({ queryKey: ["setting"] });
            toast("Saved setting successfully");
            refetch();
        }
    }

    return (
        <section>
            <h1>Setting</h1>
            <CardsSection>
                <CardUI className="w-full max-w-md mx-auto">
                    <CardContent className="flex flex-col gap-4">
                        <Label htmlFor="goalSpending">goalSpending</Label>
                        <SkeletonOverlay loading={isFetching}>
                            <Input ref={goalSpendingRef} id="goalSpending" type="number" defaultValue={data?.goalSpending ?? '0'} />
                        </SkeletonOverlay>

                        <Label htmlFor="income">income</Label>
                        <SkeletonOverlay loading={isFetching}>
                            <Input ref={incomeRef} id="income" type="number" defaultValue={data?.income ?? '0'} />
                        </SkeletonOverlay>

                        <Label htmlFor="startDayOfMonth">startDayOfMonth</Label>
                        <SkeletonOverlay loading={isFetching}>
                            <Input ref={startDayOfMonthRef} id="startDayOfMonth" type="number" defaultValue={data?.startDayOfMonth ?? '0'} />
                        </SkeletonOverlay>

                        <Button onClick={saveSetting} variant={"ghost"}>Save</Button>
                    </CardContent>
                </CardUI>
            </CardsSection>
        </section>
    );
}