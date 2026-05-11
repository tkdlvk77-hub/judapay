import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomTab from '../components/BottomTab'
import {
  PhoneShell, GradientHeader, ProfileBadge, BalanceCard, CircleAction,
} from '../design/components'
import { getAccountTheme } from '../design/accountTokens'

// ─── 공통 카드 스타일 ─────────────────────────────────────
const CARD_STYLE = {
  background:'#FFFFFF',
  borderRadius:'14px',
  border:'1px solid #E9EAEC',
  overflow:'hidden',
}

// ─── 처리 필요 항목 ───────────────────────────────────────
const TODO_ITEMS = [
  { id:'t1', text:'지급 실패',       count:1, urgent:true,  route:'/payment-alerts' },
  { id:'t2', text:'이상거래 감지',   count:1, urgent:true,  route:'/payment-alerts' },
  { id:'t3', text:'미분류 결제',     count:2, urgent:false, route:'/card-payment'   },
  { id:'t4', text:'증빙 제출 대기',  count:1, urgent:false, route:'/payment-alerts' },
  { id:'t5', text:'지원금 만료 임박',count:1, urgent:false, route:'/wallet'         },
  { id:'t6', text:'잔액 부족 위험',  count:0, urgent:true,  route:'/wallet'         },
].filter(t => t.count > 0)

// ─── 실시간 결제 ──────────────────────────────────────────
const LIVE_PAYMENTS = [
  { id:'p1', merchant:'스타벅스 강남점', sub:'오늘 09:12 · MY 지갑', amount:-4500,  status:'normal',  type:'mine'     },
  { id:'o1', merchant:'카페 결제',       sub:'방금 · 박철수 · 외주비', amount:-4500,  status:'normal',  type:'external', user:'박철수' },
  { id:'p2', merchant:'이마트 역삼점',   sub:'어제 14:32 · MY 지갑', amount:-32000, status:'normal',  type:'mine'     },
  { id:'o2', merchant:'편의점 결제',     sub:'오늘 · 이민형 · 대여금', amount:-3200,  status:'normal',  type:'external', user:'이민형' },
  { id:'p3', merchant:'GS게임센터',      sub:'4.28 22:14 · MCC 차단', amount:0,      status:'blocked', type:'mine'     },
  { id:'o3', merchant:'카지노 결제 시도',sub:'4.29 · 박철수 · 외주비', amount:0,      status:'blocked', type:'external', user:'박철수' },
]

// ─── 집행 상황 ─────────────────────────────────────────────
// 개인 권한 자금 집행 (빈 배열이면 빈 상태 메시지 노출)
const EXECUTING = []

// ─── 섹션 헤더 ────────────────────────────────────────────
function SectionHeader({ eyebrow, title, actionLabel, onAction }) {
  const theme = getAccountTheme()
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'14px 16px', borderBottom:'1px solid #F0F1F3' }}>
      <div>
        {eyebrow && <div style={{ fontSize:'10px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.8px', marginBottom:'3px' }}>{eyebrow}</div>}
        <div style={{ fontSize:'13px', fontWeight:700, color:'#111827' }}>{title}</div>
      </div>
      {actionLabel && (
        <button onClick={onAction} style={{ fontSize:'12px', fontWeight:600, color: theme.brandDark,
          background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
          {actionLabel} ›
        </button>
      )}
    </div>
  )
}

// ─── 아이콘 ───────────────────────────────────────────────
const PlusIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const ZapIcon   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const CardIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><line x1="2" y1="11" x2="22" y2="11"/></svg>
const ArrowIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="18" x2="18" y2="6"/><polyline points="9 6 18 6 18 15"/></svg>
const TrendIcon = () => <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 10 L6 6 L8 8 L12 4" stroke="#34D399" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/><polyline points="9 4 12 4 12 7" stroke="#34D399" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
const PersonalEmoji = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><circle cx="18" cy="13" r="1.5" fill="white"/></svg>
const ShieldIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="15" r="0.5" fill="#EF4444"/></svg>
const BlockIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>

function fmt(n) { return Number(Math.abs(n) || 0).toLocaleString('ko-KR') }

export default function HomePersonal() {
  const navigate = useNavigate()
  const theme = getAccountTheme()
  const [todoExpanded, setTodoExpanded] = useState(false)

  return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto' }}>

        {/* ── 헤더 ── */}
        <GradientHeader paddingBottom="16px">
          <ProfileBadge
            icon={<PersonalEmoji />}
            accent="PERSONAL"
            name="이호형"
            sub={null}
            action={
              LIVE_PAYMENTS.filter(p => p.status === 'blocked').length > 0 ? (
                <button onClick={() => navigate('/payment-alerts')} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px', background:'rgba(239,68,68,0.25)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:'20px', cursor:'pointer', fontFamily:'inherit' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#EF4444' }} />
                  <span style={{ fontSize:'11px', fontWeight:700, color:'#FCA5A5' }}>
                    이상 {LIVE_PAYMENTS.filter(p => p.status === 'blocked').length}건
                  </span>
                </button>
              ) : null
            }
          />
          <BalanceCard
            label="출금 가능 잔액"
            amount="1,250,000"
            onClick={() => navigate('/wallet')}
            sub={
              <span style={{ display:'inline-flex', alignItems:'center', gap:'5px' }}>
                <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#34D399', display:'inline-block' }} />
                받은 자금 <strong style={{ color:'#fff', fontWeight:600 }}>320,000원</strong>
              </span>
            }
            secondary={
              <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', color:'#34D399', fontWeight:600 }}>
                <TrendIcon /> +3.2%
              </span>
            }
            action={
              <button style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)', padding:0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            }
          />
          <div style={{ display:'flex', justifyContent:'space-around', padding:'14px 24px 4px' }}>
            <CircleAction icon={<PlusIcon />} label="충전" onClick={() => navigate('/charge')} />
            <CircleAction icon={<ZapIcon />} label="지급집행" active onClick={() => navigate('/execute')} />
            <CircleAction icon={<CardIcon />} label="카드결제" onClick={() => navigate('/card-payment')} />
            <CircleAction icon={<ArrowIcon />} label="출금" onClick={() => navigate('/withdraw')} />
          </div>
        </GradientHeader>

        {/* ── 콘텐츠 ── */}
        <style>{`
          @keyframes p-pulse-ring {
            0%   { transform:scale(1);   opacity:0.7; }
            70%  { transform:scale(1.9); opacity:0; }
            100% { transform:scale(1.9); opacity:0; }
          }
          @keyframes p-badge-beat {
            0%,100% { transform:scale(1); }
            30%     { transform:scale(1.12); }
            60%     { transform:scale(0.96); }
          }
          .p-pulse-ring { animation:p-pulse-ring 1.8s ease-out infinite; }
          .p-badge-beat { animation:p-badge-beat 1.8s ease-in-out infinite; }
        `}</style>

        <div style={{ padding:'14px 14px 100px', display:'flex', flexDirection:'column', gap:'10px', background:'#F4F5F7' }}>

          {/* ── 1. 처리 필요 항목 ── */}
          <div style={{ ...CARD_STYLE, border: TODO_ITEMS.length > 0 ? '1px solid #FECACA' : '1px solid #E9EAEC' }}>
            <button onClick={() => setTodoExpanded(v => !v)}
              style={{ width:'100%', padding:'14px 16px', background:'transparent', border:'none',
                borderBottom: todoExpanded ? '1px solid #FEE2E2' : 'none',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
              <div>
                <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.8px', marginBottom:'3px',
                  color: TODO_ITEMS.length > 0 ? '#EF4444' : '#9CA3AF' }}>
                  {TODO_ITEMS.length > 0 ? '⚠ 긴급' : 'TODAY'}
                </div>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#111827' }}>처리 필요 항목</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                {TODO_ITEMS.length > 0 && (
                  <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div className="p-pulse-ring" style={{ position:'absolute', width:'100%', height:'100%', borderRadius:'20px', background:'#EF4444', pointerEvents:'none' }} />
                    <span className="p-badge-beat" style={{ position:'relative', fontSize:'12px', fontWeight:800, color:'#fff', background:'#EF4444', padding:'3px 12px', borderRadius:'20px' }}>
                      {TODO_ITEMS.reduce((s,t) => s+t.count, 0)}건
                    </span>
                  </div>
                )}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: todoExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </button>
            {todoExpanded && TODO_ITEMS.map((item, i) => (
              <button key={item.id} onClick={() => navigate(item.route)}
                style={{ width:'100%', padding:'12px 16px', background:'transparent', border:'none',
                  borderTop: i===0 ? 'none' : '1px solid #F0F1F3',
                  display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                <div style={{ width:'7px', height:'7px', borderRadius:'50%', flexShrink:0,
                  background: item.urgent ? '#EF4444' : '#9CA3AF' }} />
                <span style={{ flex:1, fontSize:'13px', color:'#1F2937', fontWeight:500 }}>{item.text}</span>
                <span style={{ fontSize:'13px', fontWeight:700,
                  color: item.urgent ? '#DC2626' : '#374151',
                  background: item.urgent ? '#FEF2F2' : '#F3F4F6',
                  padding:'2px 10px', borderRadius:'20px', textAlign:'center' }}>
                  {item.count}
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ))}
          </div>

          {/* ── 2. 실시간 결제 ── */}
          <div style={CARD_STYLE}>
            <SectionHeader eyebrow="LIVE" title="실시간 결제" actionLabel="전체 보기" onAction={() => navigate('/payment-alerts')} />
            {LIVE_PAYMENTS.map((p, i) => {
              const isBlocked = p.status === 'blocked'
              const isExternal = p.type === 'external'
              const dotColor = isBlocked ? '#EF4444' : '#D1D5DB'
              const amountText = isBlocked ? 'MCC 차단' : `-${fmt(p.amount)}원`
              const amountColor = isBlocked ? '#DC2626' : '#111827'
              return (
                <button key={p.id} onClick={() => navigate('/payments/' + p.id)}
                  style={{ width:'100%', padding:'12px 16px', background:'transparent', border:'none',
                    borderTop: i===0 ? 'none' : '1px solid #F0F1F3',
                    display:'flex', alignItems:'center', gap:'10px',
                    cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', flexShrink:0, background: dotColor }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:'8px', marginBottom:'4px' }}>
                      <span style={{ fontSize:'13px', fontWeight:600, color: isBlocked ? '#DC2626' : '#111827',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                        {p.merchant}
                      </span>
                      <span style={{ fontSize:'13px', fontWeight:700, color: amountColor, flexShrink:0 }}>{amountText}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                      {isExternal && p.user && (
                        <>
                          <span style={{ fontSize:'11px', fontWeight:700, color: theme.brandDark, flexShrink:0 }}>{p.user}</span>
                          <span style={{ fontSize:'11px', color:'#D1D5DB' }}>·</span>
                        </>
                      )}
                      <span style={{ fontSize:'11px', color:'#9CA3AF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.sub}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* ── 3. 집행 상황 ── */}
          <div style={CARD_STYLE}>
            <SectionHeader eyebrow="IN PROGRESS" title="집행 상황" actionLabel="집행 통계" onAction={() => navigate('/stats')} />
            {EXECUTING.length === 0 ? (
              <div style={{ padding:'28px 16px', textAlign:'center' }}>
                <div style={{ fontSize:'13px', color:'#9CA3AF', lineHeight:1.7 }}>
                  현재 권한 자금 집행 내역이 없습니다.
                </div>
              </div>
            ) : EXECUTING.map((item, i) => {
              const pct = Math.round(item.current / item.total * 100)
              return (
                <button key={item.id} onClick={() => navigate('/control-center/recipient/' + item.recipientId)}
                  style={{ width:'100%', padding:'13px 16px', background:'transparent', border:'none',
                    borderTop: i===0 ? 'none' : '1px solid #F0F1F3',
                    display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background: theme.brandDark+'12',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'13px', fontWeight:800, color: theme.brandDark, flexShrink:0 }}>
                    {item.name[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                      <span style={{ fontSize:'13px', fontWeight:600, color:'#111827' }}>{item.name}</span>
                      <span style={{ fontSize:'13px', fontWeight:700, color:'#111827' }}>{(item.current/10000).toFixed(0)}만원</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                      <span style={{ fontSize:'11px', color:'#6B7280' }}>{item.type}</span>
                      <span style={{ fontSize:'10px', color:'#9CA3AF' }}>{pct}% 소진</span>
                    </div>
                    <div style={{ height:'3px', borderRadius:'2px', background:'#F3F4F6' }}>
                      <div style={{ width:pct+'%', height:'100%', background: theme.activeBtnGrad || theme.brandDark, borderRadius:'2px' }} />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

        </div>
      </div>

      <BottomTab />
    </PhoneShell>
  )
}
