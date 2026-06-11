import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function promptMarket(rfp: string, ctx: string) {
  return `당신은 광고대행사의 시니어 전략 플래너입니다.
아래 RFP 분석 결과를 바탕으로 시장·트렌드 인사이트를 정리해주세요.

RFP 분석 결과:
${rfp}

${ctx ? `추가 맥락:\n${ctx}\n` : ""}
아래 형식으로 구체적이고 실용적으로 작성해주세요.

## 시장 현황
(카테고리·산업 현황 3-4문장)

## 핵심 소비자 트렌드
(주요 트렌드 3가지. 각 제목 + 2-3문장 설명)

## 기회 포인트
(이 브랜드/캠페인에서 활용할 구체적 기회 2-3가지)

## 제안서 핵심 키워드
(전략·크리에이티브에 반영될 키워드 5-7개)`;
}

function promptStrategy(rfp: string, market: string) {
  return `당신은 광고대행사의 시니어 전략 플래너입니다.
RFP 분석과 시장 인사이트를 바탕으로 차별화된 전략 방향 3가지를 제시해주세요.
각 전략은 서로 뚜렷하게 다른 방향이어야 합니다.

RFP 분석:
${rfp}

시장 인사이트:
${market}

반드시 아래 구분자를 사용해 3가지 전략을 나눠 작성하세요.

---OPTION 1---
## 전략 방향 1: [전략명]

**한 줄 요약:** ...

**핵심 타겟:** ...

**전략 인사이트:** ...

**캠페인 방향:** ...

**이 전략의 강점:** ...

---OPTION 2---
## 전략 방향 2: [전략명]

**한 줄 요약:** ...

**핵심 타겟:** ...

**전략 인사이트:** ...

**캠페인 방향:** ...

**이 전략의 강점:** ...

---OPTION 3---
## 전략 방향 3: [전략명]

**한 줄 요약:** ...

**핵심 타겟:** ...

**전략 인사이트:** ...

**캠페인 방향:** ...

**이 전략의 강점:** ...`;
}

function promptConcept(strategy: string, rfp: string) {
  return `당신은 광고대행사의 크리에이티브 디렉터입니다.
선택된 전략 방향을 바탕으로 크리에이티브 컨셉 3가지를 제안해주세요.
각 컨셉은 뚜렷하게 다른 크리에이티브 방향이어야 합니다.

선택된 전략:
${strategy}

RFP 분석 (참고):
${rfp}

반드시 아래 구분자를 사용해 3가지 컨셉을 나눠 작성하세요.

---OPTION 1---
## 컨셉 1: "[컨셉명]"

**태그라인:** "..."

**컨셉 설명:** (어떤 감성·메시지인지 2-3문장)

**핵심 아이디어:** ...

**실행 방향:** (채널별 구현 방향 간략히)

**이 컨셉의 차별점:** ...

---OPTION 2---
## 컨셉 2: "[컨셉명]"

**태그라인:** "..."

**컨셉 설명:** ...

**핵심 아이디어:** ...

**실행 방향:** ...

**이 컨셉의 차별점:** ...

---OPTION 3---
## 컨셉 3: "[컨셉명]"

**태그라인:** "..."

**컨셉 설명:** ...

**핵심 아이디어:** ...

**실행 방향:** ...

**이 컨셉의 차별점:** ...`;
}

function promptProposal(rfp: string, market: string, strategy: string, concept: string) {
  return `당신은 광고대행사의 시니어 전략 플래너 겸 카피라이터입니다.
아래 내용을 바탕으로 광고 제안서 전체 구조와 섹션별 텍스트 초안을 작성해주세요.
PPT 슬라이드에 그대로 옮길 수 있을 수준으로 구체적으로 작성해주세요.

RFP 분석:
${rfp}

시장 인사이트:
${market}

전략 방향:
${strategy}

크리에이티브 컨셉:
${concept}

---

# [제안서 제목]

---

## 1. 과제 이해
(클라이언트 상황과 핵심 과제를 우리가 어떻게 이해했는지. 3-5문장)

## 2. 시장 및 환경 분석
(시장 현황, 소비자 트렌드, 경쟁 환경 요약. 슬라이드 텍스트로 활용 가능하게)

## 3. 소비자 인사이트
(핵심 타겟의 심리·행동·니즈. 제안서에서 가장 설득력 있어야 하는 파트)

## 4. 전략 방향
(선택된 전략을 제안서 언어로. 왜 이 전략인지 설득력 있게)

## 5. 크리에이티브 컨셉
(컨셉명, 태그라인, 컨셉 설명, 실행 방향을 제안서 형식으로)

## 6. 캠페인 실행 계획
(채널별 실행 방향, 콘텐츠 전략 등. 구체적으로)

## 7. 기대 효과
(정성적·정량적 기대 효과)

---

**Executive Summary** (제안서 전체를 3문장으로)`;
}

export async function POST(req: NextRequest) {
  const { step, rfpAnalysis, context, marketInsight, selectedStrategy, selectedConcept } = await req.json();

  let prompt = "";
  if (step === "market") prompt = promptMarket(rfpAnalysis, context ?? "");
  else if (step === "strategy") prompt = promptStrategy(rfpAnalysis, marketInsight);
  else if (step === "concept") prompt = promptConcept(selectedStrategy, rfpAnalysis);
  else if (step === "proposal") prompt = promptProposal(rfpAnalysis, marketInsight, selectedStrategy, selectedConcept);
  else return new Response("Invalid step", { status: 400 });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
