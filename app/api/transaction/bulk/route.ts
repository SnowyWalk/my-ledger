// app/api/transaction/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { loadTransactions, saveTransactions } from "@/lib/fsdb";
import { Transaction } from "@/schema/schemas";

export async function POST(request: NextRequest) {
    try {
        const currentTransactions = await loadTransactions();
        const body = await request.json(); // Array of transactions

        if (!Array.isArray(body)) {
            return NextResponse.json({ message: "Data must be an array" }, { status: 400 });
        }

        // 유효성 검사 및 ID 부여
        const newTransactions = body.map((item: any) => {
            // 날짜 문자열을 Date 객체로 변환
            const parsedItem = {
                ...item,
                date: new Date(item.date),
                id: crypto.randomUUID()
            };
            return Transaction.parse(parsedItem);
        });

        // 기존 데이터에 병합
        const updatedList = [...currentTransactions, ...newTransactions];
        await saveTransactions(updatedList);

        return NextResponse.json({ 
            message: `${newTransactions.length} transactions added successfully`,
            count: newTransactions.length 
        }, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Failed to bulk add transactions" }, { status: 500 });
    }
}