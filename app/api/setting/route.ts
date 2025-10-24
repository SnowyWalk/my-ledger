import { NextRequest, NextResponse } from "next/server";
import { loadSetting as loadSetting, saveSetting as saveSetting } from "../../../lib/fsdb";
import { z } from "zod";
import { Setting } from "@/schema/schemas";
import { sleep } from "@/lib/utils";

export async function GET(request: NextRequest) {
    try {
        // await sleep(5000); // 테스트용 인위적 지연
        const settings = await loadSetting();
        return NextResponse.json(settings);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const { fieldErrors, formErrors } = error.flatten();
            return NextResponse.json({ message: "Failed to load settings", fieldErrors, formErrors }, { status: 500 });
        }
        else
            return NextResponse.json({ message: "Failed to load settings" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const newSettings = Setting.parse(body);
        await saveSetting(newSettings);
        return NextResponse.json({ message: "setting added successfully", setting: body }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Failed to add setting" }, { status: 500 });
    }
}