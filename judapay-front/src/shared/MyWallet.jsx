import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'

// ─── 배지 스타일 ───────────────────────────────────────────
const BADGE = {
  my:        { bg: '#EDE9FE', color: '#5B21B6', label: 'MY 지갑' },
  withdraw:  { bg: '#D1FAE5', color: '#047857', label: '출금 가능' },
  deadline:  { bg: '#FEF3C7', color: '#92400E' },
  gift:      { bg: '#FEF3C7', color: '#92400E', label: '선물' },
  lend:      { bg: '#DBEAFE', color: '#1E40AF', label: '대여금' },
  invest:    { bg: '#EDE9FE', color: '#5B21B6', label: '지원금' },
  freelance: { bg: '#FEF9C3', color: '#713F12', label: '외주비' },
  muted:     { bg: '#F3F4F6', color: '#6B7280', label: '거의 완료' },
}

function Badge({ text, tone }) {
  const s = BADGE[tone] || BADGE.my
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '20px',
      background: s.bg, color: s.color,
      fontSize: '10px', fontWeight: 700, flexShrink: 0,
    }}>
      {text || s.label}
    </span>
  )
}

// ─── 헤더 ─────────────────────────────────────────────────
function Header({ total, walletCount, onBack }) {
  const theme = getAccountTheme()
  return (
    <div style={{ background: theme.headerGrad, paddingTop: '20px', paddingBottom: '28px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px 20px', gap: '8px' }}>
        <button onClick={onBack} style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <span style={{ fontSize: '17px', fontWeight: 700, color: '#fff', flex: 1 }}>내 지갑</span>
      </div>
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', fontWeight: 600 }}>총 보유 자금</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px' }}>
          <span style={{ fontSize: '38px', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px' }}>
            {total.toLocaleString()}
          </span>
          <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>원</span>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
          <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: theme.brand, marginRight: '6px', verticalAlign: 'middle' }} />
          활성 지갑 {walletCount}개 · MY 지갑 + 받은 지갑 {walletCount - 1}개
        </div>
      </div>
    </div>
  )
}

// ─── MY 지갑 액션 버튼 ────────────────────────────────────
function MyActionBtn({ label, icon, onClick }) {
  const theme = getAccountTheme()
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flex: 1 }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: theme.activeBtnGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.activeShadow }}>
        {icon}
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.t2 }}>{label}</span>
    </button>
  )
}

// ─── 지갑 카드 ────────────────────────────────────────────
function WalletCard({ wallet, onClick, isDragging, isDragOver, onDragStart, onDragOver, onDragEnd, onDrop }) {
  const theme = getAccountTheme()
  const isMy = wallet.id === 'my'
  const barColor = wallet.fund === 'invest' ? '#0EA5E9' : wallet.fund === 'gift' ? '#F59E0B' : wallet.fund === 'lend' ? '#6366F1' : wallet.fund === 'freelance' ? '#10B981' : theme.brandDark
  const pct = wallet.amount > 0 ? Math.min(100, Math.round((wallet.amount / (wallet.totalAmount || wallet.amount)) * 100)) : 2

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver() }}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      onClick={onClick}
      style={{ background: COLORS.bgCard, boxShadow: isDragging ? SHADOWS.cardHover : SHADOWS.card, borderRadius: RADIUS.lg, padding: '16px', marginBottom: '10px', opacity: isDragging ? 0.5 : 1, outline: isDragOver ? `2px solid ${theme.brandDark}` : 'none', cursor: 'grab', transition: 'opacity .15s' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {isMy && <Badge tone="my" />}
          {isMy && <Badge tone="withdraw" />}
          {!isMy && wallet.deadlineDays && <Badge text={wallet.deadlineDays + "일 후 만료"} tone="deadline" />}
          {!isMy && wallet.fund === 'gift' && <Badge tone="gift" />}
          {!isMy && wallet.fund === 'lend' && <Badge tone="lend" />}
          {!isMy && wallet.fund === 'invest' && <Badge tone="invest" />}
          {!isMy && wallet.fund === 'freelance' && <Badge tone="freelance" />}
          {!isMy && wallet.amount < 5000 && <Badge text="거의 완료" tone="muted" />}
        </div>
        <span style={{ fontSize: '14px', fontWeight: 700, color: COLORS.t1, flexShrink: 0 }}>{wallet.amount.toLocaleString()}원</span>
      </div>

      <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.t1, marginBottom: '3px' }}>{wallet.label}</div>
      <div style={{ fontSize: '12px', color: COLORS.t3, marginBottom: '12px' }}>{wallet.sub}</div>

      <div style={{ height: '3px', borderRadius: '2px', background: COLORS.bgMuted, overflow: 'hidden', marginBottom: isMy ? '14px' : '0' }}>
        <div style={{ width: pct + '%', height: '100%', background: barColor, borderRadius: '2px', transition: 'width 0.4s ease' }} />
      </div>

      {isMy && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <MyActionBtn label="출금" onClick={(e) => e.stopPropagation()} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>} />
          <MyActionBtn label="집행" onClick={(e) => e.stopPropagation()} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} />
          <MyActionBtn label="충전" onClick={(e) => e.stopPropagation()} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>} />
        </div>
      )}
    </div>
  )
}

// ─── 완료된 지갑 ─────────────────────────────────────────
function CompletedCard({ wallet, isLast }) {
  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid ' + COLORS.borderSoft, padding: '13px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: COLORS.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.t2, marginBottom: '2px' }}>{wallet.label}</div>
        <div style={{ fontSize: '10px', color: COLORS.t4 }}>{wallet.sub}</div>
      </div>
      <span style={{ padding: '2px 8px', background: COLORS.bgMuted, color: COLORS.t4, borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>완료</span>
    </div>
  )
}

// ─── 데이터 ──────────────────────────────────────────────
const INIT_WALLETS = [
  { id: 'my', label: '내 지갑', sub: '충전 + 노동 대가 통합', amount: 1932000, totalAmount: 1932000, fund: null, deadlineDays: null },
  { id: 'edu', label: '서울시 · 교육비 지원', sub: '학원·서점 MCC 전용 · 카드 결제만', amount: 240000, totalAmount: 300000, fund: 'invest', deadlineDays: 56 },
  { id: 'mom', label: '엄마 · 용돈', sub: '3회 누적 · 카드 결제만', amount: 200000, totalAmount: 200000, fund: 'gift', deadlineDays: null },
  { id: 'lent', label: '박민준 · 빌려준 돈', sub: '잔액 거의 소진', amount: 820, totalAmount: 1000000, fund: 'lend', deadlineDays: null },
]
const COMPLETED = [
  { id: 'c1', label: '서울시 · 4월 교육비', sub: '잔액 사용 · 4/30' },
  { id: 'c2', label: '강남구 · 문화바우처', sub: '잔액 12만원 완료 · 3/31' },
]

// ─── 메인 ─────────────────────────────────────────────────
export default function MyWallet() {
  const navigate = useNavigate()
  const [wallets, setWallets] = useState(INIT_WALLETS)
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const total = wallets.reduce((s, w) => s + w.amount, 0)

  const handleDrop = (dropIdx) => {
    if (dragIdx === null || dragIdx === dropIdx) return
    const next = [...wallets]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(dropIdx, 0, moved)
    setWallets(next)
    setDragIdx(null); setOverIdx(null)
  }

  return (
    <PhoneShell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header total={total} walletCount={wallets.length} onBack={() => navigate(-1)} />

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 32px' }}>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.t1, marginBottom: '2px' }}>결제 우선순위</div>
                <div style={{ fontSize: '11px', color: COLORS.t4 }}>위에서부터 순서대로 사용</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: COLORS.t3, fontWeight: 600 }}>
                위에서부터 사용
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.t3} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              </div>
            </div>

            {wallets.map((w, i) => (
              <WalletCard
                key={w.id} wallet={w}
                onClick={() => navigate('/wallet/' + w.id)}
                isDragging={dragIdx === i} isDragOver={overIdx === i}
                onDragStart={() => setDragIdx(i)}
                onDragOver={() => setOverIdx(i)}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                onDrop={() => handleDrop(i)}
              />
            ))}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: COLORS.t1 }}>완료된 지갑 ({COMPLETED.length})</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: COLORS.t3, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '2px' }}>
                전체 보기 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.t3} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div style={{ background: COLORS.bgCard, boxShadow: SHADOWS.card, borderRadius: RADIUS.lg, padding: '0 16px' }}>
              {COMPLETED.map((w, i) => <CompletedCard key={w.id} wallet={w} isLast={i === COMPLETED.length - 1} />)}
            </div>
          </div>
        </div>
      </div>
    </PhoneShell>
  )
}
