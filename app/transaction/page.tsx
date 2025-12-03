"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { parseKoreanDate } from "@/lib/utils";
import { Card, CardType, Transaction, TransactionType } from "@/schema/schemas";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // [!code ++]
import { Card as CardUI, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import DatePicker from "@/components/DatePicker";
import ExcelImportWizard from "@/components/ExcelImportWizard";

export default function TransactionPage() {
    const queryClient = useQueryClient();

    // Data Fetching
    const { data: transactions, isLoading } = useQuery({
        queryKey: ["transaction"],
        queryFn: async () => {
            const res = await fetch("/api/transaction");
            return z.array(Transaction).parse(await res.json());
        },
        select: (list) => [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    });

    const { data: cards } = useQuery({
        queryKey: ["card"],
        queryFn: async () => {
            const res = await fetch("/api/card");
            return z.array(Card).parse(await res.json());
        },
    });

    // Refs for General Transaction
    const dateRef = useRef<HTMLInputElement>(null);
    const merchantRef = useRef<HTMLInputElement>(null);
    const [cardValue, setCardValue] = useState<string>("");
    const amountRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLInputElement>(null);

    // Refs for Installment
    const instDateRef = useRef<HTMLInputElement>(null);
    const instMerchantRef = useRef<HTMLInputElement>(null);
    const [instCardValue, setInstCardValue] = useState<string>("");
    const instTotalRef = useRef<HTMLInputElement>(null);
    const instMonthsRef = useRef<HTMLInputElement>(null);

    // Action: Add General Transaction
    async function AddTransaction() {
        if (!dateRef.current?.value || !merchantRef.current?.value || !amountRef.current?.value || !cardValue) {
            toast.error("필수 정보를 모두 입력해주세요.");
            return;
        }

        const newTransaction = {
            date: parseKoreanDate(dateRef.current.value),
            merchant: merchantRef.current.value,
            card_id: cardValue,
            amount: Number(amountRef.current.value), // Ensure number
            description: descriptionRef.current?.value || "",
        };

        const res = await fetch("/api/transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTransaction),
        });

        if (res.ok) {
            queryClient.invalidateQueries({ queryKey: ["transaction"] });
            toast.success("지출이 등록되었습니다.");
            // Reset fields
            if (merchantRef.current) merchantRef.current.value = "";
            if (amountRef.current) amountRef.current.value = "";
            if (descriptionRef.current) descriptionRef.current.value = "";
        }
    }

    // Action: Add Installment
    async function AddInstallment() {
        if (!instDateRef.current?.value || !instMerchantRef.current?.value || !instTotalRef.current?.value || !instMonthsRef.current?.value || !instCardValue) {
            toast.error("필수 정보를 모두 입력해주세요.");
            return;
        }

        const newInstallment = {
            startDate: parseKoreanDate(instDateRef.current.value),
            merchant: instMerchantRef.current.value,
            card_id: instCardValue,
            totalAmount: Number(instTotalRef.current.value),
            months: Number(instMonthsRef.current.value),
        };

        const res = await fetch("/api/installment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newInstallment),
        });

        if (res.ok) {
            queryClient.invalidateQueries({ queryKey: ["installments"] }); // Invalidate installment query
            toast.success("할부 정보가 등록되었습니다.");
            // Reset fields
            if (instMerchantRef.current) instMerchantRef.current.value = "";
            if (instTotalRef.current) instTotalRef.current.value = "";
            if (instMonthsRef.current) instMonthsRef.current.value = "";
        }
    }

    return (
        <section className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Transaction Management</h1>
                {cards && <ExcelImportWizard cards={cards} />}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Left: Transaction History Table */}
                <div className="w-full lg:w-[65%]">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Merchant</TableHead>
                                <TableHead>Card</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan={5} className="text-center"><Spinner /> Loading...</TableCell></TableRow>}
                            {!isLoading && transactions?.map((e: TransactionType) => (
                                <TableRow key={e.id}>
                                    <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{e.merchant}</TableCell>
                                    <TableCell>{cards?.find(x => x.id === e.card_id)?.name}</TableCell>
                                    <TableCell className="text-right font-medium">{e.amount.toLocaleString()}원</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{e.description}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3}>Total</TableCell>
                                <TableCell className="text-right font-bold">
                                    {transactions ? `￦ ${transactions.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}` : "-"}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>

                {/* Right: Input Form (Tabs) */}
                <CardUI className="w-full lg:w-[35%] sticky top-4">
                    <Tabs defaultValue="general" className="w-full">
                        <CardHeader className="pb-3">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="general">일반 지출</TabsTrigger>
                                <TabsTrigger value="installment">할부 등록</TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        
                        <CardContent>
                            {/* Tab 1: General Transaction */}
                            <TabsContent value="general" className="flex flex-col gap-3 mt-0">
                                <DatePicker useRefObject={dateRef} />
                                <Input ref={merchantRef} placeholder="사용처 (예: 스타벅스)" />
                                <Select onValueChange={setCardValue}>
                                    <SelectTrigger><SelectValue placeholder="카드 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {cards?.map((card: CardType) => (
                                            <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input ref={amountRef} type="number" placeholder="금액 (음수로 입력)" />
                                <Input ref={descriptionRef} placeholder="메모 (선택)" />
                                <Button onClick={AddTransaction} className="mt-2">지출 추가</Button>
                            </TabsContent>

                            {/* Tab 2: Installment */}
                            <TabsContent value="installment" className="flex flex-col gap-3 mt-0">
                                <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 mb-2">
                                    * 할부 원금과 개월 수를 입력하면 대시보드에서 잔여금을 추적할 수 있습니다.
                                </div>
                                <DatePicker useRefObject={instDateRef} />
                                <Input ref={instMerchantRef} placeholder="사용처 (예: 애플스토어)" />
                                <Select onValueChange={setInstCardValue}>
                                    <SelectTrigger><SelectValue placeholder="결제 카드 선택" /></SelectTrigger>
                                    <SelectContent>
                                        {cards?.map((card: CardType) => (
                                            <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                    <Input ref={instTotalRef} type="number" placeholder="할부 원금 총액" className="flex-1" />
                                    <Input ref={instMonthsRef} type="number" placeholder="개월" className="w-20" />
                                </div>
                                <Button onClick={AddInstallment} variant="secondary" className="mt-2 w-full">할부 등록</Button>
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </CardUI>
            </div>
        </section>
    );
}