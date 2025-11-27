import { NextRequest, NextResponse } from "next/server";
import { loadCategoryRules, saveCategoryRules } from "../../../lib/fsdb"; // 경로에 맞게 수정하세요
import { z } from "zod";

export async function GET(request: NextRequest) {
    try {
        const rules = await loadCategoryRules();
        return NextResponse.json(rules);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const { fieldErrors, formErrors } = error.flatten();
            return NextResponse.json({ message: "Failed to load rules", fieldErrors, formErrors }, { status: 500 });
        }
        else
            return NextResponse.json({ message: "Failed to load rules" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // 규칙 관리는 순서가 중요하고 삭제/수정이 빈번하므로
        // 변경된 전체 리스트를 받아 저장하는 방식을 사용합니다.
        const body = await request.json();
        
        // 배열인지 검증 (간단한 체크)
        if (!Array.isArray(body)) {
             return NextResponse.json({ message: "Invalid data format. Expected an array of rules." }, { status: 400 });
        }

        await saveCategoryRules(body);
        return NextResponse.json({ message: "Rules saved successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Failed to save rules" }, { status: 500 });
    }
}