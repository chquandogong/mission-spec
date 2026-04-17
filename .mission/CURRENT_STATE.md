# Mission Spec — Current State

> Last updated: 2026-04-17 | Version: 1.16.2

## 현재 상태

- **Title:** Mission Spec v1.16.2 — Value-shape + CURRENT_STATE freshness (E-5, E-8)
- **Phase:** governed portability
- **Author:** Dr. QUAN
- **Created:** 2026-04-01

## 현재 목표

Mission Spec을 core library, CLI, Claude Code skill bundle로 유지한다.
누구나(사람/AI)가 설치해 기존 워크플로에 붙일 수 있는 portable한 task contract 도구로 유지한다.
mission.yaml의 변경 이력과 구조 자산을 Living Asset Registry로 관리한다.
문서 접근성은 다국어로 유지하되, 런타임/스키마/메타데이터는 일관된 영어 표면으로 유지한다.

## 핵심 제약 (활성)

1. Task contract layer만 구현 (orchestration 아님)
2. execution_hints는 suggestion (directive 아님)
3. 기존 워크플로에 녹아들 것 (별도 UI/SaaS 금지)
4. 외부 dependency 최소화 (ajv + yaml만)
5. TDD first
6. 한 번에 하나의 기능만

## 완료 조건 (9/9 PASS)

- [x] skills/ms-init/SKILL.md 존재
- [x] skills/ms-eval/SKILL.md 존재
- [x] skills/ms-status/SKILL.md 존재
- [x] skills/ms-report/SKILL.md 존재
- [x] .claude-plugin/plugin.json 존재
- [x] README.md 존재
- [x] schema_validation_passes
- [x] command_test
- [x] cross_platform_verifies

## 활성 임시 규칙

- (없음)

## 최근 구현 (v1.14.0 ~ v1.14.1)

- [x] `ms-decide` 명령과 trilingual skill 추가 — MDR 초안 생성 자동화
- [x] 플랫폼 변환 대상을 6개로 확장: Cursor, Codex, OpenCode, Cline, Continue, Aider
- [x] `src/core/migration.ts` + `scripts/migrate-mission.js` 추가 — 차기 schema v2용 migration 기반 확보
- [x] `src/core/reconstruction-verifier.ts` + `scripts/verify-reconstruction.js` 추가 — REBUILD_PLAYBOOK 참조 무결성 검증
- [x] `README.md`에 adoption scaffold 추가 — 실제 도입 사례 기록 위치 확보
- [x] `src/commands/decide.ts` Unicode slug fix — 한글/중국어/일본어 제목과 파일명을 NFC + `/u` 기반으로 안정 처리
- [x] `MDR-005` 작성 — meta-tooling 확장이 task-contract 경계를 어떻게 지키는지 공식화

## 직전 구현 (v1.13.x)

- [x] `release.yml` 추가 — tag 기반 npm publish 검증 경로
- [x] `mission-history.yaml`의 `intent` / `decision` 영문화 + `intent_ko` / `decision_ko` 보존
- [x] `arch:verify` 강화 — phantom `depends_on` 및 `API_REGISTRY.yaml` drift 탐지
- [x] `CHANGELOG.md` 자동 생성과 pre-commit / CI parity 연결

## 다음 변경 후보

- `.mission/` 서술 자산 freshness verifier 추가 (`REBUILD_PLAYBOOK.md`, `TRACE_MATRIX.yaml`, `CURRENT_STATE.md`, `VERIFICATION_LOG.yaml`)
- `package.json.exports` ↔ `API_REGISTRY.yaml.package_exports` 동기 검증
- 첫 실제 schema migration 등록 (`v2` 결정 이후)
- `reconstruction:verify`의 fast mode를 pre-commit / CI parity에 연결
- release 과정에서 `CURRENT_STATE.md` / `VERIFICATION_LOG.yaml` 자동 동기화

## 자기 검증

- [x] 이 spec만 보면 지금 무엇을 해야 하는지 알 수 있는가?
- [x] mission-history.yaml만 보면 왜 그렇게 바뀌었는지 알 수 있는가?
- [x] 특정 버전을 다시 꺼내 재실행할 수 있는가?
- [x] 임시 조치인지 영구 정책인지 구분되는가?
- [x] 코드를 읽지 않고도 모듈 구조를 알 수 있는가? (v1.7.0+)
- [x] 한국어/영어/중국어 사용자 모두 설치 문서를 따라갈 수 있는가? (v1.8.0+)
- [x] MDR 작성과 재구성 검증까지 Living Asset Registry 안에서 닫히는가? (v1.14.0+)
