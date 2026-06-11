import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "제안서 빌더 — Proposal Builder",
  description: "RFP 분석 결과를 바탕으로 전략·컨셉·제안서 초안을 자동 생성",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
