import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import QueryProvider from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner"
import { buttonVariants } from "@/components/ui/button"; // [!code ++]
import { cn } from "@/lib/utils"; // [!code ++]

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "-",
  description: "Financial Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // [!code highlight:15] 네비게이션 아이템 정의
  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Transaction", href: "/transaction" },
    { label: "Card", href: "/card" },
    { label: "Category Manager", href: "/category-manager" },
    { label: "Settings", href: "/setting" },
  ];

  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          {/* 네비게이션 바 영역 */}
          <section className="p-2 h-15 flex flex-row items-center gap-1 border-b bg-white dark:bg-slate-950 sticky top-0 z-50">
            {navItems.map((item, index) => (
              <div key={item.href} className="h-full flex items-center">
                <Link 
                  href={item.href} 
                  className={cn(
                    // buttonVariants({ variant: "ghost" })를 사용하여 버튼 스타일 적용
                    // text-lg는 너무 클 수 있어 text-sm이나 기본값으로 조정
                    buttonVariants({ variant: "ghost", size: "sm" }), 
                    "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
                {/* 마지막 아이템이 아닐 때만 구분선 표시 */}
                {index < navItems.length - 1 && (
                  <Separator orientation="vertical" className="h-1/2! mx-1" />
                )}
              </div>
            ))}
          </section>

          <main className="m-4">
            {children}
          </main>
        </QueryProvider>
        <Toaster position="top-center"/>
      </body>
    </html>
  );
}