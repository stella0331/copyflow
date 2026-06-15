# 상세 카피플로우 (CopyFlow)

> 사내 직원 전용 — Google 로그인(@ozkiz.com, @openhan.kr) 후 사용하는 AI 상세페이지 카피 생성 도구

## 📁 프로젝트 구조

```
atf-agent/
├── index.html                  ← 단일 페이지 앱 (로그인 게이트 포함)
├── netlify.toml                ← 빌드·함수·헤더·CSP 설정
├── README.md
└── netlify/
    └── functions/
        ├── claude.js           ← Claude API 중계 서버 (회사 공용 키 사용)
        └── test.js             ← 환경변수/연결 진단용 (배포 후 삭제 가능)
```

---

## 🚀 배포 순서 (필수 — 순서 중요!)

### 1단계 — 사이트 배포

[drop.netlify.com](https://drop.netlify.com) 에 `atf-agent` 폴더(or zip) 드래그 앤 드롭

### 2단계 — Claude API 키를 서버 환경변수로 등록

이 단계가 핵심입니다. 직원들은 API 키를 입력하지 않고, **서버에 저장된 회사 공용 키**를 자동으로 사용합니다.

1. Netlify 대시보드 → 해당 사이트 선택
2. **Site configuration → Environment variables**
3. **Add a variable**
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (회사 Anthropic Console에서 발급한 키)
4. **Save**

> ⚠️ Drop으로 재배포하면 환경변수가 초기화될 수 있습니다. ZIP을 다시 올린 뒤에는 **반드시 환경변수가 등록되어 있는지 재확인**하세요.

### 3단계 — 동작 확인

브라우저에서 다음 주소 접속:
```
https://[사이트주소].netlify.app/.netlify/functions/test
```

- `{"step":"OK", ...}` → 정상, Claude 모드 바로 사용 가능
- `{"step":"FAIL","reason":"ANTHROPIC_API_KEY 환경변수 없음"}` → 2단계 다시 확인

---

## 🔐 접근 제어

- **Google 로그인 필수** — 사이트 접속 시 로그인 화면이 먼저 표시됩니다.
- **이메일 도메인 제한** — `@ozkiz.com`, `@openhan.kr` 계정만 로그인 가능. 다른 도메인은 오류 메시지 표시.
- 세션은 브라우저 탭이 열려있는 동안 유지됩니다 (`sessionStorage`).

> 참고: 이 인증은 클라이언트 사이드 검증입니다. 완전한 보안이 필요하다면 서버 측 토큰 검증 추가를 고려하세요.

---

## ⚙️ 사용 방법

### Claude 모드 (기본, 권장)
- API 키 입력 불필요 — 회사 공용 키가 서버에서 자동 사용됩니다.
- 제품명 + 이미지(선택) + 콘셉트(선택) + 시즌 선택 → 생성

### Gemini 모드 (선택)
- 개인 Gemini API 키 입력 필요 ([발급](https://aistudio.google.com/app/apikey))
- 이미지 분석 + 카피 생성 동일하게 지원

---

## 🎯 생성 결과물

| # | 항목 | 설명 |
|---|------|------|
| 01 | SEO 상품 설명 | 50자 내외, 네이버쇼핑 · 구글 · 카카오 최적화 |
| 02 | ATF 메인 카피 | 최대 3줄, 모바일 화면 미리보기 |
| 03 | 후킹 문구 3종 | 감성형(A) / 기능형(B) / 심리형(C) |
| 04 | 원라인 슬로건 | 감성 저격형 3 + 직관·위트형 3, 메인+서브 카피 |
| 05 | 상세 설명 | 제품 설명 / 소재 디테일 / 착용 상황(TPO) / 코디 팁 |
