"use client";

import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CardContent, CardHeader, Card as CardUI } from "@/components/ui/card";
import { Card, CardType, Transaction, TransactionType } from "@/schema/schemas";
import { Separator } from "@radix-ui/react-separator";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import DatePicker from "@/components/DatePicker";
import { useRef, useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { parseKoreanDate } from "@/lib/utils";

export default function TransactionPage() {
    const { data: transactions, isLoading } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => {
            const res = await fetch("/api/transaction", { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return z.array(Transaction).parse(await res.json());
        },
    });

    const { data: cards } = useQuery({
        queryKey: ["card"],
        queryFn: async () => {
            const res = await fetch("/api/card", { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return z.array(Card).parse(await res.json());
        },
    });

    const dateRef = useRef<HTMLInputElement>(null);
    const merchantRef = useRef<HTMLInputElement>(null);
    const [cardValue, setCardValue] = useState<string>("");
    const amountRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLInputElement>(null);

    async function AddTransaction() {
        const newTransaction = {
            date: parseKoreanDate(dateRef.current?.value!),
            merchant: merchantRef.current?.value,
            card_id: cardValue,
            amount: amountRef.current?.value,
            description: descriptionRef.current?.value,
        };

        console.log("New Transaction:", newTransaction);

        const res = await fetch("/api/transaction", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newTransaction),
        });
        if (!res.ok) {
            alert("Failed to add transaction");
            return;
        }
        alert("Transaction added successfully");
    }

    return (
        <section>
            <h1>Transaction Page</h1>
            <Table className="w-[40%]" >
                <TableHeader>
                    <TableRow>
                        <TableHead className="border">Date</TableHead>
                        <TableHead className="border">Merchant</TableHead>
                        <TableHead className="border">Card</TableHead>
                        <TableHead className="text-right border">Amount</TableHead>
                        <TableHead className="border">Description</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        isLoading &&
                        (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center"><Spinner />Loading...</TableCell>
                            </TableRow>
                        )
                    }

                    {
                        !isLoading && transactions != null &&
                        (
                            (transactions as TransactionType[]).map((e: TransactionType) => (
                                <TableRow key={e.id}>
                                    <TableCell className="border">{e.date.toLocaleDateString()}</TableCell>
                                    <TableCell className="border">{e.merchant}</TableCell>
                                    <TableCell className="border">{cards?.find(x => x.id == e.card_id)?.name}</TableCell>
                                    <TableCell className="border">{e.amount.toLocaleString()}</TableCell>
                                    <TableCell className="border">{e.description}</TableCell>
                                </TableRow>
                            ))
                        )
                    }
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell className="text-right">
                            {
                                !isLoading && transactions != null ?
                                    "￦ " + (transactions as TransactionType[]).reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()
                                    :
                                    "-"
                            }
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>

            <Separator />

            <CardUI className="w-[20%]">
                <CardHeader>
                    <h2 className="font-bold text-lg mb-2">Add Transaction</h2>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <DatePicker useRefObject={dateRef} />
                    <Input ref={merchantRef} placeholder="Merchant" className="w-[40%]" />
                    <Select onValueChange={(value) => setCardValue(value)} >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a card" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Cards</SelectLabel>
                                {
                                    cards != null &&
                                    (cards as CardType[]).map((card: CardType) => (
                                        <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                                    ))
                                }
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Input ref={amountRef} placeholder="Amount" className="w-[40%]" />
                    <Input ref={descriptionRef} placeholder="Description" className="w-[40%]" />
                    <Button onClick={AddTransaction}>Add Transaction</Button>
                </CardContent>
            </CardUI>
        </section>
    );
}