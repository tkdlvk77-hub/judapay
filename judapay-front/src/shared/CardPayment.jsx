import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'
import MccBlock, { DEFAULT_MCC } from './execute/MccBlock'

// ─────────────────────────────────────────────────────────
// 데모 카드 데이터
// ─────────────────────────────────────────────────────────
const INITIAL_CARDS = [
  {
    id: 'card_1',
    holder: '이호형',
    type: '마스터',
    number: '5234 7891 2345 0001',
    numberMasked: '5234 **** **** 0001',
    validThru: '05/31',
    cvc: '342',
    label: '주 카드',
    balance: 1932000,
  },
  {
    id: 'card_2',
    holder: '이호형',
    type: '마스터',
    number: '5234 7891 2345 0082',
    numberMasked: '5234 **** **** 0082',
    validThru: '05/31',
    cvc: '519',
    label: '여행용',
    balance: 450000,
  },
]

// 카드별 결제 내역
const CARD_PAYMENTS = {
  card_1: [
    { id:'p1', name:'이마트 역삼점',        meta:'5.5 14:32 · 서울시 교육비', amount:-32000, status:'normal' },
    { id:'p2', name:'스타벅스',             meta:'5.5 09:15 · 엄마 용돈',     amount:-7500,  status:'normal' },
    { id:'p3', name:'GS강남게임센터 (차단)', meta:'4.28 22:14 · MCC 7993 차단', amount:0,    status:'blocked' },
    { id:'p4', name:'올리브영',             meta:'4.27 16:44 · MY 지갑',       amount:-23000, status:'normal' },
  ],
  card_2: [
    { id:'p5', name:'인천공항 면세점',      meta:'5.1 10:22 · MY 지갑',        amount:-156000, status:'normal' },
    { id:'p6', name:'싱가포르 Grab',        meta:'4.30 14:05 · MY 지갑',       amount:-18500,  status:'normal' },
    { id:'p7', name:'카지노 (차단)',         meta:'4.29 23:11 · MCC 7011 차단', amount:0,       status:'blocked' },
  ],
}

const WALLET_PRIORITY = [
  { id:'edu', label:'서울시 · 4월 교육비', sub:'만료 D-3',    amount:50000,  dotColor:'#10B981' },
  { id:'mom', label:'엄마 · 용돈',        sub:'식비·마트만',  amount:450000, dotColor:'#F59E0B' },
  { id:'my',  label:'MY 지갑',            sub:'제한 없음',    amount:932000, dotColor:'#9CA3AF' },
]

function fmt(n) { return Number(n || 0).toLocaleString('ko-KR') }

// ─────────────────────────────────────────────────────────
// 카드 비주얼
// ─────────────────────────────────────────────────────────
function PhysicalCard({ card, paused, revealed, onDetailClick }) {
  const theme = getAccountTheme()
  // 계정 타입별 카드 그라데이션
  const userType = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('bizType') : null
  const cardGrad = userType === 'business'
    ? `linear-gradient(135deg, #0A1628 0%, #0F2035 40%, #1E3A5F 70%, #0A1628 100%)`
    : `linear-gradient(135deg, #0A0A12 0%, #1A1238 35%, #2D1B5E 70%, #0A0A12 100%)`
  const glowColor = userType === 'business' ? `${theme.brandDark}55` : `${theme.brandDark}45`
  const shineColor = userType === 'business' ? 'rgba(56,189,248,0.18)' : 'rgba(168,139,255,0.22)'

  return (
    <div style={{
      background: cardGrad,
      borderRadius: RADIUS.lg,
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: `0 12px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)`,
      minHeight: '196px',
      display: 'flex', flexDirection: 'column',
      opacity: paused ? 0.75 : 1,
      transition: 'opacity .2s',
    }}>
      {/* 글로우 */}
      <div style={{ position:'absolute', top:'-40px', left:'-40px', width:'180px', height:'180px', background:`radial-gradient(circle, ${glowColor} 0%, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-60px', right:'-30px', width:'200px', height:'120px', background:`radial-gradient(ellipse, ${shineColor} 0%, transparent 70%)`, pointerEvents:'none' }} />
      {/* 사선 패턴 */}
      <div style={{ position:'absolute', inset:0, background:`repeating-linear-gradient(120deg, transparent 0px, transparent 18px, rgba(255,255,255,0.025) 18px, rgba(255,255,255,0.025) 19px)`, pointerEvents:'none' }} />

      {/* 헤더 */}
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
        <div>
          <div style={{ fontSize:'18px', fontWeight:800, color:'#fff', letterSpacing:'2px', textShadow:`0 0 10px ${theme.brand}50` }}>
            JUDA<span style={{ color: theme.brandLight || theme.brand, fontWeight:300 }}>PAY</span>
          </div>
          <div style={{ fontSize:'8px', color:`${theme.brandLight || theme.brand}99`, letterSpacing:'4px', marginTop:'2px', fontWeight:600 }}>
            {card.label.toUpperCase()}
          </div>
        </div>
        <span style={{
          padding:'4px 10px',
          background: paused ? 'rgba(252,211,77,0.20)' : 'rgba(52,211,153,0.20)',
          color: paused ? '#FCD34D' : '#34D399',
          border: `1px solid ${paused ? 'rgba(252,211,77,0.35)' : 'rgba(52,211,153,0.35)'}`,
          borderRadius: RADIUS.pill,
          fontSize:'10px', fontWeight:700,
        }}>
          {paused ? '일시정지' : '사용 가능'}
        </span>
      </div>

      {/* 명의 */}
      <div style={{ position:'relative', marginBottom:'12px' }}>
        <span style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{card.holder}</span>
        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)', marginLeft:'6px' }}>({card.type})</span>
      </div>

      {/* 번호 */}
      <div style={{ position:'relative', fontSize:'16px', fontWeight:600, color:'#fff', letterSpacing:'2px', marginBottom:'16px', fontFamily:'monospace' }}>
        {revealed ? card.number : card.numberMasked}
      </div>

      {/* 하단 */}
      <div style={{ position:'relative', display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginTop:'auto' }}>
        <div style={{ display:'flex', gap:'16px' }}>
          <div>
            <div style={{ fontSize:'8px', color:`${theme.brandLight || theme.brand}99`, letterSpacing:'1.5px', marginBottom:'2px', fontWeight:600 }}>VALID THRU</div>
            <div style={{ fontSize:'13px', fontWeight:600, color:'#fff', fontFamily:'monospace' }}>{revealed ? card.validThru : '** / **'}</div>
          </div>
          <div>
            <div style={{ fontSize:'8px', color:`${theme.brandLight || theme.brand}99`, letterSpacing:'1.5px', marginBottom:'2px', fontWeight:600 }}>CVC</div>
            <div style={{ fontSize:'13px', fontWeight:600, color:'#fff', fontFamily:'monospace' }}>{revealed ? card.cvc : '***'}</div>
          </div>
        </div>
        <button onClick={onDetailClick} style={{ background:'transparent', border:'none', color: theme.brandLight || theme.brand, fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', padding:0 }}>
          {revealed ? '숨기기' : '상세 보기 ›'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 액션 4버튼
// ─────────────────────────────────────────────────────────
function ActionGrid({ paused, onToggle, onQR, onIssue, onMCC }) {
  const theme = getAccountTheme()
  const items = [
    {
      label: paused ? '재개' : '일시정지',
      grad: paused ? 'linear-gradient(135deg,#9CA3AF,#6B7280)' : 'linear-gradient(135deg,#F97316,#EA580C)',
      icon: paused
        ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
      onClick: onToggle,
    },
    {
      label: 'QR 결제',
      grad: 'linear-gradient(135deg,#0EA5E9,#0284C7)',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><line x1="14" y1="14" x2="20" y2="14"/><line x1="14" y1="20" x2="20" y2="20"/><line x1="14" y1="14" x2="14" y2="20"/><line x1="17" y1="17" x2="21" y2="17"/></svg>,
      onClick: onQR,
    },
    {
      label: '발급',
      grad: `linear-gradient(135deg,${theme.brand},${theme.brandDark})`,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><line x1="2" y1="11" x2="22" y2="11"/><line x1="12" y1="15" x2="12" y2="18"/><line x1="10" y1="16.5" x2="14" y2="16.5"/></svg>,
      onClick: onIssue,
    },
    {
      label: 'MCC 설정',
      grad: 'linear-gradient(135deg,#10B981,#059669)',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      onClick: onMCC,
    },
  ]

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
      {items.map(item => (
        <button key={item.label} onClick={item.onClick} style={{ background: COLORS.bgCard, boxShadow: SHADOWS.card, border:'none', borderRadius: RADIUS.lg, padding:'12px 4px', display:'flex', flexDirection:'column', alignItems:'center', gap:'7px', cursor:'pointer', fontFamily:'inherit' }}>
          <div style={{ width:'52px', height:'52px', borderRadius:'14px', background: item.grad, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
            {item.icon}
          </div>
          <div style={{ fontSize:'11px', fontWeight:700, color: COLORS.t1 }}>{item.label}</div>
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Face ID 모달
// ─────────────────────────────────────────────────────────
function FaceIDModal({ onSuccess, onCancel }) {
  const theme = getAccountTheme()
  const [stage, setStage] = useState('scanning')
  useEffect(() => {
    const t = setTimeout(() => { setStage('success'); setTimeout(onSuccess, 500) }, 1500)
    return () => clearTimeout(t)
  }, [onSuccess])
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'24px', backdropFilter:'blur(8px)' }}>
      <div style={{ width:'100%', background:'linear-gradient(135deg,#14142B 0%,#0A0A12 100%)', border:`1px solid ${theme.brandDark}35`, borderRadius: RADIUS.lg, padding:'32px 24px', textAlign:'center' }}>
        <div style={{ width:'88px', height:'88px', margin:'0 auto 16px', borderRadius:'24px', background: stage==='success'?'rgba(52,211,153,0.20)':`${theme.brandDark}20`, border:`2px solid ${stage==='success'?'#34D399':theme.brandDark}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .3s' }}>
          {stage === 'scanning'
            ? <svg width="44" height="44" viewBox="0 0 64 64" fill="none"><path d="M8 18V12a4 4 0 0 1 4-4h6" stroke={theme.brandDark} strokeWidth="3" strokeLinecap="round"/><path d="M46 8h6a4 4 0 0 1 4 4v6" stroke={theme.brandDark} strokeWidth="3" strokeLinecap="round"/><path d="M56 46v6a4 4 0 0 1-4 4h-6" stroke={theme.brandDark} strokeWidth="3" strokeLinecap="round"/><path d="M18 56h-6a4 4 0 0 1-4-4v-6" stroke={theme.brandDark} strokeWidth="3" strokeLinecap="round"/><circle cx="24" cy="26" r="2" fill={theme.brandDark}/><circle cx="40" cy="26" r="2" fill={theme.brandDark}/><path d="M24 40c2 3 6 4 8 4s6-1 8-4" stroke={theme.brandDark} strokeWidth="2.5" strokeLinecap="round" fill="none"/></svg>
            : <svg width="44" height="36" viewBox="0 0 36 30" fill="none"><path d="M2 15l11 11L34 2" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          }
        </div>
        <div style={{ fontSize:'17px', fontWeight:700, color:'#fff', marginBottom:'6px' }}>
          {stage==='scanning' ? '얼굴을 인식하는 중' : '인증 완료'}
        </div>
        <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.55)', marginBottom:'20px' }}>
          {stage==='scanning' ? '카드 정보를 보려면 Face ID 인증이 필요해요' : '카드 정보가 표시됩니다'}
        </div>
        {stage==='scanning' && (
          <button onClick={onCancel} style={{ padding:'10px 24px', background:'transparent', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.18)', borderRadius: RADIUS.md, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>취소</button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 카드 발급 바텀시트
// ─────────────────────────────────────────────────────────
function IssueCardSheet({ onClose, onIssue }) {
  const theme = getAccountTheme()
  const [label, setLabel] = useState('')
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div style={{ background: COLORS.bgCard, borderRadius:`${RADIUS.lg} ${RADIUS.lg} 0 0`, padding:'20px 16px 32px' }}>
        <div style={{ width:'36px', height:'4px', background: COLORS.border, borderRadius:'2px', margin:'0 auto 18px' }} />
        <div style={{ fontSize:'16px', fontWeight:700, color: COLORS.t1, marginBottom:'6px' }}>새 카드 발급</div>
        <div style={{ fontSize:'12px', color: COLORS.t4, marginBottom:'20px' }}>추가 카드를 즉시 발급받아요. 같은 계좌에서 결제됩니다.</div>
        <div style={{ marginBottom:'16px' }}>
          <div style={{ fontSize:'12px', fontWeight:700, color: COLORS.t2, marginBottom:'8px' }}>카드 별명 (선택)</div>
          <input
            type="text" value={label} onChange={e => setLabel(e.target.value)}
            placeholder="예: 여행용, 업무용, 가족용"
            style={{ width:'100%', height:'46px', padding:'0 14px', background: COLORS.bg, border:`1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, fontSize:'13px', color: COLORS.t1, fontFamily:'inherit', outline:'none' }}
          />
        </div>
        <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius: RADIUS.md, padding:'10px 12px', fontSize:'11px', color:'#92400E', marginBottom:'18px', lineHeight:1.6 }}>
          가상 카드로 즉시 발급됩니다. 실물 카드는 영업일 3~5일 내 배송됩니다.
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={onClose} style={{ flex:1, height:'48px', background: COLORS.bgMuted, color: COLORS.t2, border:'none', borderRadius: RADIUS.md, fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>취소</button>
          <button onClick={() => onIssue(label || '추가 카드')} style={{ flex:2, height:'48px', background: theme.brandDark, color:'#fff', border:'none', borderRadius: RADIUS.md, fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>즉시 발급</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// MCC 설정 바텀시트
// ─────────────────────────────────────────────────────────
function MCCSheet({ mccItems, onChange, onClose }) {
  const theme = getAccountTheme()
  const blockedCount = mccItems.filter(m => m.block).length
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div style={{ background: COLORS.bgCard, borderRadius:`${RADIUS.lg} ${RADIUS.lg} 0 0`, padding:'20px 16px 32px', maxHeight:'80%', overflowY:'auto' }}>
        <div style={{ width:'36px', height:'4px', background: COLORS.border, borderRadius:'2px', margin:'0 auto 18px' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
          <div style={{ fontSize:'16px', fontWeight:700, color: COLORS.t1 }}>MCC 차단 설정</div>
          {blockedCount > 0 && (
            <span style={{ fontSize:'12px', fontWeight:700, color:'#DC2626', background:'#FEE2E2', padding:'2px 8px', borderRadius:'6px' }}>
              {blockedCount}개 차단 중
            </span>
          )}
        </div>
        <div style={{ fontSize:'12px', color: COLORS.t4, marginBottom:'16px' }}>차단 항목은 이 카드로 결제 불가합니다.</div>
        <MccBlock items={mccItems} onChange={onChange} theme={theme} />
        <button onClick={onClose} style={{ width:'100%', height:'50px', marginTop:'16px', background: theme.brandDark, color:'#fff', border:'none', borderRadius: RADIUS.md, fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          저장
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────
export default function CardPayment() {
  const theme = getAccountTheme()
  const navigate = useNavigate()

  // 카드 목록 state
  const [cards, setCards] = useState(INITIAL_CARDS)
  const [selectedIdx, setSelectedIdx] = useState(0)

  // 카드별 독립 state (paused, revealed, mccItems)
  const [cardStates, setCardStates] = useState(() =>
    Object.fromEntries(INITIAL_CARDS.map(c => [c.id, {
      paused: false,
      revealed: false,
      mccItems: DEFAULT_MCC.map(m => ({ ...m })),
    }]))
  )

  // 모달/시트 state
  const [showFaceID, setShowFaceID] = useState(false)
  const [showIssue, setShowIssue] = useState(false)
  const [showMCC, setShowMCC] = useState(false)
  const [showWalletPicker, setShowWalletPicker] = useState(false)
  const [selectedWalletId, setSelectedWalletId] = useState('my')

  const card = cards[selectedIdx]
  const cs = cardStates[card?.id] || { paused:false, revealed:false, mccItems: DEFAULT_MCC }

  const updateCardState = (cardId, patch) =>
    setCardStates(prev => ({ ...prev, [cardId]: { ...prev[cardId], ...patch } }))

  const handleDetailClick = () => {
    if (cs.revealed) { updateCardState(card.id, { revealed: false }); return }
    setShowFaceID(true)
  }

  const handleIssue = (label) => {
    const newCard = {
      id: `card_${Date.now()}`,
      holder: '이호형',
      type: '마스터',
      number: `5234 7891 2345 ${String(Math.floor(Math.random()*9000)+1000)}`,
      numberMasked: '5234 **** **** ****',
      validThru: '05/31',
      cvc: String(Math.floor(Math.random()*900)+100),
      label,
      balance: 0,
    }
    setCards(prev => [...prev, newCard])
    setCardStates(prev => ({ ...prev, [newCard.id]: { paused:false, revealed:false, mccItems: DEFAULT_MCC.map(m=>({...m})) } }))
    setSelectedIdx(cards.length)
    setShowIssue(false)
  }

  const payments = CARD_PAYMENTS[card?.id] || []

  return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>

        {/* 헤더 */}
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <button onClick={() => navigate(-1)} style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{ fontSize:'17px', fontWeight:700, color:'#fff' }}>카드 관리</span>
            </div>
            <button onClick={() => setShowIssue(true)} style={{ display:'flex', alignItems:'center', gap:'4px', background:'rgba(255,255,255,0.15)', border:'none', borderRadius: RADIUS.pill, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span style={{ fontSize:'12px', fontWeight:700, color:'#fff' }}>카드 발급</span>
            </button>
          </div>
        </div>

        <div style={{ padding:'18px 16px 32px' }}>

          {/* ── 카드 스와이프 영역 ── */}
          <div style={{ marginBottom:'14px' }}>
            <PhysicalCard
              card={card}
              paused={cs.paused}
              revealed={cs.revealed}
              onDetailClick={handleDetailClick}
            />
          </div>

          {/* 카드 선택 인디케이터 */}
          {cards.length > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'6px', marginBottom:'14px' }}>
              {cards.map((c, i) => (
                <button key={c.id} onClick={() => setSelectedIdx(i)} style={{ width: i===selectedIdx ? '20px' : '7px', height:'7px', borderRadius:'4px', background: i===selectedIdx ? theme.brandDark : COLORS.border, border:'none', cursor:'pointer', padding:0, transition:'all .2s' }} />
              ))}
            </div>
          )}

          {/* 카드 라벨 탭 (카드 여러 장일 때) */}
          {cards.length > 1 && (
            <div style={{ display:'flex', gap:'8px', marginBottom:'18px', overflowX:'auto', paddingBottom:'2px' }}>
              {cards.map((c, i) => (
                <button key={c.id} onClick={() => setSelectedIdx(i)} style={{ flexShrink:0, padding:'6px 14px', background: i===selectedIdx ? theme.brandDark : COLORS.bgCard, color: i===selectedIdx ? '#fff' : COLORS.t3, border: i===selectedIdx ? 'none' : `1px solid ${COLORS.border}`, borderRadius: RADIUS.pill, fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow: i===selectedIdx ? SHADOWS.card : 'none', transition:'all .15s' }}>
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* 출금 지갑 — 한 줄 */}
          {(() => {
            const w = WALLET_PRIORITY.find(w => w.id === selectedWalletId) || WALLET_PRIORITY[0]
            return (
              <div style={{ background: COLORS.bgCard, boxShadow: SHADOWS.card, borderRadius: RADIUS.lg, padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                <span style={{ fontSize:'11px', fontWeight:600, color: COLORS.t4, flexShrink:0 }}>출금 지갑</span>
                <span style={{ width:'7px', height:'7px', borderRadius:'50%', background: w.dotColor, flexShrink:0 }} />
                <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1, flex:1, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{w.label}</span>
                <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1, flexShrink:0 }}>{fmt(w.amount)}원</span>
                <button onClick={() => setShowWalletPicker(true)} style={{ flexShrink:0, padding:'5px 10px', background: `${theme.brandDark}12`, color: theme.brandDark, border:`1px solid ${theme.brandDark}25`, borderRadius: RADIUS.pill, fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>변경</button>
              </div>
            )
          })()}

          {/* 4개 액션 */}
          <div style={{ marginBottom:'22px' }}>
            <ActionGrid
              paused={cs.paused}
              onToggle={() => updateCardState(card.id, { paused: !cs.paused })}
              onQR={() => alert('QR 결제 (추후 구현)')}
              onIssue={() => setShowIssue(true)}
              onMCC={() => setShowMCC(true)}
            />
          </div>

          {/* 이 카드 결제 내역 */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', padding:'0 4px' }}>
            <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1 }}>
              <span style={{ color: theme.brandDark }}>{card.label}</span> 결제 내역
            </span>
            <button onClick={() => navigate('/payments')} style={{ fontSize:'11px', fontWeight:600, color: theme.brandDark, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>전체 보기 ›</button>
          </div>
          {payments.length === 0 ? (
            <div style={{ background: COLORS.bgCard, boxShadow: SHADOWS.card, borderRadius: RADIUS.lg, padding:'28px 16px', textAlign:'center', color: COLORS.t4, fontSize:'13px' }}>
              결제 내역이 없어요
            </div>
          ) : (
            <div style={{ background: COLORS.bgCard, boxShadow: SHADOWS.card, borderRadius: RADIUS.lg, overflow:'hidden' }}>
              {payments.map((p, i, arr) => {
                const blocked = p.status === 'blocked'
                return (
                  <button key={p.id} onClick={() => navigate(`/payments/${p.id}`)} style={{ width:'100%', padding:'13px 16px', background:'transparent', border:'none', borderBottom: i<arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                    {/* 차단 아이콘 */}
                    {blocked && (
                      <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                      </div>
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color: blocked ? COLORS.danger : COLORS.t1, marginBottom:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize:'11px', color: COLORS.t4 }}>{p.meta}</div>
                    </div>
                    <span style={{ fontSize:'13px', fontWeight:700, color: blocked ? COLORS.danger : COLORS.t2, flexShrink:0 }}>
                      {blocked ? '차단' : `${fmt(p.amount)}원`}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Face ID 모달 */}
      {showFaceID && (
        <FaceIDModal
          onSuccess={() => { updateCardState(card.id, { revealed: true }); setShowFaceID(false) }}
          onCancel={() => setShowFaceID(false)}
        />
      )}

      {/* 카드 발급 시트 */}
      {showIssue && (
        <IssueCardSheet
          onClose={() => setShowIssue(false)}
          onIssue={handleIssue}
        />
      )}

      {/* MCC 설정 시트 */}
      {showMCC && (
        <MCCSheet
          mccItems={cs.mccItems}
          onChange={items => updateCardState(card.id, { mccItems: items })}
          onClose={() => setShowMCC(false)}
        />
      )}

      {/* 출금 지갑 변경 시트 */}
      {showWalletPicker && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ background: COLORS.bgCard, borderRadius:`${RADIUS.lg} ${RADIUS.lg} 0 0`, padding:'20px 16px 32px' }}>
            <div style={{ width:'36px', height:'4px', background: COLORS.border, borderRadius:'2px', margin:'0 auto 18px' }} />
            <div style={{ fontSize:'16px', fontWeight:700, color: COLORS.t1, marginBottom:'4px' }}>출금 지갑 변경</div>
            <div style={{ fontSize:'12px', color: COLORS.t4, marginBottom:'16px' }}>선택한 지갑에서 카드 결제가 차감됩니다.</div>
            <div style={{ background: COLORS.bg, borderRadius: RADIUS.lg, overflow:'hidden', marginBottom:'16px' }}>
              {WALLET_PRIORITY.map((w, i, arr) => {
                const isSelected = selectedWalletId === w.id
                return (
                  <button key={w.id} onClick={() => { setSelectedWalletId(w.id); setShowWalletPicker(false) }} style={{ width:'100%', padding:'14px 16px', background: isSelected ? `${theme.brandDark}10` : 'transparent', border:'none', borderBottom: i<arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                    <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: w.dotColor, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color: isSelected ? theme.brandDark : COLORS.t1, marginBottom:'2px' }}>{w.label}</div>
                      <div style={{ fontSize:'11px', color: COLORS.t4 }}>{w.sub}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'13px', fontWeight:700, color: isSelected ? theme.brandDark : COLORS.t1 }}>{fmt(w.amount)}원</span>
                      {isSelected && (
                        <div style={{ width:'18px', height:'18px', borderRadius:'50%', background: theme.brandDark, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 3.5 6.5 9 1"/></svg>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setShowWalletPicker(false)} style={{ width:'100%', height:'48px', background: COLORS.bgMuted, color: COLORS.t2, border:'none', borderRadius: RADIUS.md, fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  )
}
