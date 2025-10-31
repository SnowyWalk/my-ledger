"use client";

import { useMuuriGrid } from "@/components/useMuuri";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

export function MuuriGrid({ children }: { children?: React.ReactNode }) {
    const muuriRef = useMuuriGrid();

    return (
        <div
            ref={muuriRef}
            style={{
                position: "relative",
                border: "1px solid #ccc",
                boxSizing: "border-box",
                minHeight: 300,
            }}
        >
            {children}
        </div>
    );
}

export function MuuriItem({
  children,
  margin,
  // overrideSize는 정말 필요할 때만 강제로 덮어쓰는 용도 (선택)
  overrideSize,
  onAutoResize, // Muuri 레이아웃 새로고침 콜백용 (선택)
}: {
  children?: React.ReactNode;
  margin?: number;
  overrideSize?: { width?: number | string; height?: number | string }; // ← 변경점
  onAutoResize?: (w: number, h: number) => void; // ← 변경점
}) {
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [autoSize, setAutoSize] = useState<{ w?: number; h?: number }>({});

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAutoSize({ w: Math.round(r.width), h: Math.round(r.height) });
    onAutoResize?.(Math.round(r.width), Math.round(r.height)); // ← 변경점
  }, []);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const w = Math.round(width);
      const h = Math.round(height);
      setAutoSize({ w, h });
      onAutoResize?.(w, h); // ← 변경점
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onAutoResize]);

  const finalWidth = overrideSize?.width ?? autoSize.w;
  const finalHeight = overrideSize?.height ?? autoSize.h;

  return (
    <div
      style={{
        position: "absolute",
        margin,
        ...(finalWidth !== undefined ? { width: finalWidth } : {}),
        ...(finalHeight !== undefined ? { height: finalHeight } : {}),
        boxSizing: "border-box",
      }}
    >
      {/* 측정용 래퍼 */}
      <div ref={measureRef} style={{ display: "inline-block" }}>
        {children}
      </div>
    </div>
  );
}