"use client";

import { ChartAreaStacked } from "@/components/ChartAreaStacked";
import GoalProgress from "@/components/GoalProgress";
import { MuuriGrid, MuuriItem } from "@/components/Muuri";
import { Card as CardUI, CardHeader, CardContent } from "@/components/ui/card";


export default function DashboardPage() {

    return (
        <section>
            <h1>Dashboard</h1>

            <MuuriGrid>
                <MuuriItem margin={8}>
                    <CardUI>
                        <CardHeader>
                            Goal Progress
                        </CardHeader>
                        <CardContent>
                            <GoalProgress />
                        </CardContent>
                    </CardUI>
                </MuuriItem>

                <MuuriItem margin={8}>
                    <CardUI>
                        <CardHeader>
                            Chart Area Stacked
                        </CardHeader>
                        <CardContent>
                            <ChartAreaStacked />
                        </CardContent>
                    </CardUI>
                </MuuriItem>


            </MuuriGrid>
        </section>
    );
}
