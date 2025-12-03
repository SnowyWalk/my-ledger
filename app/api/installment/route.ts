import { NextRequest, NextResponse } from "next/server";
import { loadInstallments, saveInstallments } from "../../../lib/fsdb";
import { z } from "zod";

export async function GET(request: NextRequest) {
    try {
        const data = await loadInstallments();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ message: "Failed" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const list = await loadInstallments();
        const body = await request.json();
        body.id = crypto.randomUUID();
        
        list.push(body);
        await saveInstallments(list);
        return NextResponse.json({ message: "Saved" }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Failed" }, { status: 500 });
    }
}