import { NextRequest, NextResponse } from "next/server";
import { loadCards, saveCards } from "../../../lib/fsdb";
import { z } from "zod";

export async function GET(request: NextRequest) {
    try {
        const cards = await loadCards();
        return NextResponse.json(cards);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const { fieldErrors, formErrors } = error.flatten();
            return NextResponse.json({ message: "Failed to load cards", fieldErrors, formErrors }, { status: 500 });
        }
        else
            return NextResponse.json({ message: "Failed to load cards" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const cards = await loadCards();
        const body = await request.json();
        body.id = crypto.randomUUID();
        cards.push(body);
        await saveCards(cards);
        return NextResponse.json({ message: "Cards saved successfully" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const { fieldErrors, formErrors } = error.flatten();
            return NextResponse.json({ message: "Failed to save cards", fieldErrors, formErrors }, { status: 500 });
        }
        else
            return NextResponse.json({ message: "Failed to save cards" }, { status: 500 });
    }
}