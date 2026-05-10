import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomTab from '../components/BottomTab'
import {
  PhoneShell, GradientHeader, ProfileBadge, BalanceCard,
  CircleAction, Card, SectionHeader,
} from '../design/components'
import { COLORS, RADIUS, SHADOWS, FUND_COLORS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'

// ─── 데이터 ───────────────────────────────────────────────
const WALLETS = [
  { id:'fl', label:'박철수 · 외주비', sub:'검수 대기 · MCC 제한', amount:1500000, fund:'freelance', dotColor:'#2D6BB0' },
  { id:'my', label:'MY 지갑',        sub:'자유 사용',             amount:1250000, fund:null,        dotColor:'#9CA3AF' },
]

const MY_PAYMENTS = [
  { id:'p1', name:'스타벅스 강남점', meta:'오늘 09:12 · MY 지갑', amount:-4500,  status:'normal'  },
  { id:'p2', name:'이마트 역삼점',   meta:'어제 14:32 · MY 지갑', amount:-32000, status:'normal'  },
  { id:'p3', name:'GS게임센터',      meta:'4.28 22:14 · MCC 차단', amount:0,      status:'blocked' },
]

const OTHER_PAYMENTS = [
  { id:'o1', name:'박철수', category:'카페',   amount:4500,  meta:'방금 · 외주비',  status:'normal'  },
  { id:'o2', name:'이민형', category:'편의점', amount:3200,  meta:'오늘 · 대여금',  status:'normal'  },
  { id:'o3', name:'박철수', category:'카지노', amount:89000, meta:'4.29 · 외주비',  status:'blocked' },
]

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
  const [showWalletSheet, setShowWalletSheet] = useState(false)
  const [selectedWalletId, setSelectedWalletId] = useState('my')

  const activeWallet = WALLETS.find(w => w.id === selectedWalletId) || WALLETS[0]

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
              MY_PAYMENTS.concat(OTHER_PAYMENTS).filter(p => p.status === 'blocked').length > 0 ? (
                <button onClick={() => navigate('/payment-alerts')} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px', background:'rgba(239,68,68,0.25)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:'20px', cursor:'pointer', fontFamily:'inherit' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#EF4444' }} />
                  <span style={{ fontSize:'11px', fontWeight:700, color:'#FCA5A5' }}>
                    이상 {MY_PAYMENTS.concat(OTHER_PAYMENTS).filter(p => p.status === 'blocked').length}건
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
        <div style={{ padding:'20px 16px 100px' }}>

          {/* MCC 차단 알림 */}
          <button onClick={() => navigate('/alerts')} style={{ width:'100%', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius: RADIUS.md, padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
            <ShieldIcon />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#B91C1C', marginBottom:'1px' }}>MCC 차단 1건</div>
              <div style={{ fontSize:'11px', color:'#DC2626' }}>박철수 · GS게임센터 결제 차단됨</div>
            </div>
            <span style={{ color:'#DC2626', fontSize:'16px', flexShrink:0 }}>›</span>
          </button>

          {/* 결제 우선 순위 — 한 줄 카드 */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
            <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1 }}>결제 우선 순위</span>
            <button onClick={() => navigate('/wallet')} style={{ fontSize:'11px', fontWeight:600, color: theme.brandDark, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>전체 보기 ›</button>
          </div>
          <div style={{ background: COLORS.bgCard, boxShadow: SHADOWS.card, borderRadius: RADIUS.lg, padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
            <span style={{ fontSize:'11px', fontWeight:600, color: COLORS.t4, flexShrink:0 }}>출금 지갑</span>
            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background: activeWallet.dotColor, flexShrink:0 }} />
            <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1, flex:1, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {activeWallet.label}
            </span>
            <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1, flexShrink:0 }}>
              {activeWallet.amount.toLocaleString()}원
            </span>
            <button onClick={() => setShowWalletSheet(true)} style={{ flexShrink:0, padding:'5px 10px', background:`${theme.brandDark}12`, color: theme.brandDark, border:`1px solid ${theme.brandDark}25`, borderRadius: RADIUS.pill, fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              변경
            </button>
          </div>

          {/* 내 결제 알림 */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
            <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1 }}>내 결제 알림</span>
            <button onClick={() => navigate('/payment-alerts')} style={{ fontSize:'11px', fontWeight:600, color: theme.brandDark, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>전체 보기 ›</button>
          </div>
          <div style={{ background: COLORS.bgCard, boxShadow: SHADOWS.card, borderRadius: RADIUS.lg, overflow:'hidden', marginBottom:'20px' }}>
            {MY_PAYMENTS.map((p, i) => {
              const blocked = p.status === 'blocked'
              return (
                <button key={p.id} onClick={() => navigate(`/payments/${p.id}`)} style={{ width:'100%', padding:'13px 14px', borderBottom: i < MY_PAYMENTS.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', gap:'10px', background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'10px', background: blocked ? '#FEE2E2' : COLORS.bgMuted, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {blocked
                      ? <BlockIcon />
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><line x1="2" y1="11" x2="22" y2="11"/></svg>
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'13px', fontWeight:600, color: blocked ? '#DC2626' : COLORS.t1, marginBottom:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize:'11px', color: COLORS.t4 }}>{p.meta}</div>
                  </div>
                  {blocked
                    ? <span style={{ padding:'2px 8px', borderRadius:'8px', background:'#FEE2E2', color:'#DC2626', fontSize:'10px', fontWeight:700, flexShrink:0 }}>차단</span>
                    : <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t2, flexShrink:0 }}>-{fmt(p.amount)}원</span>
                  }
                </button>
              )
            })}
          </div>

          {/* 상대방 결제 알림 */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
            <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1 }}>상대방 결제 알림</span>
            <button onClick={() => navigate('/payment-alerts#other')} style={{ fontSize:'11px', fontWeight:600, color: theme.brandDark, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>전체 보기 ›</button>
          </div>
          <div style={{ background: COLORS.bgCard, boxShadow: SHADOWS.card, borderRadius: RADIUS.lg, overflow:'hidden', marginBottom:'8px' }}>
            {OTHER_PAYMENTS.map((p, i) => {
              const blocked = p.status === 'blocked'
              return (
                <button key={p.id} onClick={() => navigate('/other-payments')} style={{ width:'100%', padding:'13px 14px', borderBottom: i < OTHER_PAYMENTS.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', gap:'10px', background: blocked ? '#FFF5F5' : 'transparent', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'10px', background: blocked ? '#FEE2E2' : `${theme.brandDark}12`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color: blocked ? '#DC2626' : theme.brandDark, flexShrink:0 }}>
                    {p.name[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'2px' }}>
                      <span style={{ fontSize:'13px', fontWeight:600, color: blocked ? '#DC2626' : COLORS.t1 }}>{p.name}</span>
                      <span style={{ fontSize:'11px', color: blocked ? '#DC2626' : COLORS.t3, background: blocked ? '#FEE2E2' : COLORS.bgMuted, padding:'1px 6px', borderRadius:'4px', fontWeight:500, flexShrink:0 }}>
                        {blocked ? '🚫 ' : ''}{p.category}
                      </span>
                    </div>
                    <div style={{ fontSize:'11px', color: COLORS.t4 }}>{p.meta}</div>
                  </div>
                  {blocked
                    ? <span style={{ padding:'2px 8px', borderRadius:'8px', background:'#FEE2E2', color:'#DC2626', fontSize:'10px', fontWeight:700, flexShrink:0 }}>차단</span>
                    : <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t2, flexShrink:0 }}>{fmt(p.amount)}원</span>
                  }
                </button>
              )
            })}
          </div>
          <div style={{ fontSize:'10px', color: COLORS.t5, textAlign:'center', marginBottom:'8px' }}>
            🔒 상대방의 정확한 가맹점명은 보호됩니다 (단계형 공개 정책)
          </div>

        </div>
      </div>

      {/* 출금 지갑 변경 바텀시트 */}
      {showWalletSheet && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ background: COLORS.bgCard, borderRadius:`${RADIUS.lg} ${RADIUS.lg} 0 0`, padding:'20px 16px 32px' }}>
            <div style={{ width:'36px', height:'4px', background: COLORS.border, borderRadius:'2px', margin:'0 auto 18px' }} />
            <div style={{ fontSize:'16px', fontWeight:700, color: COLORS.t1, marginBottom:'4px' }}>출금 지갑 변경</div>
            <div style={{ fontSize:'12px', color: COLORS.t4, marginBottom:'16px' }}>카드 결제 시 차감되는 지갑을 선택하세요.</div>
            <div style={{ background: COLORS.bg, borderRadius: RADIUS.lg, overflow:'hidden', marginBottom:'16px' }}>
              {WALLETS.map((w, i, arr) => {
                const isSel = selectedWalletId === w.id
                return (
                  <button key={w.id} onClick={() => { setSelectedWalletId(w.id); setShowWalletSheet(false) }} style={{ width:'100%', padding:'14px 16px', background: isSel ? `${theme.brandDark}10` : 'transparent', border:'none', borderBottom: i<arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                    <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: w.dotColor, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color: isSel ? theme.brandDark : COLORS.t1, marginBottom:'2px' }}>{w.label}</div>
                      <div style={{ fontSize:'11px', color: COLORS.t4 }}>{w.sub}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'13px', fontWeight:700, color: isSel ? theme.brandDark : COLORS.t1 }}>{w.amount.toLocaleString()}원</span>
                      {isSel && (
                        <div style={{ width:'18px', height:'18px', borderRadius:'50%', background: theme.brandDark, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 3.5 6.5 9 1"/></svg>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setShowWalletSheet(false)} style={{ width:'100%', height:'48px', background: COLORS.bgMuted, color: COLORS.t2, border:'none', borderRadius: RADIUS.md, fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>닫기</button>
          </div>
        </div>
      )}

      <BottomTab />
    </PhoneShell>
  )
}
