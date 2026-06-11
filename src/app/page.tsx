import { ProposalBuilder } from "@/components/ProposalBuilder";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="border-b border-[color:var(--line)] bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-white text-sm font-bold">PB</div>
          <div>
            <div className="font-semibold text-sm">제안서 빌더</div>
            <div className="text-xs text-[color:var(--muted)]">RFP 분석 → 전략 → 컨셉 → 제안서 초안</div>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <ProposalBuilder />
      </main>
    </div>
  );
}
