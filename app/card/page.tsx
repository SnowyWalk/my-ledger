"use client";

import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CardContent, CardHeader, Card as CardUI } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; // 경로 수정 (@radix-ui/react-separator -> @/components/ui/separator)
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { z } from "zod";
import { Card, CardType, PerformanceTierType } from "@/schema/schemas";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, X } from "lucide-react";

export default function CardPage() {
    const queryClient = useQueryClient();
    const { data: cards, isLoading, refetch } = useQuery({
        queryKey: ["card"],
        queryFn: async () => {
            const res = await fetch("/api/card", { cache: "no-store" });
            if (!res.ok) 
                throw new Error(`HTTP ${res.status}`);
            return z.array(Card).parse(await res.json());
        },
    });

    // 기본 카드 정보 Refs
    const nameRef = useRef<HTMLInputElement>(null);
    const limitRef = useRef<HTMLInputElement>(null);
    const dueDayRef = useRef<HTMLInputElement>(null);

    // 실적 구간 관리용 State & Refs
    const [tempTiers, setTempTiers] = useState<PerformanceTierType[]>([]);
    const tierAmountRef = useRef<HTMLInputElement>(null);
    const tierBenefitRef = useRef<HTMLInputElement>(null);

    // 실적 구간 임시 추가 핸들러
    const addTier = () => {
        const amount = Number(tierAmountRef.current?.value);
        const benefit = tierBenefitRef.current?.value;

        if (!amount || !benefit) {
            alert("실적 금액과 혜택 내용을 모두 입력해주세요.");
            return;
        }

        setTempTiers([...tempTiers, { amount, benefit }].sort((a, b) => a.amount - b.amount));
        
        // 입력창 초기화
        if (tierAmountRef.current) tierAmountRef.current.value = "";
        if (tierBenefitRef.current) tierBenefitRef.current.value = "";
        tierAmountRef.current?.focus();
    };

    // 실적 구간 삭제 핸들러
    const removeTier = (index: number) => {
        setTempTiers(tempTiers.filter((_, i) => i !== index));
    };

    // 최종 카드 등록 핸들러
    async function AddCard() {
        const name = nameRef.current?.value;
        const limit = limitRef.current?.value;
        const dueDay = dueDayRef.current?.value;

        if(!name || !limit || !dueDay) return;

        const res = await fetch("/api/card", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                limit: Number(limit),
                dueDay: Number(dueDay),
                performance: tempTiers, // 추가된 실적 리스트 전송
            }),
        })

        const data = await res.json();
        if (!res.ok) {
            console.log("Error saving card:", data);
            throw new Error(data);
        } else {
            queryClient.invalidateQueries({ queryKey: ["card"] });
            refetch();
            
            // 폼 전체 초기화
            if (nameRef.current) nameRef.current.value = "";
            if (limitRef.current) limitRef.current.value = "";
            if (dueDayRef.current) dueDayRef.current.value = "";
            setTempTiers([]); 
        }
    }

    return (
        <section className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Card Management</h1>
            
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* 왼쪽: 카드 목록 테이블 */}
                <div className="w-full lg:w-[65%]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Card Name</TableHead>
                                <TableHead>Limit / Due Day</TableHead>
                                <TableHead>Performance Benefits</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24"><Spinner /> Loading...</TableCell>
                                </TableRow>
                            )}

                            {!isLoading && cards?.map((card: CardType) => (
                                <TableRow key={card.id}>
                                    <TableCell className="font-medium align-top pt-4">{card.name}</TableCell>
                                    <TableCell className="align-top pt-4">
                                        <div className="text-sm">한도: {card.limit.toLocaleString()}원</div>
                                        <div className="text-xs text-muted-foreground">결제일: 매월 {card.dueDay}일</div>
                                    </TableCell>
                                    <TableCell>
                                        {card.performance && card.performance.length > 0 ? (
                                            <div className="flex flex-col gap-1.5">
                                                {card.performance.map((tier, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-800">
                                                        <span className="font-semibold text-blue-600 w-[70px] text-right shrink-0">
                                                            {(tier.amount / 10000).toLocaleString()}만↑
                                                        </span>
                                                        <span className="text-slate-600 dark:text-slate-400 border-l pl-2 border-slate-200">
                                                            {tier.benefit}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} className="text-right text-xs text-muted-foreground">
                                    총 {cards?.length ?? 0}개의 카드가 등록되어 있습니다.
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>

                {/* 오른쪽: 카드 추가 폼 */}
                <CardUI className="w-full lg:w-[35%] sticky top-4">
                    <CardHeader>
                        <h2 className="font-bold text-lg">Add New Card</h2>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {/* 기본 정보 */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">기본 정보</label>
                            <Input ref={nameRef} placeholder="카드 이름 (예: 현대카드 M)" />
                            <div className="flex gap-2">
                                <Input ref={limitRef} placeholder="한도 (원)" type="number" />
                                <Input ref={dueDayRef} placeholder="결제일 (일)" type="number" min={1} max={31} />
                            </div>
                        </div>

                        <Separator />

                        {/* 실적 구간 입력 */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-muted-foreground">실적 구간 및 혜택</label>
                                <span className="text-[10px] text-muted-foreground">여러 개 등록 가능</span>
                            </div>
                            
                            <div className="flex gap-2">
                                <Input ref={tierAmountRef} placeholder="실적금액 (예: 300000)" type="number" className="flex-1" />
                            </div>
                            <div className="flex gap-2">
                                <Input ref={tierBenefitRef} placeholder="혜택 (예: 1만원 할인)" className="flex-1" />
                                <Button size="icon" variant="secondary" onClick={addTier}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* 추가된 구간 미리보기 리스트 */}
                            {tempTiers.length > 0 && (
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-2 flex flex-col gap-2 mt-2 max-h-[150px] overflow-y-auto border">
                                    {tempTiers.map((tier, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm bg-white dark:bg-black p-2 rounded border shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs text-blue-600">{(tier.amount).toLocaleString()}원 이상</span>
                                                <span className="text-xs">{tier.benefit}</span>
                                            </div>
                                            <button onClick={() => removeTier(idx)} className="text-gray-400 hover:text-red-500">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator className="my-2" />

                        <Button className="w-full" onClick={AddCard}>
                            카드 등록하기
                        </Button>
                    </CardContent>
                </CardUI>
            </div>
        </section>
    );
}