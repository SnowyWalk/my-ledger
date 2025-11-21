"use client";

import { ChartAreaStacked } from "@/components/ChartAreaStacked";
import GoalProgress from "@/components/GoalProgress";
import CategorizedSpendingChart from "@/components/CategorizedSpendingChart";
import { Card as CardUI, CardHeader, CardContent } from "@/components/ui/card";
import { FrameGrid } from "@egjs/react-grid";


export default function DashboardPage() {
    return (
        <section>
            <h1>Dashboard</h1>
            <FrameGrid
                rectSize={{ inlineSize: 120, contentSize: 50 }}
                frame={[
                    [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
                    [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
                    [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
                    [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
                    [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
                    [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
                    [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
                    [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2],
                    [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                    [3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
                ]}
                gap={8}
                defaultDirection="end"
                useFit
                observeChildren
            >
                <CardUI key="goalProgress" className="w-full h-full">
                    <CardHeader>
                        Goal Progress
                    </CardHeader>
                    <CardContent>
                        <GoalProgress />
                    </CardContent>
                </CardUI>

                <CardUI key="ChartAreaStacked" className="w-full h-full">
                    <CardHeader>
                        Chart Area Stacked
                    </CardHeader>
                    <CardContent>
                        <ChartAreaStacked />
                    </CardContent>
                </CardUI>

                <CardUI key="CategorizedSpendingChart" className="w-full h-full">
                    <CardHeader>
                        Categorized Spending Chart
                    </CardHeader>
                    <CardContent>
                        <CategorizedSpendingChart />
                    </CardContent>
                </CardUI>
            </FrameGrid>
        </section >
    );
}