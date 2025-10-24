// SkeletonOverlay.tsx
"use client";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

type Props = React.PropsWithChildren<{
  loading: boolean;
  className?: string;     // 필요 시 래퍼에 추가 클래스
}>;

export default function SkeletonOverlay({ loading, className, children }: Props) {
  return (
    <div
      className={cn("relative", className)}
      aria-busy={loading ? "true" : "false"}
      aria-live="polite"
    >
      {/* 로딩 중엔 내용만 가리고, 레이아웃/사이즈는 그대로 유지 */}
      <div className={cn(loading && "opacity-0 pointer-events-none select-none")}>
        {children}
      </div>

      {loading && (
        // 부모(relative)를 기준으로 꽉 덮는 스켈레톤
        <Skeleton className="absolute inset-0 rounded-[inherit]" />
      )}
    </div>
  );
}