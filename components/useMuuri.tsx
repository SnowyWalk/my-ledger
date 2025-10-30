import { useEffect, useRef } from "react";

export function useMuuriGrid() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<any>(null);

  useEffect(() => {
    let ro: ResizeObserver | null = null;
    let destroyed = false;

    const setup = async () => {
      if (!containerRef.current) return;
      if (typeof window === "undefined") return; // ★ SSR 가드

      const { default: Muuri } = await import("muuri"); // ★ 동적 import로 변경

      if (destroyed) return;
      const grid = new Muuri(containerRef.current!, {
        dragEnabled: false,       // 배치만
        layoutDuration: 1000,      // 애니메이션(선택)
      });
      gridRef.current = grid;

      ro = new ResizeObserver(() => grid.refreshItems().layout()); // ★ 리사이즈 대응
      ro.observe(containerRef.current!);
    };

    setup();

    return () => {
      destroyed = true;
      if (ro) ro.disconnect();
      if (gridRef.current) {
        gridRef.current.destroy();
        gridRef.current = null;
      }
    };
  }, []);

  return containerRef;
}