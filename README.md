# hwpx-ts

한글 워드프로세서 HWPX 문서를 TypeScript로 읽고, 수정하고, 자동화하기 위한 모노레포입니다.

## 한눈에 보기

- **핵심 라이브러리**: `@ubermensch1218/hwpxcore` (문서 파싱/편집/저장)
- **React 에디터 UI**: `@ubermensch1218/hwpxeditor`
- **MCP 서버**: `@ubermensch1218/hwpx-mcp` (LLM 도구 연동)
- **보조 도구**: `@ubermensch1218/hwpx-tools`, `@ubermensch1218/hwpx-cli`

## 빠른 시작

### 1) 라이브러리로 문서 편집하기 (`hwpxcore`)

```bash
npm install @ubermensch1218/hwpxcore
```

```ts
import { HwpxDocument } from "@ubermensch1218/hwpxcore";

const buffer = await fetch("document.hwpx").then((r) => r.arrayBuffer());
const doc = await HwpxDocument.open(new Uint8Array(buffer));

doc.addParagraph("추가된 문단");

const bytes = await doc.saveToBuffer();
const blob = await doc.saveToBlob();
await doc.saveToPath("./out.hwpx");
```

### 2) React 에디터 붙이기 (`hwpxeditor`)

```bash
npm install @ubermensch1218/hwpxeditor react react-dom
```

```tsx
import { Editor } from "@ubermensch1218/hwpxeditor";

export default function App() {
  return <Editor />;
}
```

### 3) MCP로 LLM에 HWPX 도구 제공하기 (`hwpx-mcp`)

```bash
npx @ubermensch1218/hwpx-mcp
```

Claude Desktop 예시:

```json
{
  "mcpServers": {
    "hwpx": {
      "command": "npx",
      "args": ["@ubermensch1218/hwpx-mcp"]
    }
  }
}
```

제공 도구: `hwpx_read`, `hwpx_export`, `hwpx_extract_xml`, `hwpx_info`

## 패키지 목록

| 패키지 | 설명 | npm |
|---|---|---|
| `@ubermensch1218/hwpxcore` | HWPX 읽기/편집 핵심 라이브러리 | [npm](https://www.npmjs.com/package/@ubermensch1218/hwpxcore) |
| `@ubermensch1218/hwpxeditor` | React 기반 한글 스타일 에디터 UI | [npm](https://www.npmjs.com/package/@ubermensch1218/hwpxeditor) |
| `@ubermensch1218/hwpx-mcp` | MCP 서버 (LLM 연동용) | - |
| `@ubermensch1218/hwpx-tools` | 변환/내보내기 유틸리티 | - |
| `@ubermensch1218/hwpx-cli` | CLI 도구 | - |

## 호환성 포인트

- ZIP 저장 시 `mimetype`를 **첫 엔트리 + 무압축(STORE)** 으로 유지
- XML 직렬화 시 HWPX 네임스페이스 접두사(`hp`, `hs`, `hc`, `hh`) 우선
- container/manifest가 비표준일 때 fallback 경고 핸들러 제공

## LLM/에이전트 안내

- AI 친화 요약 문서는 루트 `llms.txt`를 참고하세요.
- `llms.txt`에는 `hwpxcore`/`hwpx-mcp` 기준의 추천 API, 제약, 예제가 정리되어 있습니다.

## 개발

```bash
pnpm install
```

주요 검증 명령:

```bash
pnpm --filter @ubermensch1218/hwpxcore test
pnpm --filter @ubermensch1218/hwpxcore typecheck
pnpm --filter @ubermensch1218/hwpxcore build
```

워크스페이스 테스트(패키지별):

```bash
pnpm --filter @ubermensch1218/hwpx-tools test
pnpm --filter @ubermensch1218/hwpx-mcp exec vitest run --passWithNoTests
```

세부 문서:

- `packages/hwpx-core/README.md`
- `packages/hwpx-editor/README.md`

## 라이선스

Non-Commercial License. 자세한 내용은 `LICENSE`를 참고하세요.
