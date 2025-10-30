"use client";

import { useMuuriGrid } from "@/components/useMuuri";

export default function DashboardPage() {
  const gridRef = useMuuriGrid();

  return (
    <section>
      <h1>Dashboard</h1>
      <div
        ref={gridRef}
        style={{
          position: "relative",
          border: "1px solid #ccc",
          boxSizing: "border-box",
          minHeight: 300,
        }}
      >
        {Array.from({ length: 10 }).map((_, index) => (
          // ✅ 아이템(바깥 div) — Muuri가 absolute 부여 대상
          <div
            key={index}
            style={{
                position: "absolute",
              margin: 8, // 여백은 아이템에
            }}
          >
            {/* ✅ 콘텐츠(안쪽 div) — 실제 크기/스타일은 여기에 */}
            <div
              style={{
                width: 100,
                height: 100 + (index % 5) * 20,
                backgroundColor: "#f0f0f0",
                border: "1px solid #ccc",
                boxSizing: "border-box",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Item {index + 1}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
