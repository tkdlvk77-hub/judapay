// ─────────────────────────────────────────────────────────
// 지갑 공통 데이터 + 집행 권한 메타
// WalletPicker, WalletDetail, MyWallet에서 공유
//
// 핵심 원칙:
//   받은 권한 자금은 보내준 사람이 설정한 MCC/목적 범위 내에서
//   자금 집행 가능. 집행 시 보내준 사람에게 자동 알림 발송.
//   "카드 결제 전용" 개념 없음 — MCC 차단 설정에 따라 집행 가능 여부 결정.
//
// canExecute: 이 지갑 돈으로 자금 집행 가능한가
//   true  = 가능 (보내준 사람 MCC 설정 범위 내)
//   false = 불가 (내가 빌려준 돈 / 검수 대기 / 잔액 없음)
//
// allowedExecuteTypes: 가능한 집행 메뉴 목록
//   ['*']     = 모든 메뉴 허용 (MY 지갑, 제약 없는 선물 등)
//   string[]  = 특정 메뉴만 (보내준 사람 목적 설정에 따름)
//
// lockedReason: 집행 불가 시 바텀시트에 표시할 이유
// senderAlertEnabled: 집행 시 보내준 사람에게 알림 발송 여부
// ─────────────────────────────────────────────────────────

export const EXECUTE_TYPES = {
  gift:         '선물·용돈',
  lend:         '빌려주기',
  invest:       '자금 지원',
  freelance:    '외주비',
  realestate:   '부동산',
  'invest-biz': '투자 (기업)',
}

export const WALLETS = [
  {
    id: 'my',
    label: 'MY 지갑',
    sub: '충전 + 노동 대가 통합',
    amount: 1932000,
    fund: null,
    sender: null,
    senderAlertEnabled: false,
    canExecute: true,
    allowedExecuteTypes: ['*'],
    lockedReason: null,
    completed: false,
  },
  {
    id: 'aurora_contract',
    label: '㈜오로라 · 계약금',
    sub: '업무 관련 지출 허용 · 집행 시 오로라에 알림',
    amount: 500000,
    fund: 'freelance',
    sender: '㈜오로라',
    senderAlertEnabled: true,
    canExecute: true,
    allowedExecuteTypes: ['freelance', 'lend', 'invest'],
    lockedReason: null,
    completed: false,
    mccBlocked: ['gambling', 'crypto', 'luxury', 'gaming', 'dining'],
  },
  {
    id: 'edu',
    label: '서울시 · 교육비 지원',
    sub: '교육 목적 집행 허용 · 집행 시 서울시에 알림',
    amount: 240000,
    fund: 'invest',
    sender: '서울시청',
    senderAlertEnabled: true,
    canExecute: true,
    // 서울시 설정: 교육 관련 외주비·인건비(자금 지원) 집행 허용
    // 선물·부동산·투자(기업)는 목적 외 불가
    allowedExecuteTypes: ['freelance', 'invest'],
    lockedReason: null,
    completed: false,
    mccBlocked: ['gambling', 'crypto', 'luxury', 'gaming'],
  },
  {
    id: 'mom',
    label: '엄마 · 용돈',
    sub: '제약 없음 · 집행 시 엄마에게 알림',
    amount: 200000,
    fund: 'gift',
    sender: '엄마',
    senderAlertEnabled: true,
    canExecute: true,
    // 엄마 설정: 제약 없음 — 모든 집행 메뉴 허용
    allowedExecuteTypes: ['*'],
    lockedReason: null,
    completed: false,
  },
  {
    id: 'fl',
    label: '박철수 · 외주비',
    sub: '검수 완료 후 집행 가능 · 집행 시 박철수에 알림',
    amount: 1500000,
    fund: 'freelance',
    sender: '박철수',
    senderAlertEnabled: true,
    canExecute: false,
    // 검수 대기 중 — 박철수 검수 완료 전 집행 불가
    allowedExecuteTypes: null,
    lockedReason: '검수 대기 중 · 완료 후 집행 가능',
    completed: false,
    mccBlocked: ['gambling', 'crypto', 'luxury'],
  },
]

// 특정 집행 메뉴에서 사용 가능한 지갑 필터 + 정렬
export function getExecutableWallets(executeType) {
  return WALLETS
    .filter(w => !w.completed && w.amount > 0)
    .map(w => {
      if (!w.canExecute) return { ...w, selectable: false }
      const allowed =
        w.allowedExecuteTypes?.includes('*') ||
        w.allowedExecuteTypes?.includes(executeType)
      return { ...w, selectable: !!allowed }
    })
    .sort((a, b) => {
      // 선택 가능 먼저, 그 안에서 MY 지갑 최우선, 이후 잔액 내림차순
      if (a.selectable && !b.selectable) return -1
      if (!a.selectable && b.selectable) return 1
      if (a.id === 'my') return -1
      if (b.id === 'my') return 1
      return b.amount - a.amount
    })
}

// 지갑 ID로 단일 지갑 조회
export function getWalletById(id) {
  return WALLETS.find(w => w.id === id) || WALLETS[0]
}
