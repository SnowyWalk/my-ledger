"use client";

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronRight, Receipt, Utensils, Bus, ShoppingBag, Coffee, ArrowLeft } from 'lucide-react';

// --- Mock Data ---
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const SPENDING_DATA = [
  {
    id: 'food',
    name: '식비',
    value: 450000,
    icon: Utensils,
    color: COLORS[0],
    subCategories: [
      { name: '배달음식', value: 200000 },
      { name: '외식', value: 150000 },
      { name: '식자재', value: 80000 },
      { name: '편의점', value: 20000 },
    ]
  },
  {
    id: 'transport',
    name: '교통',
    value: 120000,
    icon: Bus,
    color: COLORS[1],
    subCategories: [
      { name: '지하철', value: 50000 },
      { name: '택시', value: 70000 },
    ]
  },
  {
    id: 'shopping',
    name: '쇼핑',
    value: 300000,
    icon: ShoppingBag,
    color: COLORS[2],
    subCategories: [
      { name: '의류', value: 200000 },
      { name: '생필품', value: 100000 },
    ]
  },
  {
    id: 'coffee',
    name: '카페/간식',
    value: 80000,
    icon: Coffee,
    color: COLORS[3],
    subCategories: [] // 2차 카테고리 없음
  },
  {
    id: 'fixed',
    name: '고정지출',
    value: 550000,
    icon: Receipt,
    color: COLORS[4],
    subCategories: [
        { name: '월세', value: 500000 },
        { name: '통신비', value: 50000 },
    ]
  },
];

export default function CategorizedSpendingChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null); // 클릭된 상태 (우측 패널 고정)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);   // 호버된 상태 (시각적 강조)

  // 전체 총액 계산
  const totalSpending = useMemo(() => 
    SPENDING_DATA.reduce((acc, curr) => acc + curr.value, 0)
  , []);

  // 우측 패널에 표시할 데이터 (클릭된 항목 기준)
  const selectedData = activeIndex !== null ? SPENDING_DATA[activeIndex] : null;

  // 중앙 텍스트에 표시할 데이터 (호버 우선 -> 클릭 -> 없음)
  const centerDisplayData = hoverIndex !== null 
    ? SPENDING_DATA[hoverIndex] 
    : (activeIndex !== null ? SPENDING_DATA[activeIndex] : null);

  // 포맷터
  const formatCurrency = (val: number) => new Intl.NumberFormat('ko-KR').format(val) + '원';

  // 마우스 핸들러 (호버 상태만 변경)
  const onPieEnter = (_: any, index: number) => setHoverIndex(index);
  const onPieLeave = () => setHoverIndex(null);
  
  // 클릭 핸들러 (선택 상태 토글)
  const handleClick = (index: number) => {
    if (activeIndex === index) {
      setActiveIndex(null); // 이미 선택된거 누르면 해제
    } else {
      setActiveIndex(index);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 font-sans">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">이번 달 지출 분석</h2>
          <p className="text-gray-500 text-sm mt-1">차트를 클릭하여 상세 분석 정보를 확인하세요.</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-stretch gap-8 min-h-[400px]">
            
            {/* --- [Left] Main Donut Chart (1차 카테고리) --- */}
            <div className="relative w-full lg:w-1/2 min-h-[300px] flex flex-col items-center justify-center">
              <h3 className="absolute top-0 left-0 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Spending</h3>
              
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SPENDING_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={130}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    onClick={(_, index) => handleClick(index)}
                    cursor="pointer"
                  >
                    {SPENDING_DATA.map((entry, index) => {
                        // 스타일 로직: 선택되었거나 호버된 항목은 밝게, 나머지는 흐리게(선택된게 있을 때만)
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
                                    opacity: isDimmed ? 0.3 : 1 // 선택된게 있는데 내꺼 아니면 흐리게
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

              {/* Center Text (Dynamic: Hover > Selected > Total) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-sm text-gray-500 font-medium mb-1 animate-in fade-in zoom-in duration-200 key={centerDisplayData ? centerDisplayData.id : 'total'}">
                  {centerDisplayData ? centerDisplayData.name : '총 지출'}
                </span>
                <span className="text-3xl font-bold text-gray-800 animate-in fade-in zoom-in duration-200">
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

            {/* --- [Right] Detail Panel (Driven by Selected Data) --- */}
            <div className="w-full lg:w-1/2 flex flex-col bg-gray-50 rounded-xl p-4 border border-gray-100 transition-all duration-300">
              
              {/* Panel Header */}
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

              {/* Panel Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedData ? (
                  // [Case 1] 클릭된 상태 (상세 뷰 고정)
                  <div className="h-full flex flex-col animate-in slide-in-from-right-4 duration-300">
                    
                    {/* 1. 미니 파이차트 (2차 카테고리 시각화) */}
                    {selectedData.subCategories.length > 0 ? (
                        <div className="flex flex-row items-center h-[160px] mb-4 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
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
                                <p>가장 큰 지출은 <span className="font-semibold text-gray-800">{selectedData.subCategories.sort((a,b) => b.value - a.value)[0].name}</span> 입니다.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 p-4 bg-white rounded-lg border border-dashed border-gray-200 text-center text-sm text-gray-400">
                            상세 하위 분류가 없는 항목입니다.
                        </div>
                    )}

                    {/* 2. 상세 리스트 */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                      {selectedData.subCategories.length > 0 ? (
                        selectedData.subCategories
                            .sort((a, b) => b.value - a.value)
                            .map((sub, idx) => (
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
                        ))
                      ) : (
                          <div className="text-center py-8 text-gray-400 text-sm">
                             단일 항목 지출입니다.
                          </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // [Case 2] 선택 안됨 (전체 목록 뷰)
                  <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {SPENDING_DATA.map((item, idx) => (
                      <div 
                        key={item.id}
                        onClick={() => handleClick(idx)}
                        onMouseEnter={() => onPieEnter(null, idx)}
                        onMouseLeave={onPieLeave}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-transparent hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <item.icon className="w-4 h-4" />
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