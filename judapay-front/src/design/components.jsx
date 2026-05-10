import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING, TYPO, progressGradient } from './tokens'

// ─────────────────────────────────────────────────────────
// PhoneShell — 모든 화면의 최상위 컨테이너
// 내부에서 자동으로 flex column + 배경 처리
// ─────────────────────────────────────────────────────────
export function PhoneShell({ children, bg = COLORS.bg, ...rest }) {
  return (
    <div className="phone flex flex-col" style={{ background: bg, ...rest }}>
      {children}
    </div>
  )
}

// ─── 상태바 (9:41 5G) — 데모에서는 사용 안 함, 호환성 위해 export 유지 ──
export function StatusBar({ inverse = false }) {
  return null
}

// ─────────────────────────────────────────────────────────
// GradientHeader — 화면 상단의 다크 그라데이션 영역
// 홈/메시지/알림/더보기 모두 사용
// ─────────────────────────────────────────────────────────
export function GradientHeader({ children, paddingBottom = '24px', bg }) {
  return (
    <div style={{
      background: bg || GRADIENTS.header,
      paddingTop: '20px',
      paddingBottom,
      position: 'relative',
    }}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// PageTitle — 헤더 안의 큰 타이틀 (메시지/알림/더보기)
// ─────────────────────────────────────────────────────────
export function PageTitle({ title, subtitle, badge, right }) {
  return (
    <div style={{ padding: '4px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: COLORS.tInverse, letterSpacing: '-0.5px' }}>
          {title}
        </span>
        {badge != null && badge > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: '22px', height: '22px', padding: '0 7px',
            background: COLORS.danger, color: '#fff',
            borderRadius: RADIUS.pill,
            fontSize: '11px', fontWeight: 700,
          }}>
            {badge}
          </span>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// ProfileBadge — 프로필 영역 (이름 + 부제, 아이콘과 함께)
// ─────────────────────────────────────────────────────────
export function ProfileBadge({ icon, label, name, sub, action, accent = 'PERSONAL' }) {
  return (
    <div style={{ padding: '4px 20px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '44px', height: '44px',
        background: GRADIENTS.brandSubtle,
        borderRadius: RADIUS.md,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: SHADOWS.glass,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {accent && (
          <div style={{
            fontSize: '10px', color: COLORS.tInverseMuted,
            letterSpacing: '1.5px', fontWeight: 600,
            marginBottom: '2px',
          }}>
            {accent}
          </div>
        )}
        <div style={{ fontSize: '17px', fontWeight: 700, color: COLORS.tInverse }}>
          {name}
        </div>
        {sub && (
          <div style={{ fontSize: '11px', color: COLORS.tInverseSoft, marginTop: '1px' }}>
            {sub}
          </div>
        )}
      </div>
      {action}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// BalanceCard — 잔액 카드 (그라데이션 헤더 안의 글래스 카드)
// ─────────────────────────────────────────────────────────
export function BalanceCard({ label, amount, sub, secondary, action, dark = true, onClick }) {
  const isClickable = !!onClick
  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      style={{
        margin: '0 20px',
        background: dark ? 'rgba(255,255,255,0.08)' : COLORS.bgCard,
        border: dark ? '1px solid rgba(255,255,255,0.12)' : `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        padding: '16px 18px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'transform .15s, background .15s',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '4px',
      }}>
        <span style={{ fontSize: '11px', color: dark ? COLORS.tInverseSoft : COLORS.t3 }}>
          {label}
        </span>
        {action}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: sub ? '10px' : 0 }}>
        <span style={{
          fontSize: TYPO.amount.size, fontWeight: TYPO.amount.weight,
          color: dark ? COLORS.tInverse : COLORS.t1,
          letterSpacing: TYPO.amount.letterSpacing,
        }}>
          {amount}
        </span>
        <span style={{ fontSize: '14px', color: dark ? COLORS.tInverseMuted : COLORS.t3 }}>
          원
        </span>
      </div>
      {sub && (
        <div style={{
          paddingTop: '10px',
          borderTop: dark ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${COLORS.borderSoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '11px',
          color: dark ? COLORS.tInverseSoft : COLORS.t3,
        }}>
          <span>{sub}</span>
          {secondary && <span>{secondary}</span>}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// CircleAction — 원형 액션 버튼 (충전/지급집행/카드결제/출금)
// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
// CircleAction — 라운드 사각형 액션 버튼 (충전/지급집행/카드결제/출금)
// 이름은 호환성 위해 유지하되 모양은 라운드 사각형
// ─────────────────────────────────────────────────────────
export function CircleAction({ icon, label, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent', border: 'none',
        padding: '4px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px',
        cursor: 'pointer', fontFamily: 'inherit',
      }}>
      <div style={{
        width: '54px', height: '54px',
        borderRadius: '14px',
        background: active ? GRADIENTS.brand : 'rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active ? SHADOWS.buttonBrand : 'none',
        transition: 'all .15s',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: '11px', color: COLORS.tInverse, fontWeight: 500 }}>
        {label}
      </span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────
// Card — 흰 카드 (그림자 + radius)
// ─────────────────────────────────────────────────────────
export function Card({ children, padding = '14px', radius = RADIUS.lg, hoverable = false, accent, ...rest }) {
  return (
    <div style={{
      background: COLORS.bgCard,
      borderRadius: radius,
      padding,
      boxShadow: SHADOWS.card,
      border: accent ? `1px solid ${accent}` : 'none',
      ...rest,
    }}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// SectionHeader — 섹션 위 작은 라벨 ("지갑 우선순위" 등)
// ─────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 4px',
      marginBottom: '10px',
    }}>
      <span style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1 }}>{title}</span>
      {action && (
        <button onClick={onAction}
          style={{ background: 'none', border: 'none', fontSize: '11px', color: COLORS.brand, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
          {action} ›
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// ProgressBar — 그라데이션 진행률 바
// pct: 0-100, status: 'done' | 'success' | undefined
// ─────────────────────────────────────────────────────────
export function ProgressBar({ pct, status, height = 3, showLabel = false }) {
  const bg = progressGradient(pct, status)
  const clampedPct = Math.max(0, Math.min(100, pct))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1,
        height: `${height}px`,
        background: COLORS.bgMuted,
        borderRadius: RADIUS.pill,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${clampedPct}%`,
          height: '100%',
          background: bg,
          borderRadius: RADIUS.pill,
          transition: 'width .3s ease',
        }} />
      </div>
      {showLabel && (
        <span style={{
          fontSize: '11px', fontWeight: 600,
          color: pct >= 100 ? COLORS.brand : pct >= 70 ? COLORS.danger : pct >= 40 ? COLORS.warning : COLORS.t3,
          flexShrink: 0, minWidth: '32px', textAlign: 'right',
        }}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Badge — 작은 태그/배지
// kind: 'fund' (자금 종류 색 자동), 'status', 'count'
// ─────────────────────────────────────────────────────────
export function Badge({ children, color, bg, kind = 'default', size = 'sm' }) {
  const styles = {
    sm: { padding: '2px 7px', fontSize: '10px', radius: '5px' },
    md: { padding: '3px 9px', fontSize: '11px', radius: '6px' },
    lg: { padding: '4px 10px', fontSize: '12px', radius: '7px' },
  }
  const s = styles[size]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: s.padding,
      background: bg || COLORS.bgMuted,
      color: color || COLORS.t2,
      borderRadius: s.radius,
      fontSize: s.fontSize,
      fontWeight: 700,
      lineHeight: 1.2,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// Avatar — 원형 아바타 (이름 첫 글자 또는 이모지)
// kind: 'person' (원), 'business' (둥근 사각)
// ─────────────────────────────────────────────────────────
export function Avatar({ initial, emoji, kind = 'person', size = 40, color, bg }) {
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`,
      borderRadius: kind === 'business' ? RADIUS.md : RADIUS.circle,
      background: bg || GRADIENTS.brandSubtle,
      color: color || COLORS.tInverse,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: `${Math.round(size * 0.42)}px`, fontWeight: 700,
      flexShrink: 0,
    }}>
      {emoji || initial}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// FundEmoji — 자금 종류별 이모지 + 라벨 미니 배지
// ─────────────────────────────────────────────────────────
const FUND_META = {
  freelance: { emoji: '🧾', label: '외주비' },
  realestate: { emoji: '🏠', label: '부동산' },
  invest: { emoji: '🌱', label: '자금 지원' },
  lend: { emoji: '💸', label: '빌려주기' },
  gift: { emoji: '🎁', label: '용돈선물' },
  salary: { emoji: '💼', label: '급여' },
  bonus: { emoji: '🎉', label: '상여금' },
  condolence: { emoji: '💐', label: '경조사비' },
  bounty: { emoji: '📋', label: '기타소득' },
}

export function FundBadge({ type, size = 'md' }) {
  const meta = FUND_META[type]
  if (!meta) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: size === 'sm' ? '10px' : '11px',
      color: COLORS.t3,
    }}>
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// FilterChips — 필터 칩 그룹 (전체/외주비/대여금/투자/주의)
// ─────────────────────────────────────────────────────────
export function FilterChips({ items, value, onChange, dark = false }) {
  return (
    <div style={{
      display: 'flex', gap: '6px',
      padding: '0 20px', marginBottom: '12px',
      overflowX: 'auto',
    }}>
      {items.map(item => {
        const active = value === item.id
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              padding: '7px 14px',
              background: active
                ? (dark ? COLORS.tInverse : COLORS.t1)
                : (dark ? 'rgba(255,255,255,0.12)' : COLORS.bgCard),
              color: active
                ? (dark ? COLORS.t1 : COLORS.tInverse)
                : (dark ? COLORS.tInverse : COLORS.t3),
              border: active ? 'none' : (dark ? '1px solid rgba(255,255,255,0.16)' : `1px solid ${COLORS.border}`),
              borderRadius: RADIUS.pill,
              fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}>
            {item.icon && <span>{item.icon}</span>}
            <span>{item.label}</span>
            {item.count != null && item.count > 0 && (
              <span style={{
                color: active ? COLORS.danger : COLORS.danger,
                fontWeight: 700,
              }}>
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// MenuListItem — 더보기 화면 메뉴 행
// icon, title, sub, badge, onClick
// ─────────────────────────────────────────────────────────
export function MenuListItem({ icon, iconBg, title, sub, badge, badgeColor, badgeBg, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '14px',
        background: active ? '#F0F8F4' : COLORS.bgCard,
        border: active ? '1px solid #B5DDC8' : 'none',
        boxShadow: active ? 'none' : SHADOWS.card,
        borderRadius: RADIUS.lg,
        display: 'flex', alignItems: 'center', gap: '12px',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      }}>
      {icon && (
        <div style={{
          width: '36px', height: '36px',
          background: iconBg || COLORS.bgMuted,
          borderRadius: RADIUS.md,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px', fontWeight: 600,
          color: active ? '#085041' : COLORS.t1,
          marginBottom: sub ? '2px' : 0,
        }}>
          {title}
        </div>
        {sub && (
          <div style={{
            fontSize: '11px',
            color: active ? '#0E7050' : COLORS.t4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {sub}
          </div>
        )}
      </div>
      {badge && (
        <Badge color={badgeColor} bg={badgeBg} size="md">
          {badge}
        </Badge>
      )}
      <span style={{ color: COLORS.t5, fontSize: '18px', flexShrink: 0, marginLeft: badge ? '4px' : 0 }}>›</span>
    </button>
  )
}
