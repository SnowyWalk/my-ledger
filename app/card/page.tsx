"use client";

import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CardContent, CardHeader, Card as CardUI } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-separator";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { z } from "zod";
import { Card, CardType } from "@/schema/schemas";

export default function CardPage() {
    const { data: cards, isLoading, refetch } = useQuery({
        queryKey: ["card"],
        queryFn: async () => {
            const res = await fetch("/api/card", { cache: "no-store" });
            if (!res.ok) 
                throw new Error(`HTTP ${res.status}`);
            return z.array(Card).parse(await res.json());
        },
        staleTime: 5000,
    });

    const nameRef = useRef<HTMLInputElement>(null);
    const limitRef = useRef<HTMLInputElement>(null);
    const dueDayRef = useRef<HTMLInputElement>(null);

    async function AddCard() {
        const name = nameRef.current?.value;
        const limit = limitRef.current?.value;
        const dueDay = dueDayRef.current?.value;

        const res = await fetch("/api/card", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                limit: Number(limit),
                dueDay: Number(dueDay),
            }),
        })

        const data = await res.json();
        if (!res.ok) {
            console.log("Error saving card:", data);
            throw new Error(data);
        } else {
            refetch();
        }
    }

    return (
        <section>
            <h1>Card Page</h1>
            <Table className="w-[40%]" >
                <TableHeader>
                    <TableRow>
                        <TableHead className="border">Name</TableHead>
                        <TableHead className="border">Limit</TableHead>
                        <TableHead className="border">Due day</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        isLoading &&
                        (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center"><Spinner />Loading...</TableCell>
                            </TableRow>
                        )
                    }

                    {
                        !isLoading && cards != null &&
                        (
                            (cards as CardType[]).map((e: CardType) => (
                                <TableRow key={e.id}>
                                    <TableCell className="border">{e.name}</TableCell>
                                    <TableCell className="border">{e.limit}</TableCell>
                                    <TableCell className="border">{e.dueDay}</TableCell>
                                </TableRow>
                            ))
                        )
                    }
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={2}></TableCell>
                        <TableCell className="text-right">
                            {
                                !isLoading && cards != null ?
                                    `총 ${cards.length}개`
                                    :
                                    "총 -개"
                            }
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>

            <Separator />

            <CardUI className="w-[20%]">
                <CardHeader>
                    <h2 className="font-bold text-lg mb-2">Add Card</h2>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Input ref={nameRef} placeholder="Name" className="w-[40%]" />
                    <Input ref={limitRef} placeholder="Limit" className="w-[40%]" />
                    <Input ref={dueDayRef} placeholder="DueDay" type="number" className="w-[40%]" />
                    <Button className="w-[40%]" onClick={AddCard}>Add Card</Button>
                </CardContent>
            </CardUI>
        </section>
    );
}