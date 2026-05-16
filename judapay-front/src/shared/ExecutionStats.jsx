import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'

// ─────────────────────────────────────────────────────────
// 유저 타입
// ─────────────────────────────────────────────────────────
function getUserType() {
  const s = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('bizType') : null
  if (s === 'business') return 'business'
  if (s === 'public')   return 'public'
  return 'personal'
}

// ─────────────────────────────────────────────────────────
// 권한 자금 (내가 집행했지만 권한 보유)
// ─────────────────────────────────────────────────────────
const AUTHORITY_FUNDS = [
  {
    id:'auth1', type:'투자',    icon:'📈', color:'#0EA5E9',
    name:'㈜스타트업A', desc:'시리즈A 투자',
    amount:6000000000, returned:4000000000, status:'진행중',
    date:'2026.03.15',
    history:[
      { label:'1차 집행', date:'3.15', amount:3000000000 },
      { label:'2차 집행', date:'4.20', amount:2000000000 },
      { label:'3차 집행', date:'5.10', amount:1000000000 },
      { label:'1차 상환', date:'4.30', amount:-2000000000 },
      { label:'2차 상환', date:'5.20', amount:-2000000000 },
    ],
  },
  {
    id:'auth2', type:'대여금',  icon:'🤝', color:'#7C3AED',
    name:'박민준', desc:'사업 운영 자금 대여',
    amount:3000000000, returned:1500000000, status:'상환중',
    date:'2026.04.01',
    history:[
      { label:'대출 실행',    date:'4.1',  amount:3000000000  },
      { label:'1차 상환 수령', date:'4.30', amount:-800000000  },
      { label:'2차 상환 수령', date:'5.25', amount:-700000000  },
    ],
  },
  {
    id:'auth3', type:'자금지원', icon:'🎯', color:'#10B981',
    name:'이영희', desc:'창업 초기 자금 지원',
    amount:1000000000, returned:300000000, status:'상환중',
    date:'2026.05.03',
    history:[
      { label:'지원금 지급',  date:'5.3',  amount:1000000000 },
      { label:'1차 상환',     date:'5.25', amount:-300000000 },
    ],
  },
]
const TOTAL_AUTH = AUTHORITY_FUNDS.reduce((s,a)=>s+a.amount,0)

// ─────────────────────────────────────────────────────────
// 유저 타입별 카테고리 (5대 그룹 + 세부 항목)
// ─────────────────────────────────────────────────────────
const CATEGORY_GROUPS = {
  business: [
    { id:'labor', label:'인건비', icon:'👥', color:'#2A7D5E', prevAmount:26100000, subs:[
      { id:'salary',      label:'급여',    icon:'💼', color:'#2A7D5E', amount:16200000, count:12 },
      { id:'outsource',   label:'외주비',  icon:'🧑‍💻', color:'#0EA5E9', amount:7500000,  count:9  },
      { id:'bonus',       label:'상여금',  icon:'🎁', color:'#7C3AED', amount:2000000,  count:3  },
      { id:'condolence',  label:'경조사비',icon:'🎗️', color:'#EF4444', amount:500000,   count:2  },
      { id:'otherinc',    label:'기타소득',icon:'📦', color:'#9CA3AF', amount:300000,   count:1  },
      { id:'ins4',        label:'4대보험', icon:'🛡️', color:'#F59E0B', amount:1800000,  count:2  },
    ]},
    { id:'ops', label:'운영비', icon:'⚙️', color:'#0EA5E9', prevAmount:11400000, subs:[
      { id:'rent',        label:'임대료',       icon:'🏢', color:'#7C3AED', amount:5800000, count:3 },
      { id:'rentlease',   label:'렌트&리스',    icon:'🚗', color:'#06B6D4', amount:2000000, count:2 },
      { id:'subscription',label:'구독료',       icon:'📱', color:'#0EA5E9', amount:800000,  count:5 },
      { id:'telecom',     label:'통신비',       icon:'📡', color:'#10B981', amount:400000,  count:3 },
      { id:'utility',     label:'공과금',       icon:'💡', color:'#F59E0B', amount:350000,  count:2 },
      { id:'insurance',   label:'보험료',       icon:'🛡️', color:'#EF4444', amount:1800000, count:2 },
      { id:'travel_meal', label:'출장식대',     icon:'✈️', color:'#0891B2', amount:340000,  count:4 },
      { id:'welfare',     label:'복리후생',     icon:'🎁', color:'#10B981', amount:280000,  count:3 },
      { id:'otherops',    label:'기타 정기지출', icon:'📦', color:'#9CA3AF', amount:500000,  count:3 },
      { id:'personal_use',label:'개인사용',     icon:'👤', color:'#6B7280', amount:95000,   count:2 },
    ]},
    { id:'biz', label:'사업비', icon:'📋', color:'#7C3AED', prevAmount:3500000, subs:[
      { id:'marketing',   label:'마케팅비', icon:'📣', color:'#EF4444', amount:3000000, count:5 },
    ]},
    { id:'finance', label:'금융', icon:'💰', color:'#F59E0B', prevAmount:3800000, subs:[
      { id:'invest',      label:'투자',    icon:'📈', color:'#0EA5E9', amount:5000000, count:2 },
      { id:'lend',        label:'대여금',  icon:'🤝', color:'#7C3AED', amount:1000000, count:1 },
    ]},
    { id:'tax', label:'세금', icon:'🧾', color:'#EF4444', prevAmount:4100000, subs:[
      { id:'tax',         label:'세금',    icon:'🧾', color:'#EF4444', amount:4100000, count:4 },
    ]},
  ],
  personal: [
    { id:'card', label:'카드사용', icon:'💳', color:'#EF4444', prevAmount:320000, subs:[
      { id:'food',        label:'식비',    icon:'🍽️', color:'#EF4444', amount:145000, count:8 },
      { id:'transport',   label:'교통',    icon:'🚌', color:'#0EA5E9', amount:62000,  count:5 },
      { id:'shopping',    label:'쇼핑',    icon:'🛍️', color:'#EC4899', amount:88000,  count:3 },
      { id:'cafe',        label:'카페',    icon:'☕', color:'#92400E', amount:24000,  count:4 },
      { id:'health',      label:'의료·건강',icon:'🏥', color:'#10B981', amount:35000, count:2 },
      { id:'subscription',label:'구독',    icon:'📱', color:'#7C3AED', amount:29900,  count:2 },
      { id:'etc_card',    label:'기타',    icon:'📦', color:'#9CA3AF', amount:18000,  count:3 },
    ]},
    { id:'allowance', label:'용돈선물', icon:'🎁', color:'#F59E0B', prevAmount:290000, subs:[
      { id:'allowance',   label:'용돈',    icon:'💝', color:'#F59E0B', amount:200000, count:2 },
      { id:'gift_bday',   label:'생일선물',icon:'🎂', color:'#EF4444', amount:80000,  count:1 },
      { id:'condolence',  label:'경조사비',icon:'🎗️', color:'#7C3AED', amount:50000,  count:1 },
      { id:'gift_other',  label:'기타선물',icon:'🎀', color:'#EC4899', amount:20000,  count:1 },
    ]},
    { id:'lending', label:'빌려주기', icon:'🤝', color:'#7C3AED', prevAmount:800000, subs:[
      { id:'lend_friend', label:'친구',    icon:'👥', color:'#7C3AED', amount:300000, count:1 },
      { id:'lend_family', label:'가족',    icon:'👨‍👩‍👧', color:'#0EA5E9', amount:150000, count:1 },
      { id:'lend_other',  label:'지인',    icon:'🤲', color:'#9CA3AF', amount:50000,  count:1 },
    ]},
    { id:'outsource', label:'외주비', icon:'🧑‍💻', color:'#0EA5E9', prevAmount:180000, subs:[
      { id:'freelance',   label:'프리랜서', icon:'💻', color:'#0EA5E9', amount:150000, count:1 },
      { id:'design_fee',  label:'디자인',   icon:'🎨', color:'#EC4899', amount:80000,  count:1 },
      { id:'other_out',   label:'기타',     icon:'📦', color:'#9CA3AF', amount:30000,  count:1 },
    ]},
    { id:'realestate', label:'부동산', icon:'🏠', color:'#10B981', prevAmount:360000, subs:[
      { id:'monthly_rent',label:'월세',    icon:'🏢', color:'#7C3AED', amount:300000, count:1 },
      { id:'management',  label:'관리비',  icon:'🔧', color:'#10B981', amount:62000,  count:1 },
      { id:'housing_ins', label:'보험료',  icon:'🛡️', color:'#EF4444', amount:30000,  count:1 },
    ]},
    { id:'invest', label:'투자', icon:'📈', color:'#2563EB', prevAmount:120000, subs:[
      { id:'stock',   label:'주식',    icon:'📊', color:'#2563EB', amount:100000, count:2 },
      { id:'fund',    label:'펀드/ETF',icon:'📈', color:'#10B981', amount:50000,  count:1 },
      { id:'crypto',  label:'코인',    icon:'₿',  color:'#F59E0B', amount:30000,  count:1 },
    ]},
  ],
  public: [
    { id:'labor', label:'인건비', icon:'👥', color:'#2A7D5E', prevAmount:9800000, subs:[
      { id:'salary',      label:'급여',    icon:'💼', color:'#2A7D5E', amount:8200000, count:8 },
      { id:'outsource',   label:'외주비',  icon:'🧑‍💻', color:'#0EA5E9', amount:1000000, count:3 },
      { id:'bonus',       label:'상여금',  icon:'🎁', color:'#7C3AED', amount:500000,  count:1 },
      { id:'condolence',  label:'경조사비',icon:'🎗️', color:'#EF4444', amount:200000,  count:1 },
      { id:'otherinc',    label:'기타소득',icon:'📦', color:'#9CA3AF', amount:100000,  count:1 },
      { id:'ins4',        label:'4대보험', icon:'🛡️', color:'#F59E0B', amount:400000,  count:2 },
    ]},
    { id:'ops', label:'운영비', icon:'⚙️', color:'#0EA5E9', prevAmount:3100000, subs:[
      { id:'rent',        label:'임대료',       icon:'🏢', color:'#7C3AED', amount:500000,  count:1 },
      { id:'rentlease',   label:'렌트&리스',    icon:'🚗', color:'#06B6D4', amount:300000,  count:1 },
      { id:'subscription',label:'구독료',       icon:'📱', color:'#0EA5E9', amount:150000,  count:2 },
      { id:'telecom',     label:'통신비',       icon:'📡', color:'#10B981', amount:200000,  count:2 },
      { id:'utility',     label:'공과금',       icon:'💡', color:'#F59E0B', amount:980000,  count:3 },
      { id:'insurance',   label:'보험료',       icon:'🛡️', color:'#EF4444', amount:300000,  count:1 },
      { id:'travel_meal', label:'출장식대',     icon:'✈️', color:'#0891B2', amount:180000,  count:2 },
      { id:'welfare',     label:'복리후생',     icon:'🎁', color:'#10B981', amount:120000,  count:2 },
      { id:'otherops',    label:'기타 정기지출', icon:'📦', color:'#9CA3AF', amount:620000,  count:3 },
      { id:'personal_use',label:'개인사용',     icon:'👤', color:'#6B7280', amount:45000,   count:1 },
    ]},
    { id:'biz', label:'사업비', icon:'📋', color:'#7C3AED', prevAmount:4200000, subs:[
      { id:'marketing',   label:'마케팅비', icon:'📣', color:'#EF4444', amount:5400000, count:8 },
    ]},
    { id:'finance', label:'금융', icon:'💰', color:'#F59E0B', prevAmount:2800000, subs:[
      { id:'invest',      label:'투자',    icon:'📈', color:'#0EA5E9', amount:3100000, count:3 },
      { id:'lend',        label:'대여금',  icon:'🤝', color:'#7C3AED', amount:500000,  count:1 },
    ]},
    { id:'tax', label:'세금', icon:'🧾', color:'#EF4444', prevAmount:1100000, subs:[
      { id:'tax',         label:'세금',    icon:'🧾', color:'#EF4444', amount:1200000, count:2 },
    ]},
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// MCC 코드 → 카테고리 자동 매핑
//
// 카드 네트워크(Visa/Mastercard)는 모든 결제에 MCC(Merchant Category Code)를
// 자동으로 부여함. 백엔드는 이 MCC를 받아 아래 테이블로 카테고리 변환 후 내려줌.
//
// 프론트는 tx.mcc 필드가 있으면 MCC_MAP에서 label/icon/color를 조회.
// 없거나 매핑 안 된 MCC는 tx.cat 폴백 → allCatFlat → '기타' 순으로 처리.
//
// MCC 참고: https://www.citibank.com/tts/solutions/commercial-cards/assets/docs/govt/Merchant-Category-Codes.pdf
// ─────────────────────────────────────────────────────────────────────────────
const MCC_MAP = {
  // ── 마트·식료품 ──
  5411: { id:'mart',         label:'마트',        icon:'🛒', color:'#10B981' }, // Grocery Stores, Supermarkets
  5912: { id:'mart',         label:'마트',        icon:'🛒', color:'#10B981' }, // Drug Stores / Pharmacy (올리브영 등)

  // ── 식비 ──
  5812: { id:'food',         label:'식비',        icon:'🍽️', color:'#EF4444' }, // Eating Places, Restaurants
  5814: { id:'food',         label:'식비',        icon:'🍽️', color:'#EF4444' }, // Fast Food Restaurants
  5499: { id:'food',         label:'식비',        icon:'🍽️', color:'#EF4444' }, // Misc. Food Stores

  // ── 편의점 ──
  5331: { id:'convenience',  label:'편의점',      icon:'🏪', color:'#F59E0B' }, // Variety Stores (CU·GS25·7-Eleven 등)

  // ── 카페 (별도 MCC 없음 → 5812 공유. 가맹점명 매칭으로 보완 가능) ──

  // ── 교통 ──
  4111: { id:'transport',    label:'교통',        icon:'🚌', color:'#0EA5E9' }, // Local/Suburban Commuter Transportation
  4121: { id:'transport',    label:'택시',        icon:'🚕', color:'#0EA5E9' }, // Taxicabs & Limousines (카카오T 등)
  4131: { id:'transport',    label:'버스',        icon:'🚌', color:'#0EA5E9' }, // Bus Lines
  5541: { id:'transport',    label:'주유소',      icon:'⛽', color:'#6B7280' }, // Service Stations

  // ── 쇼핑 ──
  5999: { id:'shopping',     label:'쇼핑',        icon:'🛍️', color:'#EC4899' }, // Misc. & Specialty Retail
  5045: { id:'shopping',     label:'쇼핑',        icon:'🛍️', color:'#EC4899' }, // Computers & Peripherals
  5065: { id:'shopping',     label:'쇼핑',        icon:'🛍️', color:'#EC4899' }, // Electrical Parts & Equipment

  // ── 의료·건강 ──
  8099: { id:'health',       label:'의료·건강',   icon:'🏥', color:'#10B981' }, // Health Practitioners
  8011: { id:'health',       label:'의료',        icon:'🏥', color:'#10B981' }, // Doctors & Physicians

  // ── 구독·디지털 ──
  7372: { id:'subscription', label:'구독·SW',     icon:'📱', color:'#7C3AED' }, // Computer Programming (Netflix·Adobe 등)
  4899: { id:'subscription', label:'구독·통신',   icon:'📡', color:'#7C3AED' }, // Cable & Other Pay TV Services

  // ── 주식·투자 ──
  6211: { id:'stock',        label:'주식·증권',   icon:'📊', color:'#2563EB' }, // Security Brokers/Dealers (키움·미래에셋 등)
  6099: { id:'stock',        label:'금융',        icon:'💰', color:'#2563EB' }, // Financial Institutions—Other

  // ── 교육 ──
  8299: { id:'edu',          label:'교육·학원',   icon:'📚', color:'#0EA5E9' }, // Schools & Educational Services
  8211: { id:'edu',          label:'교육',        icon:'📚', color:'#0EA5E9' }, // Elementary & Secondary Schools
  5942: { id:'edu_book',     label:'교재·도서',   icon:'📖', color:'#0891B2' }, // Book Stores

  // ── 부동산·임대 ──
  6512: { id:'monthly_rent', label:'임대·월세',   icon:'🏢', color:'#7C3AED' }, // Real Estate Agents & Managers
  6513: { id:'monthly_rent', label:'임대',        icon:'🏢', color:'#7C3AED' }, // Apartment Buildings & Managers
}

// MCC_MAP에 없는 코드는 '기타' 처리
function catFromMcc(mcc) {
  return (mcc && MCC_MAP[mcc]) || null
}

// ─────────────────────────────────────────────────────────────────────────────
// [헷갈림 주의] 지갑 목록이 userType별로 분리된 이유
//
//   개인과 기업은 보유 지갑 종류가 완전히 다름.
//   개인: 생활비, 용돈, 대여금, 지원금 등 (수취 중심)
//   기업: 지원금, 외주비, 자금지원, 투자 등 (집행 중심)
//
//   PERSONAL_WALLETS / BUSINESS_WALLETS 중
//   실제 사용할 목록은 컴포넌트 내 getWalletsForUser()로 선택됨.
// ─────────────────────────────────────────────────────────────────────────────

// ── 개인 지갑 목록 ──────────────────────────────────────────────────────────
// [주의] gift 타입(용돈·선물)은 상대방 MY 지갑으로 직접 입금 → 새 지갑 생성 없음
//        → mom_gift 항목 없음. 용돈 수취는 MY 지갑 잔액에 합산됨.
const PERSONAL_WALLETS = [
  { id:'my',         label:'MY 지갑',          icon:'💳', color:'#2A7D5E', tag:null,      balance:1932000 },
  { id:'living_dad', label:'아빠 · 생활비',     icon:'🏠', color:'#0E7490', tag:'생활비',  balance:700000  },
  { id:'living_mom', label:'엄마 · 생활비',     icon:'🏠', color:'#0E7490', tag:'생활비',  balance:285000  },
  { id:'iho_lend',   label:'이호준 · 대여금',   icon:'🤝', color:'#6366F1', tag:'대여금',  balance:300000  },
  { id:'edu_p',      label:'강남구 · 교육지원', icon:'📚', color:'#0EA5E9', tag:'지원금',  balance:240000  },
]

// ── 기업 지갑 목록 ──────────────────────────────────────────────────────────
const BUSINESS_WALLETS = [
  { id:'my',       label:'MY 지갑',            icon:'💳', color:'#2A7D5E', tag:null,       balance:8430000 },
  { id:'changwon', label:'창원진흥원 · 지원금', icon:'🏛️', color:'#7C3AED', tag:'지원금',  balance:3300000 },
  { id:'aurora',   label:'㈜오로라 · 계약금',   icon:'🏢', color:'#0EA5E9', tag:'외주비',  balance:500000  },
  { id:'jungca',   label:'정창업 · 자금지원',   icon:'🌱', color:'#10B981', tag:'자금지원', balance:700000  },
  { id:'leeybiz',  label:'이영희 · 투자',       icon:'📈', color:'#8B5CF6', tag:'투자',    balance:2000000 },
]

const WALLET_SPEND = {
  // ── 개인 지갑 집행 ─────────────────────────────────────────────────────────
  // 카테고리 집계: MCC 코드별 거래를 그루핑한 결과.
  // id는 MCC_MAP의 id 값과 일치시켜야 WalletStatsDetail 카테고리 바에 표시됨.
  living_dad: [
    { id:'mart',        label:'마트',   icon:'🛒', color:'#10B981', amount:97000, count:2 },
    { id:'food',        label:'식비',   icon:'🍽️', color:'#EF4444', amount:15500, count:2 },
    { id:'convenience', label:'편의점', icon:'🏪', color:'#F59E0B', amount:8500,  count:1 },
    { id:'transport',   label:'교통',   icon:'🚌', color:'#0EA5E9', amount:11000, count:1 },
  ],
  living_mom: [
    { id:'mart', label:'마트', icon:'🛒', color:'#10B981', amount:107000, count:2 },
    { id:'food', label:'식비', icon:'🍽️', color:'#EF4444', amount:40000,  count:3 },
  ],
  // mom_gift 삭제 — gift 타입은 MY 지갑으로 직접 입금, 별도 지갑 없음 (walletsData.js 참고)
  iho_lend: [
    { id:'lend', label:'대여금', icon:'🤝', color:'#6366F1', amount:300000, count:1 },
  ],
  edu_p: [
    { id:'edu',      label:'교육·학원', icon:'📚', color:'#0EA5E9', amount:230000, count:2 },
    { id:'edu_book', label:'교재·도서', icon:'📖', color:'#0891B2', amount:25000,  count:1 },
  ],
  // ── 기업 지갑 집행 ─────────────────────────────────────────────────────────
  // [주의] id는 반드시 CATEGORY_GROUPS.business 5대 그룹 ID와 일치해야 함
  //        (labor | ops | biz | finance | tax)
  //        WalletStatsDetail에서 displayGroups.find(g => g.id === c.id)로 아이콘/색상 조회하기 때문.
  //        임의 id(equipment, personnel, invest 등) 쓰면 그룹 메타 못 찾아 폴백 처리됨.
  changwon: [
    { id:'labor',   label:'인건비', icon:'👥', color:'#2A7D5E', amount:2100000, count:5 },
    { id:'ops',     label:'운영비', icon:'⚙️', color:'#0EA5E9', amount:2400000, count:8 }, // 기기 구매(장비) 포함
    { id:'biz',     label:'사업비', icon:'📋', color:'#7C3AED', amount:600000,  count:3 },
  ],
  aurora: [
    { id:'ops',   label:'운영비', icon:'⚙️', color:'#0EA5E9', amount:280000, count:4 },
    { id:'labor', label:'인건비', icon:'👥', color:'#2A7D5E', amount:150000, count:2 }, // 외주비 → 인건비 소분류
  ],
  jungca: [
    { id:'finance', label:'금융', icon:'💰', color:'#F59E0B', amount:700000, count:1 },
  ],
  leeybiz: [
    { id:'finance', label:'금융', icon:'💰', color:'#F59E0B', amount:2000000, count:1 },
  ],
}

const WALLET_TXNS = {
  my_business: [
    { id:'t1', cat:'salary',    name:'김철수 5월 급여',   date:'5.25', amount:1350000 },
    { id:'t2', cat:'salary',    name:'이영희 5월 급여',   date:'5.25', amount:1200000 },
    { id:'t3', cat:'salary',    name:'박민준 5월 급여',   date:'5.25', amount:1100000 },
    { id:'t4', cat:'outsource', name:'㈜ABC 파트너스',    date:'5.20', amount:3200000 },
    { id:'t5', cat:'outsource', name:'프리랜서 이호준',   date:'5.15', amount:2100000 },
    { id:'t6', cat:'rent',      name:'강남 빌딩 임대료',  date:'5.10', amount:2900000 },
    { id:'t7', cat:'tax',       name:'부가가치세',        date:'5.25', amount:2100000 },
    { id:'t8', cat:'subscription', name:'AWS 서버비 (자동)', date:'5.1',  amount:408000  },
    { id:'t9', cat:'subscription', name:'Adobe CC (자동)',   date:'5.1',  amount:145200  },
  ],
  // my_personal: mcc 있으면 MCC_MAP으로 자동 분류, 없으면 cat 폴백
  // 카드 결제 = mcc 있음 / 직접 집행(용돈·대여금·외주비·주식매수 등) = mcc 없음
  my_personal: [
    { id:'p0', mcc:5411, cat:'food',         name:'이마트 역삼점',        date:'5.25', amount:38000  },
    { id:'p1', mcc:6512, cat:'monthly_rent', name:'5월 월세 납부',        date:'5.10', amount:300000 },
    { id:'p2', mcc:6512, cat:'management',   name:'관리비',               date:'5.10', amount:62000  },
    { id:'p3',           cat:'allowance',    name:'어머니 용돈',          date:'5.1',  amount:200000 },
    { id:'p4',           cat:'lend_friend',  name:'친구 이호준 빌려주기', date:'5.5',  amount:300000 },
    { id:'p5',           cat:'gift_bday',    name:'동생 생일선물',        date:'5.14', amount:80000  },
    { id:'p6', mcc:6211, cat:'stock',        name:'삼성전자 매수',        date:'5.3',  amount:100000 },
    { id:'p7',           cat:'freelance',    name:'디자인 외주 의뢰',     date:'5.8',  amount:150000 },
    { id:'p8',           cat:'condolence',   name:'결혼식 축의금',        date:'5.18', amount:50000  },
    { id:'p9', mcc:4121, cat:'transport',    name:'카카오T 택시',         date:'5.20', amount:12500  },
    { id:'pa', mcc:5812, cat:'cafe',         name:'스타벅스 강남점',      date:'5.19', amount:8500   },
    { id:'pb', mcc:7372, cat:'subscription', name:'넷플릭스 정기결제',    date:'5.1',  amount:17000  },
    { id:'pc', mcc:5912, cat:'shopping',     name:'올리브영 강남점',      date:'5.12', amount:34000  },
  ],
  // 아빠 생활비 — 일상 카드 소비 (MCC 기반 자동 분류)
  living_dad: [
    { id:'d1', mcc:5411, name:'홈플러스 창동점', date:'5.22', amount:52000 },
    { id:'d2', mcc:5331, name:'CU 편의점',       date:'5.20', amount:8500  },
    { id:'d3', mcc:5812, name:'순대국밥집',      date:'5.18', amount:9000  },
    { id:'d4', mcc:5411, name:'이마트 창동점',   date:'5.14', amount:45000 },
    { id:'d5', mcc:4121, name:'택시비',          date:'5.12', amount:11000 },
    { id:'d6', mcc:5812, name:'김밥천국',        date:'5.8',  amount:6500  },
  ],
  // 엄마 생활비 — 일상 카드 소비 (MCC 기반 자동 분류)
  living_mom: [
    { id:'m1', mcc:5411, name:'롯데마트 은평점', date:'5.23', amount:64000 },
    { id:'m2', mcc:5812, name:'설렁탕집',        date:'5.21', amount:12000 },
    { id:'m3', mcc:5411, name:'마켓컬리 배송',   date:'5.15', amount:43000 },
    { id:'m4', mcc:5814, name:'맥도날드',        date:'5.10', amount:9500  },
    { id:'m5', mcc:5812, name:'반찬가게',        date:'5.7',  amount:18500 },
  ],
  // 이호준 대여금 — 직접 집행 (카드 아님, MCC 없음)
  iho_lend: [
    { id:'il1', cat:'lend', name:'이호준 대여금 집행', date:'5.5', amount:300000 },
  ],
  // 강남구 교육지원 — 학원비 카드 결제 (MCC 기반 자동 분류)
  edu_p: [
    { id:'e1', mcc:8299, name:'강남 수학학원비',       date:'5.5',  amount:150000 },
    { id:'e2', mcc:8299, name:'영어학원비',            date:'5.8',  amount:80000  },
    { id:'e3', mcc:5942, name:'교재 구입 (yes24)',     date:'5.12', amount:25000  },
  ],
  my_public: [
    { id:'q1', cat:'personnel', name:'3월 인건비 지급', date:'5.25', amount:8200000 },
    { id:'q2', cat:'project',   name:'홍보물 제작',     date:'5.15', amount:1200000 },
    { id:'q3', cat:'subsidy',   name:'소상공인 지원',   date:'5.10', amount:3100000 },
    { id:'q4', cat:'admin',     name:'소모품 구매',     date:'5.8',  amount:230000  },
  ],
  changwon: [
    { id:'c1', cat:'labor', name:'인턴 2명 인건비',      date:'5.25', amount:2100000 },
    { id:'c2', cat:'ops',   name:'노트북 구매',           date:'5.10', amount:1400000 },
    { id:'c3', cat:'ops',   name:'사무용품',              date:'5.8',  amount:320000  },
    { id:'c4', cat:'ops',   name:'복합기 임대',           date:'5.5',  amount:680000  },
    { id:'c5', cat:'biz',   name:'SNS 광고비',            date:'5.20', amount:400000  },
    { id:'c6', cat:'biz',   name:'브로셔 인쇄',          date:'5.15', amount:200000  },
  ],
  aurora: [
    { id:'a1', cat:'ops',   name:'AWS 클라우드',          date:'5.20', amount:180000 },
    { id:'a2', cat:'ops',   name:'소프트웨어 라이선스',   date:'5.15', amount:65000  },
    { id:'a3', cat:'ops',   name:'사무용품 구매',         date:'5.10', amount:35000  },
    { id:'a4', cat:'labor', name:'㈜오로라 외주 정산',    date:'5.5',  amount:150000 },
  ],
  jungca: [
    { id:'j1', cat:'finance', name:'정창업 자금지원 1차', date:'5.15', amount:700000 },
  ],
  leeybiz: [
    { id:'l1', cat:'finance', name:'이영희 투자 집행',    date:'5.10', amount:2000000 },
  ],
}


const PERIODS      = ['이번달','3개월','6개월','1년']
const PERIOD_MULTI = { '이번달':1, '3개월':3, '6개월':6, '1년':12 }

// 기간별 비교 라벨 — 배지/문장에 사용
// '전월 대비' 고정 대신 기간에 맞게 변환
const PERIOD_COMPARE = {
  '이번달': { long:'전월 대비',  short:'전월'  },
  '3개월':  { long:'전분기 대비', short:'전분기' },
  '6개월':  { long:'전반기 대비', short:'전반기' },
  '1년':    { long:'전년 대비',  short:'전년'  },
}

// ─── 유틸 ────────────────────────────────
function fmt(n)  { return Number(n).toLocaleString('ko-KR') }
function fmtM(n) {
  if (n >= 100000000) {
    const v = n / 100000000
    return v % 1 === 0 ? `${v.toFixed(0)}억` : `${v.toFixed(1)}억`
  }
  if (n >= 10000) return `${Math.floor(n/10000)}만`
  return fmt(n)
}

function diffInfo(current, prev) {
  if (!prev || prev === 0) return null
  const diff = current - prev
  const pct  = Math.round(Math.abs(diff) / prev * 100)
  const isUp = diff > 0
  return { diff, pct, isUp,
    color: isUp ? '#EF4444' : '#10B981',
    bg:    isUp ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
    arrow: isUp ? '↑' : '↓',
  }
}

// ─────────────────────────────────────────────────────────
// 권한 자금 상세 화면 — 상단 앰버 / 하단 다크
// ─────────────────────────────────────────────────────────
function AuthFundsDetail({ onBack }) {
  const navigate    = useNavigate()
  const totalAuth   = AUTHORITY_FUNDS.reduce((s,a)=>s+a.amount,0)
  const totalReturn = AUTHORITY_FUNDS.reduce((s,a)=>s+a.returned,0)
  const remain      = totalAuth - totalReturn

  // 다크 팔레트
  const DK = {
    bg:       '#0D1017',
    card:     '#161B25',
    cardBorder:'rgba(212,163,68,0.18)',
    t1:       '#F2F2F2',
    t2:       'rgba(242,242,242,0.65)',
    t3:       'rgba(242,242,242,0.38)',
    gold:     '#F4C542',
    goldDim:  'rgba(244,197,66,0.15)',
    green:    '#34D399',
    greenDim: 'rgba(52,211,153,0.18)',
    purple:   '#A78BFA',
    purpleDim:'rgba(167,139,250,0.18)',
    blue:     '#60A5FA',
    blueDim:  'rgba(96,165,250,0.18)',
  }

  const statusStyle = {
    '진행중': { color: DK.blue,   bg: DK.blueDim   },
    '상환중':  { color: DK.purple, bg: DK.purpleDim },
    '완료':   { color: DK.green,  bg: DK.greenDim  },
  }

  return (
    <div style={{ flex:1, overflowY:'auto', background: DK.bg }}>

      {/* ── 상단 헤더 — 기존 레이아웃 유지 ── */}
      <div style={{ background:'linear-gradient(135deg,#92400E 0%,#B45309 50%,#D97706 100%)', padding:'20px 0 28px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-30px', left:'20px', width:'100px', height:'100px', borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
        <div style={{ display:'flex', alignItems:'center', padding:'4px 16px 16px', gap:'8px', position:'relative' }}>
          <button onClick={onBack} style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize:'17px', fontWeight:700, color:'#fff', flex:1 }}>🔐 권한 자금</span>
        </div>
        <div style={{ padding:'0 20px', position:'relative' }}>
          <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)', marginBottom:'12px' }}>내가 집행했지만 권한 보유 중 · {AUTHORITY_FUNDS.length}건</div>
          <div style={{ display:'flex', gap:'16px', alignItems:'flex-start', marginBottom:'4px' }}>
            <div style={{ flex:'0 0 auto' }}>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)', marginBottom:'2px' }}>총 집행</div>
              <div style={{ fontSize:'18px', fontWeight:700, color:'rgba(255,255,255,0.8)', letterSpacing:'-0.5px' }}>{fmtM(totalAuth)}원</div>
            </div>
            <div style={{ width:'1px', background:'rgba(255,255,255,0.2)', alignSelf:'stretch' }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)', marginBottom:'2px' }}>현재 잔액</div>
              <div style={{ fontSize:'26px', fontWeight:800, color:'#FEF3C7', letterSpacing:'-1px', lineHeight:1 }}>{fmtM(remain)}원</div>
            </div>
          </div>
          {totalReturn > 0 && (
            <div style={{ fontSize:'11px', color:'#FCD34D', fontWeight:600, marginTop:'6px' }}>↙ 소비 완료 {fmtM(totalReturn)}원</div>
          )}
        </div>
      </div>

      {/* ── 헤더 → 다크 전환 ── */}
      <div style={{ height:'18px', background:'linear-gradient(to bottom, #B45309, #0D1017)' }} />

      {/* ── 하단 다크 리스트 ── */}
      <div style={{ padding:'4px 16px 40px', display:'flex', flexDirection:'column', gap:'12px' }}>

        {/* 섹션 타이틀 */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'2px' }}>
          <div style={{ flex:1, height:'1px', background:'rgba(244,197,66,0.2)' }} />
          <span style={{ fontSize:'10px', fontWeight:700, color:DK.gold, letterSpacing:'1.5px' }}>ACTIVE FUNDS</span>
          <div style={{ flex:1, height:'1px', background:'rgba(244,197,66,0.2)' }} />
        </div>

        {AUTHORITY_FUNDS.map(item => {
          const itemRemain = item.amount - item.returned
          const ss         = statusStyle[item.status] || statusStyle['진행중']

          // 타입별 하단 라벨·게이지 분기
          const isLoan    = item.type === '대여금'
          const isSupport = item.type === '자금지원'
          const isInvest  = item.type === '투자'

          const remainLabel = isLoan    ? '남은 상환 금액'
                            : isSupport ? '남은 지원 자금'
                            : '운영 중 자금'

          // 대여금: 상환 진행률 게이지 / 투자·지원: 운영 비율 게이지
          const gaugeLabel   = isLoan ? '상환 진행률' : isSupport ? '지원 집행률' : '운영 현황'
          const gaugePct     = item.amount > 0 ? Math.round(item.returned / item.amount * 100) : 0
          const gaugeColor   = isLoan ? `linear-gradient(90deg,#34D399,#6EE7B7)` : isSupport ? `linear-gradient(90deg,#60A5FA,#93C5FD)` : `linear-gradient(90deg,#F4C542,#FDE68A)`
          const glowColor    = isLoan ? 'rgba(52,211,153,0.55)' : isSupport ? 'rgba(96,165,250,0.5)' : 'rgba(244,197,66,0.5)'
          const gaugeLeftLbl = isLoan    ? `상환 완료 ${fmtM(item.returned)}원`
                             : isSupport ? `집행 ${fmtM(item.returned)}원`
                             : `소비 완료 ${fmtM(item.returned)}원`
          const gaugeRightLbl = `총 ${fmtM(item.amount)}원`

          return (
            <button key={item.id}
              onClick={() => navigate('/control-center/recipient/aurora', { state: { from: 'stats-auth' } })}
              style={{
                width:'100%', border:`1px solid ${DK.cardBorder}`,
                background: DK.card,
                boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
                borderRadius:'18px', cursor:'pointer', fontFamily:'inherit',
                textAlign:'left', padding:'16px 16px 14px',
                position:'relative', overflow:'hidden',
              }}>

              {/* 카드 내 빛 효과 */}
              <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'100px', height:'100px', borderRadius:'50%', background:`radial-gradient(circle, ${item.color}22 0%, transparent 70%)`, pointerEvents:'none' }} />

              {/* 상단 행: 아이콘 + 이름 + 상태 + 잔액 */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', marginBottom:'12px' }}>
                <div style={{ width:'46px', height:'46px', borderRadius:'14px', background:`${item.color}22`, border:`1px solid ${item.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                  {item.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap', marginBottom:'4px' }}>
                    <span style={{ fontSize:'14px', fontWeight:800, color:DK.t1, letterSpacing:'-0.3px' }}>{item.name}</span>
                    <span style={{ padding:'2px 7px', background:`${item.color}22`, color:item.color, borderRadius:'6px', fontSize:'9px', fontWeight:700 }}>{item.type}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ padding:'2px 8px', background:ss.bg, color:ss.color, borderRadius:'6px', fontSize:'9px', fontWeight:700 }}>{item.status}</span>
                    <span style={{ fontSize:'10px', color:DK.t3 }}>{item.desc} · {item.date}</span>
                  </div>
                </div>
                {/* 타입별 잔액 라벨 */}
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:'9px', color:DK.t3, marginBottom:'3px' }}>{remainLabel}</div>
                  <div style={{ fontSize:'17px', fontWeight:900, color:DK.gold, letterSpacing:'-0.5px' }}>{fmtM(itemRemain)}원</div>
                </div>
              </div>

              {/* 구분선 */}
              <div style={{ height:'1px', background:'rgba(255,255,255,0.07)', marginBottom:'12px' }} />

              {/* 타입별 하단 게이지 */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                  <span style={{ fontSize:'10px', color:DK.t3 }}>{gaugeLabel}</span>
                  <span style={{ fontSize:'10px', fontWeight:700, color: gaugePct > 0 ? DK.green : DK.t3 }}>{gaugePct}%</span>
                </div>
                <div style={{ height:'5px', background:'rgba(255,255,255,0.08)', borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${gaugePct}%`, background:gaugeColor, borderRadius:'3px', boxShadow:`0 0 8px ${glowColor}`, transition:'width .4s ease' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                  <span style={{ fontSize:'9px', color:DK.t2 }}>{gaugeLeftLbl}</span>
                  <span style={{ fontSize:'9px', color:DK.t3 }}>{gaugeRightLbl}</span>
                </div>
              </div>
            </button>
          )
        })}

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 카테고리 그룹 상세 화면 (인건비 / 운영비 / 사업비 / 금융 / 세금)
// ─────────────────────────────────────────────────────────
function CategoryGroupDetail({ group, multi, txns, onBack, theme, initialPeriod }) {
  const [subFilter,       setSubFilter]       = useState('전체')
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [localPeriod,     setLocalPeriod]     = useState(initialPeriod || '이번달')

  const hasFilter  = true
  const localMulti = PERIOD_MULTI[localPeriod]
  const groupTotal = group.subs.reduce((s, sub) => s + sub.amount * localMulti, 0)

  const groupTxns    = txns.filter(t => group.subs.some(s => s.id === t.cat))
  const filteredTxns = subFilter === '전체'
    ? groupTxns
    : groupTxns.filter(t => t.cat === group.subs.find(s => s.label === subFilter)?.id)

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
      {/* 헤더 */}
      <div style={{ background: theme.headerGrad, paddingTop:'20px', flexShrink:0 }}>
        {/* 네비 */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 12px' }}>
          <button onClick={onBack}
            style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize:'15px', fontWeight:600, color:'#fff', flex:1 }}>{group.icon} {group.label}</span>
        </div>
        {/* 합계 */}
        <div style={{ padding:'4px 20px 20px' }}>
          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)', marginBottom:'6px', letterSpacing:'0.2px' }}>
            {localPeriod} {group.label} 합계
          </div>
          <div style={{ fontSize:'30px', fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1 }}>
            {fmt(groupTotal)}<span style={{ fontSize:'14px', fontWeight:600, opacity:0.65, marginLeft:'3px' }}>원</span>
          </div>
        </div>
        {/* 기간 선택 */}
        <div style={{ display:'flex', gap:'6px', padding:'0 16px 20px' }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setLocalPeriod(p)}
              style={{ flex:1, padding:'7px 0', background: p===localPeriod ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'20px', color: p===localPeriod ? theme.brandDark : '#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 건수 + 필터 바 */}
      {(() => {
        const filteredTotal = filteredTxns.reduce((s, t) => s + (t.amount || 0), 0)
        return (
      <div style={{ flexShrink:0, margin:'14px 16px 0', background:COLORS.bgCard, borderRadius:'14px', padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:SHADOWS.card, border:`1px solid ${COLORS.borderSoft}` }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
          {subFilter !== '전체' && filteredTotal > 0 && (
            <div style={{ display:'flex', alignItems:'baseline', gap:'2px' }}>
              <span style={{ fontSize:'16px', fontWeight:800, color:COLORS.t1, letterSpacing:'-0.5px' }}>{fmtM(filteredTotal)}</span>
              <span style={{ fontSize:'11px', fontWeight:500, color:COLORS.t3 }}>원</span>
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
            <span style={{ fontSize: subFilter !== '전체' ? '13px' : '20px', fontWeight:800, color: subFilter !== '전체' ? COLORS.t3 : COLORS.t1, letterSpacing:'-0.5px' }}>{filteredTxns.length}</span>
            <span style={{ fontSize:'12px', fontWeight:500, color:COLORS.t3 }}>건</span>
            {subFilter !== '전체' && (
              <span style={{ fontSize:'11px', color:theme.brandDark, fontWeight:700, background:`${theme.brandDark}12`, padding:'2px 7px', borderRadius:'6px', marginLeft:'2px' }}>{subFilter}</span>
            )}
          </div>
        </div>
        {hasFilter && (
          <button onClick={() => setShowFilterSheet(true)}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 13px', borderRadius:'20px', background: subFilter !== '전체' ? theme.brandDark : COLORS.bgMuted, border:'none', cursor:'pointer', fontFamily:'inherit', outline:'none', boxShadow: subFilter !== '전체' ? `0 2px 10px ${theme.brandDark}40` : 'none', transition:'all 0.15s' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={subFilter !== '전체' ? '#fff' : COLORS.t3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            <span style={{ fontSize:'12px', fontWeight:700, color: subFilter !== '전체' ? '#fff' : COLORS.t3 }}>
              {subFilter === '전체' ? '필터' : subFilter}
            </span>
            {subFilter !== '전체' && (
              <span onClick={e => { e.stopPropagation(); setSubFilter('전체') }}
                style={{ fontSize:'12px', color:'rgba(255,255,255,0.75)', fontWeight:700, marginLeft:'1px' }}>✕</span>
            )}
          </button>
        )}
      </div>
        )
      })()}

      {/* 거래 리스트 */}
      <div style={{ flex:1, overflowY:'auto', background: COLORS.bg, padding:'12px 16px 32px' }}>
        {filteredTxns.length > 0 ? (
          <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, overflow:'hidden' }}>
            {filteredTxns.map((tx, i, arr) => {
              const sub = group.subs.find(s => s.id === tx.cat)
              return (
                <div key={tx.id}
                  style={{ padding:'14px 16px', borderBottom:i<arr.length-1?`1px solid ${COLORS.borderSoft}`:'none', display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${sub?.color||COLORS.t5}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
                    {sub?.icon || '💳'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1, marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.name}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                      <span style={{ fontSize:'10px', color: sub?.color||COLORS.t4, fontWeight:600, background:`${sub?.color||COLORS.t4}14`, padding:'1px 6px', borderRadius:'4px' }}>{sub?.label}</span>
                      <span style={{ fontSize:'10px', color:COLORS.t4 }}>{tx.date}</span>
                    </div>
                  </div>
                  <span style={{ fontSize:'14px', fontWeight:800, color:COLORS.t1, flexShrink:0 }}>{fmt(tx.amount)}원</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'48px 0', color:COLORS.t4, fontSize:'13px' }}>
            <div style={{ fontSize:'32px', marginBottom:'10px' }}>📭</div>
            거래 내역이 없습니다
            {subFilter !== '전체' && (
              <button onClick={() => setSubFilter('전체')}
                style={{ display:'block', margin:'10px auto 0', padding:'8px 18px', borderRadius:'20px', background:COLORS.bgMuted, border:'none', outline:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'12px', fontWeight:600, color:COLORS.t3 }}>
                필터 초기화
              </button>
            )}
          </div>
        )}
      </div>

      {/* 필터 바텀시트 */}
      {showFilterSheet && (
        <div onClick={() => setShowFilterSheet(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', flexDirection:'column', justifyContent:'flex-end', zIndex:900 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:'20px 16px 36px' }}>
            <div style={{ width:'36px', height:'4px', background:'#E5E7EB', borderRadius:'2px', margin:'0 auto 16px' }}/>
            <div style={{ fontSize:'14px', fontWeight:700, color:COLORS.t1, marginBottom:'14px' }}>카테고리 필터</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {['전체', ...group.subs.map(s => s.label)].map((opt, i, arr) => {
                const isSelected = subFilter === opt
                const isLast = i === arr.length - 1 && arr.length % 2 !== 0
                return (
                  <button key={opt} onClick={() => { setSubFilter(opt); setShowFilterSheet(false) }}
                    style={{ gridColumn: isLast ? 'span 2' : undefined, padding:'12px', borderRadius:'12px', cursor:'pointer', fontFamily:'inherit', fontSize:'13px', fontWeight:600, border:'none', outline:'none', textAlign:'center', background: isSelected ? theme.brandDark : COLORS.bgMuted, color: isSelected ? '#fff' : COLORS.t2, boxShadow: isSelected ? `0 2px 8px ${theme.brandDark}40` : 'none', transition:'all 0.15s' }}>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 거래 상세
// ─────────────────────────────────────────────────────────
function TxnDetail({ txn, catLabel, catColor, onBack, theme }) {
  return (
    <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>
      <div style={{ background: theme.headerGrad, padding:'20px 0 28px' }}>
        <div style={{ display:'flex', alignItems:'center', padding:'4px 16px 18px', gap:'8px' }}>
          <button onClick={onBack} style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize:'15px', fontWeight:700, color:'#fff', flex:1 }}>{txn.name}</span>
        </div>
        <div style={{ padding:'0 20px' }}>
          <div style={{ fontSize:'32px', fontWeight:800, color:'#fff', letterSpacing:'-1px' }}>
            {txn.status === 'blocked' ? '차단됨' : `${txn.amount}원`}
          </div>
          <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.65)', marginTop:'6px' }}>{txn.meta||txn.date} · {catLabel}</div>
        </div>
      </div>
      <div style={{ padding:'18px 16px' }}>
        <div style={{ background: COLORS.bgCard, boxShadow: SHADOWS.card, borderRadius: RADIUS.lg, overflow:'hidden' }}>
          {[
            { label:'카테고리', value: catLabel },
            { label:'날짜',     value: txn.meta||txn.date },
            { label:'금액',     value: txn.status==='blocked'?'차단됨':`${fmt(txn.amount)}원` },
            { label:'상태',     value: txn.status==='blocked'?'🚫 MCC 차단':'✅ 정상 처리' },
          ].map((row,i,arr)=>(
            <div key={row.label} style={{ padding:'13px 16px', borderBottom:i<arr.length-1?`1px solid ${COLORS.borderSoft}`:'none', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:'12px', color:COLORS.t4 }}>{row.label}</span>
              <span style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 지갑별 집행 통계 서브화면
//
// props:
//   wallet        — walletWithStats 항목 (id, label, icon, color, tag, balance, execTotal)
//   userType      — 'personal' | 'business' | 'public'
//   displayGroups — CATEGORY_GROUPS[userType] (MY 지갑 카테고리용)
//   groupTxns     — MY 지갑 거래 내역 (WALLET_TXNS[my_${userType}])
//   onBack        — 뒤로 가기 핸들러
//   theme         — getAccountTheme()
//
// [헷갈림 주의] MY 지갑 vs 그 외 지갑 데이터 출처 분리
//   MY 지갑:   displayGroups → 5대 카테고리 그룹 + groupTxns 거래 내역
//   그 외 지갑: WALLET_SPEND[wallet.id] → 플랫 카테고리 + WALLET_TXNS[wallet.id]
// ─────────────────────────────────────────────────────────────────────────────
function WalletStatsDetail({ wallet, userType, displayGroups, groupTxns, onBack, theme }) {
  const [localPeriod, setLocalPeriod] = useState('이번달')
  const localMulti = PERIOD_MULTI[localPeriod]
  const isMyWallet = wallet.id === 'my'

  // ─────────────────────────────────────────────────────────────────────
  // [헷갈림 주의] 카테고리 계산 분기
  //
  //   isPersonal (userType === 'personal') — 개인 지갑 전체 (MY 지갑 포함)
  //     → 카테고리 바/목록 없음. 실시간 결제 화면 형식으로 거래 목록만 표시.
  //       MCC 자동 분류 뱃지만 표시. CardPayment 스타일.
  //
  //   !isPersonal + isMyWallet (기업/공공 MY 지갑)
  //     → displayGroups(5대 그룹) 기반 집계 + 카테고리 바.
  //
  //   !isPersonal + !isMyWallet (기업/공공 수신 지갑)
  //     → WALLET_SPEND[wallet.id] 기반 (id = 5대 그룹 id 일치).
  //       displayGroups에서 아이콘·색상 조회.
  // ─────────────────────────────────────────────────────────────────────
  const isPersonal = userType === 'personal'
  const isBizType  = userType === 'business' || userType === 'public'

  const categories = isPersonal
    ? []  // 개인 전체 → 카테고리 없음, 거래 목록으로만 표시
    : isMyWallet
      ? displayGroups.map(g => ({
          id:          g.id,
          label:       g.label,
          icon:        g.icon,
          color:       g.color,
          amount:      g.subs.reduce((s, sub) => s + sub.amount * localMulti, 0),
          count:       g.subs.reduce((s, sub) => s + (sub.count || 0), 0),
          prevAmount:  (g.prevAmount || 0) * localMulti,
        }))
      : (WALLET_SPEND[wallet.id] || []).map(c => {
          // 기업/공공: WALLET_SPEND id = 5대 그룹 id → displayGroups에서 메타 조회
          const group = isBizType ? displayGroups.find(g => g.id === c.id) : null
          return {
            id:         c.id,
            label:      group?.label || c.label,
            icon:       group?.icon  || c.icon,
            color:      group?.color || c.color,
            amount:     c.amount * localMulti,
            count:      c.count,
            prevAmount: 0,
          }
        })

  // ── 이 지갑의 거래 내역
  // 개인 MY 지갑: groupTxns(WALLET_TXNS.my_personal), 그 외: WALLET_TXNS[wallet.id]
  const txns = isMyWallet ? groupTxns : (WALLET_TXNS[wallet.id] || [])

  // ── 집행 합계 + 전월 비교
  const execTotal = isPersonal
    ? txns.reduce((s, t) => s + (t.amount || 0), 0)
    : categories.reduce((s, c) => s + c.amount, 0)
  const prevTotal = isMyWallet && !isPersonal
    ? displayGroups.reduce((s, g) => s + (g.prevAmount || 0) * localMulti, 0)
    : 0
  const diff = diffInfo(execTotal, prevTotal)

  // 카테고리별 아이콘/색상 조회 (거래 내역 렌더 시 cat 폴백용)
  // 개인 MY: CATEGORY_GROUPS.personal 전체 subs / 개인 비MY: WALLET_SPEND 항목
  const allCatFlat = isMyWallet
    ? displayGroups.flatMap(g => g.subs)
    : (WALLET_SPEND[wallet.id] || [])

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column' }}>

      {/* ── 헤더 ── */}
      <div style={{ background: theme.headerGrad, paddingTop:'20px', flexShrink:0 }}>
        {/* 네비 + 지갑 정보 */}
        <div style={{ display:'flex', alignItems:'center', padding:'4px 16px 12px', gap:'8px' }}>
          <button onClick={onBack}
            style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'15px', fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{wallet.label}</div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)' }}>집행 통계</div>
          </div>
          {wallet.tag && (
            <span style={{ padding:'3px 8px', background:'rgba(255,255,255,0.2)', borderRadius:'10px', fontSize:'10px', fontWeight:700, color:'#fff', flexShrink:0 }}>{wallet.tag}</span>
          )}
        </div>

        {/* 집행액 + 전월 비교 */}
        <div style={{ padding:'4px 20px 16px' }}>
          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)', marginBottom:'4px' }}>{localPeriod} 집행액</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'8px', marginBottom:'5px' }}>
            <div style={{ fontSize:'30px', fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1 }}>{fmt(execTotal)}원</div>
            {diff && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:'3px', background:'rgba(0,0,0,0.28)', borderRadius:'6px', padding:'3px 8px', marginBottom:'3px' }}>
                <span style={{ fontSize:'11px', fontWeight:700, color:'#fff' }}>{diff.arrow} {diff.pct}%</span>
                <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)' }}>{PERIOD_COMPARE[localPeriod]?.short}</span>
              </div>
            )}
          </div>
          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>잔액 {fmtM(wallet.balance)}원</div>
        </div>

        {/* 기간 선택 */}
        <div style={{ display:'flex', gap:'6px', padding:'0 16px 20px' }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setLocalPeriod(p)}
              style={{ flex:1, padding:'7px 0', background: p===localPeriod?'rgba(255,255,255,0.95)':'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'20px', color: p===localPeriod?theme.brandDark:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── 본문 ── */}
      <div style={{ flex:1, overflowY:'auto', background: COLORS.bg, padding:'16px 16px 40px', display:'flex', flexDirection:'column', gap:'12px' }}>

        {/* ── 개인 전체 지갑: 실시간 결제 화면 형식 (MY 지갑 + 생활비·대여금·교육지원 모두) ── */}
        {isPersonal && (
          <div>
            <div style={{ fontSize:'12px', fontWeight:700, color:COLORS.t3, letterSpacing:'0.3px', marginBottom:'10px' }}>결제 내역</div>
            {txns.length > 0 ? (
              <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, boxShadow: SHADOWS.card, overflow:'hidden' }}>
                {txns.map((tx, i, arr) => {
                  // mcc 있으면 MCC_MAP 우선 → tx.cat 폴백 → allCatFlat 폴백
                  const cat = catFromMcc(tx.mcc) || allCatFlat.find(c => c.id === tx.cat)
                  const isBlocked = tx.status === 'blocked'
                  return (
                    <div key={tx.id}
                      style={{ padding:'14px 16px', borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', gap:'12px', background: isBlocked ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                      <div style={{ width:'38px', height:'38px', borderRadius:'12px', background: isBlocked ? 'rgba(239,68,68,0.12)' : `${cat?.color || COLORS.t5}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
                        {isBlocked ? '🚫' : (cat?.icon || '💳')}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'13px', fontWeight:600, color: isBlocked ? '#EF4444' : COLORS.t1, marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.name}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                          {cat && (
                            <span style={{ fontSize:'10px', color: isBlocked ? '#EF4444' : (cat.color || COLORS.t4), fontWeight:600, background: isBlocked ? 'rgba(239,68,68,0.1)' : `${cat.color || COLORS.t4}14`, padding:'1px 6px', borderRadius:'4px' }}>
                              {isBlocked ? 'MCC 차단' : cat.label}
                            </span>
                          )}
                          <span style={{ fontSize:'10px', color:COLORS.t4 }}>{tx.date}</span>
                        </div>
                      </div>
                      <span style={{ fontSize:'14px', fontWeight:800, color: isBlocked ? '#EF4444' : COLORS.t1, flexShrink:0 }}>
                        {isBlocked ? '차단' : `-${fmt(tx.amount)}원`}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'48px 0', color:COLORS.t4, fontSize:'13px' }}>
                <div style={{ fontSize:'32px', marginBottom:'10px' }}>📭</div>결제 내역이 없습니다
              </div>
            )}
          </div>
        )}

        {/* ── 기업/공공 MY 지갑 + 비MY 지갑: 카테고리 비중 바 ── */}
        {!isPersonal && categories.length > 1 && execTotal > 0 && (
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding:'14px 16px', boxShadow: SHADOWS.card }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:COLORS.t4, marginBottom:'8px' }}>
              <span>카테고리 비중</span>
              <span style={{ fontWeight:600, color: wallet.color }}>{fmtM(execTotal)}원</span>
            </div>
            <div style={{ height:'8px', borderRadius:'4px', overflow:'hidden', display:'flex', gap:'1px', marginBottom:'10px' }}>
              {categories.map(c => {
                const pct = Math.round(c.amount / execTotal * 100)
                return <div key={c.id} style={{ flex: pct, background: c.color, minWidth: pct < 3 ? '4px' : 0 }} />
              })}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {categories.map(c => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                  <div style={{ width:'7px', height:'7px', borderRadius:'2px', background:c.color }} />
                  <span style={{ fontSize:'10px', color:COLORS.t4 }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 기업/공공 MY 지갑 + 비MY 지갑: 카테고리별 집행 목록 ── */}
        {!isPersonal && categories.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:COLORS.t3, letterSpacing:'0.3px' }}>카테고리별 집행</div>
            {categories.map(c => {
              const pct = execTotal > 0 ? Math.round(c.amount / execTotal * 100) : 0
              const d   = c.prevAmount > 0 ? diffInfo(c.amount, c.prevAmount) : null
              return (
                <div key={c.id} style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding:'14px 16px', boxShadow: SHADOWS.card }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:`${c.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
                      {c.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                        <span style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1 }}>{c.label}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          {d && (
                            <span style={{ fontSize:'10px', fontWeight:700, color:d.color, background:d.bg, padding:'2px 6px', borderRadius:'5px' }}>{d.arrow} {d.pct}% {PERIOD_COMPARE[localPeriod]?.short}</span>
                          )}
                          <span style={{ fontSize:'14px', fontWeight:800, color:COLORS.t1 }}>{fmtM(c.amount)}원</span>
                        </div>
                      </div>
                      <div style={{ height:'4px', background:COLORS.bgMuted, borderRadius:'2px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:c.color, borderRadius:'2px' }} />
                      </div>
                      <div style={{ marginTop:'4px', fontSize:'10px', color:COLORS.t4 }}>
                        {pct}% {c.count ? `· ${c.count}건` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── 기업/공공 거래 내역 (카테고리 뷰 하단) ── */}
        {!isPersonal && txns.length > 0 && (
          <div>
            <div style={{ fontSize:'12px', fontWeight:700, color:COLORS.t3, letterSpacing:'0.3px', marginBottom:'10px' }}>거래 내역</div>
            <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, boxShadow: SHADOWS.card, overflow:'hidden' }}>
              {txns.map((tx, i, arr) => {
                // mcc 있으면 MCC_MAP 우선 → allCatFlat(WALLET_SPEND id) 폴백 → 기타
                const cat = catFromMcc(tx.mcc)
                  || allCatFlat.find(c => c.id === tx.cat)
                  || { label:'기타', icon:'📦', color:COLORS.t4 }
                return (
                  <div key={tx.id}
                    style={{ padding:'13px 16px', borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:`${cat?.color || COLORS.t5}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
                      {cat?.icon || '💳'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1, marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.name}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                        <span style={{ fontSize:'10px', color: cat?.color || COLORS.t4, fontWeight:600, background:`${cat?.color || COLORS.t4}14`, padding:'1px 6px', borderRadius:'4px' }}>
                          {cat?.label || '기타'}
                        </span>
                        <span style={{ fontSize:'10px', color:COLORS.t4 }}>{tx.date}</span>
                      </div>
                    </div>
                    <span style={{ fontSize:'14px', fontWeight:800, color:COLORS.t1, flexShrink:0 }}>{fmt(tx.amount)}원</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 데이터 없음 */}
        {categories.length === 0 && txns.length === 0 && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'12px', color:COLORS.t4, padding:'60px 20px' }}>
            <div style={{ fontSize:'40px' }}>📭</div>
            <div style={{ fontSize:'14px', fontWeight:700, color:COLORS.t2 }}>집행 내역 없음</div>
            <div style={{ fontSize:'12px', textAlign:'center', lineHeight:1.6 }}>이 지갑에서 집행된 내역이 없어요</div>
          </div>
        )}

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────
export default function ExecutionStats() {
  const theme    = getAccountTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const userType = getUserType()

  const [period, setPeriod] = useState('이번달')

  // ── detail: React Router location.state 기반 서브뷰 관리
  //    navigate('/stats', { state: { _detail: {...} } }) 로 진입
  //    백버튼(navigate(-1))으로 복귀 → 원본 /stats 엔트리 보존
  const detail = location.state?._detail ?? null
  const enterDetail = (detailObj) => {
    navigate('/stats', { state: { _detail: detailObj }, replace: false })
  }

  const multi = PERIOD_MULTI[period]

  // 항상 userType 기준 카테고리 그룹 사용 (지갑 선택 없음)
  const displayGroups = CATEGORY_GROUPS[userType] || CATEGORY_GROUPS.business
  // CategoryGroupDetail 서브화면에 넘길 거래 내역 (MY 지갑 기준)
  const groupTxns = WALLET_TXNS[`my_${userType}`] || WALLET_TXNS['my_business'] || []

  // userType에 따라 지갑 목록 선택
  // business/public → 기업 지갑, personal → 개인 지갑
  const wallets = (userType === 'business' || userType === 'public')
    ? BUSINESS_WALLETS
    : PERSONAL_WALLETS

  // ── 지갑별 이번 달 집행 합계 계산
  //    MY 지갑: displayGroups 합산 / 그 외: WALLET_SPEND 합산
  const walletWithStats = wallets.map(w => {
    if (w.id === 'my') {
      const execTotal = displayGroups.reduce(
        (s, g) => s + g.subs.reduce((ss, sub) => ss + sub.amount * multi, 0), 0
      )
      return { ...w, execTotal }
    }
    const items = WALLET_SPEND[w.id] || []
    return { ...w, execTotal: items.reduce((s, c) => s + c.amount * multi, 0) }
  })

  // 전체 합산
  const grandExec    = walletWithStats.reduce((s, w) => s + w.execTotal, 0)
  const grandBalance = wallets.reduce((s, w) => s + w.balance, 0)
  // 전월 비교 기준: displayGroups의 prevAmount 합산
  const grandPrev    = displayGroups.reduce((s, g) => s + (g.prevAmount || 0) * multi, 0)

  // ── 상세 화면 분기 ──
  if (detail?.type === 'auth') {
    return <PhoneShell><AuthFundsDetail onBack={() => navigate(-1)} /></PhoneShell>
  }
  if (detail?.type === 'group') {
    return <PhoneShell><CategoryGroupDetail group={detail.group} multi={multi} txns={groupTxns} onBack={() => navigate(-1)} theme={theme} initialPeriod={period} /></PhoneShell>
  }
  if (detail?.type === 'txn') {
    // [헷갈림 주의] txn 상세는 groupTxns(MY 지갑) 기준
    // CategoryGroupDetail에서 진입하므로 항상 MY 지갑 거래 내역 사용
    const txn     = groupTxns.find(t => t.id === detail.id)
    const allSubs = displayGroups.flatMap(g => g.subs)
    const cat     = allSubs.find(c => c.id === txn?.cat)
    return <PhoneShell><TxnDetail txn={txn} catLabel={cat?.label} catColor={cat?.color} onBack={() => navigate(-1)} theme={theme} /></PhoneShell>
  }
  if (detail?.type === 'wallet') {
    const w = walletWithStats.find(w => w.id === detail.walletId) || walletWithStats[0]
    return (
      <PhoneShell>
        <WalletStatsDetail
          wallet={w}
          userType={userType}
          displayGroups={displayGroups}
          groupTxns={groupTxns}
          onBack={() => navigate(-1)}
          theme={theme}
        />
      </PhoneShell>
    )
  }

  return (
    <PhoneShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>

        {/* 헤더 — 고정 */}
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'16px', position:'relative', zIndex:10, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', padding:'0 16px 14px', gap:'4px' }}>
            <button type="button" onClick={(e) => { e.stopPropagation(); navigate(-1) }}
              style={{ width:'44px', height:'44px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, flexShrink:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize:'17px', fontWeight:700, color:'#fff', flex:1 }}>집행 통계</span>
          </div>
          <div style={{ display:'flex', gap:'6px', padding:'0 16px' }}>
            {PERIODS.map(p => (
              <button type="button" key={p} onClick={(e) => { e.stopPropagation(); setPeriod(p) }}
                style={{ flex:1, padding:'7px 0', background: p===period?'rgba(255,255,255,0.95)':'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'20px', color: p===period?theme.brandDark:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 스크롤 영역 */}
        <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>

          {/* ── 전체 집행 요약 카드 ── */}
          <div style={{ padding:'14px 16px 0' }}>
            <div style={{
              background: `linear-gradient(135deg, ${theme.brandDark} 0%, ${theme.brandDark}BB 100%)`,
              borderRadius: RADIUS.lg,
              padding: '20px 22px 22px',
              boxShadow: `0 8px 24px ${theme.brandDark}40`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'120px', height:'120px', borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />

              {/* 전체 집행액 (크게) */}
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.65)', marginBottom:'4px' }}>{period} 전체 집행액</div>
              <div style={{ fontSize:'30px', fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1, marginBottom:'8px' }}>
                {fmt(grandExec)}원
              </div>

              {/* 전월 대비 뱃지 */}
              {(() => {
                const d = diffInfo(grandExec, grandPrev)
                if (!d) return <div style={{ height:'22px' }} />
                return (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:'rgba(0,0,0,0.28)', borderRadius:'8px', padding:'3px 9px', marginBottom:'14px' }}>
                    <span style={{ fontSize:'12px', fontWeight:700, color:'#fff' }}>{d.arrow} {d.pct}%</span>
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.65)' }}>{PERIOD_COMPARE[period]?.long}</span>
                  </div>
                )
              })()}

              {/* 구분선 */}
              <div style={{ height:'1px', background:'rgba(255,255,255,0.15)', margin:'12px 0 14px' }} />

              {/* 전체 잔액 + 지갑 수 */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                <div>
                  <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>전체 지갑 잔액</div>
                  <div style={{ fontSize:'20px', fontWeight:800, color:'rgba(255,255,255,0.9)', letterSpacing:'-0.5px' }}>
                    {fmt(grandBalance)}원
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>보유 지갑</div>
                  <div style={{ fontSize:'18px', fontWeight:800, color:'rgba(255,255,255,0.85)' }}>{wallets.length}개</div>
                </div>
              </div>
            </div>

            {/* 카테고리 비중 바 */}
            <div style={{ marginTop:'12px', marginBottom:'4px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:COLORS.t4, marginBottom:'5px' }}>
                <span>카테고리 비중</span>
                <span style={{ fontWeight:600, color:theme.brandDark }}>{fmtM(grandExec)}원 · {period}</span>
              </div>
              <div style={{ height:'9px', borderRadius:'5px', overflow:'hidden', display:'flex', gap:'1px' }}>
                {displayGroups.map(g => {
                  const gTotal = g.subs.reduce((s, sub) => s + sub.amount * multi, 0)
                  const pct    = grandExec > 0 ? Math.round(gTotal / grandExec * 100) : 0
                  return <div key={g.id} style={{ flex:pct, background:g.color, minWidth: pct < 3 ? '5px' : 0 }} />
                })}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'7px' }}>
                {displayGroups.slice(0, 5).map(g => (
                  <div key={g.id} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                    <div style={{ width:'7px', height:'7px', borderRadius:'2px', background:g.color }} />
                    <span style={{ fontSize:'10px', color:COLORS.t4 }}>{g.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 카테고리별 집행 현황 + AI 요약 ── */}
          <div style={{ padding:'12px 16px 0' }}>

          {/* 권한 자금 카드 */}
          <button onClick={()=>enterDetail({type:'auth'})} style={{
            width:'100%', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left',
            background:'linear-gradient(135deg,#92400E 0%,#B45309 45%,#D97706 100%)',
            borderRadius:RADIUS.lg, padding:'16px 18px', marginBottom:'14px',
            boxShadow:'0 6px 20px rgba(180,83,9,0.40)',
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute',top:'-20px',right:'-20px',width:'100px',height:'100px',borderRadius:'50%',background:'rgba(255,255,255,0.07)',pointerEvents:'none' }} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'4px' }}>
                  <span style={{ fontSize:'18px' }}>🔐</span>
                  <span style={{ fontSize:'14px', fontWeight:800, color:'#fff', letterSpacing:'-0.3px' }}>권한 자금</span>
                  <span style={{ padding:'2px 7px', background:'rgba(255,255,255,0.2)', borderRadius:'10px', fontSize:'9px', fontWeight:700, color:'#FEF3C7' }}>내가 집행 · 권한 보유</span>
                </div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>투자 · 대여금 · 자금지원 {AUTHORITY_FUNDS.length}건</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'20px', fontWeight:800, color:'#FEF3C7', letterSpacing:'-0.5px' }}>{fmtM(TOTAL_AUTH)}원</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.65)', marginTop:'2px' }}>상세보기 ›</div>
              </div>
            </div>
          </button>

          {/* 카테고리 그룹 목록 (개인은 지갑 무관하게 항상 표시) */}
          {displayGroups && (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {displayGroups.map(g => {
                const groupTotal = g.subs.reduce((s,sub)=>s+sub.amount*multi,0)
                const totalAll   = displayGroups.reduce((s,x)=>s+x.subs.reduce((ss,sub)=>ss+sub.amount*multi,0),0)
                const pct        = totalAll > 0 ? Math.round(groupTotal/totalAll*100) : 0
                return (
                  <button key={g.id} onClick={()=>enterDetail({type:'group', group:g})}
                    style={{ width:'100%', background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, padding:'14px 16px', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:`${g.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>{g.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                        <span style={{ fontSize:'14px', fontWeight:700, color:COLORS.t1 }}>{g.label}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          {(() => {
                            const d = diffInfo(groupTotal, g.prevAmount ? g.prevAmount * multi : 0)
                            if (!d) return null
                            return (
                              <span style={{ fontSize:'10px', fontWeight:700, color:d.color, background:d.bg, padding:'2px 6px', borderRadius:'5px' }}>
                                {d.arrow} {d.pct}% {PERIOD_COMPARE[period]?.short}
                              </span>
                            )
                          })()}
                          <span style={{ fontSize:'15px', fontWeight:800, color:COLORS.t1 }}>{fmtM(groupTotal)}원</span>
                        </div>
                      </div>
                      <div style={{ height:'4px', background:COLORS.bgMuted, borderRadius:'2px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:g.color, borderRadius:'2px' }} />
                      </div>
                      <div style={{ marginTop:'4px' }}>
                        <span style={{ fontSize:'10px', color:COLORS.t4 }}>{g.subs.length}개 항목 · {pct}%</span>
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t5} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                )
              })}
            </div>
          )}

          {/* ─── AI 월간 요약 카드 ─── */}
          {displayGroups && (() => {
            const totalNow  = displayGroups.reduce((s,g)=>s+g.subs.reduce((ss,sub)=>ss+sub.amount*multi,0),0)
            const totalPrev = displayGroups.reduce((s,g)=>s+(g.prevAmount||0)*multi,0)
            const totalDiff = diffInfo(totalNow, totalPrev)

            // 그룹별 증감 계산
            const withDiff = displayGroups.map(g => {
              const now  = g.subs.reduce((s,sub)=>s+sub.amount*multi,0)
              const prev = (g.prevAmount||0)*multi
              const d    = diffInfo(now, prev)
              return { ...g, now, prev, d }
            })
            const topRiser  = [...withDiff].filter(g=>g.d&&g.d.isUp).sort((a,b)=>b.d.pct-a.d.pct)[0]
            const topFaller = [...withDiff].filter(g=>g.d&&!g.d.isUp).sort((a,b)=>b.d.pct-a.d.pct)[0]
            const topGroup  = [...withDiff].sort((a,b)=>b.now-a.now)[0]

            // 업종별 고정 힌트
            const lendingNow = withDiff.find(g=>g.id==='lending')?.now || 0
            const bizHint = {
              business: `동규모 기업 평균과 비교 시 인건비 비중 45~55%가 적정 범위입니다. 현재 인건비가 전체의 ${Math.round((withDiff.find(g=>g.id==='labor')?.now||0)/totalNow*100)}%를 차지하고 있으니 참고해두세요.`,
              personal:  lendingNow > 0
                ? `빌려주기 항목이 ${fmtM(lendingNow)}원으로 집계되었습니다. 차용증을 등록해두면 상환 관리가 쉬워집니다. 부동산(월세·관리비)은 고정 지출 1순위이니 매달 자동 확인해두세요.`
                : '부동산(월세·관리비)이 고정 지출 1순위입니다. 용돈·선물 항목을 주기별로 예산을 정해두면 지출 예측이 더 수월해집니다.',
              public:    '유사 규모 기관 평균 대비 사업비 집행 비중을 확인하세요. 집행 목적 분류를 세분화하면 결산 시 유리합니다.',
            }[userType] || ''

            // 문장 구성
            const sentences = []
            if (topGroup) {
              sentences.push({
                dot: '#2A7D5E',
                text: `이번 달 가장 큰 지출은 ${topGroup.label}(${fmtM(topGroup.now)}원)으로 전체의 ${Math.round(topGroup.now/totalNow*100)}%를 차지합니다.`,
              })
            }
            if (topRiser) {
              sentences.push({
                dot: '#EF4444',
                text: `${topRiser.label}이(가) ${PERIOD_COMPARE[period]?.long} ${topRiser.d.pct}% 증가해 가장 큰 폭으로 늘었습니다. 해당 항목을 중점적으로 점검해보세요.`,
              })
            }
            if (topFaller) {
              sentences.push({
                dot: '#10B981',
                text: `반면 ${topFaller.label}은(는) ${PERIOD_COMPARE[period]?.long} ${topFaller.d.pct}% 줄어 비용 효율이 개선되었습니다.`,
              })
            }
            if (bizHint) {
              sentences.push({ dot: '#6B7280', text: bizHint })
            }
            if (totalDiff) {
              const trendWord = totalDiff.isUp
                ? `${totalDiff.pct}% 증가했습니다. 지속적으로 늘고 있다면 항목별 세부 검토를 권장합니다.`
                : `${totalDiff.pct}% 감소했습니다. 이 절감 흐름을 꾸준히 유지해보세요.`
              sentences.push({ dot: '#0EA5E9', text: `전체 집행액은 ${PERIOD_COMPARE[period]?.long} ${trendWord}` })
            }

            return (
              <div style={{ marginTop:'20px', background:COLORS.bgCard, borderRadius:'16px', padding:'18px 16px 20px', boxShadow:SHADOWS.card, border:`1px solid ${COLORS.borderSoft}` }}>
                {/* 헤더 */}
                <div style={{ display:'flex', alignItems:'center', gap:'9px', marginBottom:'14px' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'linear-gradient(135deg,#2A7D5E 0%,#0EA5E9 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', flexShrink:0 }}>✨</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:800, color:COLORS.t1 }}>이번 달 요약</div>
                    <div style={{ fontSize:'10px', color:COLORS.t4, marginTop:'1px' }}>AI 분석 · {period} 기준</div>
                  </div>
                  {totalDiff && (
                    <div style={{ fontSize:'11px', fontWeight:700, color:totalDiff.color, background:totalDiff.bg, padding:'4px 9px', borderRadius:'8px', flexShrink:0 }}>
                      {totalDiff.arrow} {totalDiff.pct}% {PERIOD_COMPARE[period]?.short}
                    </div>
                  )}
                </div>

                {/* 구분선 */}
                <div style={{ height:'1px', background:COLORS.borderSoft, marginBottom:'14px' }} />

                {/* 문장 목록 */}
                <div style={{ display:'flex', flexDirection:'column', gap:'11px' }}>
                  {sentences.map((s,i) => (
                    <div key={i} style={{ display:'flex', gap:'9px', alignItems:'flex-start' }}>
                      <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:s.dot, marginTop:'5px', flexShrink:0 }} />
                      <span style={{ fontSize:'12px', lineHeight:'1.65', color:COLORS.t2 }}>{s.text}</span>
                    </div>
                  ))}
                </div>

                {/* 하단 워터마크 */}
                <div style={{ marginTop:'14px', paddingTop:'10px', borderTop:`1px solid ${COLORS.borderSoft}`, fontSize:'10px', color:COLORS.t5, textAlign:'right' }}>
                  judapay AI · 데이터 기반 자동 분석
                </div>
              </div>
            )
          })()}

          </div>

          {/* ── 지갑별 현황 리스트 ── */}
          <div style={{ padding:'16px 16px 40px' }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:COLORS.t3, letterSpacing:'0.3px', marginBottom:'10px' }}>지갑별 현황</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {walletWithStats.map(w => {
                const barPct = grandExec > 0 ? Math.round(w.execTotal / grandExec * 100) : 0
                return (
                  <button key={w.id}
                    onClick={() => enterDetail({ type:'wallet', walletId: w.id, walletLabel: w.label })}
                    style={{
                      width:'100%', background:COLORS.bgCard, boxShadow:SHADOWS.card,
                      borderRadius:RADIUS.lg, padding:'14px 16px',
                      border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                      display:'flex', alignItems:'center', gap:'12px',
                    }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:`${w.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
                      {w.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                          <span style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1 }}>{w.label}</span>
                          {w.tag && (
                            <span style={{ padding:'2px 6px', background:`${w.color}15`, color:w.color, borderRadius:'5px', fontSize:'9px', fontWeight:700 }}>{w.tag}</span>
                          )}
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:'9px', color:COLORS.t4, marginBottom:'2px' }}>잔액</div>
                          <div style={{ fontSize:'13px', fontWeight:800, color:COLORS.t1 }}>{fmtM(w.balance)}원</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                        <div style={{ flex:1, height:'4px', background:COLORS.bgMuted, borderRadius:'2px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${barPct}%`, background:w.color, borderRadius:'2px' }} />
                        </div>
                        <span style={{ fontSize:'10px', color:COLORS.t4, flexShrink:0, minWidth:'70px', textAlign:'right' }}>
                          {period} {fmtM(w.execTotal)}원
                        </span>
                      </div>
                      <div style={{ fontSize:'10px', color:COLORS.t4 }}>전체 집행의 {barPct}%</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t5} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </PhoneShell>
  )
}