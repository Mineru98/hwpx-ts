# GitHub HWPX 변환 조사 (@ubermensch1218/hwpx*)

작성일: 2026-03-04

## 1) 조사 범위와 결과

- 대상: `@ubermensch1218` 계정의 `hwpx*` 저장소 및 해당 코드의 변환(conversion/export) 구현
- 공개 저장소 기준 확인 결과: `hwpx*` 접두 저장소는 `hwpx-ts` 1개
  - https://github.com/ubermensch1218/hwpx-ts
- GitHub 공개 검색(Web/API 비인증)에서 `@ubermensch1218/hwpx*` 패키지를 사용하는 외부 저장소는 식별 가능한 결과가 거의 없었음
  - 참고: Code Search API는 비인증 상태에서 제한됨

## 2) 변환 기능 List (링크 포함)

### A. HWP(바이너리) -> HWPX 변환

- 구현: `hwp-to-hwpx.ts`
  - https://github.com/ubermensch1218/hwpx-ts/blob/main/packages/hwpx-tools/src/converters/hwp-to-hwpx.ts
- 핵심 로직
  - HWP 파싱 후 섹션/문단 텍스트를 HWPX 문단으로 생성
  - 표 컨트롤(`TableControl`)을 HWPX table로 변환 + 셀 merge 반영
  - 그림 컨트롤(`PictureControl`)의 BinData를 추출해 HWPX 이미지 파트로 삽입
  - HWP 단위 -> mm 변환 + 크기 clamp로 비정상 값 방어
  - 알 수 없는 인라인 객체는 placeholder 토큰으로 보존 가능

### B. HWPX -> Markdown 변환 (이미지 매니페스트 포함)

- 구현: `markdown.ts`
  - https://github.com/ubermensch1218/hwpx-ts/blob/main/packages/hwpx-tools/src/exporters/markdown.ts
- 테스트: `markdown-exporter.test.ts`
  - https://github.com/ubermensch1218/hwpx-ts/blob/main/packages/hwpx-tools/__tests__/markdown-exporter.test.ts
- 핵심 로직
  - 문단/표/이미지를 Markdown으로 직렬화
  - `imageMode`: `markdown | placeholder | omit`
  - 이미지 manifest(`binaryItemId`, `href`, `mediaType`, 위치/크기) 동시 생성
  - `tokenEfficient` 모드로 LLM 친화형 정규화 제공

### C. HWPX -> Plain Text 변환

- 구현: `text.ts`
  - https://github.com/ubermensch1218/hwpx-ts/blob/main/packages/hwpx-tools/src/exporters/text.ts
- 핵심 로직
  - 섹션/문단 단위 텍스트 추출
  - 섹션 마커/구분자 커스터마이즈

### D. CLI 변환 파이프라인

- 구현: `cli.ts`
  - https://github.com/ubermensch1218/hwpx-ts/blob/main/packages/hwpx-cli/src/cli.ts
- 제공 커맨드
  - `hwp-to-hwpx`
  - `hwpx-to-md`
  - `export --format md|txt`
- 특징
  - Markdown export 시 이미지 파일 추출 + manifest 파일 출력 가능

### E. HWPX 패키지/직렬화 안정성 (변환 품질 기반)

- 구현: `package.ts`
  - https://github.com/ubermensch1218/hwpx-ts/blob/main/packages/hwpx-core/src/package.ts
- 검증: `roundtrip.test.ts`
  - https://github.com/ubermensch1218/hwpx-ts/blob/main/packages/hwpx-core/__tests__/roundtrip.test.ts
- 핵심 포인트
  - ZIP 저장 시 `mimetype`를 첫 엔트리 + STORE(무압축)로 유지
  - roundtrip(열기/수정/저장/재열기) 테스트 다수
  - section/header 상대경로 해석 fallback, 경고 핸들링

### F. 에디터 변환 브릿지 (UI <-> HWPX 모델)

- 구현: `format-bridge.ts`
  - https://github.com/ubermensch1218/hwpx-ts/blob/main/packages/hwpx-editor/src/lib/format-bridge.ts
- 구현: `view-model.ts`
  - https://github.com/ubermensch1218/hwpx-ts/blob/main/packages/hwpx-editor/src/lib/view-model.ts
- 핵심 로직
  - charPr/paraPr를 UI 모델로 읽고 다시 적용 가능한 bridge 제공
  - 표/이미지/수식/텍스트박스를 뷰모델로 표준화

## 3) 우리가 바로 배워서 넣을 수 있는 항목

1. 변환 결과와 함께 "구조화된 manifest"를 항상 제공
- 현재 markdown exporter의 이미지 manifest처럼, 변환 산출물 + 추적 메타데이터를 함께 저장하면 후처리/디버깅/LLM 파이프라인이 쉬워짐.

2. "lossy 변환"을 옵션으로 명시
- `inlineObjectPlaceholders`처럼 손실 지점을 토큰으로 남기면, 사용자/후속 처리기가 누락 구간을 복원하기 쉬움.

3. 단위 변환 시 안전한 clamp + 기본값 전략
- HWP 단위 -> mm 변환에서 clamp/default를 강제해 깨진 문서나 이상치를 방어하는 패턴이 실무적으로 유효.

4. 표 변환에서 "텍스트 채우기"와 "병합 반영" 분리
- 셀 값 세팅과 merge 단계를 분리한 구조는 디버깅/회귀 테스트에 유리.

5. 토큰 효율 모드(LLM 전용 출력) 분리
- 일반 사용자용 Markdown과 LLM 입력용 Markdown을 분리 옵션으로 제공하면 활용성이 크게 높아짐.

6. 포맷 규격 준수 테스트를 변환 파이프라인의 게이트로 사용
- `mimetype` 엔트리 순서/압축 방식, roundtrip 재열기 테스트를 CI의 최소 품질 게이트로 두는 방식이 효과적.

## 4) 우선순위 도입 제안

1. `변환 결과 manifest 표준 스키마` 정의
- 대상: text/md/hwpx 변환 공통
- 필드: source hash, warnings, lossy segments, assets, stats

2. `lossy-report` 공통 인터페이스 도입
- 변환기별로 누락/치환 이벤트를 누적하여 최종 보고

3. `roundtrip + spec compliance` 테스트 템플릿 추가
- 각 변환기의 smoke/regression 테스트에 공통 적용

4. `tokenEfficient` 출력을 CLI/SDK 기본 옵션과 분리
- 기본은 사용자 친화, 옵션으로 LLM 친화 출력 보장

## 5) 참고 링크

- 리포지토리: https://github.com/ubermensch1218/hwpx-ts
- 패키지(코어): https://www.npmjs.com/package/@ubermensch1218/hwpxcore
- 패키지(unpkg): https://unpkg.com/@ubermensch1218/hwpxcore/
