import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'

// ─── 배지 ─────────────────────────────────────────────────
const BADGE = {
  my:        { bg: '#EDE9FE', color: '#5B21B6', label: 'MY 지갑' },
  withdraw:  { bg: '#D1FAE5', color: '#047857', label: '출금 가능' },
  invest:    { bg: '#EDE9FE', color: '#5B21B6', label: '지원금' },
  gift:      { bg: '#FEF3C7', color: '#92400E', label: '선물' },
  lend:      { bg: '#DBEAFE', color: '#1E40AF', label: '대여금' },
  freelance: { bg: '#FEF9C3', color: '#713F12', label: '외주비' },
}
function Badge({ text, tone }) {
  const s = BADGE[tone] || BADGE.my
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', background: s.bg, color: s.color, fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
      {text || s.label}
    </span>
  )
}

// ─── 액션 버튼 ────────────────────────────────────────────
function ActionBtn({ label, icon, onClick }) {
  const theme = getAccountTheme()
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flex: 1 }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '18px', background: theme.activeBtnGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.activeShadow }}>
        {icon}
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{label}</span>
    </button>
  )
}

// ─── 데이터 ──────────────────────────────────────────────
const WALLET_DATA = {
  my: {
    id: 'my', label: '내 지갑', sub: '충전 + 노동 대가 통합',
    amount: 1932000, tone: 'my',
    badges: ['my', 'withdraw'],
    monthly: { received: 1500000, executed: -820000, withdrawn: -450000 },
    limit: { used: 1280000, total: 5000000 },
    txns: [
      { id: 't1', group: '오늘', tag: '외주', tagColor: '#8B5CF6', tagBg: '#EDE9FE', name: '(주)오로라 디자인 외주', sub: '사업자 발신 · 입금 · 10분 전', amount: 500000, sign: 1 },
      { id: 't2', group: '오늘', tag: '집행', tagColor: '#DC2626', tagBg: '#FEE2E2', name: '박민준 · 빌려주기', sub: '차용증 + 오두막한 · 1시간 전', amount: -2500000, sign: -1 },
      { id: 't3', group: '어제', tag: '출금', tagColor: '#D97706', tagBg: '#FEF3C7', name: '국민은행 1234***5678', sub: '본인 명의 계좌 · 어제 18:42', amount: -450000, sign: -1 },
      { id: 't4', group: '어제', tag: '급여', tagColor: '#059669', tagBg: '#D1FAE5', name: '(주)오로라 11월 급여', sub: '사업자 발신 · 정기 · 어제 09:00', amount: 1200000, sign: 1 },
    ],
  },
}

// ─── 메인 ─────────────────────────────────────────────────
export default function WalletDetail() {
  const navigate = useNavigate()
  const { id = 'my' } = useParams()
  const theme = getAccountTheme()
  const wallet = WALLET_DATA[id] || WALLET_DATA.my
  const [activeTab, setActiveTab] = useState('전체')
  const TABS = ['전체', '충전', '집행', '출금']

  // 그룹별 거래
  const groups = wallet.txns.reduce((acc, t) => {
    if (!acc[t.group]) acc[t.group] = []
    acc[t.group].push(t)
    return acc
  }, {})

  const limitPct = Math.round((wallet.limit.used / wallet.limit.total) * 100)

  return (
    <PhoneShell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* 다크 헤더 */}
        <div style={{ background: theme.headerGrad, paddingTop: '20px', paddingBottom: '28px', flexShrink: 0 }}>

          {/* 상단 네비 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 16px' }}>
            <button onClick={() => navigate(-1)} style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>지갑 상세</span>
            <button style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1.5" fill="#fff"/><circle cx="12" cy="12" r="1.5" fill="#fff"/><circle cx="12" cy="19" r="1.5" fill="#fff"/>
              </svg>
            </button>
          </div>

          {/* 배지 + 이름 + 잔액 */}
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {wallet.badges.map(b => <Badge key={b} tone={b} />)}
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{wallet.label}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>{wallet.sub}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '38px', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px' }}>
                {wallet.amount.toLocaleString()}
              </span>
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>원</span>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div style={{ display: 'flex', padding: '0 20px' }}>
            <ActionBtn label="출금" onClick={() => navigate('/withdraw')} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>} />
            <ActionBtn label="집행" onClick={() => navigate('/execute')} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} />
            <ActionBtn label="충전" onClick={() => navigate('/charge')} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>} />
          </div>
        </div>

        {/* 라이트 영역 */}
        <div style={{ flex: 1, overflowY: 'auto', background: COLORS.bg }}>
          <div style={{ padding: '20px 16px 0' }}>

            {/* 이번 달 요약 */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: COLORS.t1 }}>이번 달 요약</span>
                <span style={{ fontSize: '11px', color: COLORS.t4 }}>2026.05</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <div style={{ flex: 1, background: '#F0FDF4', borderRadius: RADIUS.md, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#047857', fontWeight: 600, marginBottom: '4px' }}>받음</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#047857' }}>+{wallet.monthly.received.toLocaleString()}</div>
                </div>
                <div style={{ flex: 1, background: '#FEF2F2', borderRadius: RADIUS.md, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#DC2626', fontWeight: 600, marginBottom: '4px' }}>집행</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#DC2626' }}>{wallet.monthly.executed.toLocaleString()}</div>
                </div>
                <div style={{ flex: 1, background: '#FFFBEB', borderRadius: RADIUS.md, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#D97706', fontWeight: 600, marginBottom: '4px' }}>출금</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#D97706' }}>{wallet.monthly.withdrawn.toLocaleString()}</div>
                </div>
              </div>

              {/* 사용 한도 */}
              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: COLORS.t2, fontWeight: 600 }}>이번 달 사용 한도</span>
                <span style={{ fontSize: '12px', color: theme.brandDark, fontWeight: 700 }}>
                  {Math.round(wallet.limit.used / 10000)}만원 / {Math.round(wallet.limit.total / 10000)}만원
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: COLORS.bgMuted, overflow: 'hidden' }}>
                <div style={{ width: limitPct + '%', height: '100%', background: theme.activeBtnGrad, borderRadius: '3px' }} />
              </div>
            </div>

            {/* 탭 */}
            <div style={{ display: 'flex', background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '4px', gap: '4px', marginBottom: '16px', boxShadow: SHADOWS.card }}>
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, height: '34px', borderRadius: '10px',
                    background: activeTab === tab ? theme.brandDark : 'transparent',
                    color: activeTab === tab ? '#fff' : COLORS.t3,
                    border: 'none', fontSize: '12px', fontWeight: activeTab === tab ? 700 : 500,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                  }}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* 거래 내역 */}
          <div style={{ padding: '0 16px 32px' }}>
            {Object.entries(groups).map(([group, txns]) => (
              <div key={group} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.t4, marginBottom: '8px', padding: '0 4px' }}>
                  {group}
                </div>
                {txns.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderBottom: '1px solid ' + COLORS.borderSoft }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: t.tagBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: t.tagColor }}>{t.tag}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.t1, marginBottom: '2px' }}>{t.name}</div>
                      <div style={{ fontSize: '10px', color: COLORS.t4 }}>{t.sub}</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: t.sign > 0 ? '#047857' : COLORS.t1, flexShrink: 0 }}>
                      {t.sign > 0 ? '+' : ''}{t.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneShell>
  )
}
