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
    { id:'labor', label:'인건비', icon:'👥', color:'#2A7D5E', prevAmount:1480000, subs:[
      { id:'salary',      label:'급여',    icon:'💼', color:'#2A7D5E', amount:850000, count:2 },
      { id:'outsource',   label:'외주비',  icon:'🧑‍💻', color:'#0EA5E9', amount:300000, count:1 },
      { id:'bonus',       label:'상여금',  icon:'🎁', color:'#7C3AED', amount:200000, count:1 },
      { id:'condolence',  label:'경조사비',icon:'🎗️', color:'#EF4444', amount:100000, count:1 },
      { id:'otherinc',    label:'기타소득',icon:'📦', color:'#9CA3AF', amount:50000,  count:1 },
      { id:'ins4',        label:'4대보험', icon:'🛡️', color:'#F59E0B', amount:95000,  count:1 },
    ]},
    { id:'ops', label:'운영비', icon:'⚙️', color:'#0EA5E9', prevAmount:510000, subs:[
      { id:'rent',        label:'임대료',       icon:'🏢', color:'#7C3AED', amount:180000, count:1 },
      { id:'rentlease',   label:'렌트&리스',    icon:'🚗', color:'#06B6D4', amount:120000, count:1 },
      { id:'subscription',label:'구독료',       icon:'📱', color:'#0EA5E9', amount:7500,   count:2 },
      { id:'telecom',     label:'통신비',       icon:'📡', color:'#10B981', amount:55000,  count:1 },
      { id:'utility',     label:'공과금',       icon:'💡', color:'#F59E0B', amount:30000,  count:1 },
      { id:'insurance',   label:'보험료',       icon:'🛡️', color:'#EF4444', amount:50000,  count:1 },
      { id:'travel_meal', label:'출장식대',     icon:'✈️', color:'#0891B2', amount:45000,  count:1 },
      { id:'welfare',     label:'복리후생',     icon:'🎁', color:'#10B981', amount:30000,  count:1 },
      { id:'otherops',    label:'기타 정기지출', icon:'📦', color:'#9CA3AF', amount:20000,  count:1 },
      { id:'personal_use',label:'개인사용',     icon:'👤', color:'#6B7280', amount:15000,  count:1 },
    ]},
    { id:'biz', label:'사업비', icon:'📋', color:'#7C3AED', prevAmount:120000, subs:[
      { id:'marketing',   label:'마케팅비', icon:'📣', color:'#EF4444', amount:99000, count:1 },
    ]},
    { id:'finance', label:'금융', icon:'💰', color:'#F59E0B', prevAmount:180000, subs:[
      { id:'invest',      label:'투자',    icon:'📈', color:'#0EA5E9', amount:200000, count:1 },
      { id:'lend',        label:'대여금',  icon:'🤝', color:'#7C3AED', amount:100000, count:1 },
    ]},
    { id:'tax', label:'세금', icon:'🧾', color:'#EF4444', prevAmount:30000, subs:[
      { id:'tax',         label:'세금',    icon:'🧾', color:'#EF4444', amount:30000, count:1 },
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

// 지갑 정의 — id:'my'는 userType별로 cats 결정
const WALLETS = [
  { id:'my',       label:'MY 지갑',   icon:'💳', color:'#2A7D5E', tag:null,    balance:8430000  },
  { id:'changwon', label:'창원진흥원', icon:'🏛️', color:'#7C3AED', tag:'지원금', balance:3300000 },
  { id:'gift',     label:'용돈·선물', icon:'🎁', color:'#F59E0B', tag:'선물',  balance:450000   },
]

const WALLET_SPEND = {
  changwon: [
    { id:'personnel', label:'인건비',   icon:'👥', color:'#2A7D5E', amount:2100000, count:5 },
    { id:'equipment', label:'장비구매', icon:'🖥️', color:'#0EA5E9', amount:1400000, count:2 },
    { id:'ops',       label:'운영비',   icon:'⚙️', color:'#F59E0B', amount:1000000, count:6 },
  ],
  gift: [
    { id:'gift', label:'용돈·선물', icon:'🎁', color:'#F59E0B', amount:450000, count:3 },
    { id:'lend', label:'빌려주기',  icon:'🤝', color:'#7C3AED', amount:200000, count:1 },
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
  my_personal: [
    { id:'p1', cat:'living',    name:'관리비',         date:'5.10', amount:180000 },
    { id:'p2', cat:'food',      name:'이마트',         date:'5.5',  amount:87000  },
    { id:'p3', cat:'food',      name:'스타벅스',       date:'5.5',  amount:7500   },
    { id:'p4', cat:'transport', name:'카카오T 택시',   date:'5.4',  amount:12500  },
    { id:'p5', cat:'education', name:'인프런 강의',    date:'5.3',  amount:99000  },
    { id:'p6', cat:'gift',      name:'어머니 용돈',    date:'5.1',  amount:200000 },
  ],
  my_public: [
    { id:'q1', cat:'personnel', name:'3월 인건비 지급', date:'5.25', amount:8200000 },
    { id:'q2', cat:'project',   name:'홍보물 제작',     date:'5.15', amount:1200000 },
    { id:'q3', cat:'subsidy',   name:'소상공인 지원',   date:'5.10', amount:3100000 },
    { id:'q4', cat:'admin',     name:'소모품 구매',     date:'5.8',  amount:230000  },
  ],
  changwon: [
    { id:'c1', cat:'personnel', name:'인턴 2명 인건비', date:'5.25', amount:2100000 },
    { id:'c2', cat:'equipment', name:'노트북 구매',     date:'5.10', amount:1400000 },
    { id:'c3', cat:'ops',       name:'사무용품',        date:'5.8',  amount:320000  },
  ],
  gift: [
    { id:'g1', cat:'gift', name:'어머니 용돈',   date:'5.1',  amount:200000 },
    { id:'g2', cat:'gift', name:'동생 생일선물', date:'5.14', amount:150000 },
    { id:'g3', cat:'lend', name:'친구 이호준',   date:'5.5',  amount:200000 },
  ],
}


const PERIODS      = ['이번달','3개월','6개월','1년']
const PERIOD_MULTI = { '이번달':1, '3개월':3, '6개월':6, '1년':12 }

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
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
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

// ─────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────
export default function ExecutionStats() {
  const theme     = getAccountTheme()
  const navigate  = useNavigate()
  const location  = useLocation()
  const userType  = getUserType()

  const [period,    setPeriod]    = useState('이번달')
  const [walletIdx, setWalletIdx] = useState(0)
  const [detail,    setDetail]    = useState(null)

  // 권한자금 화면에서 백 버튼으로 돌아왔을 때 auth 상세 복원
  useEffect(() => {
    if (location.state?.openDetail === 'auth') {
      setDetail({ type: 'auth' })
    }
  }, [])

  const wallet = WALLETS[walletIdx]
  const multi  = PERIOD_MULTI[period]

  // MY 지갑: 5대 그룹, 그 외: 플랫 목록
  const groups = wallet.id === 'my'
    ? (CATEGORY_GROUPS[userType] || CATEGORY_GROUPS.business)
    : null

  // 세그먼트 바용 아이템 (MY=그룹, 그 외=플랫)
  const segItems = groups
    ? groups.map(g => ({ ...g, amount: g.subs.reduce((s,sub)=>s+sub.amount,0) }))
    : (WALLET_SPEND[wallet.id] || [])

  // 전체 집행 합계
  const total = segItems.reduce((s,c)=>s+c.amount*multi, 0)

  // 지갑별 거래 내역
  const txnKey = wallet.id === 'my' ? `my_${userType}` : wallet.id
  const txns   = WALLET_TXNS[txnKey] || []

  const resetWallet = () => {}

  // ── 상세 화면 분기 ──
  if (detail?.type === 'auth') {
    return <PhoneShell><AuthFundsDetail onBack={()=>setDetail(null)} /></PhoneShell>
  }
  if (detail?.type === 'group') {
    return <PhoneShell><CategoryGroupDetail group={detail.group} multi={multi} txns={txns} onBack={()=>setDetail(null)} theme={theme} initialPeriod={period} /></PhoneShell>
  }
  if (detail?.type === 'txn') {
    const txn = txns.find(t=>t.id===detail.id)
    const allSubs = groups ? groups.flatMap(g=>g.subs) : (WALLET_SPEND[wallet.id]||[])
    const cat = allSubs.find(c=>c.id===txn?.cat)
    return <PhoneShell><TxnDetail txn={txn} catLabel={cat?.label} catColor={cat?.color} onBack={()=>setDetail(null)} theme={theme} /></PhoneShell>
  }
return (
    <PhoneShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* 헤더 — 고정 */}
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'16px', position:'relative', zIndex:10, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', padding:'0 16px 14px', gap:'4px' }}>
            <button
              type="button"
              onClick={(e)=>{ e.stopPropagation(); navigate(-1) }}
              style={{ width:'44px', height:'44px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, flexShrink:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize:'17px', fontWeight:700, color:'#fff', flex:1 }}>집행 통계</span>
          </div>
          <div style={{ display:'flex', gap:'6px', padding:'0 16px' }}>
            {PERIODS.map(p=>(
              <button type="button" key={p} onClick={(e)=>{ e.stopPropagation(); setPeriod(p) }} style={{ flex:1, padding:'7px 0', background:p===period?'rgba(255,255,255,0.95)':'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'20px', color:p===period?theme.brandDark:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{p}</button>
            ))}
          </div>
        </div>

        {/* 스크롤 영역 */}
        <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>

        {/* 지갑 캐러셀 */}
        <div style={{ padding:'14px 16px 0' }}>
          <div style={{ position:'relative' }}>
            <div style={{ background:`linear-gradient(135deg,${wallet.color} 0%,${wallet.color}CC 100%)`, borderRadius:RADIUS.lg, padding:'22px 22px 24px', boxShadow:`0 8px 24px ${wallet.color}40`, minHeight:'130px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute',top:'-30px',right:'-30px',width:'120px',height:'120px',borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none' }} />
              {/* 지갑명 + 잔액 (작게) */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ fontSize:'18px' }}>{wallet.icon}</span>
                  <span style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{wallet.label}</span>
                  {wallet.tag && <span style={{ padding:'2px 7px', background:'rgba(255,255,255,0.2)', borderRadius:'10px', fontSize:'9px', fontWeight:700, color:'#fff' }}>{wallet.tag}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                  <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.65)' }}>잔액</span>
                  <span style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.85)' }}>{fmtM(wallet.balance)}원</span>
                </div>
              </div>
              {/* 이번달 집행 (크게) */}
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.65)', marginBottom:'4px' }}>{period} 집행액</div>
              <div style={{ fontSize:'30px', fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1, marginBottom:'8px' }}>{fmt(total)}원</div>
              {/* 전월 비교 */}
              {(() => {
                const prevTotal = groups ? groups.reduce((s,g)=>s+(g.prevAmount||0),0) : 0
                const d = diffInfo(total, prevTotal)
                if (!d) return null
                return (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:'rgba(0,0,0,0.28)', borderRadius:'8px', padding:'3px 9px' }}>
                    <span style={{ fontSize:'12px', fontWeight:700, color:'#fff' }}>{d.arrow} {d.pct}%</span>
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.65)' }}>전월 대비</span>
                  </div>
                )
              })()}
            </div>
            {walletIdx > 0 && (
              <button onClick={()=>{setWalletIdx(walletIdx-1);resetWallet()}} style={{ position:'absolute',left:'-10px',top:'50%',transform:'translateY(-50%)',width:'28px',height:'28px',borderRadius:'50%',background:'#fff',boxShadow:SHADOWS.card,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:2 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
            {walletIdx < WALLETS.length-1 && (
              <button onClick={()=>{setWalletIdx(walletIdx+1);resetWallet()}} style={{ position:'absolute',right:'-10px',top:'50%',transform:'translateY(-50%)',width:'28px',height:'28px',borderRadius:'50%',background:'#fff',boxShadow:SHADOWS.card,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:2 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}
          </div>

          {/* 도트 */}
          <div style={{ display:'flex', justifyContent:'center', gap:'6px', marginTop:'10px', marginBottom:'14px' }}>
            {WALLETS.map((w,i)=>(
              <button key={w.id} onClick={()=>{setWalletIdx(i);resetWallet()}} style={{ width:i===walletIdx?'18px':'6px',height:'6px',borderRadius:'3px',background:i===walletIdx?wallet.color:COLORS.border,border:'none',cursor:'pointer',padding:0,transition:'all .2s' }} />
            ))}
          </div>

          {/* 세그먼트 바 */}
          <div style={{ marginBottom:'4px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:COLORS.t4, marginBottom:'5px' }}>
              <span>카테고리 비중</span>
              <span style={{ fontWeight:600, color:wallet.color }}>{fmtM(total)}원 · {period}</span>
            </div>
            <div style={{ height:'9px', borderRadius:'5px', overflow:'hidden', display:'flex', gap:'1px' }}>
              {segItems.map(c=>{
                const pct = Math.round(c.amount/segItems.reduce((s,x)=>s+x.amount,0)*100)
                return <div key={c.id} style={{ flex:pct, background:c.color, minWidth:pct<3?'5px':0 }} />
              })}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'7px' }}>
              {segItems.slice(0,5).map(c=>(
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                  <div style={{ width:'7px', height:'7px', borderRadius:'2px', background:c.color }} />
                  <span style={{ fontSize:'10px', color:COLORS.t4 }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 카테고리 그룹 / 지갑별 항목 */}
        <div style={{ padding:'12px 16px 32px' }}>

          {/* 권한 자금 카드 */}
          <button onClick={()=>setDetail({type:'auth'})} style={{
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

          {/* MY 지갑: 그룹 카드 목록 */}
          {groups && (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {groups.map(g => {
                const groupTotal = g.subs.reduce((s,sub)=>s+sub.amount*multi,0)
                const totalAll   = groups.reduce((s,x)=>s+x.subs.reduce((ss,sub)=>ss+sub.amount*multi,0),0)
                const pct        = totalAll > 0 ? Math.round(groupTotal/totalAll*100) : 0
                return (
                  <button key={g.id} onClick={()=>setDetail({type:'group', group:g})}
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
                                {d.arrow} {d.pct}%
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

          {/* 그 외 지갑: 플랫 목록 */}
          {!groups && (
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {segItems.map(c=>(
                <div key={c.id} style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:`${c.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px', flexShrink:0 }}>{c.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
                      <span style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1 }}>{c.label}</span>
                      <span style={{ fontSize:'14px', fontWeight:800, color:COLORS.t1 }}>{fmtM(c.amount*multi)}원</span>
                    </div>
                    <div style={{ height:'4px', background:COLORS.bgMuted, borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.round(c.amount/segItems.reduce((s,x)=>s+x.amount,0)*100)}%`, background:c.color, borderRadius:'2px' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── AI 월간 요약 카드 (MY 지갑 only) ─── */}
          {groups && (() => {
            const totalNow  = groups.reduce((s,g)=>s+g.subs.reduce((ss,sub)=>ss+sub.amount*multi,0),0)
            const totalPrev = groups.reduce((s,g)=>s+(g.prevAmount||0)*multi,0)
            const totalDiff = diffInfo(totalNow, totalPrev)

            // 그룹별 증감 계산
            const withDiff = groups.map(g => {
              const now  = g.subs.reduce((s,sub)=>s+sub.amount*multi,0)
              const prev = (g.prevAmount||0)*multi
              const d    = diffInfo(now, prev)
              return { ...g, now, prev, d }
            })
            const topRiser  = [...withDiff].filter(g=>g.d&&g.d.isUp).sort((a,b)=>b.d.pct-a.d.pct)[0]
            const topFaller = [...withDiff].filter(g=>g.d&&!g.d.isUp).sort((a,b)=>b.d.pct-a.d.pct)[0]
            const topGroup  = [...withDiff].sort((a,b)=>b.now-a.now)[0]

            // 업종별 고정 힌트
            const bizHint = {
              business: `동규모 기업 평균과 비교 시 인건비 비중 45~55%가 적정 범위입니다. 현재 인건비가 전체의 ${Math.round((withDiff.find(g=>g.id==='labor')?.now||0)/totalNow*100)}%를 차지하고 있으니 참고해두세요.`,
              personal:  '동일 소득 구간 평균 대비, 구독·통신 등 고정 운영비를 점검하면 월 5~10만원 수준의 절감 여지가 있을 수 있습니다.',
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
                text: `${topRiser.label}이(가) 전월 대비 ${topRiser.d.pct}% 증가해 가장 큰 폭으로 늘었습니다. 해당 항목을 중점적으로 점검해보세요.`,
              })
            }
            if (topFaller) {
              sentences.push({
                dot: '#10B981',
                text: `반면 ${topFaller.label}은(는) ${topFaller.d.pct}% 줄어 비용 효율이 개선되었습니다.`,
              })
            }
            if (bizHint) {
              sentences.push({ dot: '#6B7280', text: bizHint })
            }
            if (totalDiff) {
              const trendWord = totalDiff.isUp
                ? `${totalDiff.pct}% 증가했습니다. 지속적으로 늘고 있다면 항목별 세부 검토를 권장합니다.`
                : `${totalDiff.pct}% 감소했습니다. 이 절감 흐름을 꾸준히 유지해보세요.`
              sentences.push({ dot: '#0EA5E9', text: `전체 집행액은 전월 대비 ${trendWord}` })
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
                      {totalDiff.arrow} {totalDiff.pct}% 전월
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
      </div>
    </div>
  </PhoneShell>
  )
}