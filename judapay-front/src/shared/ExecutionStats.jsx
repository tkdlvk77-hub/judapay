import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'
import { getLang } from '../design/i18n'

// ─── 다국어 ──────────────────────────────────────────────
const S = {
  title:          { ko: '집행 통계',       en: 'Execution Stats' },
  period:         { ko: '기간',            en: 'Period' },
  p1m:            { ko: '1개월',           en: '1M' },
  p3m:            { ko: '3개월',           en: '3M' },
  p6m:            { ko: '6개월',           en: '6M' },
  p1y:            { ko: '1년',             en: '1Y' },
  totalExec:      { ko: '총 집행액',        en: 'Total Executed' },
  execCount:      { ko: '집행 건수',        en: 'Transactions' },
  avgAmount:      { ko: '건당 평균',        en: 'Avg per Txn' },
  burnRate:       { ko: '월 소진율',        en: 'Monthly Burn' },
  vsPrev:         { ko: '전월 대비',        en: 'vs Last Month' },
  details:        { ko: '자세히 보기',      en: 'Details' },
  trend:          { ko: '월별 추이',        en: 'Monthly Trend' },
  byType:         { ko: '유형별 분석',      en: 'By Type' },
  recipient:      { ko: '집행 대상 분석',   en: 'Recipient Analysis' },
  pattern:        { ko: '패턴 분석',        en: 'Pattern Analysis' },
  insight:        { ko: '인사이트',         en: 'Insights' },
  anomaly:        { ko: '이상 감지',        en: 'Anomaly Detection' },
  forecast:       { ko: '다음 달 예측',     en: 'Forecast' },
  normal:         { ko: '정상',            en: 'Normal' },
  warning:        { ko: '주의',            en: 'Warning' },
  risk:           { ko: '위험',            en: 'Risk' },
}
function s(key, lang) { return S[key]?.[lang] || S[key]?.ko || key }

// ─── 데이터 ──────────────────────────────────────────────
const MONTHLY_DATA = [
  { m: '12월', en: 'Dec', amount: 1850000, count: 18, prev: null },
  { m: '1월',  en: 'Jan', amount: 1200000, count: 12, prev: 1850000 },
  { m: '2월',  en: 'Feb', amount: 2450000, count: 24, prev: 1200000 },
  { m: '3월',  en: 'Mar', amount: 1980000, count: 19, prev: 2450000 },
  { m: '4월',  en: 'Apr', amount: 2800000, count: 28, prev: 1980000 },
  { m: '5월',  en: 'May', amount: 3200000, count: 31, prev: 2800000 },
]

const TYPE_DATA = [
  { key: 'freelance',  ko: '외주비',    en: 'Freelance', color: '#10B981', amount: 4200000, count: 18, avgDays: 14, riskScore: 12 },
  { key: 'invest',     ko: '자금지원',  en: 'Investment',color: '#0EA5E9', amount: 5000000, count: 4,  avgDays: 45, riskScore: 8 },
  { key: 'lend',       ko: '빌려주기',  en: 'Lending',   color: '#6366F1', amount: 2500000, count: 3,  avgDays: 90, riskScore: 35 },
  { key: 'gift',       ko: '선물·용돈', en: 'Gift',      color: '#F59E0B', amount: 900000,  count: 12, avgDays: 3,  riskScore: 5 },
  { key: 'realestate', ko: '부동산',    en: 'Real Estate',color: '#EF4444', amount: 1100000, count: 2,  avgDays: 120,riskScore: 22 },
]

const RECIPIENTS = [
  {
    name: '㈜오로라',    type: '외주비',   typeKey: 'freelance', count: 8,  total: 3200000, avg: 400000, trend: 15,  risk: 'normal',
    entityType: 'business', bizNo: '123-45-67890',
    hasMCC: true, mccCategories: ['디자인/크리에이티브', 'IT/소프트웨어'],
    mccBlocked: ['유흥/오락', '명품/사치품'],
    lastExec: '2026.05.06', nextExpected: '2026.06.01',
    insight: '최근 3개월 평균 집행액 상승 추세. 계약 규모 확대 가능성.',
    warning: null,
  },
  {
    name: '박민준',      type: '빌려주기', typeKey: 'lend',      count: 2,  total: 1800000, avg: 900000, trend: -8,  risk: 'warning',
    entityType: 'personal', phone: '010-****-5678',
    hasMCC: false,
    lastExec: '2026.04.15', nextExpected: '2026.07.15',
    insight: '상환 기한 D-91. 차용증 등록 완료.',
    warning: '빌려주기 금액이 상환 기한을 초과하고 있습니다. 회수 여부를 확인하세요.',
  },
  {
    name: '서울시청',    type: '자금지원', typeKey: 'invest',    count: 1,  total: 1500000, avg: 1500000, trend: 0,  risk: 'normal',
    entityType: 'government', bizNo: '110-82-00016',
    hasMCC: true, mccCategories: ['교육/학습', '문화/예술'],
    mccBlocked: ['유흥/오락', '도박'],
    lastExec: '2026.03.01', nextExpected: '2026.09.01',
    insight: '반기 지원금. 집행 조건 이행률 100%.',
    warning: null,
  },
  {
    name: '이수진',      type: '외주비',   typeKey: 'freelance', count: 5,  total: 980000, avg: 196000, trend: 42, risk: 'normal',
    entityType: 'personal', phone: '010-****-2341',
    hasMCC: false,
    lastExec: '2026.05.02', nextExpected: '2026.05.20',
    insight: '인건비 성격. 프리랜서 계약서 1건 활성 중.',
    warning: null,
  },
  {
    name: '강남구청',    type: '자금지원', typeKey: 'invest',    count: 3,  total: 750000, avg: 250000, trend: -15, risk: 'warning',
    entityType: 'government', bizNo: '110-83-00032',
    hasMCC: true, mccCategories: ['복지/지원사업'],
    mccBlocked: ['유흥/오락', '명품/사치품', '도박'],
    lastExec: '2026.04.01', nextExpected: '2026.07.01',
    insight: '조건부 지원금. 증빙 제출 기한 D-14.',
    warning: '전월 대비 집행액 15% 감소. 지원 조건 이행 여부를 점검하세요.',
  },
]

// ─── 실시간 결제 로그 데이터 ─────────────────────────────
const PAYMENT_LOGS = [
  {
    id: 'p001', recipient: '㈜오로라', amount: 89000, mcc: '유흥/오락',
    merchant: '강남 룸살롱', merchantCode: 'MCC-7011',
    date: '2026.05.07', time: '23:41', card: '주다카드 ***4521',
    status: 'risk', riskReason: 'MCC 차단 카테고리 (유흥/오락)',
    location: '서울 강남구', lat: 37.498, lng: 127.028,
    needJustify: true,
  },
  {
    id: 'p002', recipient: '㈜오로라', amount: 340000, mcc: '디자인/크리에이티브',
    merchant: '어도비 코리아', merchantCode: 'MCC-7372',
    date: '2026.05.07', time: '14:22', card: '주다카드 ***4521',
    status: 'normal', riskReason: null,
    location: '온라인', lat: null, lng: null,
    needJustify: false,
  },
  {
    id: 'p003', recipient: '이수진', amount: 196000, mcc: 'IT/소프트웨어',
    merchant: '노션 코리아', merchantCode: 'MCC-7372',
    date: '2026.05.06', time: '11:05', card: '주다카드 ***8834',
    status: 'normal', riskReason: null,
    location: '온라인', lat: null, lng: null,
    needJustify: false,
  },
  {
    id: 'p004', recipient: '강남구청', amount: 158000, mcc: '명품/사치품',
    merchant: '루이비통 코엑스점', merchantCode: 'MCC-5944',
    date: '2026.05.05', time: '16:33', card: '주다카드 ***1102',
    status: 'risk', riskReason: 'MCC 차단 카테고리 (명품/사치품)',
    location: '서울 강남구', lat: 37.511, lng: 127.059,
    needJustify: true,
  },
  {
    id: 'p005', recipient: '㈜오로라', amount: 52000, mcc: '식비/외식',
    merchant: '강남 스시오마카세', merchantCode: 'MCC-5812',
    date: '2026.05.05', time: '13:10', card: '주다카드 ***4521',
    status: 'warning', riskReason: '허용 카테고리 외 결제 (식비)',
    location: '서울 강남구', lat: 37.499, lng: 127.031,
    needJustify: true,
  },
  {
    id: 'p006', recipient: '이수진', amount: 45000, mcc: '교통/이동',
    merchant: '카카오택시 기업결제', merchantCode: 'MCC-4121',
    date: '2026.05.04', time: '09:22', card: '주다카드 ***8834',
    status: 'normal', riskReason: null,
    location: '서울 마포구', lat: null, lng: null,
    needJustify: false,
  },
  {
    id: 'p007', recipient: '박민준', amount: 320000, mcc: '도박',
    merchant: '강원랜드 카지노', merchantCode: 'MCC-7995',
    date: '2026.05.03', time: '22:15', card: '주다카드 ***7743',
    status: 'risk', riskReason: '절대 차단 카테고리 (도박)',
    location: '강원 정선군', lat: 37.371, lng: 128.656,
    needJustify: true,
  },
]

// ─── MCC 카테고리 마스터 ─────────────────────────────────
const MCC_MASTER = [
  { id: 'design',    ko: '디자인/크리에이티브', en: 'Design/Creative',    group: 'business' },
  { id: 'it',        ko: 'IT/소프트웨어',        en: 'IT/Software',         group: 'business' },
  { id: 'edu',       ko: '교육/학습',             en: 'Education',           group: 'living' },
  { id: 'culture',   ko: '문화/예술',             en: 'Culture/Arts',        group: 'living' },
  { id: 'food',      ko: '식비/외식',             en: 'Food/Dining',         group: 'living' },
  { id: 'transport', ko: '교통/이동',             en: 'Transport',           group: 'living' },
  { id: 'medical',   ko: '의료/건강',             en: 'Medical',             group: 'living' },
  { id: 'welfare',   ko: '복지/지원사업',          en: 'Welfare',             group: 'business' },
  { id: 'luxury',    ko: '명품/사치품',            en: 'Luxury',              group: 'blocked', defaultBlocked: true },
  { id: 'gambling',  ko: '도박',                  en: 'Gambling',            group: 'blocked', defaultBlocked: true },
  { id: 'adult',     ko: '유흥/오락',              en: 'Adult/Entertainment', group: 'blocked', defaultBlocked: true },
  { id: 'crypto',    ko: '가상화폐',              en: 'Crypto',              group: 'blocked', defaultBlocked: true },
]

// ─── 집행 로그 데이터 ─────────────────────────────────────
const EXEC_LOGS = {
  '㈜오로라': [
    { date: '2026.05.06', amount: 400000, type: '외주비', status: 'done',    memo: '5월 디자인 시안 납품' },
    { date: '2026.04.22', amount: 400000, type: '외주비', status: 'done',    memo: '4월 2차 수정본' },
    { date: '2026.04.08', amount: 400000, type: '외주비', status: 'done',    memo: '4월 1차 납품' },
    { date: '2026.03.25', amount: 400000, type: '외주비', status: 'done',    memo: '3월 최종본' },
    { date: '2026.03.10', amount: 800000, type: '외주비', status: 'done',    memo: '초기 계약금' },
  ],
  '박민준': [
    { date: '2026.04.15', amount: 900000, type: '빌려주기', status: 'pending', memo: '생활비 긴급 대출 (D+91)' },
    { date: '2026.01.10', amount: 900000, type: '빌려주기', status: 'done',    memo: '사업 초기자금' },
  ],
  '서울시청': [
    { date: '2026.03.01', amount: 1500000, type: '자금지원', status: 'done', memo: '2분기 교육지원금' },
  ],
  '이수진': [
    { date: '2026.05.02', amount: 196000, type: '외주비', status: 'done', memo: '5월 원고료' },
    { date: '2026.04.18', amount: 196000, type: '외주비', status: 'done', memo: '4월 원고료' },
    { date: '2026.04.04', amount: 196000, type: '외주비', status: 'done', memo: '3월 원고료' },
  ],
  '강남구청': [
    { date: '2026.04.01', amount: 250000, type: '자금지원', status: 'done',    memo: '4월 복지사업 지원금' },
    { date: '2026.03.01', amount: 250000, type: '자금지원', status: 'done',    memo: '3월 복지사업 지원금' },
    { date: '2026.02.01', amount: 250000, type: '자금지원', status: 'warning', memo: '증빙 미제출' },
  ],
}

const PATTERNS = [
  { label: '주중 집중도', ko: '화~목 집행 집중 (76%)', en: 'Tue–Thu concentrated (76%)', status: 'normal', value: 76 },
  { label: '월초 집행', ko: '1~5일 집중 (54%)', en: '1st–5th of month (54%)', status: 'warning', value: 54 },
  { label: '평균 처리시간', ko: '집행 후 23시간 내 완료', en: 'Completed within 23hrs', status: 'normal', value: 92 },
  { label: '반복 집행', ko: '동일 대상 반복 집행 61%', en: 'Repeat recipients 61%', status: 'normal', value: 61 },
]

const ANOMALIES = [
  { date: '5월 3일', ko: '단일 집행 최대값 초과 (180만원)', en: 'Single max exceeded (1.8M KRW)', severity: 'warning' },
  { date: '4월 28일', ko: '평소 대비 3배 집행 감지', en: '3x usual amount detected', severity: 'warning' },
  { date: '3월 15일', ko: '새로운 수신자 고액 집행', en: 'High-value new recipient', severity: 'risk' },
]

const TOTAL = TYPE_DATA.reduce((s, t) => s + t.amount, 0)
const COUNT = TYPE_DATA.reduce((s, t) => s + t.count, 0)
const MAX_M = Math.max(...MONTHLY_DATA.map(d => d.amount))
const CURRENT = MONTHLY_DATA[MONTHLY_DATA.length - 1]
const PREV = MONTHLY_DATA[MONTHLY_DATA.length - 2]
const MOM = Math.round((CURRENT.amount - PREV.amount) / PREV.amount * 100)

// ─── 유틸 컴포넌트 ────────────────────────────────────────
function SectionCard({ title, onDetail, lang, children }) {
  const theme = getAccountTheme()
  return (
    <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card, marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: COLORS.t1 }}>{title}</span>
        {onDetail && (
          <button onClick={onDetail}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: theme.brandDark, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '2px' }}>
            {s('details', lang)}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.brandDark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function RiskBadge({ level, lang }) {
  const cfg = {
    normal:  { bg: '#D1FAE5', color: '#047857', ko: '정상', en: 'Normal' },
    warning: { bg: '#FEF3C7', color: '#92400E', ko: '주의', en: 'Warning' },
    risk:    { bg: '#FEE2E2', color: '#DC2626', ko: '위험', en: 'Risk' },
  }[level] || { bg: '#F3F4F6', color: '#6B7280', ko: '?', en: '?' }
  return (
    <span style={{ padding: '2px 7px', borderRadius: '10px', background: cfg.bg, color: cfg.color, fontSize: '10px', fontWeight: 700 }}>
      {cfg[lang] || cfg.ko}
    </span>
  )
}

// ─── 결제 상세 뷰 ─────────────────────────────────────────
function PaymentDetailView({ log, lang, theme, onClose, onJustify }) {
  const statusCfg = {
    normal:  { bg: '#D1FAE5', color: '#047857', ko: '정상',    en: 'Normal' },
    warning: { bg: '#FEF3C7', color: '#92400E', ko: '주의',    en: 'Warning' },
    risk:    { bg: '#FEE2E2', color: '#DC2626', ko: '위험',    en: 'Risk' },
  }
  const sc = statusCfg[log.status]

  return (
    <div style={{ position:'absolute', inset:0, background:'#fff', zIndex:50, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* 헤더 */}
      <div style={{ background: theme.headerGrad, padding: '24px 16px 20px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
          <button onClick={onClose} style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', flex: 1 }}>결제 상세</span>
          <span style={{ padding:'4px 12px', borderRadius:'20px', background:sc.bg, color:sc.color, fontSize:'11px', fontWeight:700 }}>
            {sc[lang]||sc.ko}
          </span>
        </div>
        <div style={{ fontSize:'32px', fontWeight:800, color:'#fff', letterSpacing:'-1px', marginBottom:'4px' }}>
          {log.amount.toLocaleString()}원
        </div>
        <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)' }}>{log.merchant} · {log.date} {log.time}</div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
        {/* 위험 경고 */}
        {log.status !== 'normal' && (
          <div style={{ background: log.status==='risk'?'#FEF2F2':'#FEF3C7', border:`1.5px solid ${log.status==='risk'?'#FECACA':'#FDE68A'}`, borderRadius:'14px', padding:'14px 16px', marginBottom:'14px', display:'flex', gap:'10px' }}>
            <span style={{ fontSize:'20px', flexShrink:0 }}>{log.status==='risk'?'🚨':'⚠️'}</span>
            <div>
              <div style={{ fontSize:'13px', fontWeight:700, color: log.status==='risk'?'#DC2626':'#92400E', marginBottom:'4px' }}>
                {log.status==='risk'?'차단 결제 감지':'비정상 결제 감지'}
              </div>
              <div style={{ fontSize:'12px', color: log.status==='risk'?'#B91C1C':'#78350F', lineHeight:1.6 }}>{log.riskReason}</div>
            </div>
          </div>
        )}

        {/* 결제 정보 카드 */}
        <div style={{ background:'#fff', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #F3F4F6', padding:'16px', marginBottom:'12px' }}>
          <div style={{ fontSize:'12px', fontWeight:700, color:'#9CA3AF', marginBottom:'12px' }}>결제 정보</div>
          {[
            { label:'가맹점', value: log.merchant },
            { label:'MCC 코드', value: `${log.merchantCode} (${log.mcc})` },
            { label:'결제 카드', value: log.card },
            { label:'결제 일시', value: `${log.date} ${log.time}` },
            { label:'결제 위치', value: log.location },
            { label:'집행 대상', value: log.recipient },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom: i<5?'1px solid #F9FAFB':'none' }}>
              <span style={{ fontSize:'12px', color:'#9CA3AF', fontWeight:600 }}>{item.label}</span>
              <span style={{ fontSize:'12px', color:'#111', fontWeight:600, textAlign:'right', maxWidth:'60%' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* MCC 위험도 */}
        <div style={{ background:'#fff', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #F3F4F6', padding:'16px', marginBottom:'12px' }}>
          <div style={{ fontSize:'12px', fontWeight:700, color:'#9CA3AF', marginBottom:'12px' }}>MCC 위험도 분석</div>
          {[
            { label:'카테고리 적합성', score: log.status==='normal'?95:log.status==='warning'?45:10, color: log.status==='normal'?'#10B981':log.status==='warning'?'#F59E0B':'#EF4444' },
            { label:'금액 이상 여부',  score: log.amount > 200000 ? 60 : 90, color: log.amount > 200000 ? '#F59E0B' : '#10B981' },
            { label:'시간대 적절성',   score: parseInt(log.time) > 22 || parseInt(log.time) < 6 ? 30 : 85, color: parseInt(log.time) > 22 ? '#EF4444' : '#10B981' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: i<2?'10px':0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                <span style={{ fontSize:'11px', color:'#6B7280' }}>{item.label}</span>
                <span style={{ fontSize:'11px', fontWeight:700, color:item.color }}>{item.score}점</span>
              </div>
              <div style={{ height:'5px', borderRadius:'3px', background:'#F3F4F6', overflow:'hidden' }}>
                <div style={{ width:item.score+'%', height:'100%', background:item.color, borderRadius:'3px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 소명요청 버튼 */}
      {log.needJustify && (
        <div style={{ padding:'12px 16px 32px', background:'#fff', boxShadow:'0 -4px 20px rgba(0,0,0,0.06)' }}>
          <button onClick={() => onJustify([log])}
            style={{ width:'100%', padding:'15px', background:theme.activeBtnGrad, border:'none', borderRadius:'14px', color:'#fff', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:theme.activeShadow }}>
            💬 이 건 소명요청 보내기
          </button>
        </div>
      )}
    </div>
  )
}

// ─── 소명요청 발송 모달 ───────────────────────────────────
function JustifyModal({ logs, theme, onClose }) {
  const [sent, setSent] = useState(false)
  const [msg, setMsg] = useState(
    logs.length === 1
      ? `[소명요청] ${logs[0].date} ${logs[0].merchant} ${logs[0].amount.toLocaleString()}원 결제에 대한 사용 목적을 소명해주세요.`
      : `[소명요청] 아래 ${logs.length}건의 결제에 대한 사용 목적을 소명해주세요.\n` +
        logs.map(l => `• ${l.date} ${l.merchant} ${l.amount.toLocaleString()}원`).join('\n')
  )

  return (
    <div style={{ position:'absolute', inset:0, zIndex:60, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div onClick={onClose} style={{ flex:1, background:'rgba(0,0,0,0.55)' }} />
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:'20px 20px 32px' }}>
        <div style={{ width:'36px', height:'4px', borderRadius:'2px', background:'#E5E7EB', margin:'0 auto 18px' }} />
        <div style={{ fontSize:'17px', fontWeight:700, color:'#111', marginBottom:'4px' }}>소명요청 메시지</div>
        <div style={{ fontSize:'12px', color:'#9CA3AF', marginBottom:'14px' }}>
          {logs.map(l=>l.recipient).filter((v,i,a)=>a.indexOf(v)===i).join(', ')}에게 플랫폼 메시지로 전송됩니다
        </div>

        {/* 선택된 건 목록 */}
        {logs.length > 1 && (
          <div style={{ background:'#F9FAFB', borderRadius:'12px', padding:'10px 12px', marginBottom:'12px', maxHeight:'120px', overflowY:'auto' }}>
            {logs.map((l,i) => (
              <div key={i} style={{ fontSize:'11px', color:'#374151', padding:'3px 0', display:'flex', justifyContent:'space-between' }}>
                <span>{l.merchant}</span>
                <span style={{ fontWeight:700 }}>{l.amount.toLocaleString()}원</span>
              </div>
            ))}
          </div>
        )}

        {/* 메시지 편집 */}
        <textarea
          value={msg} onChange={e => setMsg(e.target.value)}
          style={{ width:'100%', height:'100px', padding:'12px', borderRadius:'12px', border:'1.5px solid #E5E7EB', fontSize:'13px', color:'#111', fontFamily:'inherit', resize:'none', outline:'none', boxSizing:'border-box', lineHeight:1.6 }}
        />

        {sent ? (
          <div style={{ textAlign:'center', padding:'16px', background:'#D1FAE5', borderRadius:'14px', color:'#047857', fontWeight:700, fontSize:'15px', marginTop:'12px' }}>
            ✓ 플랫폼 메시지로 발송 완료
          </div>
        ) : (
          <div style={{ display:'flex', gap:'10px', marginTop:'12px' }}>
            <button onClick={onClose}
              style={{ flex:1, padding:'14px', background:'#F3F4F6', border:'none', borderRadius:'14px', fontSize:'14px', fontWeight:600, color:'#6B7280', cursor:'pointer', fontFamily:'inherit' }}>
              취소
            </button>
            <button onClick={() => setSent(true)}
              style={{ flex:2, padding:'14px', background:theme.activeBtnGrad, border:'none', borderRadius:'14px', fontSize:'14px', fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'inherit', boxShadow:theme.activeShadow }}>
              💬 메시지 발송
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 실시간 결제 로그 상세 뷰 ────────────────────────────
function PaymentLogView({ lang, theme, onClose }) {
  const [selected, setSelected] = useState([])
  const [detailLog, setDetailLog] = useState(null)
  const [justifyLogs, setJustifyLogs] = useState(null)
  const [filter, setFilter] = useState('all')

  const FILTERS = [
    { key:'all',     ko:'전체',  en:'All' },
    { key:'risk',    ko:'위험',  en:'Risk' },
    { key:'warning', ko:'주의',  en:'Warning' },
    { key:'normal',  ko:'정상',  en:'Normal' },
  ]

  const filtered = filter === 'all' ? PAYMENT_LOGS : PAYMENT_LOGS.filter(l => l.status === filter)
  const needJustify = filtered.filter(l => l.needJustify)
  const allSelected = filtered.length > 0 && filtered.every(l => selected.includes(l.id))
  const selectedNeedJustify = selected.map(id => filtered.find(l=>l.id===id)).filter(l=>l&&l.needJustify)

  const toggleAll = () => {
    if (allSelected) setSelected([])
    else setSelected(filtered.map(l=>l.id))
  }
  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  const statusCfg = {
    normal:  { bg:'#D1FAE5', color:'#047857', dot:'#10B981', ko:'정상', en:'Normal' },
    warning: { bg:'#FEF3C7', color:'#92400E', dot:'#F59E0B', ko:'주의', en:'Warning' },
    risk:    { bg:'#FEE2E2', color:'#DC2626', dot:'#EF4444', ko:'위험', en:'Risk' },
  }

  return (
    <div style={{ position:'absolute', inset:0, background:'#F9FAFB', zIndex:40, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {detailLog && (
        <PaymentDetailView
          log={detailLog} lang={lang} theme={theme}
          onClose={() => setDetailLog(null)}
          onJustify={(logs) => { setJustifyLogs(logs); setDetailLog(null) }}
        />
      )}
      {justifyLogs && <JustifyModal logs={justifyLogs} theme={theme} onClose={() => setJustifyLogs(null)} />}

      {/* 헤더 */}
      <div style={{ background:theme.headerGrad, padding: '24px 16px 20px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
          <button onClick={onClose} style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>실시간 결제 분석</div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.65)' }}>
              총 {PAYMENT_LOGS.length}건 · 위험 {PAYMENT_LOGS.filter(l=>l.status==='risk').length}건 · 주의 {PAYMENT_LOGS.filter(l=>l.status==='warning').length}건
            </div>
          </div>
          {/* 라이브 표시 */}
          <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.4)', padding:'4px 10px', borderRadius:'20px' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#EF4444', animation:'pulse 1.5s infinite' }} />
            <span style={{ fontSize:'10px', fontWeight:700, color:'#FCA5A5' }}>LIVE</span>
          </div>
        </div>

        {/* 필터 탭 */}
        <div style={{ display:'flex', background:'rgba(0,0,0,0.2)', borderRadius:'12px', padding:'3px', gap:'3px' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ flex:1, padding:'6px 4px', borderRadius:'9px', border:'none', background: filter===f.key?'rgba(255,255,255,0.22)':'transparent', color:'#fff', fontSize:'12px', fontWeight: filter===f.key?700:400, cursor:'pointer', fontFamily:'inherit' }}>
              {f[lang]||f.ko}
            </button>
          ))}
        </div>
      </div>

      {/* 전체 선택 + 소명요청 바 */}
      <div style={{ background:'#fff', padding:'10px 16px', display:'flex', alignItems:'center', gap:'10px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', flexShrink:0 }}>
        <button onClick={toggleAll}
          style={{ width:'22px', height:'22px', borderRadius:'7px', border:`2px solid ${allSelected ? theme.brandDark : '#D1D5DB'}`, background: allSelected ? theme.brandDark : '#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
          {allSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </button>
        <span style={{ fontSize:'12px', color:'#6B7280', flex:1 }}>
          {selected.length > 0 ? `${selected.length}건 선택됨` : '전체 선택'}
        </span>
        {selectedNeedJustify.length > 0 && (
          <button onClick={() => setJustifyLogs(selectedNeedJustify)}
            style={{ padding:'8px 16px', background:theme.activeBtnGrad, border:'none', borderRadius:'10px', color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:theme.activeShadow }}>
            💬 소명요청 {selectedNeedJustify.length}건
          </button>
        )}
      </div>

      {/* 결제 목록 */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 32px' }}>
        {filtered.map((log, i) => {
          const sc = statusCfg[log.status]
          const isSelected = selected.includes(log.id)
          return (
            <div key={log.id}
              style={{ background:'#fff', borderRadius:'16px', border:`1.5px solid ${isSelected ? theme.brandDark+'50' : log.status==='risk' ? '#FECACA' : log.status==='warning' ? '#FDE68A' : '#F3F4F6'}`, boxShadow: isSelected ? '0 4px 16px '+theme.brandDark+'20' : '0 2px 8px rgba(0,0,0,0.05)', padding:'14px', marginBottom:'10px', transition:'all .15s' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                {/* 체크박스 */}
                <button onClick={() => toggleOne(log.id)}
                  style={{ width:'22px', height:'22px', borderRadius:'7px', border:`2px solid ${isSelected ? theme.brandDark : '#D1D5DB'}`, background: isSelected ? theme.brandDark : '#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:'1px' }}>
                  {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>

                {/* 상태 점 */}
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:sc.dot, flexShrink:0, marginTop:'5px' }} />

                {/* 내용 */}
                <button onClick={() => setDetailLog(log)}
                  style={{ flex:1, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left', padding:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'4px' }}>
                    <span style={{ fontSize:'14px', fontWeight:700, color:'#111' }}>{log.merchant}</span>
                    <span style={{ fontSize:'15px', fontWeight:800, color: log.status==='normal'?'#111':'#111', flexShrink:0, marginLeft:'8px' }}>
                      {log.amount.toLocaleString()}원
                    </span>
                  </div>
                  <div style={{ fontSize:'11px', color:'#9CA3AF', marginBottom:'6px' }}>
                    {log.recipient} · {log.date} {log.time} · {log.card.slice(-8)}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ padding:'2px 8px', borderRadius:'8px', background:sc.bg, color:sc.color, fontSize:'10px', fontWeight:700 }}>{sc[lang]||sc.ko}</span>
                    <span style={{ padding:'2px 8px', borderRadius:'8px', background:'#F3F4F6', color:'#6B7280', fontSize:'10px', fontWeight:600 }}>{log.mcc}</span>
                    {log.riskReason && <span style={{ fontSize:'10px', color:sc.color, fontWeight:600 }}>· {log.riskReason}</span>}
                  </div>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ─── 상세 화면 ────────────────────────────────────────────
function DetailView({ type, lang, theme, onClose }) {
  if (type === 'payment') return <PaymentLogView lang={lang} theme={theme} onClose={onClose} />
  const views = {
    trend: <TrendDetail lang={lang} theme={theme} />,
    type:  <TypeDetail  lang={lang} theme={theme} />,
    recipient: <RecipientDetail lang={lang} theme={theme} />,
    pattern:   <PatternDetail  lang={lang} theme={theme} />,
    payment:   <PaymentLogView   lang={lang} theme={theme} onClose={() => setDetail(null)} />,
  }
  const titles = {
    trend: s('trend', lang), type: s('byType', lang),
    recipient: s('recipient', lang), pattern: s('pattern', lang), payment: '실시간 결제 분석',
  }
  return (
    <div style={{ position: 'absolute', inset: 0, background: COLORS.bg, zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: theme.headerGrad, padding: '24px 16px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onClose}
            style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{titles[type]}</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {views[type]}
      </div>
    </div>
  )
}

function TrendDetail({ lang, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 월별 상세 테이블 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1, marginBottom: '12px' }}>월별 집행 상세</div>
        {MONTHLY_DATA.slice(1).map((d, i) => {
          const pct = d.prev ? Math.round((d.amount - d.prev) / d.prev * 100) : 0
          const isUp = pct >= 0
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: i < MONTHLY_DATA.length - 2 ? '1px solid ' + COLORS.borderSoft : 'none' }}>
              <div style={{ width: '32px', fontSize: '12px', color: COLORS.t4, fontWeight: 600 }}>{lang === 'en' ? d.en : d.m}</div>
              <div style={{ flex: 1 }}>
                <div style={{ height: '6px', borderRadius: '3px', background: COLORS.bgMuted, overflow: 'hidden' }}>
                  <div style={{ width: (d.amount / MAX_M * 100) + '%', height: '100%', background: i === MONTHLY_DATA.length - 2 ? theme.activeBtnGrad : theme.brandDark + '60', borderRadius: '3px' }} />
                </div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.t1, width: '60px', textAlign: 'right' }}>{(d.amount / 10000).toFixed(0)}만</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: isUp ? '#DC2626' : '#059669', width: '40px', textAlign: 'right' }}>{isUp ? '▲' : '▼'}{Math.abs(pct)}%</div>
            </div>
          )
        })}
      </div>

      {/* 예측 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1, marginBottom: '12px' }}>🔮 {s('forecast', lang)}</div>
        <div style={{ background: theme.brandDark + '10', borderRadius: RADIUS.md, padding: '14px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: theme.brandDark, marginBottom: '4px' }}>약 3,650만원</div>
          <div style={{ fontSize: '12px', color: COLORS.t2 }}>6개월 평균 증가율(+14.2%) 기반 예측</div>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: '낙관 시나리오', value: '4,100만원', color: '#059669' },
            { label: '기본 시나리오', value: '3,650만원', color: theme.brandDark },
            { label: '보수 시나리오', value: '3,200만원', color: '#D97706' },
          ].map((sc, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: COLORS.t3 }}>{sc.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: sc.color }}>{sc.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 인사이트 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1, marginBottom: '12px' }}>💡 {s('insight', lang)}</div>
        {[
          { icon: '📈', text: '지난 3개월 연속 증가 추세. 4월 대비 5월 +14.3%로 성장세 가속.' },
          { icon: '⚠️', text: '2월 급등(+104%) 후 3월 조정(-19%) 패턴 반복 가능성 있음.' },
          { icon: '💰', text: '현재 소진 속도로는 연간 약 2.8억원 집행 예상.' },
        ].map((ins, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: i < 2 ? '1px solid ' + COLORS.borderSoft : 'none' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{ins.icon}</span>
            <span style={{ fontSize: '12px', color: COLORS.t2, lineHeight: 1.6 }}>{ins.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TypeDetail({ lang, theme }) {
  const total = TYPE_DATA.reduce((s, t) => s + t.amount, 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {TYPE_DATA.map((d, i) => {
        const pct = Math.round(d.amount / total * 100)
        return (
          <div key={i} style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: COLORS.t1, flex: 1 }}>{lang === 'en' ? d.en : d.ko}</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: d.color }}>{pct}%</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {[
                { label: '총 금액', value: (d.amount / 10000).toFixed(0) + '만원' },
                { label: '건수', value: d.count + '건' },
                { label: '평균 주기', value: d.avgDays + '일' },
              ].map((item, j) => (
                <div key={j} style={{ background: COLORS.bg, borderRadius: RADIUS.md, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: COLORS.t4, marginBottom: '4px', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1 }}>{item.value}</div>
                </div>
              ))}
            </div>
            {/* 리스크 바 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: COLORS.t4, fontWeight: 600, flexShrink: 0 }}>리스크</span>
              <div style={{ flex: 1, height: '5px', borderRadius: '3px', background: COLORS.bgMuted, overflow: 'hidden' }}>
                <div style={{ width: d.riskScore + '%', height: '100%', borderRadius: '3px', background: d.riskScore > 25 ? '#EF4444' : d.riskScore > 15 ? '#F59E0B' : '#10B981' }} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: d.riskScore > 25 ? '#EF4444' : d.riskScore > 15 ? '#D97706' : '#059669', flexShrink: 0 }}>{d.riskScore}/100</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── MCC 변경 바텀시트 ────────────────────────────────────
function MCCSheet({ recipient, lang, theme, onClose }) {
  const initAllowed = recipient.mccCategories?.map(ko =>
    MCC_MASTER.find(m => m.ko === ko)?.id
  ).filter(Boolean) || []
  const initBlocked = recipient.mccBlocked?.map(ko =>
    MCC_MASTER.find(m => m.ko === ko)?.id
  ).filter(Boolean) || []

  const [allowed, setAllowed] = useState(initAllowed)
  const [saved, setSaved] = useState(false)

  const toggle = (id) => {
    const isDefaultBlocked = MCC_MASTER.find(m => m.id === id)?.defaultBlocked
    if (isDefaultBlocked) return // 기본 차단은 변경 불가
    setAllowed(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', maxHeight: '80%', display: 'flex', flexDirection: 'column' }}>
        {/* 핸들 */}
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#E5E7EB' }} />
        </div>
        {/* 헤더 */}
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#111', marginBottom: '2px' }}>MCC 변경</div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{recipient.name} · 허용 카테고리 실시간 수정</div>
        </div>
        {/* 리스트 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {['business', 'living', 'blocked'].map(group => {
            const items = MCC_MASTER.filter(m => m.group === group)
            const groupLabel = { business: '업무 관련', living: '생활 관련', blocked: '항상 차단' }[group]
            return (
              <div key={group} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  {groupLabel.toUpperCase()}
                </div>
                {items.map(m => {
                  const isAllowed = allowed.includes(m.id)
                  const isDefault = m.defaultBlocked
                  return (
                    <button key={m.id} onClick={() => toggle(m.id)}
                      style={{
                        width: '100%', padding: '12px 14px', marginBottom: '6px',
                        background: isDefault ? '#FEF2F2' : isAllowed ? theme.brandDark + '0D' : '#F9FAFB',
                        border: `1.5px solid ${isDefault ? '#FECACA' : isAllowed ? theme.brandDark + '40' : '#E5E7EB'}`,
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: isDefault ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '6px',
                          background: isDefault ? '#FEE2E2' : isAllowed ? theme.brandDark : '#E5E7EB',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {(isAllowed || isDefault) && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              {isDefault ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <polyline points="20 6 9 17 4 12"/>}
                            </svg>
                          )}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: isDefault ? '#DC2626' : '#111' }}>
                          {lang === 'en' ? m.en : m.ko}
                        </span>
                      </div>
                      {isDefault && <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: 600 }}>변경불가</span>}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
        {/* 저장 버튼 */}
        <div style={{ padding: '12px 20px 32px' }}>
          {saved ? (
            <div style={{ textAlign: 'center', padding: '14px', background: '#D1FAE5', borderRadius: '14px', color: '#047857', fontWeight: 700, fontSize: '14px' }}>
              ✓ 실시간 적용 완료
            </div>
          ) : (
            <button onClick={() => setSaved(true)}
              style={{
                width: '100%', padding: '15px',
                background: theme.activeBtnGrad, border: 'none',
                borderRadius: '14px', color: '#fff',
                fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: theme.activeShadow,
              }}>
              변경 사항 즉시 적용
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 집행 로그 화면 ───────────────────────────────────────
function ExecLogView({ recipient, lang, theme, onClose }) {
  const logs = EXEC_LOGS[recipient.name] || []
  const statusCfg = {
    done:    { bg: '#D1FAE5', color: '#047857', ko: '완료',   en: 'Done' },
    pending: { bg: '#FEF3C7', color: '#92400E', ko: '진행중', en: 'Pending' },
    warning: { bg: '#FEE2E2', color: '#DC2626', ko: '주의',   en: 'Warning' },
  }
  const total = logs.reduce((s, l) => s + l.amount, 0)

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 30, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ background: theme.headerGrad, padding: '24px 16px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <button onClick={onClose}
            style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>집행 로그</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{recipient.name} · {logs.length}건</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginBottom: '2px' }}>총 집행액</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{(total/10000).toFixed(0)}만원</div>
          </div>
        </div>
      </div>

      {/* 로그 리스트 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {logs.map((log, i) => {
          const sc = statusCfg[log.status]
          return (
            <div key={i} style={{
              background: '#fff', borderRadius: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: '1px solid #F3F4F6',
              padding: '14px 16px', marginBottom: '10px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              {/* 인덱스 */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: theme.brandDark + '12',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: theme.brandDark, flexShrink: 0,
              }}>
                {String(logs.length - i).padStart(2, '0')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '3px' }}>{log.memo}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{log.date} · {log.type}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#111', marginBottom: '4px' }}>
                  {log.amount.toLocaleString()}원
                </div>
                <span style={{ padding: '2px 8px', borderRadius: '8px', background: sc.bg, color: sc.color, fontSize: '10px', fontWeight: 700 }}>
                  {sc[lang] || sc.ko}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


function RecipientDetail({ lang, theme }) {
  const [expanded, setExpanded] = React.useState(null)
  const [mccTarget, setMccTarget] = React.useState(null)
  const [logTarget, setLogTarget] = React.useState(null)

  const ENTITY_BADGE = {
    business:   { ko: '법인', en: 'Corp',  bg: '#EFF6FF', color: '#1D4ED8' },
    personal:   { ko: '개인', en: 'Personal', bg: '#F5F3FF', color: '#6D28D9' },
    government: { ko: '기관', en: 'Gov',   bg: '#F0FDF4', color: '#15803D' },
  }

  const ACTION_BTNS = (r) => {
    const hasMoved = ['lend', 'freelance'].includes(r.typeKey) && r.entityType === 'personal'
    const btns = []
    if (!hasMoved && r.hasMCC) {
      btns.push({ label: 'MCC 변경', icon: '⚙️', color: theme.brandDark, bg: theme.brandDark + '12' })
    }
    btns.push({ label: '집행 로그', icon: '📋', color: '#0369A1', bg: '#EFF6FF' })
    if (!hasMoved) {
      btns.push({ label: '증빙 센터', icon: '📎', color: '#047857', bg: '#F0FDF4' })
    }
    return btns
  }

  return (
    <div style={{ position: 'relative' }}>
      {mccTarget && <MCCSheet recipient={mccTarget} lang={lang} theme={theme} onClose={() => setMccTarget(null)} />}
      {logTarget && <ExecLogView recipient={logTarget} lang={lang} theme={theme} onClose={() => setLogTarget(null)} />}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {RECIPIENTS.map((r, i) => {
        const isOpen = expanded === i
        const eb = ENTITY_BADGE[r.entityType]
        const actions = ACTION_BTNS(r)

        return (
          <div key={i} style={{
            background: COLORS.bgCard,
            borderRadius: '20px',
            boxShadow: isOpen ? '0 8px 32px rgba(0,0,0,0.12)' : SHADOWS.card,
            overflow: 'hidden',
            border: isOpen ? '1.5px solid ' + theme.brandDark + '30' : '1.5px solid transparent',
            transition: 'box-shadow .2s, border .2s',
          }}>
            {/* 상단 헤더 — 항상 보임 */}
            <button onClick={() => setExpanded(isOpen ? null : i)}
              style={{ width: '100%', background: 'none', border: 'none', padding: '16px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* 아바타 */}
                <div style={{
                  width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                  background: isOpen ? theme.activeBtnGrad : theme.brandDark + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 800, color: isOpen ? '#fff' : theme.brandDark,
                  boxShadow: isOpen ? theme.activeShadow : 'none',
                  transition: 'all .2s',
                }}>
                  {r.name[0]}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: COLORS.t1 }}>{r.name}</span>
                    <span style={{ padding: '1px 6px', borderRadius: '6px', background: eb.bg, color: eb.color, fontSize: '10px', fontWeight: 700 }}>
                      {eb[lang] || eb.ko}
                    </span>
                    <RiskBadge level={r.risk} lang={lang} />
                  </div>
                  <div style={{ fontSize: '11px', color: COLORS.t4 }}>
                    {r.type} · {r.count}회 · 최근 {r.lastExec}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: COLORS.t1, letterSpacing: '-0.5px' }}>
                    {(r.total / 10000).toFixed(0)}만
                  </div>
                  <div style={{ fontSize: '10px', color: r.trend > 0 ? '#DC2626' : r.trend < 0 ? '#059669' : COLORS.t4, fontWeight: 700 }}>
                    {r.trend > 0 ? '▲' : r.trend < 0 ? '▼' : '─'}{Math.abs(r.trend)}%
                  </div>
                </div>
              </div>
            </button>

            {/* 펼쳐지는 상세 */}
            {isOpen && (
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ height: '1px', background: COLORS.borderSoft, marginBottom: '14px' }} />

                {/* KPI 3박스 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  {[
                    { label: '총 집행액', value: (r.total/10000).toFixed(0)+'만원' },
                    { label: '건당 평균', value: (r.avg/10000).toFixed(1)+'만원' },
                    { label: '다음 예정', value: r.nextExpected },
                  ].map((item, j) => (
                    <div key={j} style={{ background: COLORS.bg, borderRadius: RADIUS.md, padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: COLORS.t4, marginBottom: '4px', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: COLORS.t1 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* MCC 허용 카테고리 */}
                {r.hasMCC && r.mccCategories && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: COLORS.t4, fontWeight: 600, marginBottom: '6px' }}>허용 MCC 카테고리</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      {r.mccCategories.map((m, j) => (
                        <span key={j} style={{ padding: '3px 9px', borderRadius: '20px', background: '#F0FDF4', color: '#047857', fontSize: '10px', fontWeight: 600 }}>✓ {m}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {r.mccBlocked.map((m, j) => (
                        <span key={j} style={{ padding: '3px 9px', borderRadius: '20px', background: '#FEF2F2', color: '#DC2626', fontSize: '10px', fontWeight: 600 }}>✕ {m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 인사이트 */}
                <div style={{ background: theme.brandDark+'0D', borderRadius: RADIUS.md, padding: '10px 12px', marginBottom: '12px', display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>💡</span>
                  <span style={{ fontSize: '11px', color: COLORS.t2, lineHeight: 1.6 }}>{r.insight}</span>
                </div>

                {/* 경고 */}
                {r.warning && (
                  <div style={{ background: '#FEF3C7', borderRadius: RADIUS.md, padding: '10px 12px', marginBottom: '12px', display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
                    <span style={{ fontSize: '11px', color: '#92400E', lineHeight: 1.6 }}>{r.warning}</span>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {actions.map((a, j) => (
                    <button key={j}
                      onClick={() => {
                        if (a.label === 'MCC 변경') setMccTarget(r)
                        else if (a.label === '집행 로그') setLogTarget(r)
                        else alert(a.label + '\n\n개발 예정 기능입니다.')
                      }}
                      style={{
                        flex: 1, padding: '10px 4px',
                        background: a.bg, border: 'none',
                        borderRadius: RADIUS.md,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                      <span style={{ fontSize: '16px' }}>{a.icon}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: a.color }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
    </div>
  )
}

function PatternDetail({ lang, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 요일별 히트맵 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1, marginBottom: '14px' }}>요일별 집행 분포</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { day: '월', pct: 12 }, { day: '화', pct: 28 }, { day: '수', pct: 24 },
            { day: '목', pct: 20 }, { day: '금', pct: 14 }, { day: '토', pct: 2 }, { day: '일', pct: 0 },
          ].map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '9px', color: d.pct > 20 ? theme.brandDark : COLORS.t4, fontWeight: d.pct > 20 ? 700 : 400 }}>{d.pct}%</div>
              <div style={{ width: '100%', borderRadius: '6px 6px 0 0', height: Math.max(4, d.pct * 2.4) + 'px', background: d.pct > 20 ? theme.activeBtnGrad : COLORS.bgMuted }} />
              <div style={{ fontSize: '10px', color: COLORS.t3, fontWeight: d.pct > 20 ? 700 : 400 }}>{d.day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 시간대별 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1, marginBottom: '14px' }}>시간대별 집행 분포</div>
        {[
          { label: '오전 (09~12시)', pct: 42, color: theme.brandDark },
          { label: '오후 (13~18시)', pct: 38, color: theme.brandDark + 'AA' },
          { label: '저녁 (18~22시)', pct: 16, color: COLORS.bgMuted },
          { label: '심야/새벽',      pct: 4,  color: '#EF4444' },
        ].map((t, i) => (
          <div key={i} style={{ marginBottom: i < 3 ? '10px' : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: COLORS.t2 }}>{t.label}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: t.pct === 4 ? '#EF4444' : COLORS.t1 }}>{t.pct}%</span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', background: COLORS.bgMuted, overflow: 'hidden' }}>
              <div style={{ width: t.pct + '%', height: '100%', background: t.color, borderRadius: '3px' }} />
            </div>
          </div>
        ))}
        {/* 심야 경고 */}
        <div style={{ marginTop: '12px', background: '#FEE2E2', borderRadius: RADIUS.md, padding: '10px 12px', display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>🔴</span>
          <span style={{ fontSize: '11px', color: '#DC2626', lineHeight: 1.5 }}>심야 시간대 집행 4건 감지. 비정상 접근 가능성이 있으니 보안 로그를 확인하세요.</span>
        </div>
      </div>

      {/* 이상 감지 */}
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding: '16px', boxShadow: SHADOWS.card }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.t1, marginBottom: '12px' }}>🚨 {s('anomaly', lang)}</div>
        {ANOMALIES.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: i < ANOMALIES.length - 1 ? '1px solid ' + COLORS.borderSoft : 'none' }}>
            <div style={{ width: '6px', borderRadius: '3px', background: a.severity === 'risk' ? '#EF4444' : '#F59E0B', flexShrink: 0, alignSelf: 'stretch' }} />
            <div>
              <div style={{ fontSize: '11px', color: COLORS.t4, marginBottom: '2px' }}>{a.date}</div>
              <div style={{ fontSize: '12px', color: COLORS.t1, lineHeight: 1.5 }}>{lang === 'en' ? a.en : a.ko}</div>
            </div>
            <RiskBadge level={a.severity} lang={lang} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 메인 화면 ────────────────────────────────────────────
export default function ExecutionStats() {
  const navigate = useNavigate()
  const theme = getAccountTheme()
  const [lang, setLang] = useState(getLang())
  const [period, setPeriod] = useState('p1m')
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    const handler = () => setLang(getLang())
    window.addEventListener('langchange', handler)
    return () => window.removeEventListener('langchange', handler)
  }, [])

  const PERIODS = ['p1m','p3m','p6m','p1y'].map(k => ({ key: k, label: s(k, lang) }))

  return (
    <PhoneShell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* 상세 화면 오버레이 */}
        {detail && <DetailView type={detail} lang={lang} theme={theme} onClose={() => setDetail(null)} />}

        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* 헤더 */}
          <div style={{ background: theme.headerGrad, padding: '24px 16px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => navigate(-1)}
                style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{s('title', lang)}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '3px' }}>전체 집행 · 일별·주별·월별 분석</div>
              </div>
            </div>

            {/* KPI 4박스 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: s('totalExec', lang), value: (TOTAL/10000).toFixed(0)+'만원', sub: `${s('vsPrev', lang)} ${MOM>0?'+':''}${MOM}%`, subColor: MOM>0?'#FCA5A5':'#6EE7B7' },
                { label: s('execCount', lang), value: COUNT+'건', sub: '이번달 31건', subColor: 'rgba(255,255,255,0.5)' },
                { label: s('avgAmount', lang), value: (TOTAL/COUNT/10000).toFixed(1)+'만원', sub: '전월 대비 +8.2%', subColor: '#FCA5A5' },
                { label: s('burnRate', lang), value: '64%', sub: '목표 소진율 70%', subColor: 'rgba(255,255,255,0.5)' },
              ].map((kpi, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: RADIUS.lg, padding: '12px 14px' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginBottom: '6px' }}>{kpi.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '4px' }}>{kpi.value}</div>
                  <div style={{ fontSize: '10px', color: kpi.subColor, fontWeight: 600 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* 기간 탭 */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: RADIUS.pill, padding: '3px', gap: '2px' }}>
              {PERIODS.map(p => (
                <button key={p.key} onClick={() => setPeriod(p.key)}
                  style={{ flex: 1, height: '30px', borderRadius: RADIUS.pill, border: 'none', background: period === p.key ? 'rgba(255,255,255,0.25)' : 'transparent', color: '#fff', fontSize: '12px', fontWeight: period === p.key ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 섹션들 */}
          <div style={{ padding: '16px 16px 32px' }}>

            {/* 월별 추이 */}
            <SectionCard title={s('trend', lang)} onDetail={() => setDetail('trend')} lang={lang}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '90px' }}>
                {MONTHLY_DATA.map((d, i) => {
                  const isLast = i === MONTHLY_DATA.length - 1
                  const pct = d.amount / MAX_M
                  const prev = MONTHLY_DATA[i-1]
                  const chg = prev ? Math.round((d.amount-prev.amount)/prev.amount*100) : null
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      {chg !== null && <div style={{ fontSize: '8px', fontWeight: 700, color: chg>=0?'#DC2626':'#059669' }}>{chg>0?'+':''}{chg}%</div>}
                      {chg === null && <div style={{ fontSize: '8px', color: 'transparent' }}>0</div>}
                      <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: Math.max(6, pct*70)+'px', background: isLast ? theme.activeBtnGrad : COLORS.bgMuted }} />
                      <div style={{ fontSize: '10px', color: isLast ? theme.brandDark : COLORS.t4, fontWeight: isLast?700:400 }}>
                        {lang==='en'?d.en:d.m}
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>

            {/* 유형별 분석 */}
            <SectionCard title={s('byType', lang)} onDetail={() => setDetail('type')} lang={lang}>
              {TYPE_DATA.map((d, i) => {
                const pct = Math.round(d.amount/TOTAL*100)
                return (
                  <div key={i} style={{ marginBottom: i<TYPE_DATA.length-1?'10px':0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:d.color }} />
                        <span style={{ fontSize:'12px', color:COLORS.t1, fontWeight:600 }}>{lang==='en'?d.en:d.ko}</span>
                        <span style={{ fontSize:'10px', color:COLORS.t4 }}>{d.count}건</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ fontSize:'12px', fontWeight:700, color:COLORS.t1 }}>{(d.amount/10000).toFixed(0)}만원</span>
                        <span style={{ fontSize:'10px', color:COLORS.t4, width:'28px', textAlign:'right' }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height:'5px', borderRadius:'3px', background:COLORS.bgMuted, overflow:'hidden' }}>
                      <div style={{ width:pct+'%', height:'100%', background:d.color, borderRadius:'3px' }} />
                    </div>
                  </div>
                )
              })}
            </SectionCard>

            {/* 집행 대상 */}
            <SectionCard title={s('recipient', lang)} onDetail={() => setDetail('recipient')} lang={lang}>
              {RECIPIENTS.slice(0,3).map((r, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom: i<2?'1px solid '+COLORS.borderSoft:'none' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:theme.brandDark+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:theme.brandDark, flexShrink:0 }}>
                    {r.name[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1 }}>{r.name}</div>
                    <div style={{ fontSize:'10px', color:COLORS.t4 }}>{r.type} · {r.count}회</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1 }}>{(r.total/10000).toFixed(0)}만</div>
                    <RiskBadge level={r.risk} lang={lang} />
                  </div>
                </div>
              ))}
            </SectionCard>

            {/* 패턴 분석 */}
            <SectionCard title={s('pattern', lang)} onDetail={() => setDetail('pattern')} lang={lang}>
              {PATTERNS.map((p, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom: i<PATTERNS.length-1?'1px solid '+COLORS.borderSoft:'none' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'12px', fontWeight:600, color:COLORS.t1, marginBottom:'2px' }}>{p.label}</div>
                    <div style={{ fontSize:'11px', color:COLORS.t3 }}>{lang==='en'?p.en:p.ko}</div>
                  </div>
                  <RiskBadge level={p.status} lang={lang} />
                </div>
              ))}
            </SectionCard>


            {/* 실시간 결제 분석 */}
            <SectionCard title="실시간 결제 분석" onDetail={() => navigate('/payments')} lang={lang}>
              <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
                {[
                  { label:'위험', count: PAYMENT_LOGS.filter(l=>l.status==='risk').length,    bg:'#FEE2E2', color:'#DC2626' },
                  { label:'주의', count: PAYMENT_LOGS.filter(l=>l.status==='warning').length, bg:'#FEF3C7', color:'#92400E' },
                  { label:'정상', count: PAYMENT_LOGS.filter(l=>l.status==='normal').length,  bg:'#D1FAE5', color:'#047857' },
                ].map((item, i) => (
                  <div key={i} style={{ flex:1, background:item.bg, borderRadius:RADIUS.md, padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:'20px', fontWeight:800, color:item.color }}>{item.count}</div>
                    <div style={{ fontSize:'10px', color:item.color, fontWeight:700 }}>{item.label}</div>
                  </div>
                ))}
              </div>
              {PAYMENT_LOGS.filter(l=>l.status!=='normal').slice(0,2).map((log, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 0', borderBottom: i===0?'1px solid '+COLORS.borderSoft:'none' }}>
                  <div style={{ width:'7px', height:'7px', borderRadius:'50%', background: log.status==='risk'?'#EF4444':'#F59E0B', flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'12px', fontWeight:600, color:COLORS.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.merchant}</div>
                    <div style={{ fontSize:'10px', color:COLORS.t4 }}>{log.recipient} · {log.amount.toLocaleString()}원</div>
                  </div>
                  <span style={{ fontSize:'10px', fontWeight:700, color: log.status==='risk'?'#DC2626':'#92400E', flexShrink:0 }}>
                    {log.status==='risk'?'위험':'주의'}
                  </span>
                </div>
              ))}
              <div style={{ marginTop:'10px', display:'flex', alignItems:'center', gap:'5px', justifyContent:'center' }}>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#EF4444' }} />
                <span style={{ fontSize:'11px', color:'#EF4444', fontWeight:700 }}>소명요청 필요 {PAYMENT_LOGS.filter(l=>l.needJustify).length}건</span>
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </PhoneShell>
  )
}
