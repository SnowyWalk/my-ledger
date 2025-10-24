"use client";

import CardsSection from "@/components/CardsSection";
import { CardContent, CardHeader, Card as CardUI } from "@/components/ui/card";
import GoalProgress from "@/components/GoalProgress";
import { ChartAreaStacked } from "@/components/ChartAreaStacked";

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
                <CardUI className="[column-span:3]">
                    <CardHeader>
                        Monthly Chart
                    </CardHeader>
                    <CardContent>
                        <ChartAreaStacked />
                    </CardContent>
                </CardUI>
                <CardUI>
                    <CardHeader>
                        Goal Progress
                    </CardHeader>
                    <CardContent>
                        <GoalProgress />
                    </CardContent>
                </CardUI>
                <CardUI>
                    <CardHeader>
                        Goal Progress
                    </CardHeader>
                    <CardContent>
                        <GoalProgress />
                    </CardContent>
                </CardUI>
                <CardUI>
                    <CardHeader>
                        Goal Progress
                    </CardHeader>
                    <CardContent>
                        <GoalProgress />
                    </CardContent>
                </CardUI>
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