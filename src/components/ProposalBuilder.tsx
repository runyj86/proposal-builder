"use client";
import { useState } from "react";
import { MarkdownView } from "./MarkdownView";

type Step = "input" | "market" | "strategy" | "concept" | "proposal";
const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: "input",    label: "입력",     icon: "01" },
  { key: "market",   label: "시장 분석", icon: "02" },
  { key: "strategy", label: "전략 선택", icon: "03" },
  { key: "concept",  label: "컨셉 선택", icon: "04" },
  { key: "proposal", label: "제안서",   icon: "05" },
];

function parseOptions(text: string): string[] {
  const parts = text.split(/---OPTION \d+---/);
  return parts.slice(1).map(p => p.trim()).filter(Boolean);
}

export function ProposalBuilder() {
  const [step, setStep]                     = useState<Step>("input");
  const [rfpAnalysis, setRfpAnalysis]       = useState("");
  const [context, setContext]               = useState("");
  const [marketInsight, setMarketInsight]   = useState("");
  const [strategyText, setStrategyText]     = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const [conceptText, setConceptText]       = useState("");
  const [selectedConcept, setSelectedConcept]   = useState("");
  const [proposalText, setProposalText]     = useState("");
  const [running, setRunning]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const stepIdx = STEPS.findIndex(s => s.key === step);

  async function streamStep(
    apiStep: string,
    body: Record<string, string>,
    setter: (v: string) => void,
    nextStep: Step,
  ) {
    setError(null);
    setRunning(true);
    setter("");
    setStep(nextStep);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: apiStep, ...body }),
      });
      if (!res.ok || !res.body) throw new Error("요청 실패");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setter(acc);
      }
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setRunning(false);
    }
  }

  const startMarket   = () => streamStep("market",   { rfpAnalysis, context },                          setMarketInsight,   "market");
  const startStrategy = () => streamStep("strategy", { rfpAnalysis, marketInsight },                    setStrategyText,    "strategy");
  const pickStrategy  = (s: string) => { setSelectedStrategy(s); streamStep("concept", { rfpAnalysis, selectedStrategy: s }, setConceptText, "concept"); };
  const pickConcept   = (c: string) => { setSelectedConcept(c);  streamStep("proposal", { rfpAnalysis, marketInsight, selectedStrategy, selectedConcept: c }, setProposalText, "proposal"); };

  function copy(text: string) { navigator.clipboard.writeText(text); }
  function download(text: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    a.download = "proposal-draft.md";
    a.click();
  }

  const strategyOptions = parseOptions(strategyText);
  const conceptOptions  = parseOptions(conceptText);

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1 min-w-0">
            <div className={`flex items-center gap-1.5 flex-1 pb-2 border-b-2 transition-all ${
              i === stepIdx ? "border-ink" : i < stepIdx ? "border-ink/30" : "border-[color:var(--line)]"
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                i === stepIdx ? "bg-ink text-white" : i < stepIdx ? "bg-ink/30 text-white" : "bg-[color:var(--line)] text-[color:var(--muted)]"
              }`}>{i + 1}</span>
              <span className={`text-xs truncate hidden sm:block ${i === stepIdx ? "font-semibold text-ink" : "text-[color:var(--muted)]"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="w-2 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* ── STEP 0: INPUT ── */}
      {step === "input" && (
        <div className="card space-y-5">
          <div>
            <div className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-widest mb-3">Step 1</div>
            <h2 className="text-xl font-semibold mb-1">RFP 분석 결과 붙여넣기</h2>
            <p className="text-sm text-[color:var(--muted)]">
              RFP 분석기에서 나온 결과를 그대로 붙여넣으세요. 분석기 결과가 길수록 제안서 품질이 높아집니다.
            </p>
          </div>
          <div>
            <label className="label">RFP 분석 결과 <span className="text-red-500">*</span></label>
            <textarea
              className="input min-h-[260px] font-mono text-[13px]"
              placeholder="RFP 분석기 결과를 여기에 붙여넣으세요..."
              value={rfpAnalysis}
              onChange={e => setRfpAnalysis(e.target.value)}
            />
            <p className="text-xs text-[color:var(--muted)] mt-1">{rfpAnalysis.length.toLocaleString()}자</p>
          </div>
          <div>
            <label className="label">추가 맥락 <span className="text-[color:var(--muted)] font-normal text-xs">(선택)</span></label>
            <textarea
              className="input min-h-[80px] text-sm"
              placeholder="예산 규모, 캠페인 기간, 클라이언트 특이사항, 선호/비선호 방향 등..."
              value={context}
              onChange={e => setContext(e.target.value)}
            />
          </div>
          <button className="btn-primary w-full text-base py-3" onClick={startMarket} disabled={!rfpAnalysis.trim()}>
            시장 분석 시작 →
          </button>
        </div>
      )}

      {/* ── STEP 1: MARKET ── */}
      {step === "market" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-widest">Step 2</div>
              <h2 className="text-xl font-semibold">📊 시장 및 트렌드 분석</h2>
            </div>
            {running && <span className="text-sm text-blue-500 animate-pulse font-medium">분석 중…</span>}
          </div>
          <div className="card self-start">
            {marketInsight
              ? <MarkdownView>{marketInsight}</MarkdownView>
              : <div className="py-16 text-center text-[color:var(--muted)] text-sm animate-pulse">시장 분석 생성 중…</div>
            }
          </div>
          {!running && marketInsight && (
            <div className="flex gap-3">
              <button className="btn-ghost" onClick={() => setStep("input")}>← 입력 수정</button>
              <button className="btn-primary flex-1" onClick={startStrategy}>전략 방향 도출 →</button>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* ── STEP 2: STRATEGY ── */}
      {step === "strategy" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-widest">Step 3</div>
              <h2 className="text-xl font-semibold">🎯 전략 방향 선택</h2>
              <p className="text-sm text-[color:var(--muted)] mt-0.5">가장 적합한 전략 방향을 선택하세요.</p>
            </div>
            {running && <span className="text-sm text-blue-500 animate-pulse font-medium">전략 도출 중…</span>}
          </div>

          {/* While streaming: raw markdown */}
          {running && (
            <div className="card self-start">
              {strategyText
                ? <MarkdownView>{strategyText}</MarkdownView>
                : <div className="py-16 text-center text-[color:var(--muted)] text-sm animate-pulse">전략 방향 생성 중…</div>
              }
            </div>
          )}

          {/* After streaming: parsed option cards */}
          {!running && strategyOptions.length > 0 && strategyOptions.map((opt, i) => (
            <div key={i} className="card-option">
              <MarkdownView>{opt}</MarkdownView>
              <button className="btn-select" onClick={() => pickStrategy(opt)}>
                이 전략으로 진행 →
              </button>
            </div>
          ))}

          {/* Fallback if parsing fails */}
          {!running && strategyOptions.length === 0 && strategyText && (
            <div className="space-y-3">
              <div className="card self-start"><MarkdownView>{strategyText}</MarkdownView></div>
              <p className="text-xs text-amber-600">옵션 구분이 어렵습니다. 원하는 전략 텍스트를 복사해 아래에 붙여넣고 진행하세요.</p>
              <textarea className="input min-h-[120px] text-sm" placeholder="선택할 전략 내용 붙여넣기..."
                onBlur={e => { if (e.target.value.trim()) pickStrategy(e.target.value.trim()); }} />
            </div>
          )}

          <button className="btn-ghost" onClick={() => setStep("market")}>← 시장 분석으로</button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* ── STEP 3: CONCEPT ── */}
      {step === "concept" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-widest">Step 4</div>
              <h2 className="text-xl font-semibold">✨ 크리에이티브 컨셉 선택</h2>
              <p className="text-sm text-[color:var(--muted)] mt-0.5">가장 마음에 드는 컨셉을 선택하세요.</p>
            </div>
            {running && <span className="text-sm text-blue-500 animate-pulse font-medium">컨셉 도출 중…</span>}
          </div>

          {running && (
            <div className="card self-start">
              {conceptText
                ? <MarkdownView>{conceptText}</MarkdownView>
                : <div className="py-16 text-center text-[color:var(--muted)] text-sm animate-pulse">크리에이티브 컨셉 생성 중…</div>
              }
            </div>
          )}

          {!running && conceptOptions.length > 0 && conceptOptions.map((opt, i) => (
            <div key={i} className="card-option">
              <MarkdownView>{opt}</MarkdownView>
              <button className="btn-select" onClick={() => pickConcept(opt)}>
                이 컨셉으로 제안서 작성 →
              </button>
            </div>
          ))}

          {!running && conceptOptions.length === 0 && conceptText && (
            <div className="space-y-3">
              <div className="card self-start"><MarkdownView>{conceptText}</MarkdownView></div>
              <p className="text-xs text-amber-600">컨셉을 직접 선택해주세요.</p>
              <textarea className="input min-h-[120px] text-sm" placeholder="선택할 컨셉 내용 붙여넣기..."
                onBlur={e => { if (e.target.value.trim()) pickConcept(e.target.value.trim()); }} />
            </div>
          )}

          <button className="btn-ghost" onClick={() => setStep("strategy")}>← 전략 다시 선택</button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* ── STEP 4: PROPOSAL ── */}
      {step === "proposal" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-widest">Step 5</div>
              <h2 className="text-xl font-semibold">📋 제안서 초안</h2>
              <p className="text-sm text-[color:var(--muted)] mt-0.5">각 섹션을 PPT에 그대로 옮겨 사용하세요.</p>
            </div>
            {running && <span className="text-sm text-blue-500 animate-pulse font-medium">제안서 작성 중…</span>}
          </div>
          <div className="card self-start">
            {proposalText
              ? <MarkdownView>{proposalText}</MarkdownView>
              : <div className="py-16 text-center text-[color:var(--muted)] text-sm animate-pulse">제안서 초안 작성 중…</div>
            }
          </div>
          {!running && proposalText && (
            <div className="flex gap-3 flex-wrap">
              <button className="btn-ghost" onClick={() => setStep("concept")}>← 컨셉 다시 선택</button>
              <button className="btn-ghost flex-1" onClick={() => copy(proposalText)}>📋 전체 복사</button>
              <button className="btn-primary" onClick={() => download(proposalText)}>⬇ MD 다운로드</button>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
