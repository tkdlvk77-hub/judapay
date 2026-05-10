import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'
import { getLang } from '../design/i18n'
import BottomTab from '../components/BottomTab'

// ─── 데이터 ──────────────────────────────────────────────
const REPORTS = [
  {
    id: 'r202505', month: '2026년 5월', status: 'generating',
    genDate: '6.1 자동 생성 예정', sentTo: '세무사 자동 전송',
  },
  {
    id: 'r202504', month: '2026년 4월', status: 'done',
    genDate: '2026.05.01 생성', sentTo: '세무사 전송 완료',

    // ① 월간 핵심 요약
    summary: {
      totalExec:    124000000,
      totalRevenue:  89000000,
      operatingFund: 2700000000,
      operationStatus: '정상',
      highlights: [
        '기업 자동지출 기능 개발 완료',
        'PG 연동 테스트 진행 중',
        '신규 기업회원 12곳 증가',
      ],
    },

    // ② 자금 흐름
    cashflow: {
      inflow:    350000000,
      outflow:   124000000,
      remaining: 2700000000,
      burnRate:  8.5,
      runway:    14,
    },

    // ③ 매출 및 성장
    growth: {
      revenue:       89000000,
      prevRevenue:   77000000,
      growthRate:    15.6,
      recurringRate: 68,
      newBiz:        12,
      activeBiz:     87,
      monthlyRevenue: [42000000, 55000000, 61000000, 70000000, 77000000, 89000000],
    },

    // ④ 카테고리별 집행
    categories: [
      { label: '인건비',         amount: 62000000, pct: 50, color: '#0EA5E9' },
      { label: '운영비',         amount: 22320000, pct: 18, color: '#10B981' },
      { label: '마케팅',         amount: 18600000, pct: 15, color: '#F59E0B' },
      { label: '개발비 / 인프라', amount: 12400000, pct: 10, color: '#6366F1' },
      { label: '외주비',         amount:  6200000, pct: 5,  color: '#8B5CF6' },
      { label: '법률 / 세무',    amount:  2480000, pct: 2,  color: '#EC4899' },
    ],

    // ⑤ 운영 안정성
    stability: {
      payrollDelay:   false,
      taxFiled:       true,
      insurancePaid:  true,
      outsourceDelay: false,
      lastActivity:   '12분 전',
      uptime:         '99.8%',
    },

    // ⑥ 법인카드 요약
    cardSummary: [
      { category: 'SaaS / AI',  amount: 3240000,  icon: '🤖' },
      { category: '교통',        amount: 890000,   icon: '🚗' },
      { category: '회의비',      amount: 1240000,  icon: '☕' },
      { category: '운영비',      amount: 5800000,  icon: '⚙️' },
      { category: '기타',        amount: 1230000,  icon: '📦' },
    ],

    // ⑦ 인건비 구조
    payroll: {
      total:    62000000,
      headcount: 8,
      taxWithheld:   1860000,
      insurancePaid: 4960000,
      breakdown: [
        { role: '개발',  count: 3, amount: 28000000 },
        { role: '기획',  count: 2, amount: 16000000 },
        { role: '운영',  count: 2, amount: 12000000 },
        { role: '인턴',  count: 1, amount:  6000000 },
      ],
    },

    // ⑧ 세무 / 보험
    tax: {
      vat:        { done: true,  date: '2026.04.25' },
      withholding:{ done: true,  date: '2026.04.10' },
      insurance:  { done: true,  amount: 4960000, date: '2026.04.10' },
    },

    // ⑨ 외부 금융 검증 (쿠콘)
    kucoon: {
      verified:  true,
      verifyDate:'2026.05.01',
      matches: [
        { label: '실제 계좌 흐름 ↔ 내부 집행 데이터', result: '일치 확인 완료', ok: true },
        { label: '외부 금융 연동 검증',               result: '정상 완료',      ok: true },
        { label: '수령인 매출 대조',                  result: '+15.6% 확인',    ok: true },
      ],
    },

    // ⑩ 다음 달 계획
    nextPlan: [
      'PG 심사 준비 완료',
      '기업회원 30곳 확보 목표',
      '자동정산 기능 오픈 예정',
      '실시간 운영 리포트 기능 추가 개발',
    ],

    sentEmail: 'kim@samil.com',
    sentTime:  '2026.05.01 09:00',
  },
  {
    id: 'r202503', month: '2026년 3월', status: 'done',
    genDate: '2026.04.01 생성', sentTo: '세무사 전송 완료',
    summary: {
      totalExec: 98000000, totalRevenue: 77000000,
      operatingFund: 2800000000, operationStatus: '정상',
      highlights: ['신규 파트너 계약 3건', '서버 인프라 고도화 완료', '기업회원 75곳 유지'],
    },
    cashflow: { inflow: 310000000, outflow: 98000000, remaining: 2800000000, burnRate: 7.2, runway: 16 },
    growth: { revenue: 77000000, prevRevenue: 70000000, growthRate: 10.0, recurringRate: 65, newBiz: 8, activeBiz: 75, monthlyRevenue: [] },
    categories: [
      { label: '인건비',   amount: 49000000, pct: 50, color: '#0EA5E9' },
      { label: '운영비',   amount: 17640000, pct: 18, color: '#10B981' },
      { label: '마케팅',   amount: 14700000, pct: 15, color: '#F59E0B' },
      { label: '개발/인프라', amount: 9800000, pct: 10, color: '#6366F1' },
      { label: '외주비',   amount: 4900000,  pct: 5,  color: '#8B5CF6' },
      { label: '법률/세무', amount: 1960000, pct: 2,  color: '#EC4899' },
    ],
    stability: { payrollDelay: false, taxFiled: true, insurancePaid: true, outsourceDelay: false, lastActivity: '어제', uptime: '99.9%' },
    cardSummary: [
      { category: 'SaaS / AI', amount: 2800000, icon: '🤖' },
      { category: '교통',       amount: 720000,  icon: '🚗' },
      { category: '운영비',     amount: 4900000, icon: '⚙️' },
    ],
    payroll: {
      total: 49000000, headcount: 8, taxWithheld: 1470000, insurancePaid: 3920000,
      breakdown: [
        { role: '개발', count: 3, amount: 22000000 },
        { role: '기획', count: 2, amount: 13000000 },
        { role: '운영', count: 2, amount: 10000000 },
        { role: '인턴', count: 1, amount: 4000000 },
      ],
    },
    tax: { vat: { done: true, date: '2026.03.25' }, withholding: { done: true, date: '2026.03.10' }, insurance: { done: true, amount: 3920000, date: '2026.03.10' } },
    kucoon: { verified: true, verifyDate: '2026.04.01', matches: [{ label: '계좌 흐름 대조', result: '일치 확인 완료', ok: true }] },
    nextPlan: ['기업회원 90곳 목표', '투자자 데모데이 준비', '정산 자동화 기능 고도화'],
    sentEmail: 'kim@samil.com', sentTime: '2026.04.01 09:00',
  },
]

const LIST_TABS = [
  { key: 'all',    ko: '전체',    en: 'All' },
  { key: 'invest', ko: '투자 보고', en: 'Invest' },
  { key: 'tax',    ko: '세무 증빙', en: 'Tax' },
  { key: 'gov',    ko: '기관 회계', en: 'Account' },
]

// ─── 목록 아이템 ──────────────────────────────────────────
function ReportItem({ r, theme, onPress }) {
  const isDone = r.status === 'done'
  return (
    <button onClick={() => isDone && onPress(r)}
      style={{ width: '100%', background: COLORS.bgCard, border: 'none', borderRadius: '16px', padding: '16px', marginBottom: '10px', textAlign: 'left', cursor: isDone ? 'pointer' : 'default', fontFamily: 'inherit', boxShadow: SHADOWS.card }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: COLORS.t1 }}>{r.month} 보고서</span>
          <span style={{ padding: '2px 8px', borderRadius: '8px', background: isDone ? '#D1FAE5' : '#FEF3C7', color: isDone ? '#047857' : '#92400E', fontSize: '10px', fontWeight: 700 }}>
            {isDone ? '완료' : '생성 중'}
          </span>
        </div>
        {isDone && <span style={{ fontSize: '12px', color: theme.brandDark, fontWeight: 700 }}>PDF ›</span>}
      </div>
      <div style={{ fontSize: '12px', color: COLORS.t4, marginBottom: isDone && r.summary ? '10px' : 0 }}>
        {r.genDate} · {r.sentTo}
      </div>
      {isDone && r.summary && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            '집행 ' + (r.summary.totalExec / 100000000).toFixed(1) + '억',
            '매출 ' + (r.summary.totalRevenue / 10000).toFixed(0) + '만',
            '런웨이 ' + r.cashflow.runway + '개월',
          ].map((tag, i) => (
            <span key={i} style={{ padding: '3px 9px', borderRadius: '8px', background: COLORS.bg, color: COLORS.t3, fontSize: '11px', fontWeight: 600 }}>{tag}</span>
          ))}
        </div>
      )}
    </button>
  )
}

// ─── 보고서 상세 ──────────────────────────────────────────
function ReportDetail({ r, theme, onClose }) {
  const [notifSent, setNotifSent] = useState(false)
  const [expandCard, setExpandCard] = useState(false)

  const Card = ({ title, sub, emoji, children }) => (
    <div style={{ background: COLORS.bgCard, borderRadius: '18px', padding: '18px', boxShadow: SHADOWS.card, marginBottom: '12px' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.t1 }}>{emoji} {title}</div>
        {sub && <div style={{ fontSize: '11px', color: COLORS.t4, marginTop: '2px' }}>{sub}</div>}
      </div>
      {children}
    </div>
  )

  const Row = ({ label, value, valueColor, border = true, i, total }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: border && i < total - 1 ? '1px solid ' + COLORS.borderSoft : 'none' }}>
      <span style={{ fontSize: '13px', color: COLORS.t2 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: valueColor || COLORS.t1 }}>{value}</span>
    </div>
  )

  const StatusDot = ({ ok }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: ok ? '#047857' : '#DC2626' }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ok ? '#10B981' : '#EF4444', display: 'inline-block' }} />
      {ok ? '정상' : '이상'}
    </span>
  )

  return (
    <div style={{ position: 'absolute', inset: 0, background: COLORS.bg, zIndex: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* 헤더 */}
      <div style={{ background: theme.headerGrad, padding: '24px 16px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <button onClick={onClose}
            style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{r.month} 투자자 보고서</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{r.genDate} · {r.sentTo}</div>
          </div>
          <button style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            PDF ↓
          </button>
        </div>

        {/* 핵심 KPI 3박스 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: '총 집행',   value: (r.summary.totalExec / 100000000).toFixed(1) + '억' },
            { label: '총 매출',   value: (r.summary.totalRevenue / 10000).toFixed(0) + '만' },
            { label: '런웨이',    value: r.cashflow.runway + '개월' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginBottom: '4px', fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* ① 월간 핵심 요약 */}
        <Card emoji="📋" title="이번 달 핵심 요약" sub={'운영 상태: ' + r.summary.operationStatus}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#047857' }}>최근 30일 정상 운영 중</span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.t4, marginBottom: '8px' }}>주요 진행 사항</div>
          {r.summary.highlights.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', padding: '8px 0', borderBottom: i < r.summary.highlights.length - 1 ? '1px solid ' + COLORS.borderSoft : 'none' }}>
              <span style={{ color: theme.brandDark, fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '13px', color: COLORS.t1, lineHeight: 1.5 }}>{h}</span>
            </div>
          ))}
        </Card>

        {/* ② 자금 흐름 현황 */}
        <Card emoji="💰" title="자금 흐름 현황">
          {[
            { label: '총 유입 자금',       value: (r.cashflow.inflow / 100000000).toFixed(1) + '억원' },
            { label: '총 집행 금액',       value: (r.cashflow.outflow / 100000000).toFixed(1) + '억원' },
            { label: '잔여 운영 자금',     value: (r.cashflow.remaining / 100000000).toFixed(1) + '억원', color: theme.brandDark },
            { label: '월 소진율',          value: r.cashflow.burnRate + '%' },
          ].map((item, i) => (
            <Row key={i} label={item.label} value={item.value} valueColor={item.color} i={i} total={4} />
          ))}
          {/* 런웨이 강조 */}
          <div style={{ marginTop: '14px', padding: '14px', background: r.cashflow.runway >= 12 ? '#F0FDF4' : r.cashflow.runway >= 6 ? '#FFFBEB' : '#FEF2F2', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.t2 }}>예상 운영 가능 기간</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: r.cashflow.runway >= 12 ? '#047857' : r.cashflow.runway >= 6 ? '#D97706' : '#DC2626' }}>
              약 {r.cashflow.runway}개월
            </span>
          </div>
        </Card>

        {/* ③ 매출 및 성장 현황 */}
        <Card emoji="📈" title="매출 및 성장 현황">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {[
              { label: '이번 달 매출',   value: (r.growth.revenue / 10000).toFixed(0) + '만원', color: COLORS.t1 },
              { label: '전월 대비',      value: '+' + r.growth.growthRate + '%',                color: '#047857' },
              { label: '반복 매출 비율', value: r.growth.recurringRate + '%',                    color: theme.brandDark },
              { label: '신규 기업 유입', value: r.growth.newBiz + '곳',                          color: COLORS.t1 },
              { label: '활성 기업 수',  value: r.growth.activeBiz + '곳',                       color: COLORS.t1 },
            ].map((item, i) => (
              <div key={i} style={{ background: COLORS.bg, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: COLORS.t4, marginBottom: '4px', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          {/* 월별 매출 미니 바 */}
          {r.growth.monthlyRevenue.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: COLORS.t4, fontWeight: 700, marginBottom: '8px' }}>최근 6개월 매출 추이</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '60px' }}>
                {r.growth.monthlyRevenue.map((v, i) => {
                  const max = Math.max(...r.growth.monthlyRevenue)
                  const isLast = i === r.growth.monthlyRevenue.length - 1
                  const months = ['11월', '12월', '1월', '2월', '3월', '4월']
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <div style={{ width: '100%', borderRadius: '3px 3px 0 0', height: Math.max(4, v / max * 44) + 'px', background: isLast ? theme.activeBtnGrad : COLORS.bgMuted }} />
                      <div style={{ fontSize: '9px', color: isLast ? theme.brandDark : COLORS.t4, fontWeight: isLast ? 700 : 400 }}>{months[i]}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        {/* ④ 카테고리별 집행 */}
        <Card emoji="📊" title="카테고리별 집행 현황" sub="막대 그래프 기반">
          {r.categories.map((cat, i) => (
            <div key={i} style={{ marginBottom: i < r.categories.length - 1 ? '12px' : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: cat.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.t1 }}>{cat.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: COLORS.t1 }}>{(cat.amount / 10000).toFixed(0)}만원</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: cat.color, width: '28px', textAlign: 'right' }}>{cat.pct}%</span>
                </div>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', background: COLORS.bgMuted, overflow: 'hidden' }}>
                <div style={{ width: cat.pct + '%', height: '100%', background: cat.color, borderRadius: '4px', transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </Card>

        {/* ⑤ 운영 안정성 */}
        <Card emoji="🛡️" title="운영 안정성 현황">
          {[
            { label: '급여 지급 지연', value: r.stability.payrollDelay ? '지연 있음' : '없음', ok: !r.stability.payrollDelay },
            { label: '세금 신고 상태', value: r.stability.taxFiled ? '정상 제출 완료' : '미제출', ok: r.stability.taxFiled },
            { label: '4대보험 상태',  value: r.stability.insurancePaid ? '정상 납부 중' : '미납', ok: r.stability.insurancePaid },
            { label: '외주 정산 지연', value: r.stability.outsourceDelay ? '지연 있음' : '없음', ok: !r.stability.outsourceDelay },
            { label: '서비스 가동률', value: r.stability.uptime, ok: true },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid ' + COLORS.borderSoft : 'none' }}>
              <span style={{ fontSize: '13px', color: COLORS.t2 }}>{item.label}</span>
              <StatusDot ok={item.ok} />
            </div>
          ))}
        </Card>

        {/* ⑥ 법인카드 / 자금 사용 요약 */}
        <Card emoji="💳" title="법인카드 사용 요약" sub="카테고리 기반 · 상세 내역 별도 열람 가능">
          {r.cardSummary.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: i < r.cardSummary.length - 1 ? '1px solid ' + COLORS.borderSoft : 'none' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: COLORS.t1 }}>{item.category}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1 }}>{item.amount.toLocaleString()}원</span>
            </div>
          ))}
          <button onClick={() => setExpandCard(v => !v)}
            style={{ marginTop: '12px', width: '100%', padding: '10px', background: COLORS.bg, border: '1px solid ' + COLORS.borderSoft, borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: COLORS.t3, cursor: 'pointer', fontFamily: 'inherit' }}>
            {expandCard ? '상세 내역 접기 ↑' : '상세 내역 열람 ↓'}
          </button>
          {expandCard && (
            <div style={{ marginTop: '10px', padding: '12px', background: COLORS.bg, borderRadius: '10px', fontSize: '12px', color: COLORS.t4, lineHeight: 1.8 }}>
              상세 내역은 세무사 및 권한 있는 관계자에게만 공개됩니다.
            </div>
          )}
        </Card>

        {/* ⑦ 인건비 구조 */}
        <Card emoji="👥" title="인력 및 인건비 구조" sub={'총 ' + r.payroll.headcount + '명 · 실명 미공개'}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {[
              { label: '총 인건비',  value: (r.payroll.total / 10000).toFixed(0) + '만' },
              { label: '원천징수',   value: (r.payroll.taxWithheld / 10000).toFixed(0) + '만' },
              { label: '4대보험',    value: (r.payroll.insurancePaid / 10000).toFixed(0) + '만' },
            ].map((item, i) => (
              <div key={i} style={{ background: COLORS.bg, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: COLORS.t4, marginBottom: '3px', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.t1 }}>{item.value}</div>
              </div>
            ))}
          </div>
          {r.payroll.breakdown.map((b, i) => {
            const pct = Math.round(b.amount / r.payroll.total * 100)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: i < r.payroll.breakdown.length - 1 ? '1px solid ' + COLORS.borderSoft : 'none' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: theme.brandDark + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: theme.brandDark, flexShrink: 0 }}>
                  {b.count}명
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.t1 }}>{b.role}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: COLORS.t1 }}>{(b.amount / 10000).toFixed(0)}만</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '2px', background: COLORS.bgMuted, overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: theme.brandDark, borderRadius: '2px' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </Card>

        {/* ⑧ 세무 / 보험 현황 */}
        <Card emoji="🧾" title="세무 / 보험 현황">
          {[
            { label: '부가세 신고',   value: r.tax.vat.done ? '완료 (' + r.tax.vat.date + ')' : '미완료',               ok: r.tax.vat.done },
            { label: '원천세 신고',   value: r.tax.withholding.done ? '완료 (' + r.tax.withholding.date + ')' : '미완료', ok: r.tax.withholding.done },
            { label: '4대보험 납부',  value: r.tax.insurance.done ? r.tax.insurance.amount.toLocaleString() + '원 (' + r.tax.insurance.date + ')' : '미납', ok: r.tax.insurance.done },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid ' + COLORS.borderSoft : 'none' }}>
              <span style={{ fontSize: '13px', color: COLORS.t2 }}>{item.label}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: item.ok ? '#047857' : '#DC2626' }}>{item.value}</span>
            </div>
          ))}
        </Card>

        {/* ⑨ 외부 금융 검증 */}
        <Card emoji="🔍" title="외부 금융 데이터 검증" sub={'쿠콘 API · ' + r.kucoon.verifyDate + ' 검증 완료'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#F0FDF4', borderRadius: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#047857' }}>
              내부 집행 데이터 ↔ 실제 금융 흐름 일치 확인 완료
            </span>
          </div>
          {r.kucoon.matches.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < r.kucoon.matches.length - 1 ? '1px solid ' + COLORS.borderSoft : 'none' }}>
              <span style={{ fontSize: '12px', color: COLORS.t2 }}>{m.label}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: m.ok ? '#047857' : '#DC2626' }}>{m.result}</span>
            </div>
          ))}
        </Card>

        {/* ⑩ 다음 달 계획 */}
        <Card emoji="🚀" title="다음 달 계획" sub="투자자를 위한 주요 목표">
          {r.nextPlan.map((plan, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '9px 0', borderBottom: i < r.nextPlan.length - 1 ? '1px solid ' + COLORS.borderSoft : 'none' }}>
              <span style={{ color: theme.brandDark, fontWeight: 700, flexShrink: 0, fontSize: '13px' }}>{i + 1}.</span>
              <span style={{ fontSize: '13px', color: COLORS.t1, lineHeight: 1.5 }}>{plan}</span>
            </div>
          ))}
        </Card>

        {/* 세무사 전송 */}
        <div style={{ background: COLORS.bgCard, borderRadius: '16px', padding: '14px 16px', boxShadow: SHADOWS.card, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>📤</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: COLORS.t1 }}>세무사 {r.sentEmail} 전송 완료</div>
            <div style={{ fontSize: '11px', color: COLORS.t4, marginTop: '2px' }}>{r.sentTime}</div>
          </div>
        </div>

        {/* 투자자 알림 */}
        <div style={{ background: COLORS.bgCard, borderRadius: '16px', padding: '16px', boxShadow: SHADOWS.card, marginBottom: '32px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.t1, marginBottom: '6px' }}>💬 투자 관계자 알림 발송</div>
          <div style={{ fontSize: '12px', color: COLORS.t4, lineHeight: 1.7, marginBottom: '14px' }}>
            기업 프로필 공개 설정 시, 이번 달 보고서를 투자 관계자에게 플랫폼 메시지로 발송할 수 있습니다.
          </div>
          {notifSent ? (
            <div style={{ padding: '14px', background: '#D1FAE5', borderRadius: '12px', textAlign: 'center', color: '#047857', fontWeight: 700 }}>
              ✓ 투자 관계자에게 발송 완료
            </div>
          ) : (
            <button onClick={() => setNotifSent(true)}
              style={{ width: '100%', padding: '14px', background: theme.activeBtnGrad, border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: theme.activeShadow }}>
              📢 투자 관계자에게 보고서 알림 발송
            </button>
          )}
        </div>
      </div>

      {/* PDF */}
      <div style={{ padding: '12px 16px 20px', background: COLORS.bgCard, boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <button style={{ width: '100%', padding: '15px', background: theme.activeBtnGrad, border: 'none', borderRadius: '14px', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: theme.activeShadow }}>
          PDF 다운로드
        </button>
      </div>
    </div>
  )
}

// ─── 메인 ─────────────────────────────────────────────────
export default function MonthlyReport() {
  const navigate = useNavigate()
  const theme = getAccountTheme()
  const [lang, setLang] = useState(getLang())
  const [activeTab, setActiveTab] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const h = () => setLang(getLang())
    window.addEventListener('langchange', h)
    return () => window.removeEventListener('langchange', h)
  }, [])

  return (
    <PhoneShell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {selected && <ReportDetail r={selected} theme={theme} onClose={() => setSelected(null)} />}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ background: theme.headerGrad, padding: '24px 16px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <button onClick={() => navigate(-1)}
                style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>월간 보고서</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '3px' }}>투자자 운영 리포트 · 자동 생성</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {LIST_TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{ padding: '7px 16px', borderRadius: '20px', border: 'none', flexShrink: 0, background: activeTab === t.key ? '#fff' : 'rgba(255,255,255,0.18)', color: activeTab === t.key ? theme.brandDark : '#fff', fontSize: '12px', fontWeight: activeTab === t.key ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t[lang] || t.ko}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '16px' }}>
            {REPORTS.map(r => <ReportItem key={r.id} r={r} theme={theme} onPress={setSelected} />)}
          </div>

          <div style={{ margin: '0 16px', padding: '14px 16px', background: theme.brandDark + '0E', border: '1px solid ' + theme.brandDark + '25', borderRadius: '14px', display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>📋</span>
            <span style={{ fontSize: '12px', color: COLORS.t2, lineHeight: 1.7 }}>
              매월 1일 자동 생성 후 등록 세무사에게 전송됩니다. 5년간 보관됩니다.
            </span>
          </div>

          <div style={{ padding: '0 16px 32px' }}>
            <button style={{ width: '100%', padding: '14px', background: COLORS.bgCard, border: '1.5px solid ' + COLORS.borderSoft, borderRadius: '14px', color: COLORS.t2, fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: SHADOWS.card }}>
              전체 다운로드 (ZIP)
            </button>
          </div>
        </div>

        <BottomTab />
      </div>
    </PhoneShell>
  )
}
