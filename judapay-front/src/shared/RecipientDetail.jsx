import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'
import { getLang } from '../design/i18n'

// ─── 다국어 ──────────────────────────────────────────────
const S = {
  overview:     { ko: '개요',       en: 'Overview' },
  mccSetting:   { ko: 'MCC 설정',   en: 'MCC' },
  execLog:      { ko: '집행 로그',  en: 'Log' },
  evidence:     { ko: '증빙 센터',  en: 'Evidence' },
  report:       { ko: '보고서',     en: 'Report' },
  riskScore:    { ko: '리스크 스코어', en: 'Risk Score' },
  insight:      { ko: 'AI 인사이트', en: 'AI Insight' },
  nextExec:     { ko: '다음 예정',  en: 'Next Expected' },
  totalExec:    { ko: '총 집행액',  en: 'Total Executed' },
  avgAmount:    { ko: '건당 평균',  en: 'Avg/Txn' },
  thisMonth:    { ko: '이번 달',    en: 'This Month' },
  allowed:      { ko: '허용',       en: 'Allowed' },
  blocked:      { ko: '차단',       en: 'Blocked' },
  alwaysBlocked:{ ko: '항상 차단',  en: 'Always Blocked' },
  liveApply:    { ko: '즉시 적용',  en: 'Apply Now' },
  applied:      { ko: '적용 완료',  en: 'Applied' },
  changeHistory:{ ko: '변경 이력',  en: 'Change History' },
  evidenceRate: { ko: '증빙 완료율', en: 'Evidence Rate' },
  missing:      { ko: '누락',       en: 'Missing' },
  upload:       { ko: '업로드',     en: 'Upload' },
  genReport:    { ko: '보고서 생성', en: 'Generate Report' },
  shareLink:    { ko: '공유 링크',  en: 'Share Link' },
  taxCategory:  { ko: '세무 분류',  en: 'Tax Category' },
  justifyReq:   { ko: '소명요청',   en: 'Request Justify' },
  done:         { ko: '완료',       en: 'Done' },
  pending:      { ko: '진행중',     en: 'Pending' },
  warning:      { ko: '주의',       en: 'Warning' },
  risk:         { ko: '위험',       en: 'Risk' },
  normal:       { ko: '정상',       en: 'Normal' },
}
const t = (key, lang) => S[key]?.[lang] || S[key]?.ko || key

// ─── 데이터 ──────────────────────────────────────────────
const RECIPIENTS_DATA = {
  aurora: {
    id: 'aurora', name: '㈜오로라', entityType: 'business', bizNo: '123-45-67890',
    type: '외주비', typeKey: 'freelance',
    totalAmount: 3200000, count: 8, avg: 400000, trend: 15,
    riskScore: 12, riskLevel: 'normal',
    thisMonth: { exec: 800000, count: 2 },
    monthly: [520000, 400000, 680000, 400000, 800000, 400000],
    mccAllowed: ['design', 'it', 'edu'],
    mccBlocked: ['luxury', 'gambling', 'adult', 'crypto'],
    lastExec: '2026.05.06', nextExpected: '2026.06.01',
    insight: '최근 3개월 집행액 상승 추세. 5월 계약 갱신 예정으로 6월 집행액 증가 예상. 현재까지 이상 결제 없음.',
    warning: null,
    execLogs: [
      { id: 'e1', date: '2026.05.06', time: '14:22', merchant: '어도비 코리아', amount: 340000, mcc: 'IT/소프트웨어', status: 'done', evidence: true, justify: 'none' },
      { id: 'e2', date: '2026.05.02', time: '10:15', merchant: '피그마 구독', amount: 60000, mcc: 'IT/소프트웨어', status: 'done', evidence: true, justify: 'none' },
      { id: 'e3', date: '2026.04.22', time: '09:30', merchant: '강남 룸살롱', amount: 89000, mcc: '유흥/오락', status: 'risk', evidence: false, justify: 'requested' },
      { id: 'e4', date: '2026.04.15', time: '16:00', merchant: '무신사 스토어', amount: 155000, mcc: '패션/쇼핑', status: 'warning', evidence: false, justify: 'none' },
      { id: 'e5', date: '2026.04.08', time: '11:20', merchant: 'AWS 코리아', amount: 280000, mcc: 'IT/소프트웨어', status: 'done', evidence: true, justify: 'none' },
    ],
    evidenceList: [
      { id: 'ev1', name: '어도비 영수증 05.06', date: '2026.05.06', type: 'receipt', auto: true },
      { id: 'ev2', name: '피그마 영수증 05.02', date: '2026.05.02', type: 'receipt', auto: true },
      { id: 'ev3', name: 'AWS 영수증 04.08',    date: '2026.04.08', type: 'receipt', auto: true },
      { id: 'ev4', name: '계약서 2026 v2',       date: '2026.04.01', type: 'contract', auto: false },
    ],
    mccChangeHistory: [
      { date: '2026.04.20', action: 'IT/소프트웨어 허용 추가', by: '관리자' },
      { date: '2026.03.15', action: '패션/쇼핑 허용 제거',     by: '마스터' },
    ],
    reports: [
      { month: '2026년 4월', status: 'done',    taxCategory: '외주비/지급수수료', amount: 1200000 },
      { month: '2026년 3월', status: 'done',    taxCategory: '외주비/지급수수료', amount: 980000 },
      { month: '2026년 2월', status: 'pending', taxCategory: '외주비/지급수수료', amount: 650000 },
    ],
  },
  park: {
    id: 'park', name: '박민준', entityType: 'personal', phone: '010-****-5678',
    type: '빌려주기', typeKey: 'lend',
    totalAmount: 1800000, count: 2, avg: 900000, trend: -8,
    riskScore: 35, riskLevel: 'warning',
    thisMonth: { exec: 0, count: 0 },
    monthly: [0, 900000, 0, 0, 900000, 0],
    mccAllowed: [], mccBlocked: [],
    lastExec: '2026.04.15', nextExpected: '2026.07.15 (상환 예정)',
    insight: '차용증 기반 대출. 상환 기한 D-91. 연체 이력 없음. 단, 카지노 결제 감지로 리스크 상향.',
    warning: '빌려주기 금액 상환 기한 접근 중. 회수 여부를 사전 확인하세요.',
    execLogs: [
      { id: 'e1', date: '2026.04.15', time: '11:00', merchant: '박민준 계좌이체', amount: 900000, mcc: '개인송금', status: 'done', evidence: true, justify: 'none' },
      { id: 'e2', date: '2026.01.10', time: '14:30', merchant: '박민준 계좌이체', amount: 900000, mcc: '개인송금', status: 'done', evidence: true, justify: 'none' },
    ],
    evidenceList: [
      { id: 'ev1', name: '금전소비대차 계약서', date: '2026.01.10', type: 'contract', auto: false },
      { id: 'ev2', name: '이체 확인증 04.15',   date: '2026.04.15', type: 'receipt', auto: true },
    ],
    mccChangeHistory: [],
    reports: [],
  },
}

const MCC_MASTER = [
  { id: 'design',    ko: '디자인/크리에이티브', en: 'Design',     group: 'business', defaultBlocked: false },
  { id: 'it',        ko: 'IT/소프트웨어',        en: 'IT/Software',group: 'business', defaultBlocked: false },
  { id: 'edu',       ko: '교육/학습',             en: 'Education',  group: 'living',   defaultBlocked: false },
  { id: 'food',      ko: '식비/외식',             en: 'Dining',     group: 'living',   defaultBlocked: false },
  { id: 'transport', ko: '교통/이동',             en: 'Transport',  group: 'living',   defaultBlocked: false },
  { id: 'medical',   ko: '의료/건강',             en: 'Medical',    group: 'living',   defaultBlocked: false },
  { id: 'fashion',   ko: '패션/쇼핑',             en: 'Fashion',    group: 'living',   defaultBlocked: false },
  { id: 'welfare',   ko: '복지/지원사업',          en: 'Welfare',    group: 'business', defaultBlocked: false },
  { id: 'luxury',    ko: '명품/사치품',            en: 'Luxury',     group: 'blocked',  defaultBlocked: true },
  { id: 'gambling',  ko: '도박',                  en: 'Gambling',   group: 'blocked',  defaultBlocked: true },
  { id: 'adult',     ko: '유흥/오락',              en: 'Adult',      group: 'blocked',  defaultBlocked: true },
  { id: 'crypto',    ko: '가상화폐',              en: 'Crypto',     group: 'blocked',  defaultBlocked: true },
]

// ─── 유틸 컴포넌트 ────────────────────────────────────────
function EntityBadge({ type, lang }) {
  const cfg = {
    business:   { ko: '법인',   en: 'Corp',    bg: '#EFF6FF', color: '#1D4ED8' },
    personal:   { ko: '개인',   en: 'Personal',bg: '#F5F3FF', color: '#6D28D9' },
    government: { ko: '기관',   en: 'Gov',     bg: '#F0FDF4', color: '#15803D' },
  }[type] || {}
  return (
    <span style={{ padding: '2px 8px', borderRadius: '8px', background: cfg.bg, color: cfg.color, fontSize: '10px', fontWeight: 700 }}>
      {cfg[lang] || cfg.ko}
    </span>
  )
}

function RiskBadge({ level, lang }) {
  const cfg = {
    normal:  { bg: '#D1FAE5', color: '#047857' },
    warning: { bg: '#FEF3C7', color: '#92400E' },
    risk:    { bg: '#FEE2E2', color: '#DC2626' },
  }[level] || {}
  return (
    <span style={{ padding: '2px 8px', borderRadius: '8px', background: cfg.bg, color: cfg.color, fontSize: '10px', fontWeight: 700 }}>
      {t(level, lang)}
    </span>
  )
}

function StatusBadge({ status, lang }) {
  const cfg = {
    done:      { bg: '#D1FAE5', color: '#047857' },
    pending:   { bg: '#EFF6FF', color: '#1D4ED8' },
    warning:   { bg: '#FEF3C7', color: '#92400E' },
    risk:      { bg: '#FEE2E2', color: '#DC2626' },
    requested: { bg: '#FEF3C7', color: '#92400E' },
  }[status] || { bg: '#F3F4F6', color: '#6B7280' }
  const label = { done: t('done',lang), pending: t('pending',lang), warning: t('warning',lang), risk: t('risk',lang), requested: '소명요청중' }[status] || status
  return (
    <span style={{ padding: '2px 7px', borderRadius: '8px', background: cfg.bg, color: cfg.color, fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
      {label}
    </span>
  )
}

// ─── 탭: 개요 ────────────────────────────────────────────
function OverviewTab({ r, lang, theme }) {
  const maxMonthly = Math.max(...r.monthly)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* 이번 달 요약 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1, marginBottom: '12px' }}>{t('thisMonth', lang)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: '집행액',   value: (r.thisMonth.exec/10000).toFixed(0)+'만원' },
            { label: '집행 건수', value: r.thisMonth.count+'건' },
            { label: '전월 대비', value: (r.trend>0?'+':'')+r.trend+'%', color: r.trend>0?'#DC2626':'#059669' },
          ].map((item,i) => (
            <div key={i} style={{ background: COLORS.bg, borderRadius: RADIUS.md, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: COLORS.t4, fontWeight: 600, marginBottom: '5px' }}>{item.label}</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: item.color || COLORS.t1 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 6개월 바 차트 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1, marginBottom: '14px' }}>최근 6개월 추이</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
          {r.monthly.map((amt, i) => {
            const isLast = i === r.monthly.length - 1
            const pct = maxMonthly > 0 ? amt / maxMonthly : 0
            const months = ['12월','1월','2월','3월','4월','5월']
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                {amt > 0 && <div style={{ fontSize: '8px', color: isLast ? theme.brandDark : COLORS.t4, fontWeight: isLast ? 700 : 400 }}>
                  {(amt/10000).toFixed(0)}만
                </div>}
                {amt === 0 && <div style={{ fontSize: '8px', color: 'transparent' }}>0</div>}
                <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: Math.max(4, pct*60)+'px', background: isLast ? theme.activeBtnGrad : COLORS.bgMuted, transition: 'height 0.4s' }} />
                <div style={{ fontSize: '9px', color: isLast ? theme.brandDark : COLORS.t4, fontWeight: isLast ? 700 : 400 }}>{months[i]}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 리스크 스코어 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1 }}>{t('riskScore', lang)}</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: r.riskScore > 30 ? '#EF4444' : r.riskScore > 15 ? '#F59E0B' : '#10B981' }}>
            {r.riskScore}<span style={{ fontSize: '12px', fontWeight: 400, color: COLORS.t4 }}>/100</span>
          </div>
        </div>
        {[
          { label: 'MCC 준수율',    score: 100 - r.riskScore,        color: '#10B981' },
          { label: '시간대 적절성', score: r.riskScore < 20 ? 90 : 60, color: '#0EA5E9' },
          { label: '금액 안정성',   score: r.riskScore < 20 ? 85 : 55, color: '#6366F1' },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: i < 2 ? '10px' : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: COLORS.t3 }}>{item.label}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: item.color }}>{item.score}점</span>
            </div>
            <div style={{ height: '5px', borderRadius: '3px', background: COLORS.bgMuted, overflow: 'hidden' }}>
              <div style={{ width: item.score+'%', height: '100%', background: item.color, borderRadius: '3px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* AI 인사이트 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1, marginBottom: '10px' }}>
          💡 {t('insight', lang)}
        </div>
        <div style={{ fontSize: '13px', color: COLORS.t2, lineHeight: 1.7 }}>{r.insight}</div>
        {r.warning && (
          <div style={{ marginTop: '12px', background: '#FEF3C7', borderRadius: RADIUS.md, padding: '10px 12px', display: 'flex', gap: '8px' }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <span style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.6 }}>{r.warning}</span>
          </div>
        )}
      </div>

      {/* 다음 예정 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '14px 16px', boxShadow: SHADOWS.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: COLORS.t3, fontWeight: 600 }}>{t('nextExec', lang)}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: theme.brandDark }}>{r.nextExpected}</span>
      </div>
    </div>
  )
}

// ─── 탭: MCC 설정 ─────────────────────────────────────────
function MCCTab({ r, lang, theme }) {
  const [allowed, setAllowed] = useState(r.mccAllowed)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState(r.mccChangeHistory)
  const hasMCC = r.typeKey !== 'lend' && r.typeKey !== 'gift'

  if (!hasMCC) {
    return (
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '32px', textAlign: 'center', boxShadow: SHADOWS.card }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.t2, marginBottom: '6px' }}>MCC 설정 불가</div>
        <div style={{ fontSize: '12px', color: COLORS.t4, lineHeight: 1.6 }}>
          {r.typeKey === 'lend' ? '빌려주기 자금은 카드 결제가 아닌 계좌이체로 집행됩니다.' : '선물/용돈 자금은 MCC 제한 없이 자유롭게 사용 가능합니다.'}
        </div>
      </div>
    )
  }

  const toggle = (id) => {
    if (MCC_MASTER.find(m => m.id === id)?.defaultBlocked) return
    setAllowed(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
    setSaved(false)
  }

  const handleApply = () => {
    const newHistory = [{ date: new Date().toLocaleDateString('ko-KR').replace(/\. /g,'.').replace('.','.'), action: 'MCC 설정 변경', by: '관리자' }, ...history]
    setHistory(newHistory)
    setSaved(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {['business','living','blocked'].map(group => {
        const items = MCC_MASTER.filter(m => m.group === group)
        const groupLabel = { business: '업무 관련', living: '생활 관련', blocked: t('alwaysBlocked', lang) }[group]
        return (
          <div key={group} style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: COLORS.t4, marginBottom: '10px', letterSpacing: '0.5px' }}>{groupLabel.toUpperCase()}</div>
            {items.map(m => {
              const isAllowed = allowed.includes(m.id)
              const isLocked = m.defaultBlocked
              return (
                <button key={m.id} onClick={() => toggle(m.id)}
                  style={{
                    width: '100%', padding: '11px 14px', marginBottom: '6px',
                    background: isLocked ? '#FEF2F2' : isAllowed ? theme.brandDark+'0E' : COLORS.bg,
                    border: `1.5px solid ${isLocked ? '#FECACA' : isAllowed ? theme.brandDark+'40' : COLORS.borderSoft}`,
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: isLocked ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    transition: 'all .15s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '7px', flexShrink: 0,
                      background: isLocked ? '#FEE2E2' : isAllowed ? theme.brandDark : COLORS.bgMuted,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {(isAllowed || isLocked) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          {isLocked
                            ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                            : <polyline points="20 6 9 17 4 12"/>
                          }
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: isLocked ? '#DC2626' : COLORS.t1 }}>
                      {lang === 'en' ? m.en : m.ko}
                    </span>
                  </div>
                  {isLocked
                    ? <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: 600 }}>변경불가</span>
                    : <span style={{ fontSize: '10px', color: isAllowed ? theme.brandDark : COLORS.t4, fontWeight: 600 }}>{isAllowed ? t('allowed',lang) : t('blocked',lang)}</span>
                  }
                </button>
              )
            })}
          </div>
        )
      })}

      {/* 적용 버튼 */}
      <button onClick={handleApply}
        style={{
          width: '100%', padding: '15px',
          background: saved ? '#D1FAE5' : theme.activeBtnGrad,
          border: 'none', borderRadius: '14px',
          color: saved ? '#047857' : '#fff',
          fontSize: '15px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: saved ? 'none' : theme.activeShadow,
          transition: 'all .2s',
        }}>
        {saved ? '✓ '+t('applied', lang) : '⚡ '+t('liveApply', lang)}
      </button>

      {/* 변경 이력 */}
      {history.length > 0 && (
        <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.t3, marginBottom: '10px' }}>{t('changeHistory', lang)}</div>
          {history.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < history.length-1 ? '1px solid '+COLORS.borderSoft : 'none' }}>
              <div style={{ width: '4px', borderRadius: '2px', background: theme.brandDark+'50', flexShrink: 0, alignSelf: 'stretch' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: COLORS.t1, fontWeight: 600, marginBottom: '2px' }}>{h.action}</div>
                <div style={{ fontSize: '10px', color: COLORS.t4 }}>{h.date} · {h.by}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 탭: 집행 로그 ────────────────────────────────────────
function ExecLogTab({ r, lang, theme, onNavigate }) {
  const [justifyTarget, setJustifyTarget] = useState(null)
  const [justifySent, setJustifySent] = useState({})
  const [statusFilter, setStatusFilter] = useState('all')
  const [period, setPeriod] = useState('이번달')

  const statusFilters = [
    { key: 'all',     label: '전체' },
    { key: 'done',    label: t('done', lang) },
    { key: 'warning', label: t('warning', lang) },
    { key: 'risk',    label: t('risk', lang) },
  ]
  const PERIODS = ['이번달', '3개월', '6개월', '1년']

  const filtered = statusFilter === 'all' ? r.execLogs : r.execLogs.filter(l => l.status === statusFilter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 기간 필터 */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{
              flex: 1, padding: '7px 4px', borderRadius: RADIUS.pill, border: 'none',
              background: period === p ? theme.brandDark+'18' : COLORS.bgCard,
              color: period === p ? theme.brandDark : COLORS.t3,
              fontSize: '11px', fontWeight: period === p ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: SHADOWS.card,
              outline: period === p ? `1.5px solid ${theme.brandDark}40` : 'none',
            }}>
            {p}
          </button>
        ))}
      </div>

      {/* 상태 필터 */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
        {statusFilters.map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: RADIUS.pill, border: 'none', flexShrink: 0,
              background: statusFilter === f.key ? theme.brandDark : COLORS.bgCard,
              color: statusFilter === f.key ? '#fff' : COLORS.t2,
              fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: SHADOWS.card,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.map((log, i) => (
        <div key={log.id}
          onClick={() => onNavigate && onNavigate('/payments', { logId: log.id, merchant: log.merchant, amount: log.amount, date: log.date, mcc: log.mcc, status: log.status })}
          style={{
            background: COLORS.bgCard, borderRadius: RADIUS.lg,
            border: `1.5px solid ${log.status === 'risk' ? '#FECACA' : log.status === 'warning' ? '#FDE68A' : 'transparent'}`,
            boxShadow: SHADOWS.card, overflow: 'hidden', cursor: 'pointer',
          }}>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.t1, marginBottom: '3px' }}>{log.merchant}</div>
                <div style={{ fontSize: '11px', color: COLORS.t4 }}>{log.date} {log.time} · {log.mcc}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: COLORS.t1, marginBottom: '4px' }}>{log.amount.toLocaleString()}원</div>
                <StatusBadge status={log.status} lang={lang} />
              </div>
            </div>

            {/* 증빙 + 소명요청 */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <div style={{
                flex: 1, padding: '8px 12px', borderRadius: '10px',
                background: log.evidence ? '#F0FDF4' : '#FEF2F2',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ fontSize: '12px' }}>{log.evidence ? '📎' : '📋'}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: log.evidence ? '#047857' : '#DC2626' }}>
                  {log.evidence ? '증빙 첨부됨' : '증빙 누락'}
                </span>
              </div>
              {(log.status === 'risk' || log.status === 'warning') && (
                <button
                  onClick={(e) => { e.stopPropagation(); setJustifyTarget(log) }}
                  style={{
                    padding: '8px 14px', borderRadius: '10px', border: 'none',
                    background: justifySent[log.id] ? '#D1FAE5' : theme.brandDark+'15',
                    color: justifySent[log.id] ? '#047857' : theme.brandDark,
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    flexShrink: 0,
                  }}>
                  {justifySent[log.id] ? '✓ 발송됨' : '💬 소명요청'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* 소명요청 모달 */}
      {justifyTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setJustifyTarget(null)} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 36px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#E5E7EB', margin: '0 auto 18px' }} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.t1, marginBottom: '4px' }}>소명요청 발송</div>
            <div style={{ fontSize: '12px', color: COLORS.t4, marginBottom: '14px' }}>{r.name} · {justifyTarget.merchant} {justifyTarget.amount.toLocaleString()}원</div>
            <textarea
              defaultValue={`[소명요청] ${justifyTarget.date} ${justifyTarget.merchant}에서 ${justifyTarget.amount.toLocaleString()}원 결제에 대한 사용 목적과 영수증을 제출해주세요.`}
              style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '12px', border: `1.5px solid ${COLORS.borderSoft}`, fontSize: '13px', fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button onClick={() => setJustifyTarget(null)}
                style={{ flex: 1, padding: '14px', background: COLORS.bgMuted, border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 600, color: COLORS.t2, cursor: 'pointer', fontFamily: 'inherit' }}>
                취소
              </button>
              <button onClick={() => { setJustifySent(p => ({...p, [justifyTarget.id]: true})); setJustifyTarget(null) }}
                style={{ flex: 2, padding: '14px', background: theme.activeBtnGrad, border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: theme.activeShadow }}>
                💬 메시지 발송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 탭: 증빙 센터 ────────────────────────────────────────
function EvidenceTab({ r, lang, theme }) {
  const total = r.execLogs.length
  const withEvidence = r.execLogs.filter(l => l.evidence).length
  const pct = Math.round(withEvidence / total * 100)

  const typeIcon = { receipt: '🧾', contract: '📋', invoice: '📄' }
  const typeLabel = { receipt: '영수증', contract: '계약서', invoice: '청구서' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 완료율 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1 }}>{t('evidenceRate', lang)}</span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: pct >= 80 ? '#047857' : pct >= 50 ? '#D97706' : '#DC2626' }}>{pct}%</span>
        </div>
        <div style={{ height: '8px', borderRadius: '4px', background: COLORS.bgMuted, overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ width: pct+'%', height: '100%', background: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444', borderRadius: '4px', transition: 'width 0.5s' }} />
        </div>
        <div style={{ fontSize: '11px', color: COLORS.t4 }}>
          {withEvidence}건 완료 · <span style={{ color: '#DC2626', fontWeight: 600 }}>{total - withEvidence}건 {t('missing', lang)}</span>
        </div>
      </div>

      {/* 누락 증빙 알림 */}
      {total - withEvidence > 0 && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: RADIUS.lg, padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>증빙 누락 {total - withEvidence}건</div>
            <div style={{ fontSize: '11px', color: '#78350F', lineHeight: 1.6 }}>누락 건에 대한 영수증을 업로드하거나 소명요청을 발송하세요.</div>
          </div>
        </div>
      )}

      {/* 증빙 목록 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.t3, marginBottom: '12px' }}>첨부 파일</div>
        {r.evidenceList.map((ev, i) => (
          <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < r.evidenceList.length-1 ? '1px solid '+COLORS.borderSoft : 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: theme.brandDark+'12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              {typeIcon[ev.type] || '📄'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>{ev.name}</div>
              <div style={{ fontSize: '10px', color: COLORS.t4 }}>{ev.date} · {typeLabel[ev.type]} {ev.auto ? '· 자동수집' : '· 수동업로드'}</div>
            </div>
            {ev.auto && <span style={{ padding: '2px 7px', borderRadius: '8px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>자동</span>}
          </div>
        ))}
      </div>

    </div>
  )
}

// ─── 탭: 보고서 ───────────────────────────────────────────
function ReportTab({ r, lang, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 보고서 목록 */}
      {r.reports.length > 0 ? (
        <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.t3, marginBottom: '12px' }}>생성된 보고서</div>
          {r.reports.map((rep, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: i < r.reports.length-1 ? '1px solid '+COLORS.borderSoft : 'none' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: rep.status === 'done' ? theme.brandDark+'12' : COLORS.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                {rep.status === 'done' ? '📊' : '⏳'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1, marginBottom: '2px' }}>{rep.month} 집행 보고서</div>
                <div style={{ fontSize: '11px', color: COLORS.t4 }}>{rep.taxCategory} · {(rep.amount/10000).toFixed(0)}만원</div>
              </div>
              {rep.status === 'done' ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={{ padding: '6px 10px', background: theme.brandDark+'12', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: theme.brandDark, cursor: 'pointer', fontFamily: 'inherit' }}>PDF</button>
                  <button style={{ padding: '6px 10px', background: '#EFF6FF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: '#1D4ED8', cursor: 'pointer', fontFamily: 'inherit' }}>공유</button>
                </div>
              ) : (
                <span style={{ padding: '3px 8px', borderRadius: '8px', background: '#FEF3C7', color: '#92400E', fontSize: '10px', fontWeight: 700 }}>처리중</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '32px', textAlign: 'center', boxShadow: SHADOWS.card }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
          <div style={{ fontSize: '13px', color: COLORS.t3 }}>생성된 보고서가 없습니다</div>
        </div>
      )}

    </div>
  )
}

// ─── 메인 ─────────────────────────────────────────────────
export default function RecipientDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const theme = getAccountTheme()
  const [lang, setLang] = useState(getLang())
  const [activeTab, setActiveTab] = useState('overview')

  const fromStatsAuth = location.state?.from === 'stats-auth'

  useEffect(() => {
    const handler = () => setLang(getLang())
    window.addEventListener('langchange', handler)
    return () => window.removeEventListener('langchange', handler)
  }, [])

  const r = RECIPIENTS_DATA[id] || RECIPIENTS_DATA.aurora

  const TABS = [
    { key: 'overview',  label: t('overview', lang) },
    { key: 'mcc',       label: t('mccSetting', lang) },
    { key: 'log',       label: t('execLog', lang) },
    { key: 'evidence',  label: t('evidence', lang) },
    { key: 'report',    label: t('report', lang) },
  ]

  return (
    <PhoneShell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* 앰버 헤더 */}
          <div style={{ background: 'linear-gradient(135deg,#92400E 0%,#B45309 50%,#D97706 100%)', paddingTop: '20px', paddingBottom: '20px', position: 'relative', overflow: 'hidden' }}>
            {/* 장식 원 */}
            <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'140px', height:'140px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:'-20px', left:'-20px', width:'100px', height:'100px', borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
            {/* 네비 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px 14px' }}>
              <button onClick={() => fromStatsAuth ? navigate('/stats', { state: { openDetail: 'auth' } }) : navigate(-1)}
                style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', flex: 1 }}>권한 자금</span>
              <button onClick={() => navigate('/message', { state: { recipientId: r.id, recipientName: r.name } })}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: '20px', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>메세지하기</span>
              </button>
            </div>

            {/* 프로필 */}
            <div style={{ padding: '0 20px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#fff', flexShrink: 0, backdropFilter: 'blur(10px)' }}>
                {r.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{r.name}</span>
                  <EntityBadge type={r.entityType} lang={lang} />
                  <RiskBadge level={r.riskLevel} lang={lang} />
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                  {r.type} · {r.bizNo || r.phone || ''}
                </div>
              </div>
            </div>

            {/* KPI 1박스 */}
            <div style={{ display: 'flex', gap: '8px', padding: '0 16px 16px' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: RADIUS.lg, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: '4px' }}>{t('totalExec', lang)}</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{(r.totalAmount/10000).toFixed(0)}만원</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: RADIUS.lg, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: '4px' }}>{t('nextExec', lang)}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FDE68A' }}>{r.nextExpected}</div>
              </div>
            </div>

            {/* 탭 */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '7px 14px', borderRadius: RADIUS.pill, border: 'none', flexShrink: 0,
                    background: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.15)',
                    color: activeTab === tab.key ? theme.brandDark : '#fff',
                    fontSize: '12px', fontWeight: activeTab === tab.key ? 700 : 500,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div style={{ padding: '16px 16px 32px' }}>
            {activeTab === 'overview'  && <OverviewTab  r={r} lang={lang} theme={theme} />}
            {activeTab === 'mcc'       && <MCCTab       r={r} lang={lang} theme={theme} />}
            {activeTab === 'log'       && <ExecLogTab   r={r} lang={lang} theme={theme} onNavigate={(path, state) => navigate(path, { state })} />}
            {activeTab === 'evidence'  && <EvidenceTab  r={r} lang={lang} theme={theme} />}
            {activeTab === 'report'    && <ReportTab    r={r} lang={lang} theme={theme} />}
          </div>
        </div>
      </div>
    </PhoneShell>
  )
}
