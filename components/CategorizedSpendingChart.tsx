"use client";

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronRight, Receipt, Utensils, Bus, ShoppingBag, Coffee, ArrowLeft, CircleHelp, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CategoryRule, Transaction } from '@/schema/schemas';
import { z } from 'zod';
import { Skeleton } from './ui/skeleton';

// --- Category Metadata Definition ---
// 카테고리 ID에 따른 색상, 아이콘, 이름 매핑 정보
const CATEGORY_META: Record<string, { name: string, icon: any, color: string }> = {
  cat_food: { name: '식비', icon: Utensils, color: '#3b82f6' }, // Blue
  cat_transport: { name: '교통/차량', icon: Bus, color: '#10b981' }, // Emerald
  cat_shopping: { name: '쇼핑', icon: ShoppingBag, color: '#f59e0b' }, // Amber
  cat_fixed: { name: '고정지출', icon: Receipt, color: '#ef4444' }, // Red
  cat_hobby: { name: '취미/여가', icon: Coffee, color: '#8b5cf6' }, // Violet
  uncategorized: { name: '분류 미지정', icon: CircleHelp, color: '#94a3b8' } // Slate (Gray)
};

// 하위 카테고리 이름 매핑 (필요하다면 전역 상수나 DB에서 관리 권장)
const SUB_CATEGORY_NAMES: Record<string, string> = {
  sub_groceries: '장보기', sub_dining: '외식',
  sub_public: '대중교통', sub_taxi: '택시',
  sub_necessary: '생필품', sub_habit: '취미', sub_unnecessary: '사치품', sub_present: '선물',
  sub_youtube: '유튜브', sub_coupang: '쿠팡', sub_baemin: '배민', sub_chatgpt: 'ChatGPT', sub_googledrive: '구글드라이브', sub_etc: '기타 구독'
};

export default function CategorizedSpendingChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 1. Data Fetching
  const { data: transactions, isLoading: isTxLoading } = useQuery({
    queryKey: ["transaction"],
    queryFn: async () => {
      const res = await fetch("/api/transaction");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return z.array(Transaction).parse(await res.json());
    }
  });

  const { data: rules, isLoading: isRuleLoading } = useQuery({
    queryKey: ["category-rules"], // 키를 명확히 구분
    queryFn: async () => {
      const res = await fetch("/api/category-manager");
      if (!res.ok) throw new Error("Failed to fetch rules");
      return z.array(CategoryRule).parse(await res.json());
    }
  });

  // 2. Data Processing & Aggregation
  const spendingData = useMemo(() => {
    if (!transactions || !rules) return [];

    // (1) 지출만 필터링 (amount < 0) 및 양수로 변환
    const expenses = transactions.filter(t => t.amount < 0);

    // (2) 집계용 맵 생성
    // 구조: { [catId]: { value: 0, sub: { [subId]: 0 } } }
    const aggMap: Record<string, { value: number, sub: Record<string, number> }> = {};

    expenses.forEach(tx => {
      const absAmount = Math.abs(tx.amount);
      let matchedRule = null;

      // 규칙 매칭 (상위 규칙 우선)
      for (const rule of rules) {
        try {
          if (new RegExp(rule.pattern, 'i').test(tx.merchant)) {
            matchedRule = rule;
            break;
          }
        } catch (e) { continue; }
      }

      const catId = matchedRule ? matchedRule.categoryId : 'uncategorized';
      const subId = matchedRule?.subCategoryId || 'default';

      if (!aggMap[catId]) {
        aggMap[catId] = { value: 0, sub: {} };
      }

      aggMap[catId].value += absAmount;
      aggMap[catId].sub[subId] = (aggMap[catId].sub[subId] || 0) + absAmount;
    });

    // (3) Chart Data Format으로 변환
    const result = Object.entries(aggMap).map(([catId, data]) => {
      const meta = CATEGORY_META[catId] || { name: catId, icon: Layers, color: '#cbd5e1' };
      
      const subCategories = Object.entries(data.sub).map(([subId, val]) => ({
        name: SUB_CATEGORY_NAMES[subId] || (subId === 'default' ? '기타' : subId),
        value: val
      })).sort((a, b) => b.value - a.value); // 하위 카테고리 내림차순 정렬

      return {
        id: catId,
        name: meta.name,
        value: data.value,
        icon: meta.icon,
        color: meta.color,
        subCategories
      };
    });

    // (4) 금액 큰 순서대로 정렬
    return result.sort((a, b) => b.value - a.value);

  }, [transactions, rules]);

  // --- Helpers ---
  const totalSpending = useMemo(() => spendingData.reduce((acc, curr) => acc + curr.value, 0), [spendingData]);
  const selectedData = activeIndex !== null ? spendingData[activeIndex] : null;
  const centerDisplayData = hoverIndex !== null 
    ? spendingData[hoverIndex] 
    : (activeIndex !== null ? spendingData[activeIndex] : null);

  const formatCurrency = (val: number) => new Intl.NumberFormat('ko-KR').format(val) + '원';
  const onPieEnter = (_: any, index: number) => setHoverIndex(index);
  const onPieLeave = () => setHoverIndex(null);
  
  const handleClick = (index: number) => {
    setActiveIndex(prev => prev === index ? null : index);
  };

  if (isTxLoading || isRuleLoading) {
    return <div className="w-full h-[400px] flex items-center justify-center"><Skeleton className="w-full h-full rounded-xl" /></div>;
  }

  if (spendingData.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4">
         <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-10 text-center text-gray-500">
            지출 내역이 없습니다.
         </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 font-sans">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">지출 분류 분석</h2>
          <p className="text-gray-500 text-sm mt-1">
            총 지출: <strong>{formatCurrency(totalSpending)}</strong>
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-stretch gap-8 min-h-[400px]">
            
            {/* Left: Pie Chart */}
            <div className="relative w-full lg:w-1/2 min-h-[300px] flex flex-col items-center justify-center">
              <h3 className="absolute top-0 left-0 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Spending</h3>
              
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={130}
                    paddingAngle={2}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    onClick={(_, index) => handleClick(index)}
                    cursor="pointer"
                  >
                    {spendingData.map((entry, index) => {
                        const isSelected = activeIndex === index;
                        const isHovered = hoverIndex === index;
                        const isDimmed = activeIndex !== null && !isSelected && !isHovered;

                        return (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color} 
                                strokeWidth={0}
                                className={`transition-all duration-300 outline-none`}
                                style={{
                                    filter: isHovered || isSelected ? 'brightness(1.05)' : 'brightness(1)',
                                    transform: isHovered || isSelected ? 'scale(1.05)' : 'scale(1)',
                                    transformOrigin: 'center',
                                    opacity: isDimmed ? 0.3 : 1
                                }}
                            />
                        );
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#374151', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-sm text-gray-500 font-medium mb-1 animate-in fade-in zoom-in duration-200 key={centerDisplayData ? centerDisplayData.id : 'total'}">
                  {centerDisplayData ? centerDisplayData.name : '총 지출'}
                </span>
                <span className="text-2xl font-bold text-gray-800 animate-in fade-in zoom-in duration-200">
                  {centerDisplayData 
                    ? formatCurrency(centerDisplayData.value) 
                    : formatCurrency(totalSpending)
                  }
                </span>
                {centerDisplayData && (
                    <div className="mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                        {((centerDisplayData.value / totalSpending) * 100).toFixed(1)}%
                    </div>
                )}
              </div>
            </div>

            {/* Right: Detail Panel */}
            <div className="w-full lg:w-1/2 flex flex-col bg-gray-50 rounded-xl p-4 border border-gray-100 transition-all duration-300">
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {selectedData ? (
                    <>
                        <button onClick={() => setActiveIndex(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors" aria-label="Back to all">
                            <ArrowLeft className="w-4 h-4 text-gray-500" />
                        </button>
                        <selectedData.icon className="w-5 h-5" style={{ color: selectedData.color }} />
                        <h3 className="font-bold text-lg text-gray-800">{selectedData.name} 분석</h3>
                    </>
                  ) : (
                    <>
                        <Receipt className="w-5 h-5 text-gray-400" />
                        <h3 className="font-bold text-lg text-gray-600">전체 내역</h3>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedData ? (
                  // Detail View
                  <div className="h-full flex flex-col animate-in slide-in-from-right-4 duration-300">
                    {/* Sub-Category Mini Pie Chart */}
                    {selectedData.subCategories.length > 0 && selectedData.subCategories[0].name !== '기타' ? (
                        <div className="flex flex-row items-center h-[140px] mb-4 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                            <div className="w-1/3 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={selectedData.subCategories}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={25}
                                            outerRadius={45}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {selectedData.subCategories.map((entry, index) => (
                                                <Cell key={`cell-sub-${index}`} fill={selectedData.color} fillOpacity={1 - (index * 0.15)} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-2/3 pl-2 text-xs text-gray-500">
                                <p className="mb-1"><strong>{selectedData.name}</strong> 내 상세 비중입니다.</p>
                                <p>가장 큰 지출: <span className="font-semibold text-gray-800">{selectedData.subCategories[0].name}</span></p>
                            </div>
                        </div>
                    ) : (
                         <div className="mb-4 p-4 bg-white rounded-lg border border-dashed border-gray-200 text-center text-sm text-gray-400">
                            상세 하위 분류가 없는 항목입니다.
                        </div>
                    )}

                    {/* Sub-Category List */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {selectedData.subCategories.map((sub, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-2 h-8 rounded-sm" 
                                        style={{ backgroundColor: selectedData.color, opacity: 1 - (idx * 0.15) }} 
                                    />
                                    <span className="text-gray-700 font-medium">{sub.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900 text-sm">{formatCurrency(sub.value)}</div>
                                    <div className="text-xs text-gray-400">
                                        {((sub.value / selectedData.value) * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  // All Categories List
                  <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {spendingData.map((item, idx) => (
                      <div 
                        key={item.id}
                        onClick={() => handleClick(idx)}
                        onMouseEnter={() => onPieEnter(null, idx)}
                        onMouseLeave={onPieLeave}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-transparent hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <item.icon className="w-4 h-4" style={{ color: item.color }} />
                          </div>
                          <span className="text-gray-700 font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="font-bold text-gray-900 text-sm">{formatCurrency(item.value)}</div>
                                <div className="text-xs text-gray-400">{((item.value / totalSpending) * 100).toFixed(1)}%</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}