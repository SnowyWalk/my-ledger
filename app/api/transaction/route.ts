import { NextRequest, NextResponse } from "next/server";
import { loadCards, loadTransactions, saveTransactions } from "../../../lib/fsdb";
import { z } from "zod";

export async function GET(request: NextRequest) {
    try {
        const transactions = await loadTransactions();
        return NextResponse.json(transactions);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const { fieldErrors, formErrors } = error.flatten();
            return NextResponse.json({ message: "Failed to load transactions", fieldErrors, formErrors }, { status: 500 });
        }
        else
            return NextResponse.json({ message: "Failed to load transactions" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const transactions = await loadTransactions();
        const body = await request.json();
        body.id = crypto.randomUUID();
        transactions.push(body);
        await saveTransactions(transactions);
        return NextResponse.json({ message: "Transaction added successfully", transaction: body }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Failed to add transaction" }, { status: 500 });
    }
}