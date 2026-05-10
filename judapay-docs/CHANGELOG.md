# 주다페이 (JudaPay) Changelog

> 작업 단위로 묶은 버전 히스토리. 와이어프레임 단계라 백엔드 미연결, UI/UX 흐름 검증 위주.

---

## v2.8.0 — 자동지급 완성 + 쿠콘 API 확정 (2026-05-10)

### 핵심 변경 요약
1. **자동지급 화면 4개 완성** (ExecuteSalary / ExecuteRent / ExecuteRentLease / ExecuteTelecom) — 디자인 완전 통일
2. **ExecuteSalary 전면 재구조화** — 급여 차트 시스템 + 엑셀 업로드 + 구독료 스타일 자동지급 설정
3. **알림 설정 Toggle 통일** — RentLease·Rent·Telecom 3개 파일 모두 Toggle 방식으로 통일
4. **통지형 4개 pushToStore 완료** — Bonus / Condolence / OtherIncome / Gift
5. **관리자관리 화면 6모듈 완성**
6. **쿠콘 API 파트너십 확정** — 쿠콘 회장 = Judapay 주주 → 계약 실질 확정
7. **쿠콘 연동 범위 최종 결정** — 5개 API (공동인증서/홈택스/위택스/전자세금계산서/4대보험)
8. **증빙 자체 생성 전략 확정** — 외부 API 불필요한 6가지 증빙 명확화

---

### ExecuteSalary 재구조화 (v2.8 핵심)

#### 자동지급 설정 — 구독료 스타일로 전면 교체

기존: 별도 바텀시트 (showPayDaySheet 모달)
변경: 인라인 칩 선택 방식 (구독료/임대료 동일 패턴)

```jsx
// 지급일 칩 (인라인)
[1일] [5일] [10일] [15일] [20일] [25일] [말일] [직접 입력]
→ 직접 입력 선택 시: 숫자 input 필드 표시

// 지급 방식 (카드 자동결제형 제거)
● 계좌 자동이체   ○ 링크 수취형
→ 계좌 자동이체: 은행 칩 (8개) + 계좌번호 입력
→ 링크 수취형: 안내 박스
```

추가 state: `bankName`, `bankAccount`, `editHasPayroll`, `customDayInput`
computed: `const isCustomDay = !PAY_DAYS.includes(editPayDay) && editPayDay !== ''`
삭제: `showPayDaySheet` state + payDaySheet 바텀시트 모달 전체

#### 매월 총 지급액 — addForm에도 표시

```jsx
// 변경 전: detail 화면에서만
{ec.gross > 0 && <SummaryCard />}

// 변경 후: 직원 1명 이상이면 addForm에서도 표시
{editEmployees.length > 0 && <SummaryCard />}
```

#### 증빙 연동 — 급여 대장 추가

```js
{ label:'급여 대장 자동 생성', sub:'통합증빙센터 인건비 급여대장 자동 첨부',
  val:editHasPayroll, set:setEditHasPayroll }
```

#### 엑셀 업로드 (ExcelUploadSheet 컴포넌트)

급여 차트 일괄 생성 기능:

```
[Step 1 - 업로드]
  - CSV 양식 다운로드 (UTF-8 BOM, 한글 Excel 호환)
    컬럼: 이름 / 휴대폰번호 / 월급(세전) / 은행명 / 계좌번호
  - 드래그&드롭 / 파일 선택 업로드

[Step 2 - 미리보기]
  - FileReader API로 CSV 파싱 (외부 라이브러리 없음)
  - 직원 카드: 이름 / 전화 / 금액 / 상태 칩
    🏦 계좌 등록됨 (은행+계좌 있음, authStatus='account_provided')
    📩 초대 링크 발송 예정 (계좌 없음, authStatus='invited')
  - 차트 이름 입력 → 생성
```

empStatusChip 추가:
```js
if (emp.payable && emp.authStatus === 'account_provided')
  → { icon:'🏦', label:'계좌 등록됨', bg:'#E0F2FE', color:'#0369A1', border:'#BAE6FD' }
```

npm install 불가 (403 Forbidden) → 네이티브 Blob API + FileReader API로 해결

---

### 알림 설정 Toggle 통일

#### ExecuteRentLease — 자동 뱃지 → 5개 Toggle

```js
추가 state: notifBefore, notifDone, notifFail, notifExpiry, notifRenew
```

```
🔔 지급 예정 알림 (지급 3일 전)
✅ 지급 완료 알림 (납부 완료 즉시)
⚠️ 지급 실패 알림 (실패 즉시)
📅 계약 만료 30일 전 알림
🔄 갱신 필요 알림 (만료 7일 전)
```

#### ExecuteRent — 자동 뱃지 → 4개 Toggle

```js
추가 state: notifBefore, notifDone, notifFail, notifExpiry
```

#### ExecuteTelecom — 알림 설정 섹션 신규 추가

기존: 알림 설정 섹션 없음
추가: 3개 Toggle (addForm + detail 동시 적용)

```js
추가 state: notifBefore, notifDone, notifFail
{ label:'지급 전 알림', sub:'지급 1일 전 사전 안내' }
{ label:'지급 완료 알림', sub:'납부 완료 즉시 발송' }
{ label:'지급 실패 알림', sub:'실패 즉시 관리자 알림' }
```

---

### 쿠콘 API 연동 범위 확정

#### 파트너십

- 쿠콘 회장 = Judapay 주주 → 계약 실질 확정
- 표준 요금제 적용, 전체 API 사용 가능

#### 확정 계약 5개

1. 공동인증서 모듈 (전체 기반)
2. 홈택스 스크래핑 (국세 고지 + 전자납부번호)
3. 위택스 스크래핑 (지방세)
4. 전자세금계산서 조회
5. 4대보험 3종 (건강보험공단 + 국민연금공단 + 근로복지공단)

#### 불필요 항목 (결정)

- ❌ 기업 계좌 잔액 — 충전 잔액 기반 모델이므로 불필요
- ❌ 통신비/전기/가스 스크래핑 — 수동 등록 + 자동납부로 충분

---

### 증빙 자체 생성 전략 확정

주다페이 내부 데이터만으로 자동 생성 가능한 증빙 (쿠콘 불필요):

| 증빙 | 비고 |
|---|---|
| 지급 확인서 | 금융 증빙 가치 |
| 집행 영수증 | 내부 회계 증빙 |
| 급여 명세서 | 자동 생성 |
| 외주비 지급명세 | 원천세 포함 |
| 임대료 지급 증빙 | 자동 생성 |
| 운영비 지급 증빙 | 자동 생성 |

---

### 통지형 메뉴 pushToStore 풍부화 (v2.8 완료)

| 파일 | 완료 |
|---|---|
| ExecuteBonusBusiness | ✅ |
| ExecuteCondolenceBusiness | ✅ |
| ExecuteOtherIncomeBusiness | ✅ |
| ExecuteGift | ✅ |

---

### 버그 수정

- **RentLease/Rent 알림 "자동" 뱃지**: Toggle로 전환
- **Telecom 알림 섹션 누락**: addForm + detail 양쪽 추가
- **Salary addForm 총 지급액 미표시**: `ec.gross > 0` → `editEmployees.length > 0`
- **급여 대장 증빙 누락**: 통합증빙센터 연동 toggle 추가

---

## v2.7.0 — 사업자 메뉴 완성 + 거래 상세 풍부화 (2026-05-08)

### 핵심 변경 요약
1. **사업자에게 지급 5개 메뉴** 완성 (외주비/마케팅비/부동산/자금대여/투자)
2. **SelectVendor** — 사업자번호 조회 + 미가입자 이메일 처리
3. **SelectBusiness** — 개인→사업자 흐름에도 미가입자 이메일 처리 추가
4. **StoreTransactionDetail** — 정적 예제와 동등한 풍부 상세 화면 구현
5. **모든 거래형 메뉴 pushToStore 풍부화** — timeline/safety/contractFile/dealDescription/investMeta 추가
6. **ExecuteVendorInvestBusiness** — 3단계 B2B 투자 (4가지 유형 + 자금 사용 목적 + MCC + 계약서)

---

### 신규 화면

#### SelectVendor (`business/execute/SelectVendor.jsx`)
- 사업자번호 10자리 입력 → 국세청 실시간 조회 시뮬
- 데모: `123-45-67890` 정상 (주)오로라 / `234-56-78901` 폐업 (주)한빛홀딩스
- 최근 거래 사업자 4명 (오로라/벨라부동산/그로스마케팅/네오컴퍼니)
- **미가입 사업자**: 이메일 입력 필수 → verified=false → 외부링크 발송 흐름
- `?menu=${menuId}` query string → 진입 경로 보존

#### ExecuteVendorLoanBusiness (`business/execute/ExecuteVendorLoanBusiness.jsx`)
- B2B 자금 대여 — 사업자에게 단기 차용증 + 이자 설정
- 이자율: 무이자 / 적정 4.6% / 직접 입력
- 법정 이자제한법 검증 (연 20% 초과 경고)

#### ExecuteVendorInvestBusiness (`business/execute/ExecuteVendorInvestBusiness.jsx`) — 3단계
- Step 1: 투자 유형 4가지 (지분/CB/단순대여/수익분배) + 금액 + 회사 가치 자동 계산
- Step 2: 계약 기간 + 보고 주기
- Step 3: 자금 사용 목적 (6개 카테고리) + MCC 차단 + 계약서 첨부

---

### 데이터 모델 확장

#### Milestone 확장
```js
{
  note: string,              // 단계 설명
  conditions: [{ label, done, sub }],  // 집행 조건
}
```

#### addTransaction 신규 필드
```js
dealDescription, contractFile, timeline, safety, supportMeta, investMeta
```

---

### 버그 수정

- **ExecuteInvest type 오류**: `type: 'invest'` → `type: 'support'`
- **마일스톤 amount=0 표시**: "0원" 숨김 처리
- **수익 분배 만기 금액 오류**: equity+profit 만기 amount=0
- **개인→사업자 투자 라우트 누락**: App.jsx 미등록 수정
- **자금 사용 목적 mock 오류**: 균등 분할 → 라벨 칩만 표시

---

## v2.6.0 — 통합 데이터 store 도입 (2026-05-08)

자금집행 1건 → 알림/메시지/홈 화면 활동 피드 자동 반영 완성.

### 신규 기능

#### 통합 거래 store (`shared/transactionStore.js`)
- 자금집행 1건 → 활동 피드 / 알림 / 메시지 양측 자동 생성
- 거래형(contract) / 통지형(notification) 분리
- Pub/Sub 변경 알림 시스템

#### 화면 통합
- HomeBusiness 활동 피드 → store 동적
- Alerts 알림/거래 탭 → 정적 + store 합산
- Messages → store 통합

### 신규 화면
- ExecuteLendBusiness — 대여금 사유 4가지
- ExecuteSupportBusiness — 기업 → 직원 자금 지원

---

## v2.5.x — 자금집행 화면 정비

### v2.5.4 — 모달 position: fixed → absolute
### v2.5.3 — ExecuteOtherIncomeBusiness (기타소득)
### v2.5.2 — ExecuteCondolenceBusiness (경조사비)
### v2.5.1 — ExecuteBonusBusiness (상여금)
### v2.5.0 — 사람 풀 시스템 + SelectRecipientBusiness

---

## 핵심 시스템 규칙 (모든 버전 공통)

1. `getAccountTheme()` 컴포넌트 내부 첫 줄
2. 싱글쿼트 안 `${theme.xxx}` 금지 → 백틱
3. 최상위 상수에 theme 참조 금지
4. import 중복 금지
5. `theme.brandDark` 흰 배경용
6. 헤더 스크롤 함께, BottomTab만 고정
7. 모달/바텀시트 `position: 'absolute'` (PhoneShell 안에)
8. early return 위 useMemo 금지
9. 새 화면마다 `getAccountTheme()` + `useT()` + DarkHeader

## 브랜드 색상
- 개인: `#5B4FE8` (보라), brandDark `#3D2090`
- 기업: `#0EA5E9` (네이비), brandDark `#0369A1`
- 기관: `#16A34A` (그린), brandDark `#166534`

---

## 미완료 작업

### 구현 잔여
- HomeBusiness 기업 홈 화면 고도화
- 단계 F: 비가입자 → 가입자 매칭 흐름
- 기관 홈 화면 고도화
- 백엔드 시뮬레이터 (마일스톤 진행)

### 쿠콘 API 연동 (계약 후)
- 공동인증서 모듈 → 홈택스/위택스 스크래핑 시작
- 전자세금계산서 조회
- 4대보험 3종 스크래핑
