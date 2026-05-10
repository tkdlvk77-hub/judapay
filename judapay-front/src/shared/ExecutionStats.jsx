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
    { id:'labor', label:'인건비', icon:'👥', color:'#2A7D5E', subs:[
      { id:'salary',      label:'급여',    icon:'💼', color:'#2A7D5E', amount:16200000, count:12 },
      { id:'outsource',   label:'외주비',  icon:'🧑‍💻', color:'#0EA5E9', amount:7500000,  count:9  },
      { id:'bonus',       label:'상여금',  icon:'🎁', color:'#7C3AED', amount:2000000,  count:3  },
      { id:'condolence',  label:'경조사비',icon:'🎗️', color:'#EF4444', amount:500000,   count:2  },
      { id:'otherinc',    label:'기타소득',icon:'📦', color:'#9CA3AF', amount:300000,   count:1  },
      { id:'ins4',        label:'4대보험', icon:'🛡️', color:'#F59E0B', amount:1800000,  count:2  },
    ]},
    { id:'ops', label:'운영비', icon:'⚙️', color:'#0EA5E9', subs:[
      { id:'rent',        label:'임대료',       icon:'🏢', color:'#7C3AED', amount:5800000, count:3 },
      { id:'rentlease',   label:'렌트&리스',    icon:'🚗', color:'#06B6D4', amount:2000000, count:2 },
      { id:'subscription',label:'구독료',       icon:'📱', color:'#0EA5E9', amount:800000,  count:5 },
      { id:'telecom',     label:'통신비',       icon:'📡', color:'#10B981', amount:400000,  count:3 },
      { id:'utility',     label:'공과금',       icon:'💡', color:'#F59E0B', amount:350000,  count:2 },
      { id:'insurance',   label:'보험료',       icon:'🛡️', color:'#EF4444', amount:1800000, count:2 },
      { id:'otherops',    label:'기타 정기지출', icon:'📦', color:'#9CA3AF', amount:500000,  count:3 },
    ]},
    { id:'biz', label:'사업비', icon:'📋', color:'#7C3AED', subs:[
      { id:'marketing',   label:'마케팅비', icon:'📣', color:'#EF4444', amount:3000000, count:5 },
    ]},
    { id:'finance', label:'금융', icon:'💰', color:'#F59E0B', subs:[
      { id:'invest',      label:'투자',    icon:'📈', color:'#0EA5E9', amount:5000000, count:2 },
      { id:'lend',        label:'대여금',  icon:'🤝', color:'#7C3AED', amount:1000000, count:1 },
    ]},
    { id:'tax', label:'세금', icon:'🧾', color:'#EF4444', subs:[
      { id:'tax',         label:'세금',    icon:'🧾', color:'#EF4444', amount:4100000, count:4 },
    ]},
  ],
  personal: [
    { id:'labor', label:'인건비', icon:'👥', color:'#2A7D5E', subs:[
      { id:'salary',      label:'급여',    icon:'💼', color:'#2A7D5E', amount:850000, count:2 },
      { id:'outsource',   label:'외주비',  icon:'🧑‍💻', color:'#0EA5E9', amount:300000, count:1 },
      { id:'bonus',       label:'상여금',  icon:'🎁', color:'#7C3AED', amount:200000, count:1 },
      { id:'condolence',  label:'경조사비',icon:'🎗️', color:'#EF4444', amount:100000, count:1 },
      { id:'otherinc',    label:'기타소득',icon:'📦', color:'#9CA3AF', amount:50000,  count:1 },
      { id:'ins4',        label:'4대보험', icon:'🛡️', color:'#F59E0B', amount:95000,  count:1 },
    ]},
    { id:'ops', label:'운영비', icon:'⚙️', color:'#0EA5E9', subs:[
      { id:'rent',        label:'임대료',       icon:'🏢', color:'#7C3AED', amount:180000, count:1 },
      { id:'rentlease',   label:'렌트&리스',    icon:'🚗', color:'#06B6D4', amount:120000, count:1 },
      { id:'subscription',label:'구독료',       icon:'📱', color:'#0EA5E9', amount:7500,   count:2 },
      { id:'telecom',     label:'통신비',       icon:'📡', color:'#10B981', amount:55000,  count:1 },
      { id:'utility',     label:'공과금',       icon:'💡', color:'#F59E0B', amount:30000,  count:1 },
      { id:'insurance',   label:'보험료',       icon:'🛡️', color:'#EF4444', amount:50000,  count:1 },
      { id:'otherops',    label:'기타 정기지출', icon:'📦', color:'#9CA3AF', amount:20000,  count:1 },
    ]},
    { id:'biz', label:'사업비', icon:'📋', color:'#7C3AED', subs:[
      { id:'marketing',   label:'마케팅비', icon:'📣', color:'#EF4444', amount:99000, count:1 },
    ]},
    { id:'finance', label:'금융', icon:'💰', color:'#F59E0B', subs:[
      { id:'invest',      label:'투자',    icon:'📈', color:'#0EA5E9', amount:200000, count:1 },
      { id:'lend',        label:'대여금',  icon:'🤝', color:'#7C3AED', amount:100000, count:1 },
    ]},
    { id:'tax', label:'세금', icon:'🧾', color:'#EF4444', subs:[
      { id:'tax',         label:'세금',    icon:'🧾', color:'#EF4444', amount:30000, count:1 },
    ]},
  ],
  public: [
    { id:'labor', label:'인건비', icon:'👥', color:'#2A7D5E', subs:[
      { id:'salary',      label:'급여',    icon:'💼', color:'#2A7D5E', amount:8200000, count:8 },
      { id:'outsource',   label:'외주비',  icon:'🧑‍💻', color:'#0EA5E9', amount:1000000, count:3 },
      { id:'bonus',       label:'상여금',  icon:'🎁', color:'#7C3AED', amount:500000,  count:1 },
      { id:'condolence',  label:'경조사비',icon:'🎗️', color:'#EF4444', amount:200000,  count:1 },
      { id:'otherinc',    label:'기타소득',icon:'📦', color:'#9CA3AF', amount:100000,  count:1 },
      { id:'ins4',        label:'4대보험', icon:'🛡️', color:'#F59E0B', amount:400000,  count:2 },
    ]},
    { id:'ops', label:'운영비', icon:'⚙️', color:'#0EA5E9', subs:[
      { id:'rent',        label:'임대료',       icon:'🏢', color:'#7C3AED', amount:500000,  count:1 },
      { id:'rentlease',   label:'렌트&리스',    icon:'🚗', color:'#06B6D4', amount:300000,  count:1 },
      { id:'subscription',label:'구독료',       icon:'📱', color:'#0EA5E9', amount:150000,  count:2 },
      { id:'telecom',     label:'통신비',       icon:'📡', color:'#10B981', amount:200000,  count:2 },
      { id:'utility',     label:'공과금',       icon:'💡', color:'#F59E0B', amount:980000,  count:3 },
      { id:'insurance',   label:'보험료',       icon:'🛡️', color:'#EF4444', amount:300000,  count:1 },
      { id:'otherops',    label:'기타 정기지출', icon:'📦', color:'#9CA3AF', amount:620000,  count:3 },
    ]},
    { id:'biz', label:'사업비', icon:'📋', color:'#7C3AED', subs:[
      { id:'marketing',   label:'마케팅비', icon:'📣', color:'#EF4444', amount:5400000, count:8 },
    ]},
    { id:'finance', label:'금융', icon:'💰', color:'#F59E0B', subs:[
      { id:'invest',      label:'투자',    icon:'📈', color:'#0EA5E9', amount:3100000, count:3 },
      { id:'lend',        label:'대여금',  icon:'🤝', color:'#7C3AED', amount:500000,  count:1 },
    ]},
    { id:'tax', label:'세금', icon:'🧾', color:'#EF4444', subs:[
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

const CARD_LABELS = ['전체','주 카드','여행용']
const CARD_TXNS = [
  { id:'cp1', card:'주 카드', name:'이마트 역삼점',    meta:'5.5 14:32', amount:32000,  cat:'식료품', status:'normal'  },
  { id:'cp2', card:'주 카드', name:'스타벅스',         meta:'5.5 09:15', amount:7500,   cat:'카페',   status:'normal'  },
  { id:'cp3', card:'주 카드', name:'AWS 서버비 (자동)',meta:'5.1 00:01', amount:408000, cat:'서버',   status:'normal'  },
  { id:'cp4', card:'주 카드', name:'GS게임센터 (차단)',meta:'4.28 22:14',amount:0,      cat:'오락',   status:'blocked' },
  { id:'cp5', card:'여행용',  name:'인천공항 면세점',  meta:'5.1 10:22', amount:156000, cat:'면세점', status:'normal'  },
  { id:'cp6', card:'여행용',  name:'Adobe CC (자동)',  meta:'5.1 00:01', amount:145200, cat:'구독',   status:'normal'  },
  { id:'cp7', card:'여행용',  name:'카지노 (차단)',    meta:'4.29 23:11',amount:0,      cat:'도박',   status:'blocked' },
]

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

// ─────────────────────────────────────────────────────────
// 권한 자금 상세 화면
// ─────────────────────────────────────────────────────────
function AuthFundsDetail({ onBack }) {
  const navigate     = useNavigate()
  const statusColor  = { '진행중':'#2563EB','상환중':'#7C3AED','완료':'#10B981' }
  const statusBg     = { '진행중':'#EFF6FF','상환중':'#F5F3FF','완료':'#F0FDF4' }
  const totalAuth    = AUTHORITY_FUNDS.reduce((s,a)=>s+a.amount,0)
  const totalReturn  = AUTHORITY_FUNDS.reduce((s,a)=>s+a.returned,0)

  return (
    <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>
      {/* 헤더 — 권한 자금 앰버 그라디언트 */}
      <div style={{ background:'linear-gradient(135deg,#92400E 0%,#B45309 50%,#D97706 100%)', padding:'20px 0 28px', position:'relative', overflow:'hidden' }}>
        {/* 배경 장식 원 */}
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
          <div style={{ display:'flex', gap:'16px', alignItems:'flex-end', marginBottom:'4px' }}>
            <div style={{ flex:'0 0 auto' }}>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)', marginBottom:'2px' }}>총 집행</div>
              <div style={{ fontSize:'18px', fontWeight:700, color:'rgba(255,255,255,0.8)', letterSpacing:'-0.5px' }}>{fmtM(totalAuth)}원</div>
            </div>
            <div style={{ width:'1px', background:'rgba(255,255,255,0.2)', height:'36px' }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)', marginBottom:'2px' }}>현재 잔액 (미회수)</div>
              <div style={{ fontSize:'26px', fontWeight:800, color:'#FEF3C7', letterSpacing:'-1px', lineHeight:1 }}>{fmtM(totalAuth - totalReturn)}원</div>
            </div>
          </div>
          {totalReturn > 0 && (
            <div style={{ fontSize:'11px', color:'#FCD34D', fontWeight:600, marginTop:'6px' }}>↙ 소비 완료 {fmtM(totalReturn)}원</div>
          )}
        </div>
      </div>

      {/* 리스트 */}
      <div style={{ padding:'18px 16px 32px', display:'flex', flexDirection:'column', gap:'10px' }}>
        {AUTHORITY_FUNDS.map(item => {
          const remain = item.amount - item.returned
          const repaidPct = item.returned > 0 ? Math.round(item.returned/item.amount*100) : 0
          return (
            <button key={item.id}
              onClick={() => navigate('/control-center/recipient/aurora', { state: { from: 'stats-auth' } })}
              style={{ width:'100%', background: COLORS.bgCard, boxShadow: SHADOWS.card, borderRadius: RADIUS.lg, border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left', padding:'16px', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:`${item.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>{item.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'14px', fontWeight:700, color: COLORS.t1 }}>{item.name}</span>
                  <span style={{ padding:'2px 7px', background:`${item.color}18`, color:item.color, borderRadius:'5px', fontSize:'10px', fontWeight:700 }}>{item.type}</span>
                  <span style={{ padding:'2px 7px', background:statusBg[item.status], color:statusColor[item.status], borderRadius:'5px', fontSize:'10px', fontWeight:700 }}>{item.status}</span>
                </div>
                <div style={{ fontSize:'11px', color: COLORS.t4, marginBottom:'6px' }}>{item.desc} · {item.date}</div>
                {/* 상환 게이지 */}
                {item.returned > 0 && (
                  <div>
                    <div style={{ height:'4px', background: COLORS.bgMuted, borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${repaidPct}%`, background:'#10B981', borderRadius:'2px' }} />
                    </div>
                    <div style={{ fontSize:'10px', color:'#10B981', fontWeight:600, marginTop:'3px' }}>{repaidPct}% 소비</div>
                  </div>
                )}
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:'10px', color: COLORS.t4, marginBottom:'2px' }}>현재 잔액</div>
                <div style={{ fontSize:'16px', fontWeight:800, color: item.color }}>{fmtM(remain)}원</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t5} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop:'6px' }}><polyline points="9 18 15 12 9 6"/></svg>
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
function CategoryGroupDetail({ group, multi, txns, onBack, theme }) {
  const [subFilter, setSubFilter] = useState('전체')

  const groupTxns   = txns.filter(t => group.subs.some(s => s.id === t.cat))
  const filteredTxns = subFilter === '전체'
    ? groupTxns
    : groupTxns.filter(t => t.cat === group.subs.find(s => s.label === subFilter)?.id)

  const maxAmt = Math.max(...group.subs.map(s => s.amount), 1)

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* 헤더 */}
      <div style={{ background: theme.headerGrad, paddingTop:'20px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 14px' }}>
          <button onClick={onBack}
            style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize:'17px', fontWeight:700, color:'#fff', flex:1 }}>{group.icon} {group.label}</span>
          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.65)' }}>{group.subs.length}개 항목</span>
        </div>

        {/* 서브카테고리 필터 칩 */}
        <div style={{ display:'flex', gap:'6px', overflowX:'auto', padding:'0 16px 14px', scrollbarWidth:'none' }}>
          {['전체', ...group.subs.map(s => s.label)].map(f => (
            <button key={f} onClick={() => setSubFilter(f)}
              style={{
                flexShrink:0, padding:'7px 16px',
                background: subFilter === f ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)',
                border:'1px solid rgba(255,255,255,0.3)', borderRadius:'20px',
                color: subFilter === f ? theme.brandDark : '#fff',
                fontSize:'12px', fontWeight: subFilter === f ? 700 : 500,
                cursor:'pointer', fontFamily:'inherit',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex:1, overflowY:'auto', background: COLORS.bg, padding:'12px 16px 32px', display:'flex', flexDirection:'column', gap:'6px' }}>

        {/* 전체 선택: 서브카테고리 카드 목록 */}
        {subFilter === '전체' && group.subs.map(sub => {
          const pct = Math.round(sub.amount / maxAmt * 100)
          return (
            <button key={sub.id} onClick={() => setSubFilter(sub.label)}
              style={{ width:'100%', background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, padding:'13px 14px', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:`${sub.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>{sub.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                  <span style={{ fontSize:'14px', fontWeight:700, color:COLORS.t1 }}>{sub.label}</span>
                  <span style={{ fontSize:'15px', fontWeight:800, color:COLORS.t1 }}>{fmtM(sub.amount*multi)}원</span>
                </div>
                <div style={{ height:'4px', background:COLORS.bgMuted, borderRadius:'2px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:sub.color, borderRadius:'2px' }} />
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t5} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )
        })}

        {/* 특정 서브 선택: 거래 내역 */}
        {subFilter !== '전체' && (
          filteredTxns.length > 0 ? (
            <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, overflow:'hidden' }}>
              {filteredTxns.map((tx, i, arr) => {
                const sub = group.subs.find(s => s.id === tx.cat)
                return (
                  <div key={tx.id}
                    style={{ padding:'13px 14px', borderBottom:i<arr.length-1?`1px solid ${COLORS.borderSoft}`:'none', display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:sub?.color||COLORS.t5, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1, marginBottom:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.name}</div>
                      <div style={{ fontSize:'10px', color:COLORS.t4 }}>{tx.date} · {sub?.label}</div>
                    </div>
                    <span style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1, flexShrink:0 }}>{fmt(tx.amount)}원</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'48px 0', color:COLORS.t4, fontSize:'13px' }}>
              <div style={{ fontSize:'32px', marginBottom:'10px' }}>📭</div>
              거래 내역이 없습니다
            </div>
          )
        )}
      </div>
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

  const [period,     setPeriod]     = useState('이번달')
  const [walletIdx,  setWalletIdx]  = useState(0)
  const [tab,        setTab]        = useState('spend')
  const [cardFilter, setCardFilter] = useState('전체')
  const [detail,     setDetail]     = useState(null)

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

  const filteredCards = cardFilter === '전체'
    ? CARD_TXNS
    : CARD_TXNS.filter(t=>t.card===cardFilter)

  const resetWallet = () => { setCardFilter('전체') }

  // ── 상세 화면 분기 ──
  if (detail?.type === 'auth') {
    return <PhoneShell><AuthFundsDetail onBack={()=>setDetail(null)} /></PhoneShell>
  }
  if (detail?.type === 'group') {
    return <PhoneShell><CategoryGroupDetail group={detail.group} multi={multi} txns={txns} onBack={()=>setDetail(null)} theme={theme} /></PhoneShell>
  }
  if (detail?.type === 'txn') {
    const txn = txns.find(t=>t.id===detail.id)
    const allSubs = groups ? groups.flatMap(g=>g.subs) : (WALLET_SPEND[wallet.id]||[])
    const cat = allSubs.find(c=>c.id===txn?.cat)
    return <PhoneShell><TxnDetail txn={txn} catLabel={cat?.label} catColor={cat?.color} onBack={()=>setDetail(null)} theme={theme} /></PhoneShell>
  }
  if (detail?.type === 'card') {
    const txn = CARD_TXNS.find(t=>t.id===detail.id)
    return <PhoneShell><TxnDetail txn={txn} catLabel={txn?.cat} catColor={COLORS.t3} onBack={()=>setDetail(null)} theme={theme} /></PhoneShell>
  }

  return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>

        {/* 헤더 */}
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', padding:'4px 16px 12px', gap:'8px' }}>
            <button onClick={()=>navigate(-1)} style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize:'17px', fontWeight:700, color:'#fff', flex:1 }}>집행 통계</span>
          </div>
          <div style={{ display:'flex', gap:'6px', padding:'0 16px' }}>
            {PERIODS.map(p=>(
              <button key={p} onClick={()=>setPeriod(p)} style={{ flex:1, padding:'6px 0', background:p===period?'rgba(255,255,255,0.95)':'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'20px', color:p===period?theme.brandDark:'#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{p}</button>
            ))}
          </div>
        </div>

        {/* 지갑 캐러셀 */}
        <div style={{ padding:'14px 16px 0' }}>
          <div style={{ position:'relative' }}>
            <div style={{ background:`linear-gradient(135deg,${wallet.color} 0%,${wallet.color}CC 100%)`, borderRadius:RADIUS.lg, padding:'18px 20px', boxShadow:`0 8px 24px ${wallet.color}40`, minHeight:'110px', position:'relative', overflow:'hidden' }}>
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
              <div style={{ fontSize:'30px', fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1 }}>{fmt(total)}원</div>
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

        {/* 탭 */}
        <div style={{ padding:'14px 16px 0' }}>
          <div style={{ display:'flex', background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, padding:'3px' }}>
            {[
              { id:'spend', label:'집행 비용' },
              { id:'card',  label:'카드 내역', disabled: wallet.id !== 'my' },
            ].map(t=>(
              <button key={t.id} onClick={()=>!t.disabled&&setTab(t.id)} style={{ flex:1, padding:'10px 8px', background:tab===t.id?theme.brandDark:'transparent', border:'none', borderRadius:'10px', cursor:t.disabled?'default':'pointer', fontFamily:'inherit', opacity:t.disabled?0.35:1, transition:'background .15s' }}>
                <span style={{ fontSize:'13px', fontWeight:700, color:tab===t.id?'#fff':COLORS.t3 }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 집행 비용 탭 ── */}
        {tab === 'spend' && (
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
                          <span style={{ fontSize:'15px', fontWeight:800, color:COLORS.t1 }}>{fmtM(groupTotal)}원</span>
                        </div>
                        <div style={{ height:'4px', background:COLORS.bgMuted, borderRadius:'2px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:g.color, borderRadius:'2px' }} />
                        </div>
                        <div style={{ fontSize:'10px', color:COLORS.t4, marginTop:'4px' }}>{g.subs.length}개 항목 · {pct}%</div>
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

          </div>
        )}

        {/* ── 카드 내역 탭 ── */}
        {tab === 'card' && (
          <div style={{ padding:'12px 16px 32px' }}>
            <div style={{ display:'flex', gap:'6px', marginBottom:'12px' }}>
              {CARD_LABELS.map(f=>(
                <button key={f} onClick={()=>setCardFilter(f)} style={{ padding:'7px 14px', background:cardFilter===f?theme.brandDark:COLORS.bgCard, boxShadow:SHADOWS.card, color:cardFilter===f?'#fff':COLORS.t2, border:'none', borderRadius:RADIUS.pill, fontSize:'12px', fontWeight:cardFilter===f?700:500, cursor:'pointer', fontFamily:'inherit' }}>{f}</button>
              ))}
            </div>
            {cardFilter === '전체' && (
              <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                {['주 카드','여행용'].map(cardName=>{
                  const ct = CARD_TXNS.filter(t=>t.card===cardName&&t.status!=='blocked')
                  const sum = ct.reduce((s,t)=>s+t.amount,0)
                  return (
                    <button key={cardName} onClick={()=>setCardFilter(cardName)} style={{ flex:1, background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, padding:'12px 14px', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                      <div style={{ fontSize:'11px', color:COLORS.t4, marginBottom:'3px' }}>{cardName}</div>
                      <div style={{ fontSize:'16px', fontWeight:800, color:COLORS.t1 }}>{fmtM(sum)}원</div>
                      <div style={{ fontSize:'10px', color:COLORS.t4, marginTop:'2px' }}>{ct.length}건</div>
                    </button>
                  )
                })}
              </div>
            )}
            <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, overflow:'hidden' }}>
              {filteredCards.map((p,i,arr)=>{
                const blocked = p.status==='blocked'
                return (
                  <button key={p.id} onClick={()=>setDetail({type:'card',id:p.id})} style={{ width:'100%', padding:'13px 14px', background:'transparent', border:'none', borderBottom:i<arr.length-1?`1px solid ${COLORS.borderSoft}`:'none', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                    <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:blocked?'#FEF2F2':COLORS.bgMuted, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>
                      {blocked?'🚫':'💳'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:blocked?'#EF4444':COLORS.t1, marginBottom:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize:'10px', color:COLORS.t4 }}>{p.meta} · {p.card} · {p.cat}</div>
                    </div>
                    <span style={{ fontSize:'13px', fontWeight:700, color:blocked?'#EF4444':COLORS.t1, flexShrink:0 }}>
                      {blocked?'차단':`${fmt(p.amount)}원`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </PhoneShell>
  )
}
