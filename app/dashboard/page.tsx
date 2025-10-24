"use client";

import CardsSection from "@/components/CardsSection";
import { Progress } from '@/components/ui/progress';
import { Setting, Transaction, TransactionType } from "@/schema/schemas";
import { CardContent, CardHeader, Card as CardUI } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useLayoutEffect, useMemo, useRef } from "react";
import z from "zod";
import GoalProgress from "@/components/GoalProgress";

export default function DashboardPage() {


    return (
        <section>
            <h1>Dashboard</h1>
            <CardsSection>
                <CardUI>
                    <CardHeader>
                        Goal Progress
                    </CardHeader>
                    <CardContent>
                        <GoalProgress />
                    </CardContent>
                </CardUI>
            </CardsSection>

        </section>
    );
}