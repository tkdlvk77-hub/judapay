import { useState, useRef } from 'react'
import { useStepHistory } from '../../hooks/useStepHistory'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../design/components'
import { COLORS, RADIUS, SHADOWS } from '../../design/tokens'
import { getAccountTheme } from '../../design/accountTokens'
import { addTransaction } from '../../shared/transactionStore'
import { dialog } from '../../components/Dialog'

// ─── 상수 ─────────────────────────────────────────────────
const INCOME_TAX_RATE   = 0.06
const FOUR_INS_EMP_RATE = 0.09
const FOUR_INS_CO_RATE  = 0.12
const PAY_DAYS  = ['1','5','10','15','20','25','28','말일']
const DEMO_BANKS = ['국민','신한','우리','하나','기업','농협','카카오뱅크','토스뱅크']

const REGISTERED_USERS = {
  '01012345678':'김지수', '01022223333':'박성민',
  '01055556666':'최수진', '01077778888':'정현우',
}

// ─── 통합 상태 ────────────────────────────────────────────
const STATUS_MAP = {
  active:  { label:'자동지급 ON',  bg:'#D1FAE5', color:'#059669' },
  overdue: { label:'미납 중',      bg:'#FEF3C7', color:'#D97706' },
  paused:  { label:'자동지급 OFF', bg:'#F3F4F6', color:'#6B7280' },
}
function getComputedStatus(chart) {
  if (!chart.autoEnabled) return 'paused'
  if (chart.lastPayStatus === 'fail') return 'overdue'
  return 'active'
}
function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.paused
  return <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 8px', borderRadius:'20px', background:s.bg, color:s.color }}>{s.label}</span>
}

// ─── 데모 차트 ────────────────────────────────────────────
const DEMO_CHARTS = [
  {
    id:'ch1', name:'정규직 급여', payDay:'25', payMethod:'account',
    autoEnabled:true, lastPayStatus:'success',
    bankName:'국민', bankAccount:'12345678901234',
    limitEnabled:false, limitAmount:0, approvalEnabled:false,
    hasReceipt:true, hasTax:false, hasPayroll:true,
    notifBefore:true, notifDone:true, notifFail:true,
    employees:[
      { id:'e1', name:'김지수', salary:3200000, phone:'01012345678',
        authStatus:'verified', accountStatus:'verified', payable:true,
        lastPay:{ date:'2026.04.25', status:'success', amount:2720000 }, inviteExpiresAt:null },
      { id:'e2', name:'박성민', salary:2500000, phone:'01022223333',
        authStatus:'pending', accountStatus:'verified', payable:false,
        lastPay:null, inviteExpiresAt:null },
    ],
  },
  {
    id:'ch2', name:'계약직 급여', payDay:'10', payMethod:'link',
    autoEnabled:true, lastPayStatus:'fail',
    bankName:'', bankAccount:'',
    limitEnabled:false, limitAmount:0, approvalEnabled:false,
    hasReceipt:true, hasTax:false, hasPayroll:true,
    notifBefore:true, notifDone:true, notifFail:true,
    employees:[
      { id:'e3', name:'이유진', salary:2800000, phone:'01099991234',
        authStatus:'invited', accountStatus:'pending', payable:false,
        lastPay:null, inviteExpiresAt:'2026-05-12T14:00:00' },
    ],
  },
]

const DEMO_LOGS = [
  { date:'2026.05.25', status:'success', amount:5700000, note:'' },
  { date:'2026.04.25', status:'success', amount:5700000, note:'' },
  { date:'2026.03.25', status:'fail',    amount:0,       note:'잔액 부족 → 재시도 후 실패' },
  { date:'2026.02.25', status:'success', amount:5700000, note:'' },
  { date:'2026.01.25', status:'success', amount:5500000, note:'직원 급여 조정 전' },
]

// ─── 유틸 ─────────────────────────────────────────────────
function fmt(n) { return Number(Math.floor(n||0)).toLocaleString('ko-KR') }
function displayPhone(d) {
  if (!d || d.length < 4) return d || ''
  if (d.length < 8) return `${d.slice(0,3)}-${d.slice(3)}`
  return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7,11)}`
}
function expiryHours(iso) {
  if (!iso) return null
  const ms = new Date(iso) - new Date()
  return ms <= 0 ? 0 : Math.floor(ms / (1000*60*60))
}
function calcEmployees(employees) {
  const payable = employees.filter(e => e.payable)
  const gross   = payable.reduce((s,e) => s + (e.salary||0), 0)
  const tax     = Math.floor(gross * INCOME_TAX_RATE)
  const insEmp  = Math.floor(gross * FOUR_INS_EMP_RATE)
  const net     = gross - tax - insEmp
  const insCo   = Math.floor(gross * FOUR_INS_CO_RATE)
  return { payable, gross, tax, insEmp, net, insCo, total: gross + insCo }
}

const AVATAR_COLORS = [
  { bg:'#E6F5EF', fg:'#085041' }, { bg:'#EDF3FA', fg:'#1E5294' },
  { bg:'#FFF7ED', fg:'#9A3412' }, { bg:'#FEF3C7', fg:'#92400E' },
  { bg:'#F5F3FF', fg:'#5B21B6' }, { bg:'#FCE7F3', fg:'#9D174D' },
]
function pickAvatar(name) {
  const i = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[i]
}
function empStatusChip(emp) {
  if (emp.payable && emp.authStatus === 'verified')         return { icon:'✓', label:'지급 가능', bg:'#ECFDF5', color:'#065F46', border:'#A7F3D0' }
  if (emp.payable && emp.authStatus === 'account_provided') return { icon:'🏦', label:'계좌 등록됨', bg:'#E0F2FE', color:'#0369A1', border:'#BAE6FD' }
  if (emp.authStatus === 'invited')                         return { icon:'📩', label:'초대 발송중', bg:'#EFF6FF', color:'#1E40AF', border:'#BFDBFE' }
  if (emp.authStatus === 'expired')                         return { icon:'❌', label:'링크 만료', bg:'#FEE2E2', color:'#B91C1C', border:'#FCA5A5' }
  if (emp.authStatus === 'pending')                         return { icon:'⏳', label:'인증 대기', bg:'#FEF3C7', color:'#92400E', border:'#FCD34D' }
  if (emp.accountStatus === 'name_mismatch')                return { icon:'❌', label:'이름 불일치', bg:'#FEE2E2', color:'#B91C1C', border:'#FCA5A5' }
  return { icon:'🚫', label:'지급 제한', bg:'#FEE2E2', color:'#B91C1C', border:'#FCA5A5' }
}

// ─── 공통 버튼 ────────────────────────────────────────────
const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ width:'32px', height:'32px', background:'none', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, borderRadius:'10px' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  </button>
)
const XBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ width:'32px', height:'32px', background:'none', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, borderRadius:'10px' }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
)

// ─── 섹션 레이블 ──────────────────────────────────────────
function SecLabel({ label, brand }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'6px', marginBottom:'10px' }}>
      <div style={{ width:'3px', height:'14px', borderRadius:'2px', background:brand, flexShrink:0 }}/>
      <span style={{ fontSize:'11px', fontWeight:700, color:brand, letterSpacing:'0.6px', textTransform:'uppercase' }}>{label}</span>
    </div>
  )
}

// ─── 직원 추가 바텀시트 ────────────────────────────────────
function AddEmployeeSheet({ theme, onClose, onAdd }) {
  const [phone, setPhone]   = useState('')
  const [name, setName]     = useState('')
  const [salary, setSalary] = useState('')
  const isPhoneComplete = phone.length === 11
  const matchedName = isPhoneComplete ? REGISTERED_USERS[phone] : null
  const isVerified  = !!matchedName
  const canAdd = isPhoneComplete && (isVerified || name.trim().length > 0)

  const handleAdd = () => {
    if (!canAdd) return
    const finalName = isVerified ? matchedName : name.trim()
    const sal = parseInt(salary) || 0
    const newEmp = isVerified
      ? { id:'e'+Date.now(), name:finalName, salary:sal, phone, authStatus:'verified', accountStatus:'verified', payable:true, lastPay:null, inviteExpiresAt:null }
      : { id:'e'+Date.now(), name:finalName, salary:sal, phone, authStatus:'invited', accountStatus:'pending', payable:false, lastPay:null, inviteExpiresAt:new Date(Date.now()+72*3600*1000).toISOString() }
    onAdd(newEmp); onClose()
  }

  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }} onClick={onClose}>
      <div style={{ background:COLORS.bgCard, borderRadius:`${RADIUS.lg} ${RADIUS.lg} 0 0`, padding:'20px 16px 32px', maxHeight:'88%', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ width:'36px', height:'4px', background:COLORS.border, borderRadius:'2px', margin:'0 auto 18px' }} />
        <div style={{ fontSize:'17px', fontWeight:700, color:COLORS.t1, marginBottom:'4px' }}>직원 추가</div>
        <div style={{ fontSize:'12px', color:COLORS.t4, marginBottom:'18px' }}>정규직 직원의 휴대폰 번호를 입력해주세요</div>
        <div style={{ fontSize:'12px', fontWeight:600, color:COLORS.t2, marginBottom:'6px' }}>휴대폰 번호 (숫자만)</div>
        <input type="tel" inputMode="numeric" value={phone}
          onChange={e => setPhone(e.target.value.replace(/[^0-9]/g,'').slice(0,11))} placeholder="01012345678"
          style={{ width:'100%', padding:'12px 14px', background:COLORS.bg, border:`1.5px solid ${isPhoneComplete ? theme.brandDark : COLORS.border}`, borderRadius:'10px', fontSize:'15px', fontWeight:600, color:COLORS.t1, fontFamily:'inherit', outline:'none', marginBottom:'6px', boxSizing:'border-box', letterSpacing:'1px' }}
        />
        <div style={{ fontSize:'11px', color:COLORS.t4, marginBottom:'10px', textAlign:'right', minHeight:'14px' }}>
          {phone.length > 0 ? `${displayPhone(phone)} (${phone.length}/11)` : ' '}
        </div>
        {isPhoneComplete && isVerified && (
          <div style={{ padding:'10px 12px', background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:'9px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><polyline points="20 6 9 17 4 12"/></svg>
            <div>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#065F46' }}>가입자 · {matchedName}님</div>
              <div style={{ fontSize:'11px', color:'#047857' }}>저장된 계좌로 자동 지급됩니다</div>
            </div>
          </div>
        )}
        {isPhoneComplete && !isVerified && (
          <div style={{ padding:'10px 12px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'9px', marginBottom:'14px', display:'flex', alignItems:'flex-start', gap:'8px' }}>
            <span style={{ fontSize:'14px', flexShrink:0, lineHeight:1.3 }}>📲</span>
            <div>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#92400E', marginBottom:'2px' }}>미가입자 — 초대 링크 발송</div>
              <div style={{ fontSize:'11px', color:'#78350F', lineHeight:1.5 }}>72시간 유효한 초대 링크가 발송됩니다. 받는 분이 본인인증 + 계좌 등록 완료 시 자동 지급됩니다.</div>
            </div>
          </div>
        )}
        {isPhoneComplete && !isVerified && (
          <>
            <div style={{ fontSize:'12px', fontWeight:600, color:COLORS.t2, marginBottom:'6px' }}>이름</div>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동"
              style={{ width:'100%', padding:'12px 14px', background:COLORS.bg, border:`1.5px solid ${name ? theme.brandDark : COLORS.border}`, borderRadius:'10px', fontSize:'15px', fontWeight:600, color:COLORS.t1, fontFamily:'inherit', outline:'none', marginBottom:'14px', boxSizing:'border-box' }}
            />
          </>
        )}
        <div style={{ fontSize:'12px', fontWeight:600, color:COLORS.t2, marginBottom:'6px' }}>월급 (세전)</div>
        <div style={{ display:'flex', alignItems:'center', background:COLORS.bg, border:`1.5px solid ${parseInt(salary)>0 ? theme.brandDark : COLORS.border}`, borderRadius:'10px', padding:'12px 14px', marginBottom:'18px', gap:'8px' }}>
          <input type="tel" inputMode="numeric" value={salary}
            onChange={e => setSalary(e.target.value.replace(/[^0-9]/g,''))} placeholder="3000000"
            style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'18px', fontWeight:700, color:COLORS.t1, fontFamily:'inherit', textAlign:'right', minWidth:0, width:0, padding:0 }}
          />
          <span style={{ fontSize:'14px', fontWeight:600, color:COLORS.t3, flexShrink:0 }}>원</span>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={onClose} style={{ flex:1, height:'48px', background:COLORS.bgMuted, color:COLORS.t2, border:'none', borderRadius:RADIUS.md, fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>취소</button>
          <button onClick={handleAdd} disabled={!canAdd}
            style={{ flex:2, height:'48px', background:canAdd ? `linear-gradient(135deg, ${theme.brand}, ${theme.brandDark})` : COLORS.bgMuted, color:canAdd ? '#fff' : COLORS.t4, border:'none', borderRadius:RADIUS.md, fontSize:'14px', fontWeight:700, cursor:canAdd ? 'pointer' : 'not-allowed', fontFamily:'inherit' }}>
            등록
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 직원 카드 ────────────────────────────────────────────
function EmployeeCard({ emp, theme, onUpdateSalary, onRemove, onResend }) {
  const [expanded, setExpanded] = useState(false)
  const av   = pickAvatar(emp.name)
  const chip = empStatusChip(emp)
  const expHrs = expiryHours(emp.inviteExpiresAt)
  return (
    <div style={{ borderTop:`1px solid ${COLORS.borderSoft}` }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', userSelect:'none' }}>
        <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:av.bg, color:av.fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:800, flexShrink:0 }}>{emp.name[0]}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'14px', fontWeight:700, color:COLORS.t1, marginBottom:'4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{emp.name}</div>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 8px', background:chip.bg, color:chip.color, border:`1px solid ${chip.border}`, borderRadius:'5px', fontSize:'10.5px', fontWeight:700 }}>
            <span style={{ fontSize:'10px' }}>{chip.icon}</span>{chip.label}
          </span>
        </div>
        <div onClick={e => e.stopPropagation()}
          style={{ display:'flex', alignItems:'center', background:'#fff', border:`1.5px solid ${emp.salary > 0 ? COLORS.border : COLORS.borderSoft}`, borderRadius:'9px', padding:'8px 11px', gap:'4px', width:'124px', flexShrink:0 }}>
          <input type="tel" inputMode="numeric" value={String(emp.salary||'')}
            onChange={e => onUpdateSalary(emp.id, e.target.value.replace(/[^0-9]/g,''))} placeholder="0"
            style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', fontWeight:700, color:COLORS.t1, fontFamily:'inherit', textAlign:'right', minWidth:0, width:0, padding:0 }}
          />
          <span style={{ fontSize:'11px', color:COLORS.t4, flexShrink:0, fontWeight:600 }}>원</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding:'0 16px 16px', background:COLORS.bg, display:'flex', flexDirection:'column', gap:'8px' }}>
          <div style={{ fontSize:'11.5px', color:COLORS.t3, padding:'4px 0' }}>📱 {displayPhone(emp.phone)}</div>
          {emp.payable && emp.authStatus === 'verified' && (
            <div style={{ padding:'11px 13px', background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:'10px', display:'flex', gap:'10px' }}>
              <span style={{ fontSize:'15px', flexShrink:0 }}>✅</span>
              <div><div style={{ fontSize:'12.5px', fontWeight:700, color:'#065F46', marginBottom:'2px' }}>지급 가능</div>
              <div style={{ fontSize:'11px', color:'#047857', lineHeight:1.55 }}>본인인증 + 계좌 등록 완료. 자동 지급 대상입니다.</div></div>
            </div>
          )}
          {emp.payable && emp.authStatus === 'account_provided' && (
            <div style={{ padding:'11px 13px', background:'#E0F2FE', border:'1px solid #BAE6FD', borderRadius:'10px', display:'flex', gap:'10px' }}>
              <span style={{ fontSize:'15px', flexShrink:0 }}>🏦</span>
              <div>
                <div style={{ fontSize:'12.5px', fontWeight:700, color:'#0369A1', marginBottom:'4px' }}>관리자 등록 계좌</div>
                <div style={{ fontSize:'11.5px', color:'#0369A1', fontWeight:600 }}>{emp.empBankName} · {emp.empBankAccount}</div>
                <div style={{ fontSize:'10.5px', color:'#0284C7', marginTop:'2px', lineHeight:1.5 }}>직원 본인인증 없이 지급 가능합니다.</div>
              </div>
            </div>
          )}
          {emp.authStatus === 'invited' && expHrs !== null && expHrs > 0 && (
            <div style={{ padding:'11px 13px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'10px', display:'flex', gap:'10px', alignItems:'flex-start' }}>
              <span style={{ fontSize:'15px', flexShrink:0 }}>📩</span>
              <div style={{ flex:1 }}><div style={{ fontSize:'12.5px', fontWeight:700, color:'#1E40AF', marginBottom:'2px' }}>초대 링크 발송 중 · {expHrs}시간 남음</div>
              <div style={{ fontSize:'11px', color:'#3B82F6', lineHeight:1.55 }}>본인인증 + 계좌 등록 완료 시 자동 지급됩니다.</div></div>
              <button onClick={e => { e.stopPropagation(); onResend(emp.id) }} style={{ padding:'7px 12px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'7px', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>재발송</button>
            </div>
          )}
          {emp.authStatus === 'pending' && (
            <div style={{ padding:'11px 13px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'10px', display:'flex', gap:'10px' }}>
              <span style={{ fontSize:'15px', flexShrink:0 }}>⏳</span>
              <div><div style={{ fontSize:'12.5px', fontWeight:700, color:'#92400E', marginBottom:'2px' }}>본인인증 대기 중</div>
              <div style={{ fontSize:'11px', color:'#B45309', lineHeight:1.55 }}>인증 완료 후 자동으로 지급 가능 상태가 됩니다.</div></div>
            </div>
          )}
          {emp.lastPay && (
            <div style={{ padding:'10px 13px', background:'#fff', border:`1px solid ${COLORS.borderSoft}`, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
              <span style={{ fontSize:'11px', color:COLORS.t4, fontWeight:600 }}>마지막 지급</span>
              <span style={{ fontSize:'11.5px', color:emp.lastPay.status==='success'?'#065F46':'#B91C1C', fontWeight:700 }}>
                {emp.lastPay.date} · {emp.lastPay.status==='success'?`성공 · ${fmt(emp.lastPay.amount)}원`:'실패'}
              </span>
            </div>
          )}
          <button onClick={e => { e.stopPropagation(); onRemove(emp.id) }}
            style={{ width:'100%', padding:'11px', background:'#fff', color:'#B91C1C', border:'1px solid #FCA5A5', borderRadius:'10px', fontSize:'12.5px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            이 직원 삭제
          </button>
        </div>
      )}
    </div>
  )
}

// ─── 엑셀 업로드 바텀시트 ─────────────────────────────────
const EXCEL_DEMO_PARSED = [
  { id:'ex1', name:'김철수', phone:'01011112222', salary:3500000,
    authStatus:'invited', accountStatus:'pending', payable:false, lastPay:null, inviteExpiresAt:new Date(Date.now()+72*3600*1000).toISOString() },
  { id:'ex2', name:'이영희', phone:'01033334444', salary:2800000,
    authStatus:'invited', accountStatus:'pending', payable:false, lastPay:null, inviteExpiresAt:new Date(Date.now()+72*3600*1000).toISOString() },
  { id:'ex3', name:'박민준', phone:'01055556666', salary:4200000,
    authStatus:'invited', accountStatus:'pending', payable:false, lastPay:null, inviteExpiresAt:new Date(Date.now()+72*3600*1000).toISOString() },
  { id:'ex4', name:'정수아', phone:'01077778888', salary:3100000,
    authStatus:'invited', accountStatus:'pending', payable:false, lastPay:null, inviteExpiresAt:new Date(Date.now()+72*3600*1000).toISOString() },
]

function ExcelUploadSheet({ theme, onClose, onCreateChart }) {
  const [step, setStep]           = useState('upload')   // 'upload' | 'preview'
  const [chartName, setChartName] = useState('')
  const [parsedEmps, setParsedEmps] = useState([])
  const [fileName, setFileName]   = useState('')
  const [dragging, setDragging]   = useState(false)
  const [parseError, setParseError] = useState('')
  const fileRef = useRef(null)

  // ── 양식 다운로드 (UTF-8 BOM CSV — Excel에서 바로 열림) ──
  const handleTemplateDownload = () => {
    const rows = [
      ['이름', '휴대폰번호', '월급(세전)', '은행명', '계좌번호'],
      ['김직원', '01012345678', '3000000', '국민', '12345678901234'],
      ['이직원', '01023456789', '2500000', '신한', '23456789012345'],
      ['박직원', '01034567890', '2800000', '', ''],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const BOM  = '﻿'  // Excel에서 한글 깨짐 방지
    const blob = new Blob([BOM + csv], { type:'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href:url, download:'급여_업로드_양식.csv' })
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  // ── CSV 파싱 ──────────────────────────────────────────────
  const parseCSV = (text) => {
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    return lines.slice(1).map((line, i) => {
      // 따옴표 포함 CSV도 처리
      const cols       = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      const name       = cols[0] || ''
      const phone      = (cols[1] || '').replace(/[^0-9]/g, '')
      const salary     = parseInt((cols[2] || '').replace(/[^0-9]/g, '')) || 0
      const empBank    = cols[3] || ''
      const empAccount = (cols[4] || '').replace(/[^0-9]/g, '')
      if (!name || !phone) return null
      const matchedName  = REGISTERED_USERS[phone]
      const isVerified   = !!matchedName
      const hasAccount   = !!(empBank && empAccount)
      // 앱 가입자 → verified / 미가입이지만 계좌 있음 → 계좌 등록됨 / 계좌도 없음 → 초대 필요
      const authStatus    = isVerified ? 'verified' : hasAccount ? 'account_provided' : 'invited'
      const accountStatus = (isVerified || hasAccount) ? 'verified' : 'pending'
      const payable       = isVerified || hasAccount
      return {
        id: 'ex' + Date.now() + i,
        name:    isVerified ? matchedName : name,
        phone,   salary,
        empBankName:    empBank,
        empBankAccount: empAccount,
        authStatus,
        accountStatus,
        payable,
        lastPay: null,
        inviteExpiresAt: (!isVerified && !hasAccount) ? new Date(Date.now() + 72*3600*1000).toISOString() : null,
      }
    }).filter(Boolean)
  }

  const handleFileSelect = (file) => {
    if (!file) return
    setParseError('')
    setFileName(file.name)

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv','xlsx','xls'].includes(ext)) {
      setParseError('CSV 또는 엑셀 파일(.csv, .xlsx, .xls)만 업로드 가능합니다.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let text = e.target.result
        // xlsx/xls는 바이너리라 CSV 변환 불가 → 안내 메시지
        if (ext !== 'csv') {
          setParseError('엑셀 파일은 "다른 이름으로 저장 → CSV(쉼표로 분리)(*.csv)"로 저장 후 업로드해주세요.')
          return
        }
        const parsed = parseCSV(text)
        if (parsed.length === 0) {
          setParseError('인식된 직원이 없습니다. 양식 형식을 확인해주세요.')
          return
        }
        const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[_\-]?(업로드|양식|급여|salary)/gi, '') || '급여 차트'
        setChartName(baseName.trim() || '급여 차트')
        setParsedEmps(parsed)
        setStep('preview')
      } catch {
        setParseError('파일을 읽는 중 오류가 발생했습니다.')
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const totalGross = parsedEmps.reduce((s, e) => s + (e.salary || 0), 0)
  const canCreate  = chartName.trim().length > 0 && parsedEmps.length > 0

  const handleCreate = () => {
    if (!canCreate) return
    onCreateChart(chartName.trim(), parsedEmps)
    onClose()
  }

  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }} onClick={onClose}>
      <div style={{ background:COLORS.bgCard, borderRadius:`${RADIUS.lg} ${RADIUS.lg} 0 0`, padding:'20px 16px 32px', maxHeight:'90%', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ width:'36px', height:'4px', background:COLORS.border, borderRadius:'2px', margin:'0 auto 18px' }} />

        {step === 'upload' ? (
          <>
            <div style={{ fontSize:'17px', fontWeight:700, color:COLORS.t1, marginBottom:'3px' }}>엑셀로 급여 차트 만들기</div>
            <div style={{ fontSize:'12px', color:COLORS.t4, marginBottom:'18px' }}>엑셀 파일을 업로드하면 직원 목록과 급여가 자동으로 등록됩니다</div>

            {/* 양식 다운로드 */}
            <button onClick={handleTemplateDownload} style={{ width:'100%', padding:'13px 14px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'12px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'inherit', marginBottom:'14px', textAlign:'left' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'#DBEAFE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>📥</div>
              <div>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#1D4ED8', marginBottom:'2px' }}>급여 양식 다운로드 (.csv)</div>
                <div style={{ fontSize:'11px', color:'#3B82F6' }}>Excel에서 바로 열어 작성 후 CSV로 저장</div>
              </div>
              <svg style={{ marginLeft:'auto', flexShrink:0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            {/* 드래그앤드롭 영역 */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              style={{ border:`2px dashed ${dragging ? theme.brand : '#D1D5DB'}`, borderRadius:'14px', padding:'36px 16px', textAlign:'center', cursor:'pointer', background: dragging ? theme.brand+'08' : COLORS.bg, marginBottom:'14px', transition:'all 0.15s' }}>
              <div style={{ fontSize:'36px', marginBottom:'10px' }}>📊</div>
              <div style={{ fontSize:'14px', fontWeight:700, color:COLORS.t2, marginBottom:'4px' }}>파일을 여기에 끌어다 놓거나</div>
              <div style={{ fontSize:'12px', color:COLORS.t4, marginBottom:'14px' }}>클릭하여 파일을 선택하세요</div>
              <span style={{ fontSize:'11px', color:COLORS.t4, background:COLORS.bgMuted, padding:'5px 14px', borderRadius:'20px', fontWeight:600 }}>
                .csv · .xlsx · .xls
              </span>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }}
              onChange={e => handleFileSelect(e.target.files?.[0])} />

            {/* 파싱 에러 */}
            {parseError && (
              <div style={{ padding:'10px 12px', background:'#FEE2E2', border:'1px solid #FCA5A5', borderRadius:'10px', fontSize:'11.5px', color:'#B91C1C', lineHeight:1.6, marginBottom:'12px', fontWeight:600 }}>
                ⚠️ {parseError}
              </div>
            )}

            {/* 형식 안내 */}
            <div style={{ padding:'12px 14px', background:'#F9FAFB', border:`1px solid ${COLORS.borderSoft}`, borderRadius:'12px', marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:COLORS.t2, marginBottom:'8px' }}>📋 업로드 방법</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                {[
                  '① 위 양식 다운로드 버튼을 눌러 CSV 파일을 받으세요',
                  '② Excel에서 열어 이름 · 휴대폰번호 · 월급(세전) · 은행명 · 계좌번호 입력',
                  '③ 계좌번호 입력 시 초대 없이 바로 지급 가능 (미입력 시 초대 링크 발송)',
                  '④ 파일 → 다른 이름으로 저장 → CSV(쉼표로 분리) 선택 후 업로드',
                ].map((t,i) => (
                  <div key={i} style={{ fontSize:'11px', color:COLORS.t4, display:'flex', gap:'6px' }}>
                    <span style={{ color:theme.brand, fontWeight:700, flexShrink:0, minWidth:'10px' }}></span>
                    <span style={{ lineHeight:1.55 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={onClose} style={{ width:'100%', height:'46px', background:COLORS.bgMuted, color:COLORS.t2, border:'none', borderRadius:RADIUS.md, fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>닫기</button>
          </>
        ) : (
          <>
            {/* 미리보기 헤더 */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'3px' }}>
              <button onClick={() => setStep('upload')} style={{ width:'28px', height:'28px', borderRadius:'8px', background:COLORS.bgMuted, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, padding:0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t2} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div style={{ fontSize:'17px', fontWeight:700, color:COLORS.t1 }}>업로드 미리보기</div>
            </div>
            <div style={{ fontSize:'12px', color:COLORS.t4, marginBottom:'18px' }}>
              📄 {fileName} · <span style={{ color:theme.brand, fontWeight:700 }}>{parsedEmps.length}명</span> 인식됨
            </div>

            {/* 차트 이름 */}
            <div style={{ fontSize:'12px', fontWeight:600, color:COLORS.t2, marginBottom:'6px' }}>급여 차트 이름</div>
            <input value={chartName} onChange={e => setChartName(e.target.value)} placeholder="예: 5월 급여 차트"
              style={{ width:'100%', padding:'12px 14px', background:COLORS.bg, border:`1.5px solid ${chartName ? theme.brandDark : COLORS.border}`, borderRadius:'10px', fontSize:'15px', fontWeight:700, color:COLORS.t1, fontFamily:'inherit', outline:'none', marginBottom:'14px', boxSizing:'border-box' }} />

            {/* 직원 미리보기 */}
            <div style={{ background:COLORS.bgCard, border:`1px solid ${COLORS.borderSoft}`, borderRadius:'12px', overflow:'hidden', marginBottom:'12px' }}>
              <div style={{ padding:'10px 14px', background:COLORS.bgMuted, borderBottom:`1px solid ${COLORS.borderSoft}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'11px', fontWeight:700, color:COLORS.t3 }}>인식된 직원 목록</span>
                <span style={{ fontSize:'11px', fontWeight:700, color:theme.brand }}>{parsedEmps.length}명</span>
              </div>
              {parsedEmps.map((emp, i) => {
                const av   = pickAvatar(emp.name)
                const chip = empStatusChip(emp)
                return (
                  <div key={i} style={{ padding:'11px 14px', borderTop: i > 0 ? `1px solid ${COLORS.borderSoft}` : 'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:av.bg, color:av.fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:800, flexShrink:0 }}>
                        {emp.name[0]}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1, marginBottom:'3px' }}>{emp.name}</div>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 7px', background:chip.bg, color:chip.color, border:`1px solid ${chip.border}`, borderRadius:'5px', fontSize:'10px', fontWeight:700 }}>
                          {chip.icon} {chip.label}
                        </span>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1 }}>{fmt(emp.salary)}원</div>
                        {emp.empBankName && <div style={{ fontSize:'10px', color:COLORS.t4, marginTop:'2px' }}>{emp.empBankName}</div>}
                      </div>
                    </div>
                    {emp.empBankName && emp.empBankAccount && (
                      <div style={{ marginTop:'7px', marginLeft:'44px', padding:'7px 10px', background:'#F0F9FF', borderRadius:'8px', display:'flex', gap:'8px', alignItems:'center' }}>
                        <span style={{ fontSize:'11px' }}>🏦</span>
                        <span style={{ fontSize:'11px', color:'#0369A1', fontWeight:600 }}>{emp.empBankName} · {emp.empBankAccount}</span>
                      </div>
                    )}
                  </div>
                )
              })}
              {/* 세전 합계 */}
              <div style={{ padding:'11px 14px', background:`linear-gradient(135deg, ${theme.brand}12, ${theme.brand}06)`, borderTop:`1px solid ${COLORS.borderSoft}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'12px', fontWeight:700, color:COLORS.t2 }}>세전 합계</span>
                <span style={{ fontSize:'16px', fontWeight:800, color:theme.brandDark }}>{fmt(totalGross)}원</span>
              </div>
            </div>

            {/* 안내 */}
            <div style={{ padding:'11px 13px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'10px', fontSize:'11px', color:'#78350F', lineHeight:1.7, marginBottom:'16px' }}>
              <span style={{ fontWeight:700 }}>⚠️ 초대 링크 발송 안내</span><br/>
              미가입 직원에게 72시간 유효한 초대 링크가 발송됩니다. 본인인증 + 계좌 등록 완료 후 자동 지급 대상이 됩니다.
            </div>

            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={onClose} style={{ flex:1, height:'48px', background:COLORS.bgMuted, color:COLORS.t2, border:'none', borderRadius:RADIUS.md, fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>취소</button>
              <button onClick={handleCreate} disabled={!canCreate}
                style={{ flex:2, height:'48px', background:canCreate ? `linear-gradient(135deg, ${theme.brand}, ${theme.brandDark})` : COLORS.bgMuted, color:canCreate ? '#fff' : COLORS.t4, border:'none', borderRadius:RADIUS.md, fontSize:'14px', fontWeight:700, cursor:canCreate ? 'pointer' : 'not-allowed', fontFamily:'inherit' }}>
                차트 자동 생성
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 메인 컴포넌트
// ═══════════════════════════════════════════════════════════
export default function ExecuteSalary() {
  const navigate = useNavigate()
  const theme    = getAccountTheme('business')

  // ── 권한 체크: staff/viewer는 조회만 가능 ──
  const _bizRole = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('bizRole') || '' : ''
  const canEdit  = !['viewer', 'staff'].includes(_bizRole)

  const [charts, setCharts]               = useState(DEMO_CHARTS)
  const [screen, setScreen]               = useState('list')
  const [selectedChart, setSelectedChart] = useState(null)
  const [saved, setSaved]                 = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [showAddEmpSheet, setShowAddEmpSheet] = useState(false)
  const [showExcelSheet, setShowExcelSheet] = useState(false)

  const goBack = () => {
    if (screen === 'list') navigate(-1)
    else if (screen === 'log') setScreen('detail')
    else setScreen('list')
  }
  useStepHistory(goBack, screen === 'list')

  // 편집 상태
  const [editName, setEditName]       = useState('')
  const [editPayDay, setEditPayDay]   = useState('25')
  const [editPayMethod, setEditPayMethod] = useState('account')
  const [editAutoOn, setEditAutoOn]   = useState(true)
  const [editEmployees, setEditEmployees] = useState([])
  const [editLimitEnabled, setEditLimitEnabled]   = useState(false)
  const [editLimitAmount, setEditLimitAmount]     = useState('')
  const [editApproval, setEditApproval]           = useState(false)
  const [editHasReceipt, setEditHasReceipt]       = useState(true)
  const [editHasTax, setEditHasTax]               = useState(false)
  const [editHasPayroll, setEditHasPayroll]       = useState(true)
  const [bankName, setBankName]                   = useState('')
  const [bankAccount, setBankAccount]             = useState('')
  const [customDayInput, setCustomDayInput]       = useState('')
  const [editNotifBefore, setEditNotifBefore]     = useState(true)
  const [editNotifDone, setEditNotifDone]         = useState(true)
  const [editNotifFail, setEditNotifFail]         = useState(true)

  // ── isCustomDay (computed) ──────────────────────────────
  const isCustomDay = !PAY_DAYS.includes(editPayDay) && editPayDay !== ''

  // ── 차트 열기 ──────────────────────────────────────────
  const openDetail = (chart) => {
    setSelectedChart(chart)
    setEditName(chart.name)
    setEditPayDay(chart.payDay)
    setEditPayMethod(chart.payMethod || 'account')
    setEditAutoOn(chart.autoEnabled)
    setEditEmployees([...chart.employees])
    setEditLimitEnabled(chart.limitEnabled ?? false)
    setEditLimitAmount(chart.limitAmount ? String(chart.limitAmount) : '')
    setEditApproval(chart.approvalEnabled ?? false)
    setEditHasReceipt(chart.hasReceipt ?? true)
    setEditHasTax(chart.hasTax ?? false)
    setEditHasPayroll(chart.hasPayroll ?? true)
    setBankName(chart.bankName || '')
    setBankAccount(chart.bankAccount || '')
    setCustomDayInput(!PAY_DAYS.includes(chart.payDay) ? chart.payDay : '')
    setEditNotifBefore(chart.notifBefore ?? true)
    setEditNotifDone(chart.notifDone ?? true)
    setEditNotifFail(chart.notifFail ?? true)
    setSaved(false)
    setScreen('detail')
  }

  // ── 새 차트 ────────────────────────────────────────────
  const openAddForm = () => {
    setSelectedChart(null)
    setEditName(''); setEditPayDay('25'); setEditPayMethod('account')
    setEditAutoOn(true); setEditEmployees([])
    setEditLimitEnabled(false); setEditLimitAmount('')
    setEditApproval(false); setEditHasReceipt(true); setEditHasTax(false)
    setEditHasPayroll(true); setBankName(''); setBankAccount(''); setCustomDayInput('')
    setEditNotifBefore(true); setEditNotifDone(true); setEditNotifFail(true)
    setSaved(false)
    setScreen('addForm')
  }

  // ── 저장/등록 ──────────────────────────────────────────
  const handleSave = () => {
    if (!selectedChart) return
    const updated = { ...selectedChart, name:editName, payDay:editPayDay, payMethod:editPayMethod,
      autoEnabled:editAutoOn, employees:editEmployees,
      bankName, bankAccount,
      limitEnabled:editLimitEnabled, limitAmount:parseInt(editLimitAmount)||0,
      approvalEnabled:editApproval, hasReceipt:editHasReceipt, hasTax:editHasTax, hasPayroll:editHasPayroll,
      notifBefore:editNotifBefore, notifDone:editNotifDone, notifFail:editNotifFail }
    setCharts(prev => prev.map(c => c.id === selectedChart.id ? updated : c))
    setSaved(true)
    setTimeout(() => setScreen('list'), 800)
  }
  const handleAddSubmit = () => {
    if (!editName.trim() || editEmployees.length === 0) return
    const newChart = {
      id:'ch'+Date.now(), name:editName, payDay:editPayDay, payMethod:editPayMethod,
      autoEnabled:editAutoOn, lastPayStatus:null, employees:editEmployees,
      bankName, bankAccount,
      limitEnabled:editLimitEnabled, limitAmount:parseInt(editLimitAmount)||0,
      approvalEnabled:editApproval, hasReceipt:editHasReceipt, hasTax:editHasTax, hasPayroll:editHasPayroll,
      notifBefore:editNotifBefore, notifDone:editNotifDone, notifFail:editNotifFail,
    }
    setCharts(prev => [newChart, ...prev])
    setScreen('list')
  }

  // ── 엑셀로 차트 생성 ──────────────────────────────────
  const handleExcelCreate = (chartName, employees) => {
    const newChart = {
      id:'ch'+Date.now(), name:chartName, payDay:'25', payMethod:'account',
      autoEnabled:false, lastPayStatus:null, employees,
      bankName:'', bankAccount:'',
      limitEnabled:false, limitAmount:0, approvalEnabled:false,
      hasReceipt:true, hasTax:false, hasPayroll:true,
      notifBefore:true, notifDone:true, notifFail:true,
    }
    setCharts(prev => [newChart, ...prev])
  }

  // ── 직원 조작 ──────────────────────────────────────────
  const updateEmpSalary = (empId, val) => {
    const num = parseInt(val) || 0
    setEditEmployees(prev => prev.map(e => e.id === empId ? { ...e, salary:num } : e))
  }
  const removeEmp    = (empId) => setEditEmployees(prev => prev.filter(e => e.id !== empId))
  const resendInvite = (empId) => {
    const newExpiry = new Date(Date.now() + 72*3600*1000).toISOString()
    setEditEmployees(prev => prev.map(e => e.id === empId ? { ...e, authStatus:'invited', inviteExpiresAt:newExpiry } : e))
    dialog.alert({ title: '초대 링크 재발송', message: '유효기간은 72시간입니다.' })
  }

  // ── 리스트용 집계 ──────────────────────────────────────
  const allPayable = charts.flatMap(c => c.employees.filter(e => e.payable))
  const totalGross    = allPayable.reduce((s,e) => s + (e.salary||0), 0)
  const totalIncomeTax  = Math.floor(totalGross * INCOME_TAX_RATE)
  const totalFourInsEmp = Math.floor(totalGross * FOUR_INS_EMP_RATE)
  const totalNet        = totalGross - totalIncomeTax - totalFourInsEmp
  const totalFourInsCo  = Math.floor(totalGross * FOUR_INS_CO_RATE)
  const totalLaborCost  = totalGross + totalFourInsCo
  const overdueCount    = charts.filter(c => getComputedStatus(c) === 'overdue').length

  // ── 편집 중 통계 ───────────────────────────────────────
  const ec = calcEmployees(editEmployees)
  const canSubmit = editName.trim().length > 0 && editEmployees.length > 0

  // ── 공통 모달 ──────────────────────────────────────────
  const exitModal = showExitModal && (
    <div onClick={() => setShowExitModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'24px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'20px', padding:'24px 20px 18px', width:'100%', maxWidth:'320px', boxShadow:'0 16px 48px rgba(0,0,0,0.22)' }}>
        <div style={{ fontSize:'18px', fontWeight:800, color:'#111', marginBottom:'6px', textAlign:'center' }}>나가시겠어요?</div>
        <div style={{ fontSize:'13px', color:'#999', lineHeight:1.6, marginBottom:'20px', textAlign:'center' }}>변경 내용은 저장되지 않습니다.</div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={() => setShowExitModal(false)} style={{ flex:1, height:'48px', background:'#F3F4F6', color:'#555', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>계속 작성</button>
          <button onClick={() => { setShowExitModal(false); setScreen('list') }} style={{ flex:1, height:'48px', background:'#EF4444', color:'#fff', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>나가기</button>
        </div>
      </div>
    </div>
  )

// ═══════════════════════════════════════════════════════
  // ── 지급 로그 화면
  // ═══════════════════════════════════════════════════════
  if (screen === 'log' && selectedChart) {
    return (
      <PhoneShell>
        <div style={{ flex:1, overflowY:'auto', background:COLORS.bg }}>
          <div style={{ background:theme.headerGrad, paddingTop:'max(20px, env(safe-area-inset-top))', paddingBottom:'24px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 16px' }}>
              <BackBtn onClick={() => setScreen('detail')} />
              <span style={{ fontSize:'15px', fontWeight:600, color:'#fff', flex:1 }}>지급 로그</span>
            </div>
            <div style={{ padding:'0 20px' }}>
              <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', lineHeight:1.2, marginBottom:'3px' }}>{selectedChart.name}</div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)' }}>급여 지급 이력 · 매월 {selectedChart.payDay}일</div>
            </div>
          </div>
          <div style={{ padding:'16px 16px 32px', display:'flex', flexDirection:'column', gap:'8px' }}>
            {DEMO_LOGS.map((log, i) => (
              <div key={i} style={{ background:COLORS.bgCard, borderRadius:'14px', padding:'14px 16px', boxShadow:SHADOWS.card, display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', flexShrink:0, background:log.status==='success'?'#D1FAE5':'#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>
                  {log.status==='success' ? '✅' : '❌'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1, marginBottom:'2px' }}>{log.date}</div>
                  {log.note
                    ? <div style={{ fontSize:'11px', color:'#B91C1C' }}>{log.note}</div>
                    : <div style={{ fontSize:'11px', color:COLORS.t4 }}>{log.status==='success'?'정상 지급':'지급 실패'}</div>
                  }
                </div>
                {log.status === 'success'
                  ? <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:'14px', fontWeight:700, color:'#065F46' }}>{fmt(log.amount)}원</div>
                      <div style={{ fontSize:'10px', color:COLORS.t4, marginTop:'2px' }}>세전</div>
                    </div>
                  : <div style={{ fontSize:'12px', fontWeight:700, color:'#DC2626' }}>실패</div>
                }
              </div>
            ))}
          </div>
        </div>
      </PhoneShell>
    )
  }

  // ═══════════════════════════════════════════════════════
  // ── addForm / detail 화면 공용
  // ═══════════════════════════════════════════════════════
  const isAddMode = screen === 'addForm'
  if (screen === 'addForm' || (screen === 'detail' && selectedChart)) {
    return (
      <PhoneShell>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ flex:1, overflowY:'auto', background:COLORS.bg }}>

            {/* 헤더 — 유리 카드 없음, 타이틀만 */}
            <div style={{ background:theme.headerGrad, paddingTop:'max(20px, env(safe-area-inset-top))', paddingBottom:'20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 12px' }}>
                <BackBtn onClick={() => setScreen('list')} />
                <span style={{ fontSize:'15px', fontWeight:600, color:'#fff', flex:1 }}>
                  {isAddMode ? '급여 차트 만들기' : editName || '급여 차트 수정'}
                </span>
                {!isAddMode && (
                  <button onClick={() => setScreen('log')}
                    style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.85)', background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.22)', padding:'5px 11px', borderRadius:'20px', cursor:'pointer', fontFamily:'inherit', marginRight:'4px' }}>
                    지급 로그
                  </button>
                )}
                <XBtn onClick={() => setShowExitModal(true)} />
              </div>
            </div>

            <div style={{ padding:'16px 16px 36px', display:'flex', flexDirection:'column', gap:'6px' }}>

              {/* ── 차트 이름 */}
              <SecLabel label="기본 정보" brand={theme.brand} />
              <div style={{ background:COLORS.bgCard, borderRadius:'16px', boxShadow:SHADOWS.card, padding:'16px', marginBottom:'4px' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:COLORS.t3, marginBottom:'8px', letterSpacing:'0.4px' }}>차트 이름</div>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  placeholder="예: 정규직 급여, 5월 급여차트"
                  style={{ width:'100%', fontSize:'15px', fontWeight:700, color:COLORS.t1, background:'transparent', border:'none', outline:'none', fontFamily:'inherit', borderBottom:`2px solid ${editName ? theme.brand : COLORS.borderSoft}`, paddingBottom:'6px', boxSizing:'border-box' }}
                />
              </div>

              {/* ── 직원 목록 */}
              <SecLabel label="직원 관리" brand={theme.brand} />
              <div style={{ background:COLORS.bgCard, borderRadius:'16px', boxShadow:SHADOWS.card, overflow:'hidden', marginBottom:'4px' }}>
                <div style={{ padding:'14px 16px 10px' }}>
                  <div style={{ fontSize:'14px', fontWeight:700, color:COLORS.t1 }}>직원 ({editEmployees.length}명)</div>
                  <div style={{ fontSize:'11px', color:COLORS.t4, marginTop:'2px' }}>
                    지급 가능 {ec.payable.length}명 · 대기 {editEmployees.length - ec.payable.length}명
                  </div>
                </div>
                {editEmployees.length === 0 ? (
                  <div style={{ padding:'20px 16px', textAlign:'center' }}>
                    <div style={{ fontSize:'28px', marginBottom:'6px' }}>👥</div>
                    <div style={{ fontSize:'13px', color:COLORS.t4 }}>직원을 추가해주세요</div>
                  </div>
                ) : (
                  editEmployees.map(emp => (
                    <EmployeeCard key={emp.id} emp={emp} theme={theme}
                      onUpdateSalary={updateEmpSalary} onRemove={removeEmp} onResend={resendInvite} />
                  ))
                )}
                <button onClick={() => setShowAddEmpSheet(true)}
                  style={{ width:'100%', padding:'13px', background:COLORS.bg, border:'none', borderTop:`1px solid ${COLORS.borderSoft}`, cursor:'pointer', fontFamily:'inherit', fontSize:'13px', fontWeight:700, color:theme.brandDark, display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  직원 추가
                </button>
              </div>

              {/* ── 자동 지급 설정 */}
              <SecLabel label="자동 지급 설정" brand={theme.brand} />
              <div style={{ background:COLORS.bgCard, borderRadius:'16px', boxShadow:SHADOWS.card, padding:'16px', marginBottom:'4px' }}>
                {/* 자동지급 토글 */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: editAutoOn ? '16px' : 0 }}>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:700, color:COLORS.t1, marginBottom:'2px' }}>자동 지급</div>
                    <div style={{ fontSize:'11px', color:COLORS.t4 }}>
                      {editAutoOn ? `매월 ${editPayDay}일 09:00 자동 집행` : '수동 지급 모드 (알림만 발송)'}
                    </div>
                  </div>
                  <button onClick={() => setEditAutoOn(!editAutoOn)}
                    style={{ width:'48px', height:'28px', borderRadius:'14px', background:editAutoOn ? theme.brandDark : COLORS.borderSoft, border:'none', position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0, padding:0 }}>
                    <div style={{ position:'absolute', top:'3px', left:editAutoOn?'23px':'3px', width:'22px', height:'22px', borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.25)', transition:'left .2s' }} />
                  </button>
                </div>

                {/* 자동 ON일 때만 표시 */}
                {editAutoOn && (
                  <>
                    <div style={{ height:'1px', background:COLORS.borderSoft, marginBottom:'16px' }} />

                    {/* 지급일 */}
                    <div style={{ marginBottom:'16px' }}>
                      <div style={{ fontSize:'11px', fontWeight:600, color:COLORS.t4, marginBottom:'10px', letterSpacing:'0.3px' }}>매월 지급일</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                        {PAY_DAYS.map(d => (
                          <button key={d} onClick={() => { setEditPayDay(d); setCustomDayInput('') }}
                            style={{ padding:'6px 13px', borderRadius:'20px', cursor:'pointer', fontFamily:'inherit', fontSize:'12px', fontWeight:600, border:'none', background: editPayDay === d ? theme.brand : COLORS.bgMuted, color: editPayDay === d ? '#fff' : COLORS.t3, boxShadow: editPayDay === d ? `0 2px 8px ${theme.brand}40` : 'none', transition:'all 0.15s' }}>
                            {d === '말일' ? '말일' : `${d}일`}
                          </button>
                        ))}
                        <button onClick={() => { if (!isCustomDay) { setEditPayDay(''); setCustomDayInput('') } }}
                          style={{ padding:'6px 13px', borderRadius:'20px', cursor:'pointer', fontFamily:'inherit', fontSize:'12px', fontWeight:600, border:'none', background: isCustomDay ? theme.brand : COLORS.bgMuted, color: isCustomDay ? '#fff' : COLORS.t3, boxShadow: isCustomDay ? `0 2px 8px ${theme.brand}40` : 'none', transition:'all 0.15s' }}>
                          직접 입력
                        </button>
                      </div>
                      {isCustomDay && (
                        <div style={{ marginTop:'8px', display:'flex', alignItems:'center', gap:'8px', background:COLORS.bg, borderRadius:'10px', padding:'10px 14px', border:`1px solid ${theme.brand}40` }}>
                          <span style={{ fontSize:'12px', color:COLORS.t3, flexShrink:0 }}>매월</span>
                          <input type="number" min="1" max="31" value={customDayInput}
                            onChange={e => { setCustomDayInput(e.target.value); if (e.target.value) setEditPayDay(e.target.value) }}
                            placeholder="일 입력"
                            style={{ flex:1, border:'none', outline:'none', fontSize:'16px', fontWeight:700, color:theme.brand, background:'transparent', fontFamily:'inherit', textAlign:'center' }}/>
                          <span style={{ fontSize:'12px', color:COLORS.t3, flexShrink:0 }}>일</span>
                        </div>
                      )}
                    </div>

                    {/* 지급 방식 */}
                    <div>
                      <div style={{ fontSize:'11px', fontWeight:600, color:COLORS.t4, marginBottom:'10px', letterSpacing:'0.3px' }}>지급 방식</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                        {[
                          { id:'account', label:'계좌 자동이체', sub:'등록된 직원 계좌로 자동 이체' },
                          { id:'link',    label:'링크 수취형',   sub:'직원에게 링크 발송 후 수취' },
                        ].map(pm => (
                          <button key={pm.id} onClick={() => setEditPayMethod(pm.id)}
                            style={{ width:'100%', padding:'11px 14px', textAlign:'left', background: editPayMethod === pm.id ? theme.brand+'10' : COLORS.bgMuted, border:`1px solid ${editPayMethod === pm.id ? theme.brand+'40' : COLORS.borderSoft}`, borderRadius:'10px', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{ width:'16px', height:'16px', borderRadius:'50%', border:`2px solid ${editPayMethod === pm.id ? theme.brand : COLORS.border}`, background: editPayMethod === pm.id ? theme.brand : '#fff', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              {editPayMethod === pm.id && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#fff' }}/>}
                            </div>
                            <div>
                              <div style={{ fontSize:'12px', fontWeight:700, color:COLORS.t1 }}>{pm.label}</div>
                              <div style={{ fontSize:'10px', color:COLORS.t4, marginTop:'1px' }}>{pm.sub}</div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* 계좌 자동이체 — 은행 + 계좌번호 */}
                      {editPayMethod === 'account' && (
                        <div style={{ marginTop:'10px', background:COLORS.bg, borderRadius:'12px', padding:'12px 14px', border:`1px solid ${COLORS.borderSoft}` }}>
                          <div style={{ fontSize:'11px', fontWeight:600, color:COLORS.t3, marginBottom:'10px' }}>수취 계좌 정보</div>
                          <div style={{ marginBottom:'8px' }}>
                            <div style={{ fontSize:'10px', color:COLORS.t4, marginBottom:'6px' }}>은행 선택</div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                              {DEMO_BANKS.map(b => (
                                <button key={b} onClick={() => setBankName(b)}
                                  style={{ padding:'5px 10px', borderRadius:'20px', border:`1px solid ${bankName === b ? theme.brand : COLORS.borderSoft}`, background: bankName === b ? theme.brand : '#fff', color: bankName === b ? '#fff' : COLORS.t3, fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                                  {b}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div style={{ background:'#fff', borderRadius:'8px', border:`1px solid ${COLORS.borderSoft}`, padding:'10px 12px' }}>
                            <div style={{ fontSize:'10px', color:COLORS.t4, marginBottom:'4px' }}>계좌번호</div>
                            <input value={bankAccount} onChange={e => setBankAccount(e.target.value)}
                              placeholder="계좌번호 입력 (- 없이)"
                              style={{ width:'100%', border:'none', outline:'none', fontSize:'13px', fontWeight:600, color:COLORS.t1, background:'transparent', fontFamily:'inherit' }}/>
                          </div>
                        </div>
                      )}

                      {/* 링크 수취형 — 안내 */}
                      {editPayMethod === 'link' && (
                        <div style={{ marginTop:'10px', background:'#FFFBEB', borderRadius:'12px', padding:'12px 14px', border:'1px solid #FDE68A' }}>
                          <div style={{ fontSize:'11px', fontWeight:700, color:'#92400E', marginBottom:'4px' }}>링크 수취형 안내</div>
                          <div style={{ fontSize:'11px', color:'#78350F', lineHeight:1.6 }}>직원이 본인인증 후 등록한 계좌로 급여 링크가 발송됩니다. 초대 수락 + 계좌 등록 완료된 직원에게만 자동 지급됩니다.</div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* ── 매월 총 지급액 요약 */}
              {editEmployees.length > 0 && (
                <>
                  <SecLabel label="매월 총 지급액" brand={theme.brand} />
                  <div style={{ background:COLORS.bgCard, borderRadius:'16px', boxShadow:SHADOWS.card, padding:'16px', marginBottom:'4px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'14px' }}>
                      <span style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1 }}>세전 합계</span>
                      <span style={{ fontSize:'20px', fontWeight:800, color:theme.brandDark, letterSpacing:'-0.5px' }}>{fmt(ec.gross)}원</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0', borderTop:`1px solid ${COLORS.borderSoft}`, paddingTop:'12px' }}>
                      <div style={{ fontSize:'10px', fontWeight:700, color:COLORS.t4, marginBottom:'8px', letterSpacing:'0.5px' }}>직원 공제 (예상, 간이)</div>
                      {[
                        { label:'소득세 + 지방소득세', val:`-${fmt(ec.tax)}원` },
                        { label:'4대보험 본인부담',     val:`-${fmt(ec.insEmp)}원` },
                      ].map((r,i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:COLORS.t3, marginBottom:'6px' }}>
                          <span>{r.label}</span><span style={{ fontWeight:600 }}>{r.val}</span>
                        </div>
                      ))}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'8px', borderTop:`1px dashed ${COLORS.borderSoft}`, marginTop:'2px' }}>
                        <span style={{ fontSize:'12px', fontWeight:700, color:COLORS.t1 }}>실수령 합계</span>
                        <span style={{ fontSize:'15px', fontWeight:800, color:'#059669' }}>{fmt(ec.net)}원</span>
                      </div>
                    </div>
                    <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:`1px solid ${COLORS.borderSoft}`, display:'flex', flexDirection:'column', gap:'6px' }}>
                      <div style={{ fontSize:'10px', fontWeight:700, color:COLORS.t4, marginBottom:'2px', letterSpacing:'0.5px' }}>회사 부담 (예상, 간이)</div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:COLORS.t3 }}>
                        <span>4대보험 회사부담</span><span style={{ fontWeight:600 }}>+{fmt(ec.insCo)}원</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'8px', borderTop:`1px dashed ${COLORS.borderSoft}`, marginTop:'2px' }}>
                        <span style={{ fontSize:'12px', fontWeight:700, color:COLORS.t1 }}>총 인건비</span>
                        <span style={{ fontSize:'17px', fontWeight:800, color:'#D97706' }}>{fmt(ec.total)}원</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── 승인 및 통제 */}
              <SecLabel label="승인 및 통제" brand={theme.brand} />
              <div style={{ background:COLORS.bgCard, borderRadius:'16px', boxShadow:SHADOWS.card, padding:'16px', display:'flex', flexDirection:'column', gap:'14px', marginBottom:'4px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1, marginBottom:'2px' }}>지급 전 승인 요청</div>
                    <div style={{ fontSize:'11px', color:COLORS.t4, lineHeight:1.5 }}>자동 지급 전 관리자 승인이 필요합니다</div>
                  </div>
                  <button onClick={() => setEditApproval(!editApproval)}
                    style={{ width:'46px', height:'26px', borderRadius:'13px', border:'none', cursor:'pointer', background:editApproval ? theme.brand : COLORS.bgMuted, position:'relative', transition:'background 0.2s', padding:0, flexShrink:0 }}>
                    <div style={{ position:'absolute', top:'3px', left:editApproval?'23px':'3px', width:'20px', height:'20px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.25)' }} />
                  </button>
                </div>
                <div style={{ height:'1px', background:COLORS.borderSoft }} />
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:editLimitEnabled?'10px':0 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1, marginBottom:'2px' }}>월 한도 설정</div>
                      <div style={{ fontSize:'11px', color:COLORS.t4 }}>설정 금액 초과 시 알림 발송</div>
                    </div>
                    <button onClick={() => setEditLimitEnabled(!editLimitEnabled)}
                      style={{ width:'46px', height:'26px', borderRadius:'13px', border:'none', cursor:'pointer', background:editLimitEnabled ? theme.brand : COLORS.bgMuted, position:'relative', transition:'background 0.2s', padding:0, flexShrink:0 }}>
                      <div style={{ position:'absolute', top:'3px', left:editLimitEnabled?'23px':'3px', width:'20px', height:'20px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.25)' }} />
                    </button>
                  </div>
                  {editLimitEnabled && (
                    <div style={{ display:'flex', alignItems:'center', background:COLORS.bg, border:`1.5px solid ${parseInt(editLimitAmount)>0 ? theme.brand : COLORS.borderSoft}`, borderRadius:'10px', padding:'10px 14px', gap:'8px' }}>
                      <input type="tel" inputMode="numeric" value={editLimitAmount}
                        onChange={e => setEditLimitAmount(e.target.value.replace(/[^0-9]/g,''))} placeholder="10000000"
                        style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'16px', fontWeight:700, color:COLORS.t1, fontFamily:'inherit', textAlign:'right', minWidth:0, width:0, padding:0 }}
                      />
                      <span style={{ fontSize:'13px', fontWeight:600, color:COLORS.t3, flexShrink:0 }}>원</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 증빙 연동 */}
              <SecLabel label="증빙 연동" brand={theme.brand} />
              <div style={{ background:COLORS.bgCard, borderRadius:'16px', boxShadow:SHADOWS.card, padding:'16px', display:'flex', flexDirection:'column', gap:'14px', marginBottom:'4px' }}>
                {[
                  { label:'급여 대장 자동 생성', sub:'통합증빙센터 인건비 급여대장 자동 첨부', val:editHasPayroll, set:setEditHasPayroll },
                  { label:'급여명세서 자동 발송', sub:'PDF 명세서 직원 휴대폰 발송', val:editHasReceipt, set:setEditHasReceipt },
                  { label:'원천징수 영수증 연동', sub:'원천징수 자동 생성 및 보관', val:editHasTax, set:setEditHasTax },
                ].map((row, i) => (
                  <div key={i}>
                    {i > 0 && <div style={{ height:'1px', background:COLORS.borderSoft, marginBottom:'14px' }} />}
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1, marginBottom:'2px' }}>{row.label}</div>
                        <div style={{ fontSize:'11px', color:COLORS.t4 }}>{row.sub}</div>
                      </div>
                      <button onClick={() => row.set(!row.val)}
                        style={{ width:'46px', height:'26px', borderRadius:'13px', border:'none', cursor:'pointer', background:row.val ? theme.brand : COLORS.bgMuted, position:'relative', transition:'background 0.2s', padding:0, flexShrink:0 }}>
                        <div style={{ position:'absolute', top:'3px', left:row.val?'23px':'3px', width:'20px', height:'20px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.25)' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 알림 설정 */}
              <SecLabel label="알림 설정" brand={theme.brand} />
              <div style={{ background:COLORS.bgCard, borderRadius:'16px', boxShadow:SHADOWS.card, padding:'16px', display:'flex', flexDirection:'column', gap:'14px', marginBottom:'4px' }}>
                {[
                  { label:'지급 전 알림',  sub:'지급 1일 전 사전 안내', val:editNotifBefore, set:setEditNotifBefore },
                  { label:'지급 완료 알림', sub:'지급 완료 시 즉시 발송', val:editNotifDone,   set:setEditNotifDone },
                  { label:'지급 실패 알림', sub:'실패 즉시 관리자 알림',  val:editNotifFail,   set:setEditNotifFail },
                ].map((row, i) => (
                  <div key={i}>
                    {i > 0 && <div style={{ height:'1px', background:COLORS.borderSoft, marginBottom:'14px' }} />}
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1, marginBottom:'2px' }}>{row.label}</div>
                        <div style={{ fontSize:'11px', color:COLORS.t4 }}>{row.sub}</div>
                      </div>
                      <button onClick={() => row.set(!row.val)}
                        style={{ width:'46px', height:'26px', borderRadius:'13px', border:'none', cursor:'pointer', background:row.val ? theme.brand : COLORS.bgMuted, position:'relative', transition:'background 0.2s', padding:0, flexShrink:0 }}>
                        <div style={{ position:'absolute', top:'3px', left:row.val?'23px':'3px', width:'20px', height:'20px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.25)' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 안내 */}
              <div style={{ padding:'13px 14px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:RADIUS.md, display:'flex', gap:'8px', marginTop:'6px' }}>
                <span style={{ fontSize:'14px', flexShrink:0 }}>ⓘ</span>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:700, color:'#92400E', marginBottom:'2px' }}>예상 공제액 (간이 계산)</div>
                  <div style={{ fontSize:'11px', color:'#78350F', lineHeight:1.6 }}>실제 공제 금액은 연봉, 보험 요율, 비과세 항목 등에 따라 달라질 수 있습니다.</div>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div style={{ flexShrink:0, padding:'12px 16px 20px', background:COLORS.bgCard, borderTop:`1px solid ${COLORS.borderSoft}`, boxShadow:'0 -4px 16px rgba(0,0,0,0.06)' }}>
            {isAddMode ? (
              <button onClick={handleAddSubmit} disabled={!canSubmit}
                style={{ width:'100%', padding:'15px', background:canSubmit ? theme.activeBtnGrad : COLORS.bgMuted, boxShadow:canSubmit ? theme.activeShadow : 'none', color:canSubmit ? '#fff' : COLORS.t4, border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:700, cursor:canSubmit ? 'pointer' : 'not-allowed', fontFamily:'inherit', letterSpacing:'-0.2px' }}>
                급여 차트 등록
              </button>
            ) : (
              <button onClick={handleSave}
                style={{ width:'100%', padding:'15px', background:saved ? '#10B981' : theme.activeBtnGrad, boxShadow:saved ? 'none' : theme.activeShadow, color:'#fff', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.25s', letterSpacing:'-0.2px' }}>
                {saved ? '✓  저장 완료' : '자동 설정 저장'}
              </button>
            )}
          </div>
        </div>

        {showAddEmpSheet && <AddEmployeeSheet theme={theme} onClose={() => setShowAddEmpSheet(false)} onAdd={emp => setEditEmployees(prev => [...prev, emp])} />}
        {exitModal}
      </PhoneShell>
    )
  }

  // ═══════════════════════════════════════════════════════
  // ── 리스트 화면 (원래 헤더 유지)
  // ═══════════════════════════════════════════════════════
  return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto', background:COLORS.bg }}>

        {/* 헤더 — 원래 형태 그대로 유지 */}
        <div style={{ background:theme.headerGrad, paddingTop:'max(20px, env(safe-area-inset-top))', paddingBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 14px' }}>
            <button onClick={() => navigate(-1)} style={{ width:'32px', height:'32px', background:'none', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, flexShrink:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff' }}>급여 자동 설정</span>
            <div style={{ flex:1 }} />
            <button onClick={() => navigate('/home-business')} style={{ width:'32px', height:'32px', background:'none', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, flexShrink:0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* 원래 유리 카드 — 집계 그대로 */}
          <div style={{ margin:'0 16px', padding:'16px', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:'14px' }}>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.65)', fontWeight:600, marginBottom:'6px' }}>
              전체 급여 · 지급 가능 {allPayable.length}명 · 차트 {charts.length}개
            </div>
            <div style={{ fontSize:'26px', fontWeight:800, color:'#fff', letterSpacing:'-0.5px', whiteSpace:'nowrap' }}>
              {fmt(totalGross)}<span style={{ fontSize:'14px', fontWeight:500, opacity:0.7 }}>원</span>
            </div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginBottom:'12px' }}>세전 합계</div>

            <div style={{ paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.15)', display:'flex', flexDirection:'column', gap:'5px' }}>
              <div style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.5px' }}>직원 공제 (예상, 간이)</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>
                <span>소득세 + 지방소득세</span><span>-{fmt(totalIncomeTax)}원</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>
                <span>4대보험 본인부담</span><span>-{fmt(totalFourInsEmp)}원</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'6px', marginTop:'2px', borderTop:'1px solid rgba(255,255,255,0.12)' }}>
                <span style={{ fontSize:'12px', fontWeight:700, color:'#fff' }}>실수령 합계</span>
                <span style={{ fontSize:'15px', fontWeight:800, color:'#86EFAC' }}>{fmt(totalNet)}원</span>
              </div>
            </div>

            <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.15)', display:'flex', flexDirection:'column', gap:'5px' }}>
              <div style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.5px' }}>회사 부담 (예상, 간이)</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>
                <span>4대보험 회사부담</span><span>+{fmt(totalFourInsCo)}원</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'6px', marginTop:'2px', borderTop:'1px solid rgba(255,255,255,0.12)' }}>
                <span style={{ fontSize:'12px', fontWeight:700, color:'#fff' }}>총 인건비</span>
                <span style={{ fontSize:'17px', fontWeight:800, color:'#FCD34D' }}>{fmt(totalLaborCost)}원</span>
              </div>
            </div>
          </div>
        </div>

        {/* 차트 리스트 */}
        <div style={{ padding:'16px 16px 36px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
            {charts.length === 0 ? (
              <div style={{ padding:'48px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
                <div style={{ fontSize:'48px' }}>💰</div>
                <div style={{ fontSize:'15px', fontWeight:700, color:COLORS.t1 }}>등록된 급여 차트가 없어요</div>
                <div style={{ fontSize:'13px', color:COLORS.t4 }}>아래 버튼을 눌러 첫 차트를 만들어보세요</div>
              </div>
            ) : (
              charts.map(chart => {
                const computedStatus = getComputedStatus(chart)
                const isOverdue = computedStatus === 'overdue'
                const { payable, gross, insCo } = calcEmployees(chart.employees)
                return (
                  <div key={chart.id} onClick={() => canEdit && openDetail(chart)}
                    style={{ background:COLORS.bgCard, borderRadius:'16px', boxShadow:SHADOWS.card, border:isOverdue ? '1px solid #FDE68A' : `1px solid ${COLORS.borderSoft}`, cursor:'pointer', overflow:'hidden' }}>
                    <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ width:'44px', height:'44px', borderRadius:'14px', background:`${theme.brand}12`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>💰</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'14px', fontWeight:700, color:COLORS.t1, marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{chart.name}</div>
                        <div style={{ fontSize:'11px', color:COLORS.t4 }}>
                          직원 {chart.employees.length}명 · 지급 가능 {payable.length}명 · 매월 {chart.payDay}일
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:'15px', fontWeight:800, color:COLORS.t1, marginBottom:'5px' }}>{fmt(gross)}원</div>
                        <StatusBadge status={computedStatus} />
                      </div>
                    </div>
                    <div style={{ padding:'8px 16px', background:COLORS.bg, borderTop:`1px solid ${COLORS.borderSoft}`, display:'flex', gap:'16px' }}>
                      <div style={{ fontSize:'11px', color:COLORS.t4 }}>세전 {fmt(gross)}원</div>
                      <div style={{ fontSize:'11px', color:COLORS.t4 }}>총 인건비 {fmt(gross+insCo)}원</div>
                    </div>
                    {isOverdue && (
                      <div style={{ padding:'7px 16px', background:'#FFFBEB', borderTop:'1px solid #FDE68A', display:'flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ fontSize:'12px' }}>⚠️</span>
                        <span style={{ fontSize:'11px', fontWeight:600, color:'#D97706' }}>미납 중 · 결제 수단을 확인해주세요</span>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* 버튼 2개 — 직접 만들기 + 엑셀 업로드 (권한 있을 때만) */}
          {canEdit && (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <button onClick={openAddForm}
                style={{ width:'100%', padding:'15px', background:theme.activeBtnGrad, color:'#fff', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', boxShadow:theme.activeShadow }}>
                <span style={{ fontSize:'18px' }}>+</span> 급여 차트 만들기
              </button>
              <button onClick={() => setShowExcelSheet(true)}
                style={{ width:'100%', padding:'14px', background:COLORS.bgCard, color:COLORS.t1, border:`1.5px solid ${COLORS.borderSoft}`, borderRadius:'14px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', boxShadow:SHADOWS.card }}>
                <span style={{ fontSize:'17px' }}>📊</span> 엑셀로 일괄 업로드
              </button>
            </div>
          )}
          {!canEdit && (
            <div style={{ padding:'13px 16px', background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:'13px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'18px' }}>🔒</span>
              <div>
                <div style={{ fontSize:'12px', fontWeight:700, color:'#92400E' }}>조회 전용</div>
                <div style={{ fontSize:'11px', color:'#B45309', lineHeight:1.5 }}>급여 차트 생성·수정은 관리자 이상 권한이 필요합니다.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showExcelSheet && (
        <ExcelUploadSheet
          theme={theme}
          onClose={() => setShowExcelSheet(false)}
          onCreateChart={handleExcelCreate}
        />
      )}
    </PhoneShell>
  )
}
