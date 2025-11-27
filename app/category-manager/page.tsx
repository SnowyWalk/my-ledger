"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Code,
  Layers,
  Beaker,
  Terminal,
  Loader2,
  Save
} from 'lucide-react';

// --- Type Definitions ---

// 카테고리 구조 (UI 표시용)
interface SubCategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  sub: SubCategory[];
}

// 규칙 데이터 (DB 스키마와 일치)
interface Rule {
  id: string; // UUID
  pattern: string;
  categoryId: string;
  subCategoryId: string | null;
  active: boolean;
}

// 시뮬레이션 결과 타입
interface SimulationResult {
  matched: boolean;
  rule?: Rule;
}

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

// --- Constants (카테고리 목록) ---
// 실제 앱에서는 이 부분도 API로 불러오거나 전역 상태(Context/Redux)에서 관리할 수 있습니다.
const CATEGORIES: Category[] = [
  {
    id: 'cat_food',
    name: '식비',
    sub: [
      { id: 'sub_groceries', name: '장보기' },
      { id: 'sub_dining', name: '외식' },
    ]
  },
  {
    id: 'cat_transport',
    name: '교통/차량',
    sub: [
      { id: 'sub_public', name: '대중교통' },
      { id: 'sub_taxi', name: '택시' },
    ]
  },
  {
    id: 'cat_shopping',
    name: '쇼핑',
    sub: [
      { id: 'sub_necessary', name: '생필품' },
      { id: 'sub_habit', name: '취미' },
      { id: 'sub_unnecessary', name: '사치품' },
      { id: 'sub_present', name: '선물' },
    ]
  },
  {
    id: 'cat_fixed',
    name: '고정지출',
    sub: [
      { id: 'sub_youtube', name: '유튜브 구독' },
      { id: 'sub_coupang', name: '쿠팡멤버쉽' },
      { id: 'sub_baemin', name: '배민' },
      { id: 'sub_chatgpt', name: 'ChatGPT' },
      { id: 'sub_googledrive', name: '구글드라이브' },
      { id: 'sub_etc', name: '기타 구독' },
    ]
  }
];

// --- Sub Components ---

const Card = ({ children, className = "" }: CardProps) => (
  <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: BadgeProps) => {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    primary: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

// --- Main Component ---

export default function CategoryRuleManager() {
  // State
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [testMerchant, setTestMerchant] = useState<string>('Gangnam Starbucks 001');
  
  // Form State
  const [patternInput, setPatternInput] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('');
  const [isRegexValid, setIsRegexValid] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- API Handling ---

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/category-manager');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRules(data);
    } catch (error) {
      console.error("Rules loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveRulesToApi = async (newRules: Rule[]) => {
    setIsSaving(true);
    // Optimistic Update: 화면에 먼저 반영
    setRules(newRules);

    try {
      const res = await fetch('/api/category-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRules),
      });

      if (!res.ok) {
        throw new Error('Server error');
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("규칙 저장에 실패했습니다. 다시 시도해주세요.");
      fetchRules(); // 롤백을 위해 서버 데이터 재요청
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // --- Logic Helpers ---

  // Regex Validation
  const validateRegex = (pattern: string): boolean => {
    try {
      new RegExp(pattern);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPatternInput(val);
    setIsRegexValid(validateRegex(val));
  };

  // Add New Rule
  const handleAddRule = async () => {
    if (!patternInput || !selectedCat || !isRegexValid) return;

    const newRule: Rule = {
      id: crypto.randomUUID(),
      pattern: patternInput,
      categoryId: selectedCat,
      subCategoryId: selectedSubCat || null,
      active: true,
    };

    // 최신 규칙을 맨 위로 (우선순위 높음)
    const updatedRules = [newRule, ...rules];
    await saveRulesToApi(updatedRules);

    // 폼 초기화
    setPatternInput('');
    setSelectedCat('');
    setSelectedSubCat('');
  };

  // Delete Rule
  const handleDeleteRule = async (id: string) => {
    if (!confirm("이 규칙을 삭제하시겠습니까?")) return;
    const updatedRules = rules.filter(r => r.id !== id);
    await saveRulesToApi(updatedRules);
  };

  const getCategoryName = (id: string): string => CATEGORIES.find(c => c.id === id)?.name || id;
  
  const getSubCategoryName = (catId: string, subId: string | null): string => {
    if (!subId) return '';
    const cat = CATEGORIES.find(c => c.id === catId);
    return cat?.sub.find(s => s.id === subId)?.name || subId;
  };

  // Derived State for Subcategories Dropdown
  const availableSubCats = useMemo(() => {
    const cat = CATEGORIES.find(c => c.id === selectedCat);
    return cat ? cat.sub : [];
  }, [selectedCat]);

  // --- Simulation Logic ---
  const simulationResult = useMemo<SimulationResult | null>(() => {
    if (!testMerchant) return null;

    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, 'i'); // Case insensitive
        if (regex.test(testMerchant)) {
          return { matched: true, rule };
        }
      } catch (e) {
        continue;
      }
    }
    return { matched: false };
  }, [testMerchant, rules]);

  // --- Loading View ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-black gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-slate-500">규칙 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black p-4 md:p-8 font-sans text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">분류 규칙 엔진</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Merchant 이름을 정규식(Regex)으로 분석하여 카테고리를 자동 분류합니다.
          </p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50 transition-colors">
             가계부 돌아가기
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Editor & Rule List (Width: 7/12) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Rule Editor */}
          <Card className="p-5 border-blue-100 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-semibold text-lg">새 규칙 추가</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
              {/* Regex Input */}
              <div className="md:col-span-12">
                <label className="block text-xs font-medium text-slate-500 mb-1">RegEx Pattern (Merchant Name)</label>
                <div className="relative">
                  <Code className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="예: Starbucks|Twosome (대소문자 무시)"
                    className={`w-full pl-9 pr-4 py-2 rounded-md border bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 transition-all font-mono text-sm
                      ${!isRegexValid 
                        ? 'border-red-300 focus:ring-red-200 text-red-600' 
                        : 'border-slate-200 dark:border-slate-800 focus:ring-blue-200 focus:border-blue-400'
                      }`}
                    value={patternInput}
                    onChange={handlePatternChange}
                  />
                </div>
                {!isRegexValid && (
                  <p className="text-red-500 text-xs mt-1">올바르지 않은 정규식입니다.</p>
                )}
              </div>

              {/* Category Selects */}
              <div className="md:col-span-6">
                <label className="block text-xs font-medium text-slate-500 mb-1">1차 카테고리</label>
                <select 
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={selectedCat}
                  onChange={(e) => {
                    setSelectedCat(e.target.value);
                    setSelectedSubCat('');
                  }}
                >
                  <option value="">선택하세요</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-medium text-slate-500 mb-1">2차 카테고리 (선택)</label>
                <select 
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
                  value={selectedSubCat}
                  onChange={(e) => setSelectedSubCat(e.target.value)}
                  disabled={!selectedCat || availableSubCats.length === 0}
                >
                  <option value="">
                    {availableSubCats.length === 0 && selectedCat ? '하위 카테고리 없음' : '선택 안함'}
                  </option>
                  {availableSubCats.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleAddRule}
                disabled={!patternInput || !selectedCat || !isRegexValid || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                규칙 저장
              </button>
            </div>
          </Card>

          {/* Rules List */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-sm">적용 중인 규칙 ({rules.length})</h3>
              </div>
              <span className="text-xs text-slate-400">상단 규칙이 우선 적용됩니다</span>
            </div>
            
            <div className="overflow-auto max-h-[500px]">
              {rules.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  등록된 규칙이 없습니다.
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 font-medium w-1/3">Pattern (Regex)</th>
                      <th className="px-4 py-3 font-medium">Mapping</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">/{rule.pattern}/</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="primary">{getCategoryName(rule.categoryId)}</Badge>
                            {rule.subCategoryId && (
                              <>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <Badge variant="default">{getSubCategoryName(rule.categoryId, rule.subCategoryId)}</Badge>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Simulator (Width: 5/12) */}
        <div className="lg:col-span-5">
          <div className="sticky top-8 space-y-6">
            
            {/* Simulator Card */}
            <Card className="border-indigo-200 dark:border-indigo-900 shadow-lg overflow-hidden ring-1 ring-indigo-500/10">
              <div className="bg-indigo-600 p-4 text-white flex items-center gap-2">
                <Beaker className="w-5 h-5" />
                <h2 className="font-semibold">규칙 시뮬레이터</h2>
              </div>
              
              <div className="p-5 space-y-6">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">
                    테스트할 거래처 이름 (Merchant)
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={testMerchant}
                      onChange={(e) => setTestMerchant(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                      placeholder="거래처명을 입력해보세요"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Result</h3>
                  
                  {simulationResult?.matched && simulationResult.rule ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2 mb-3 text-green-700 dark:text-green-400 font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>매칭 성공!</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">적용 규칙:</span>
                          <code className="bg-white dark:bg-slate-950 px-1.5 rounded border border-green-100 dark:border-green-900 text-slate-700 dark:text-slate-300 font-mono text-xs">
                            /{simulationResult.rule.pattern}/
                          </code>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-900/50">
                          <div className="text-xs text-slate-500 mb-1">분류 결과</div>
                          <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
                            <span>{getCategoryName(simulationResult.rule.categoryId)}</span>
                            {simulationResult.rule.subCategoryId && (
                              <>
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                                <span>{getSubCategoryName(simulationResult.rule.categoryId, simulationResult.rule.subCategoryId)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">
                        일치하는 규칙이 없습니다.<br/>
                        <span className="text-xs text-slate-400">기타(Uncategorized)로 분류됩니다.</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 p-3 text-xs text-slate-400 text-center border-t border-slate-100 dark:border-slate-800">
                * 목록의 상위 규칙이 먼저 테스트됩니다.
              </div>
            </Card>

            {/* Quick Tip */}
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/30">
              <h4 className="font-bold text-yellow-800 dark:text-yellow-500 text-sm mb-2">RegEx Tips</h4>
              <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc pl-4">
                <li><code>^Star</code> : Star로 시작하는 문자열</li>
                <li><code>Mart$</code> : Mart로 끝나는 문자열</li>
                <li><code>A|B</code> : A 또는 B (OR 연산)</li>
                <li><code>.</code> : 임의의 한 문자</li>
                <li><code>.*</code> : 0개 이상의 모든 문자</li>
              </ul>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}