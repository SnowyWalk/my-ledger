"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, ArrowRight, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { CardType } from "@/schema/schemas";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ExcelImportWizardProps {
    cards: CardType[];
}

export default function ExcelImportWizard({ cards }: ExcelImportWizardProps) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    
    // 단계: 업로드 -> 시트선택 -> 매핑 -> 미리보기
    const [step, setStep] = useState<"upload" | "sheet-selection" | "mapping" | "preview">("upload");
    
    // 엑셀 데이터 관련 상태
    const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [fileData, setFileData] = useState<any[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedCardId, setSelectedCardId] = useState<string>("");

    const [mapping, setMapping] = useState({
        date: -1,
        merchant: -1,
        amount: -1,
        description: -1,
    });

    // 1. 파일 읽기 (Workbook 로드)
    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
            
            setWorkbook(wb); // 워크북 저장
            setSheetNames(wb.SheetNames); // 시트 목록 저장

            // 시트가 1개뿐이면 바로 선택, 여러 개면 선택 단계로 이동
            if (wb.SheetNames.length === 1) {
                analyzeSheet(wb, wb.SheetNames[0]);
            } else {
                setStep("sheet-selection");
            }
        };
        reader.readAsBinaryString(file);
    };

    // 2. 특정 시트 분석 (양식 자동 감지 로직 개선)
    const analyzeSheet = (wb: XLSX.WorkBook, sheetName: string) => {
        const ws = wb.Sheets[sheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        // 헤더 행 찾기 (헤더 감지 키워드 추가)
        let headerIndex = 0;
        const keywords = [
            "날짜", "일시", "거래일", "승인일", "승인일자", 
            "가맹점", "사용처", "금액", "출금", "이용내역", "승인금액"
        ];
        
        for(let i=0; i < Math.min(data.length, 10); i++) {
            const rowStr = data[i].join(" ");
            if (keywords.some(k => rowStr.includes(k))) {
                headerIndex = i;
                break;
            }
        }

        const extractedHeaders = data[headerIndex] as string[];
        const rows = data.slice(headerIndex + 1).filter(r => r.length > 0);

        setHeaders(extractedHeaders);
        setFileData(rows);

        // [!code highlight:15] 스마트 컬럼 매핑 (추론 단어 추가)
        const newMapping = { date: -1, merchant: -1, amount: -1, description: -1 };
        extractedHeaders.forEach((h, idx) => {
            const header = String(h).trim();
            // 날짜: 승인일자 추가
            if (/날짜|거래일|승인일|Date|승인일자/i.test(header)) newMapping.date = idx;
            // 가맹점: 가맹점명 추가
            else if (/가맹점|사용처|거래처|Merchant|Store|기재내용|가맹점명/i.test(header)) newMapping.merchant = idx;
            // 금액: 승인금액 추가 (잔액은 제외)
            else if ((/출금|사용금액|지출|Amount|이용금액|승인금액/i.test(header)) && !/잔액/i.test(header)) newMapping.amount = idx;
            // 내용: 일시불할부구분 추가
            else if (/적요|내용|메모|Desc|일시불할부구분/i.test(header)) newMapping.description = idx;
        });

        setMapping(newMapping);
        setStep("mapping");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) processFile(file);
        else toast.error("엑셀 파일만 업로드 가능합니다.");
    };

    // 미리보기 데이터 생성
    const getPreviewData = () => {
        return fileData.slice(0, 5).map((row, idx) => {
            const dateVal = row[mapping.date];
            const amountVal = row[mapping.amount];
            
            let dateStr = "";
            try {
                if (dateVal instanceof Date) dateStr = dateVal.toLocaleDateString();
                else dateStr = String(dateVal);
            } catch(e) { dateStr = "Invalid Date"; }

            // 금액 파싱 (쉼표 제거 로직 포함되어 있음)
            let amountNum = 0;
            if (typeof amountVal === 'number') amountNum = amountVal;
            else {
                // [!code highlight] 쉼표 등 숫자 외 문자 제거 후 파싱
                const cleanStr = String(amountVal).replace(/[^0-9.-]/g, "");
                amountNum = parseFloat(cleanStr) || 0;
            }
            if (amountNum > 0) amountNum = -amountNum;

            return {
                id: idx,
                date: dateStr,
                merchant: String(row[mapping.merchant] || ""),
                amount: amountNum,
                description: mapping.description > -1 ? String(row[mapping.description]) : ""
            };
        });
    };

    const handleSave = async () => {
        if (!selectedCardId) { toast.error("연동할 카드를 선택해주세요."); return; }
        try {
            const transactions = fileData.map(row => {
                const dateVal = row[mapping.date];
                let dateObj = new Date();
                if (dateVal instanceof Date) dateObj = dateVal;
                else {
                    const dateStr = String(dateVal).replace(/\./g, "-");
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) dateObj = parsed;
                }
                
                let amountVal = row[mapping.amount];
                if (typeof amountVal !== 'number') {
                    // [!code highlight] 저장 시에도 쉼표 제거
                    amountVal = parseFloat(String(amountVal).replace(/[^0-9.-]/g, "")) || 0;
                }
                if (amountVal > 0) amountVal = -amountVal;

                return {
                    date: dateObj,
                    merchant: String(row[mapping.merchant] || "알 수 없음"),
                    amount: amountVal,
                    card_id: selectedCardId,
                    description: mapping.description > -1 ? String(row[mapping.description]) : ""
                };
            }).filter(t => t.amount !== 0);

            const res = await fetch("/api/transaction/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transactions),
            });
            if (!res.ok) throw new Error("Import failed");
            const result = await res.json();
            toast.success(`${result.count}건의 내역을 불러왔습니다.`);
            queryClient.invalidateQueries({ queryKey: ["transaction"] });
            setOpen(false); reset();
        } catch (error) { toast.error("저장 중 오류가 발생했습니다."); console.error(error); }
    };

    const reset = () => {
        setStep("upload");
        setWorkbook(null);
        setFileData([]); setHeaders([]); setIsDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) reset(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" />엑셀 업로드</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>엑셀 지출내역 불러오기</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* Step 1: Upload */}
                    {step === "upload" && (
                        <div 
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 gap-4 transition-colors cursor-pointer ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50"}`}
                            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className={`w-10 h-10 ${isDragging ? "text-blue-500" : "text-slate-300"}`} />
                            <div className="text-center space-y-1">
                                <p className="text-sm font-medium">엑셀 파일을 드래그하거나 클릭하세요</p>
                                <p className="text-xs text-muted-foreground">.xlsx, .xls 파일 지원</p>
                            </div>
                            <Input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                        </div>
                    )}

                    {/* Step 1.5: Sheet Selection */}
                    {step === "sheet-selection" && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-600 flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4" />
                                <span>데이터를 불러올 시트를 선택해주세요.</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                                {sheetNames.map((name) => (
                                    <Button 
                                        key={name} 
                                        variant="outline" 
                                        className="justify-start h-auto py-3 px-4 font-normal"
                                        onClick={() => workbook && analyzeSheet(workbook, name)}
                                    >
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className="font-medium text-slate-800">{name}</span>
                                            <span className="text-xs text-slate-400">클릭하여 선택</span>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Mapping */}
                    {step === "mapping" && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <div>헤더를 분석했습니다. 올바른 컬럼인지 확인해주세요.</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>날짜</Label>
                                    <Select value={String(mapping.date)} onValueChange={(v) => setMapping({...mapping, date: Number(v)})}>
                                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                                        <SelectContent>{headers.map((h, i) => <SelectItem key={i} value={String(i)}>{h}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>가맹점</Label>
                                    <Select value={String(mapping.merchant)} onValueChange={(v) => setMapping({...mapping, merchant: Number(v)})}>
                                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                                        <SelectContent>{headers.map((h, i) => <SelectItem key={i} value={String(i)}>{h}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>금액</Label>
                                    <Select value={String(mapping.amount)} onValueChange={(v) => setMapping({...mapping, amount: Number(v)})}>
                                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                                        <SelectContent>{headers.map((h, i) => <SelectItem key={i} value={String(i)}>{h}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>내용(선택)</Label>
                                    <Select value={String(mapping.description)} onValueChange={(v) => setMapping({...mapping, description: Number(v)})}>
                                        <SelectTrigger><SelectValue placeholder="선택 안함" /></SelectTrigger>
                                        <SelectContent><SelectItem value="-1">선택 안함</SelectItem>{headers.map((h, i) => <SelectItem key={i} value={String(i)}>{h}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2 border-t">
                                <Label>카드 선택</Label>
                                <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                                    <SelectTrigger><SelectValue placeholder="연동할 카드 선택" /></SelectTrigger>
                                    <SelectContent>{cards.map(card => (<SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preview */}
                    {step === "preview" && (
                        <div className="space-y-4">
                            <div className="rounded-md border max-h-[300px] overflow-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>날짜</TableHead><TableHead>가맹점</TableHead><TableHead className="text-right">금액</TableHead><TableHead>내용</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {getPreviewData().map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{row.date}</TableCell><TableCell>{row.merchant}</TableCell>
                                                <TableCell className="text-right text-red-500 font-medium">{row.amount.toLocaleString()}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{row.description}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <p className="text-xs text-center text-muted-foreground">상위 5개 항목 미리보기 / 총 {fileData.length}건</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                     <Button variant="ghost" onClick={reset}>취소</Button>
                     <div className="flex gap-2">
                        {step === "sheet-selection" && <Button variant="ghost" onClick={() => setStep("upload")}>뒤로</Button>}
                        {step === "mapping" && (
                            <>
                                {sheetNames.length > 1 && <Button variant="ghost" onClick={() => setStep("sheet-selection")}>시트 다시 선택</Button>}
                                <Button onClick={() => setStep("preview")} disabled={mapping.date === -1 || mapping.merchant === -1 || mapping.amount === -1 || !selectedCardId}>다음 <ArrowRight className="w-4 h-4 ml-2" /></Button>
                            </>
                        )}
                        {step === "preview" && (
                            <>
                                <Button variant="outline" onClick={() => setStep("mapping")}>이전</Button>
                                <Button onClick={handleSave}><CheckCircle2 className="w-4 h-4 mr-2" />저장하기</Button>
                            </>
                        )}
                     </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}