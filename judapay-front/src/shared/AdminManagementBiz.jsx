import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'

// ═══════════════════════════════════════════════════════════
// ── 상수
// ═══════════════════════════════════════════════════════════
const ROLES = {
  master:     { id:'master',     label:'대표',     icon:'👑', color:'#7C3AED', bg:'#EDE9FE', desc:'모든 권한' },
  admin:      { id:'admin',      label:'관리자',   icon:'🛠️', color:'#1D4ED8', bg:'#DBEAFE', desc:'승인·설정 가능' },
  accounting: { id:'accounting', label:'회계',     icon:'💼', color:'#059669', bg:'#D1FAE5', desc:'증빙 조회·다운로드' },
  manager:    { id:'manager',    label:'팀장',     icon:'📋', color:'#0891B2', bg:'#CFFAFE', desc:'팀 집행 요청·1차 확인' },
  staff:      { id:'staff',      label:'일반직원', icon:'✏️', color:'#6B7280', bg:'#F3F4F6', desc:'집행 요청만 가능' },
  viewer:     { id:'viewer',     label:'조회전용', icon:'👁️', color:'#9CA3AF', bg:'#F9FAFB', desc:'보기만 가능' },
}

const MEMBER_STATUS = {
  active:   { label:'재직중',    color:'#059669', bg:'#D1FAE5' },
  invited:  { label:'초대 대기', color:'#D97706', bg:'#FEF3C7' },
  inactive: { label:'비활성',    color:'#6B7280', bg:'#F3F4F6' },
  resigned: { label:'퇴사',      color:'#DC2626', bg:'#FEE2E2' },
}

const DEPT_LIST = ['경영지원', '개발팀', '마케팅', '영업팀', '디자인', '재무', '기타']

const APPROVAL_MODES = [
  { id:'none',      label:'승인 없음',       sub:'바로 집행 가능',                   icon:'⚡' },
  { id:'single',    label:'1단계 승인',       sub:'관리자 또는 대표 1명 승인',        icon:'✅' },
  { id:'double',    label:'2단계 승인',       sub:'1차 팀장 → 2차 대표 순서 승인',   icon:'✅✅' },
  { id:'threshold', label:'금액 초과시 승인', sub:'한도 이하 즉시·초과 시 승인 요청', icon:'💰' },
]

const DEMO_MEMBERS = [
  { id:'m1', name:'이대표', role:'master',     status:'active',  dept:'경영지원', position:'대표이사', phone:'010-1234-5678', email:'ceo@company.com',   monthlyUsed:0,       monthlyLimit:null,    singleLimit:null,    approvalMode:'none',      joinDate:'2026.01.01' },
  { id:'m2', name:'김관리', role:'admin',      status:'active',  dept:'경영지원', position:'팀장',     phone:'010-2345-6789', email:'admin@company.com', monthlyUsed:1240000, monthlyLimit:3000000, singleLimit:500000,  approvalMode:'threshold', joinDate:'2026.02.15' },
  { id:'m3', name:'박팀장', role:'manager',    status:'active',  dept:'개발팀',   position:'개발팀장', phone:'010-3456-7890', email:'mgr@company.com',   monthlyUsed:680000,  monthlyLimit:2000000, singleLimit:300000,  approvalMode:'single',    joinDate:'2026.02.20' },
  { id:'m4', name:'최직원', role:'staff',      status:'active',  dept:'마케팅',   position:'마케터',   phone:'010-4567-8901', email:'staff@company.com', monthlyUsed:320000,  monthlyLimit:500000,  singleLimit:100000,  approvalMode:'single',    joinDate:'2026.03.01' },
  { id:'m5', name:'정세무', role:'accounting', status:'active',  dept:'재무',     position:'세무사',   phone:'010-5678-9012', email:'tax@company.com',   monthlyUsed:0,       monthlyLimit:null,    singleLimit:null,    approvalMode:'none',      joinDate:'2026.03.10' },
  { id:'m6', name:'한신입', role:'staff',      status:'invited', dept:'마케팅',   position:'인턴',     phone:'010-6789-0123', email:'new@company.com',   monthlyUsed:0,       monthlyLimit:200000,  singleLimit:50000,   approvalMode:'single',    joinDate:'-' },
]

const DEMO_AUDIT_LOGS = [
  { id:'a1', date:'2026.05.09 14:32', actor:'김관리', action:'권한 변경',     target:'한신입 → 일반직원',      ip:'192.168.1.10' },
  { id:'a2', date:'2026.05.09 11:15', actor:'이대표', action:'구성원 초대',   target:'한신입 (마케팅/인턴)',    ip:'192.168.1.1'  },
  { id:'a3', date:'2026.05.08 16:44', actor:'박팀장', action:'집행 승인',     target:'사무용품 124,000원',      ip:'192.168.1.22' },
  { id:'a4', date:'2026.05.08 09:30', actor:'정세무', action:'증빙 다운로드', target:'4월 세금계산서 전체',     ip:'192.168.1.33' },
  { id:'a5', date:'2026.05.07 17:00', actor:'시스템', action:'이상 접근 탐지',target:'미인증 IP 로그인 시도',   ip:'123.45.67.89' },
]

// ═══════════════════════════════════════════════════════════
// ── 유틸
// ═══════════════════════════════════════════════════════════
function fmt(n) { return Number(Math.floor(n||0)).toLocaleString('ko-KR') }

// ═══════════════════════════════════════════════════════════
// ── 공통 컴포넌트
// ═══════════════════════════════════════════════════════════
function Header({ onBack, title, sub, right }) {
  const theme = getAccountTheme()
  return (
    <div style={{ background:theme.headerGrad, padding:'20px 16px 18px', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <button onClick={onBack} style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'19px', fontWeight:700, color:'#fff', letterSpacing:'-0.4px' }}>{title}</div>
          {sub && <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.65)', marginTop:'2px' }}>{sub}</div>}
        </div>
        {right}
      </div>
    </div>
  )
}

function SectionTitle({ label, color, extra }) {
  const theme = getAccountTheme()
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
        <div style={{ width:'3px', height:'14px', borderRadius:'2px', background: color || theme.brand }}/>
        <span style={{ fontSize:'11px', fontWeight:700, color: color || theme.brandDark, letterSpacing:'0.6px', textTransform:'uppercase' }}>{label}</span>
      </div>
      {extra}
    </div>
  )
}

function Toggle({ on, onChange, brand }) {
  return (
    <button onClick={onChange}
      style={{ width:'46px', height:'26px', borderRadius:'13px', border:'none', cursor:'pointer', background: on ? brand : COLORS.bgMuted, position:'relative', transition:'background 0.2s', padding:0, flexShrink:0 }}>
      <div style={{ position:'absolute', top:'3px', left: on ? '23px' : '3px', width:'20px', height:'20px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.25)' }}/>
    </button>
  )
}

function RoleBadge({ role }) {
  const r = ROLES[role] || ROLES.viewer
  return <span style={{ padding:'2px 8px', borderRadius:'20px', background:r.bg, color:r.color, fontSize:'10px', fontWeight:700, whiteSpace:'nowrap' }}>{r.icon} {r.label}</span>
}

function StatusBadge({ status }) {
  const s = MEMBER_STATUS[status] || MEMBER_STATUS.inactive
  return <span style={{ padding:'2px 8px', borderRadius:'20px', background:s.bg, color:s.color, fontSize:'10px', fontWeight:700 }}>{s.label}</span>
}

function Avatar({ name, role, size = 44 }) {
  const r = ROLES[role] || ROLES.viewer
  return (
    <div style={{ width:`${size}px`, height:`${size}px`, borderRadius:'50%', background:r.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:`${Math.floor(size*0.36)}px`, fontWeight:700, color:r.color, flexShrink:0 }}>
      {name[0]}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 1. 메인 허브 (리디자인)
// ═══════════════════════════════════════════════════════════
function MainHub({ members, onNav }) {
  const navigate = useNavigate()
  const active   = members.filter(m => m.status === 'active').length
  const invited  = members.filter(m => m.status === 'invited').length

  // 역할별 색상 (MembersView와 동일)
  const ROLE_STYLE = {
    master:     { label:'대표',     color:'#6D28D9', bg:'#F3EEFF' },
    admin:      { label:'관리자',   color:'#1D4ED8', bg:'#EEF2FF' },
    accounting: { label:'회계',     color:'#0D7750', bg:'#E6F6EF' },
    manager:    { label:'팀장',     color:'#0369A1', bg:'#E0F2FE' },
    staff:      { label:'일반직원', color:'#374151', bg:'#F3F4F6' },
    viewer:     { label:'조회전용', color:'#6B7280', bg:'#F9FAFB' },
  }

  const STATUS_COLOR = {
    active:  { label:'재직중',    color:'#0D7750', bg:'#E6F6EF' },
    invited: { label:'초대 대기', color:'#92590A', bg:'#FEF3E0' },
  }

  const modules = [
    { id:'members',  label:'구성원 관리', sub:`재직 ${active}명 · 초대 ${invited}명`, badge: invited > 0 ? invited : null, iconBg:'#EEF2FF', iconColor:'#1D4ED8',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id:'company',  label:'기업 설정',   sub:'회사정보 · 계좌 · API 연동',          iconBg:'#FEF3E0', iconColor:'#92590A',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92590A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
    { id:'security', label:'보안 및 감사', sub:'활동로그 · 이상탐지 · 디바이스',    badge: 1, iconBg:'#FEE9E9', iconColor:'#C0392B',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  ]

  const theme = getAccountTheme()

  return (
    <>
      {/* ── 헤더 (통일 그라디언트) */}
      <div style={{ background:theme.headerGrad, padding:'20px 16px 22px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px' }}>
          <button onClick={() => navigate(-1)}
            style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'19px', fontWeight:700, color:'#fff', letterSpacing:'-0.4px' }}>관리자</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'2px' }}>㈜주다컴퍼니</div>
          </div>
        </div>

        {/* 요약 2칸 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
          <div style={{ background:'rgba(255,255,255,0.13)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'14px', padding:'13px 14px' }}>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.65)', fontWeight:600, marginBottom:'6px' }}>전체 구성원</div>
            <div style={{ fontSize:'24px', fontWeight:800, color:'#fff', letterSpacing:'-0.5px', marginBottom:'3px' }}>{members.length}명</div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.5)' }}>재직 {active} · 초대 {invited}</div>
          </div>
          <div style={{ background:'rgba(239,68,68,0.18)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'14px', padding:'13px 14px' }}>
            <div style={{ fontSize:'10px', color:'rgba(252,165,165,0.9)', fontWeight:600, marginBottom:'6px' }}>이상 탐지</div>
            <div style={{ fontSize:'24px', fontWeight:800, color:'#FCA5A5', letterSpacing:'-0.5px', marginBottom:'3px' }}>1건</div>
            <div style={{ fontSize:'10px', color:'rgba(252,165,165,0.7)' }}>미조치 항목</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'16px 16px 36px', background:'#F8F9FB', minHeight:'100%' }}>

        {/* ── 이상 탐지 배너 */}
        <div style={{ background:'#fff', border:'1px solid #FCCFCF', borderRadius:'14px', padding:'13px 14px', display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'#FEE9E9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#111827', marginBottom:'2px' }}>이상 접근 탐지됨</div>
            <div style={{ fontSize:'11px', color:'#9CA3AF' }}>해외 IP 로그인 시도 — 즉시 확인 필요</div>
          </div>
          <button onClick={() => onNav('security')}
            style={{ padding:'6px 13px', background:'#111827', color:'#fff', border:'none', borderRadius:'8px', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
            확인
          </button>
        </div>

        {/* ── 메뉴 */}
        <div style={{ fontSize:'11px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'9px' }}>메뉴</div>
        <div style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', border:'1px solid #EAECF0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', marginBottom:'24px' }}>
          {modules.map((mod, i) => (
            <button key={mod.id} onClick={() => onNav(mod.id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:'14px', padding:'16px', background:'transparent', border:'none', borderBottom: i < modules.length-1 ? '1px solid #F0F1F3' : 'none', borderLeft:'3px solid transparent', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderLeft = `3px solid ${mod.iconColor}` }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = '3px solid transparent' }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:mod.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {mod.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'3px' }}>
                  <span style={{ fontSize:'14px', fontWeight:700, color:'#111827' }}>{mod.label}</span>
                  {mod.badge && (
                    <span style={{ padding:'1px 7px', borderRadius:'20px', background: mod.id === 'security' ? '#FEE9E9' : '#FEF3E0', color: mod.id === 'security' ? '#C0392B' : '#92590A', fontSize:'10px', fontWeight:800 }}>
                      {mod.badge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize:'11px', color:'#9CA3AF' }}>{mod.sub}</div>
              </div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>

        {/* ── 구성원 현황 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'9px' }}>
          <div style={{ fontSize:'11px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.5px', textTransform:'uppercase' }}>구성원 현황</div>
          <button onClick={() => onNav('members')}
            style={{ background:'none', border:'none', fontSize:'11px', fontWeight:700, color:'#374151', cursor:'pointer', fontFamily:'inherit', padding:0 }}>
            전체 보기 →
          </button>
        </div>
        <div style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', border:'1px solid #EAECF0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          {members.filter(m => m.status !== 'resigned').slice(0, 4).map((m, i, arr) => {
            const rs  = ROLE_STYLE[m.role]  || ROLE_STYLE.staff
            const ss  = STATUS_COLOR[m.status]
            return (
              <div key={m.id}
                style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px 16px', borderBottom: i < arr.length-1 ? '1px solid #F0F1F3' : 'none' }}>
                {/* 아바타 */}
                <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:rs.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:rs.color, flexShrink:0 }}>
                  {m.name[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
                    <span style={{ fontSize:'13px', fontWeight:700, color:'#111827' }}>{m.name}</span>
                    <span style={{ fontSize:'10px', fontWeight:700, color:rs.color, background:rs.bg, padding:'1px 7px', borderRadius:'5px' }}>
                      {rs.label}
                    </span>
                  </div>
                  <div style={{ fontSize:'10px', color:'#9CA3AF' }}>{m.dept} · {m.position}</div>
                </div>
                {ss && (
                  <span style={{ fontSize:'10px', fontWeight:600, color:ss.color, background:ss.bg, padding:'2px 8px', borderRadius:'5px', flexShrink:0 }}>
                    {ss.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </>
  )
}
function MembersView({ members, setMembers, onBack, onInvite }) {
  const theme = getAccountTheme()
  const [filter, setFilter]   = useState('all')
  const [editMember, setEdit] = useState(null)

  if (editMember) return (
    <MemberDetailView member={editMember} onBack={() => setEdit(null)}
      onSave={updated => { setMembers(ms => ms.map(m => m.id === updated.id ? updated : m)); setEdit(null) }}
      onResign={id => { setMembers(ms => ms.map(m => m.id === id ? { ...m, status:'resigned' } : m)); setEdit(null) }}
    />
  )

  const FILTERS = [
    { id:'all',     label:'전체' },
    { id:'active',  label:'재직중' },
    { id:'invited', label:'초대중' },
  ]
  const filtered = filter === 'all'
    ? members.filter(m => m.status !== 'resigned')
    : members.filter(m => m.status === filter)

  const activeCount  = members.filter(m => m.status === 'active').length
  const invitedCount = members.filter(m => m.status === 'invited').length

  // 상태 → 스타일
  const STATUS_STYLE = {
    active:   { label:'재직중',    color:'#0D7750', bg:'#E6F6EF' },
    invited:  { label:'초대 대기', color:'#92590A', bg:'#FEF3E0' },
    inactive: { label:'비활성',    color:'#9CA3AF', bg:'#F3F4F6' },
    resigned: { label:'퇴사',      color:'#9CA3AF', bg:'#F3F4F6' },
  }

  // 역할별 색상 (부드럽게)
  const ROLE_STYLE = {
    master:     { label:'대표',     color:'#6D28D9', bg:'#F3EEFF' },
    admin:      { label:'관리자',   color:'#1D4ED8', bg:'#EEF2FF' },
    accounting: { label:'회계',     color:'#0D7750', bg:'#E6F6EF' },
    manager:    { label:'팀장',     color:'#0369A1', bg:'#E0F2FE' },
    staff:      { label:'일반직원', color:'#374151', bg:'#F3F4F6' },
    viewer:     { label:'조회전용', color:'#6B7280', bg:'#F9FAFB' },
  }

  return (
    <>
      {/* ── 헤더 */}
      <Header onBack={onBack} title="구성원 관리" sub={`총 ${members.length}명`}
        right={
          <button onClick={onInvite}
            style={{ display:'flex', alignItems:'center', gap:'4px', padding:'7px 14px', background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'20px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            직원 초대
          </button>
        }
      />

      <div style={{ padding:'16px 16px 36px' }}>

        {/* ── 요약 3칸 */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', marginBottom:'20px' }}>
          {[
            { label:'재직중',    value:`${activeCount}명` },
            { label:'초대 대기', value:`${invitedCount}명` },
            { label:'전체',      value:`${members.length}명` },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', border:'1px solid #EAECF0', borderRadius:'12px', padding:'13px 10px', textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize:'20px', fontWeight:800, color:'#111827', letterSpacing:'-0.5px' }}>{s.value}</div>
              <div style={{ fontSize:'10px', color:'#9CA3AF', fontWeight:600, marginTop:'3px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── 필터 탭 */}
        <div style={{ display:'flex', background:'#F3F4F6', borderRadius:'10px', padding:'3px', gap:'2px', marginBottom:'16px' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ flex:1, padding:'9px 4px', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', border:'none', fontSize:'12px', fontWeight:700, transition:'all 0.15s', background: filter === f.id ? '#fff' : 'transparent', color: filter === f.id ? '#111827' : '#9CA3AF', boxShadow: filter === f.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* ── 멤버 목록 */}
        <div style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', border:'1px solid #EAECF0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          {filtered.map((m, i) => {
            const isMaster = m.role === 'master'
            const usagePct = m.monthlyLimit && m.monthlyUsed
              ? Math.min(100, m.monthlyUsed / m.monthlyLimit * 100) : 0
            const sm = STATUS_STYLE[m.status] || STATUS_STYLE.inactive
            const rs = ROLE_STYLE[m.role] || ROLE_STYLE.staff

            return (
              <button key={m.id} onClick={() => !isMaster && setEdit(m)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:'14px', padding:'15px 16px', background:'transparent', border:'none', borderBottom: i < filtered.length-1 ? '1px solid #F0F1F3' : 'none', cursor: isMaster ? 'default' : 'pointer', fontFamily:'inherit', textAlign:'left', transition:'background 0.12s' }}
                onMouseEnter={e => { if (!isMaster) e.currentTarget.style.background = '#FAFAFA' }}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                {/* 아바타 */}
                <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:rs.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:700, color:rs.color, flexShrink:0, border:`1px solid ${rs.bg}` }}>
                  {m.name[0]}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  {/* 이름 + 역할 */}
                  <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'4px' }}>
                    <span style={{ fontSize:'14px', fontWeight:700, color:'#111827' }}>{m.name}</span>
                    <span style={{ fontSize:'10px', fontWeight:700, color:rs.color, background:rs.bg, padding:'2px 8px', borderRadius:'6px' }}>
                      {rs.label}
                    </span>
                  </div>
                  {/* 부서 · 직책 */}
                  <div style={{ fontSize:'11px', color:'#9CA3AF', marginBottom: usagePct > 0 ? '6px' : '0' }}>
                    {m.dept} · {m.position}
                  </div>
                  {/* 사용량 미니 바 */}
                  {usagePct > 0 && (
                    <div>
                      <div style={{ height:'3px', background:'#F3F4F6', borderRadius:'10px', overflow:'hidden', width:'100%' }}>
                        <div style={{ height:'100%', borderRadius:'10px', background: usagePct > 80 ? '#EF4444' : rs.color, width:`${usagePct}%` }}/>
                      </div>
                      <div style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'3px' }}>
                        {fmt(m.monthlyUsed)}원 사용 ({Math.round(usagePct)}%)
                      </div>
                    </div>
                  )}
                </div>

                {/* 오른쪽: 상태 + 화살표 */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px', flexShrink:0 }}>
                  <span style={{ fontSize:'10px', fontWeight:600, color: sm.color, background: sm.bg, padding:'2px 8px', borderRadius:'5px' }}>
                    {sm.label}
                  </span>
                  {!isMaster && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* ── 퇴사 인원 표시 (접힘) */}
        {members.filter(m => m.status === 'resigned').length > 0 && filter === 'all' && (
          <div style={{ marginTop:'16px', padding:'13px 16px', background:'#F9FAFB', border:'1px solid #EAECF0', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'12px', color:'#9CA3AF' }}>
              퇴사 {members.filter(m => m.status === 'resigned').length}명 숨겨짐
            </span>
            <button onClick={() => setFilter('resigned')} style={{ background:'none', border:'none', fontSize:'11px', color:'#6B7280', fontWeight:600, cursor:'pointer', fontFamily:'inherit', padding:0 }}>
              보기 →
            </button>
          </div>
        )}

      </div>
    </>
  )
}

function MemberDetailView({ member, onBack, onSave, onResign }) {
  const theme = getAccountTheme()
  const [role, setRole]               = useState(member.role)
  const [dept, setDept]               = useState(member.dept)
  const [position, setPosition]       = useState(member.position)
  const [approvalMode, setApproval]   = useState(member.approvalMode)
  const [monthlyLimit, setMonthlyLim] = useState(member.monthlyLimit ? String(member.monthlyLimit) : '')
  const [singleLimit, setSingleLim]   = useState(member.singleLimit ? String(member.singleLimit) : '')
  const [showResign, setShowResign]   = useState(false)

  const usagePct = member.monthlyLimit && member.monthlyUsed
    ? Math.min(100, member.monthlyUsed / member.monthlyLimit * 100) : 0
  const isOver80 = usagePct > 80
  const r = ROLES[member.role] || ROLES.viewer

  // 섹션 구분자
  const Divider = () => <div style={{ height:'1px', background:'#F0F1F3', margin:'0 -16px' }} />

  return (
    <>
      {/* ── 헤더 */}
      <Header onBack={onBack} title={member.name} sub={`${r.label} · ${member.dept}`}
        right={member.role !== 'master' && (
          <button onClick={() => setShowResign(true)}
            style={{ padding:'6px 14px', background:'rgba(239,68,68,0.1)', color:'#EF4444', border:'none', borderRadius:'20px', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            퇴사
          </button>
        )}
      />

      <div style={{ padding:'16px 16px 100px' }}>

        {/* ── 프로필 카드 */}
        <div style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', marginBottom:'12px', border:'1px solid #EAECF0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          {/* 상단 배경 밴드 */}
          <div style={{ height:'52px', background:'linear-gradient(135deg, #F8F9FB 0%, #F1F3F7 100%)' }} />
          <div style={{ padding:'0 18px 18px', marginTop:'-26px' }}>
            {/* 아바타 */}
            <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'#fff', border:'2px solid #fff', boxShadow:'0 2px 8px rgba(0,0,0,0.10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:700, color:'#374151', marginBottom:'10px' }}>
              {member.name[0]}
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px' }}>
              <div>
                <div style={{ fontSize:'17px', fontWeight:700, color:'#111827', letterSpacing:'-0.3px' }}>{member.name}</div>
                <div style={{ fontSize:'12px', color:'#9CA3AF', marginTop:'2px' }}>{member.email}</div>
                <div style={{ fontSize:'12px', color:'#9CA3AF' }}>{member.phone}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'5px', paddingTop:'2px' }}>
                <span style={{ padding:'3px 9px', borderRadius:'20px', background:'#F3F4F6', color:'#374151', fontSize:'11px', fontWeight:700 }}>
                  {r.icon} {r.label}
                </span>
                <StatusBadge status={member.status} />
              </div>
            </div>
          </div>

          {/* 사용량 바 */}
          {member.monthlyUsed > 0 && member.monthlyLimit && (
            <div style={{ padding:'14px 18px', borderTop:'1px solid #F0F1F3' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <span style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:600 }}>이달 사용 현황</span>
                <span style={{ fontSize:'12px', fontWeight:700, color: isOver80 ? '#EF4444' : '#374151' }}>
                  {fmt(member.monthlyUsed)}원
                  <span style={{ fontSize:'10px', color:'#9CA3AF', fontWeight:400 }}> / {fmt(member.monthlyLimit)}원</span>
                </span>
              </div>
              <div style={{ height:'5px', background:'#F3F4F6', borderRadius:'10px', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:'10px', background: isOver80 ? '#EF4444' : theme.brand, width:`${usagePct}%`, transition:'width 0.4s' }}/>
              </div>
              <div style={{ fontSize:'10px', color: isOver80 ? '#EF4444' : '#9CA3AF', textAlign:'right', marginTop:'5px' }}>
                {Math.round(usagePct)}%
              </div>
            </div>
          )}
        </div>

        {/* ── 부서 및 직책 */}
        <div style={{ background:'#fff', borderRadius:'18px', padding:'16px', marginBottom:'12px', border:'1px solid #EAECF0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize:'11px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:'12px' }}>부서 및 직책</div>

          {/* 부서 선택 */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'14px' }}>
            {DEPT_LIST.map(d => (
              <button key={d} onClick={() => setDept(d)}
                style={{ padding:'6px 13px', borderRadius:'8px', border:'none', background: dept===d ? '#111827' : '#F3F4F6', color: dept===d ? '#fff' : '#6B7280', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                {d}
              </button>
            ))}
          </div>

          <Divider />

          {/* 직책 입력 */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'13px' }}>
            <span style={{ fontSize:'13px', color:'#6B7280' }}>직책</span>
            <input value={position} onChange={e => setPosition(e.target.value)} placeholder="직책 입력"
              style={{ width:'160px', fontSize:'14px', fontWeight:600, color:'#111827', background:'transparent', border:'none', outline:'none', fontFamily:'inherit', textAlign:'right' }}/>
          </div>
        </div>

        {/* ── 권한 (역할) */}
        <div style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', marginBottom:'12px', border:'1px solid #EAECF0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding:'16px 16px 10px' }}>
            <div style={{ fontSize:'11px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.6px', textTransform:'uppercase' }}>권한 (역할)</div>
          </div>
          {['admin','accounting','manager','staff','viewer'].map((rid, i, arr) => {
            const info = ROLES[rid]
            const active = role === rid
            return (
              <button key={rid} onClick={() => setRole(rid)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:'14px', padding:'13px 16px', background: active ? '#FAFAFA' : 'transparent', border:'none', borderTop:'1px solid #F0F1F3', borderLeft: active ? `3px solid #111827` : '3px solid transparent', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s' }}>
                {/* 라디오 도트 */}
                <div style={{ width:'18px', height:'18px', borderRadius:'50%', border: active ? '6px solid #111827' : '2px solid #D1D5DB', flexShrink:0, transition:'all 0.15s' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13px', fontWeight: active ? 700 : 500, color: active ? '#111827' : '#374151', marginBottom:'2px' }}>{info.label}</div>
                  <div style={{ fontSize:'11px', color:'#9CA3AF' }}>{info.desc}</div>
                </div>
                {active && (
                  <div style={{ fontSize:'11px', fontWeight:700, color:'#111827', background:'#F3F4F6', padding:'2px 9px', borderRadius:'6px' }}>선택됨</div>
                )}
              </button>
            )
          })}
        </div>

        {/* ── 집행 승인 방식 */}
        <div style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', marginBottom:'12px', border:'1px solid #EAECF0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding:'16px 16px 10px' }}>
            <div style={{ fontSize:'11px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.6px', textTransform:'uppercase' }}>집행 승인 방식</div>
          </div>
          {APPROVAL_MODES.map((m, i) => {
            const active = approvalMode === m.id
            return (
              <button key={m.id} onClick={() => setApproval(m.id)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:'14px', padding:'13px 16px', background: active ? '#FAFAFA' : 'transparent', border:'none', borderTop:'1px solid #F0F1F3', borderLeft: active ? '3px solid #111827' : '3px solid transparent', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s' }}>
                <div style={{ width:'18px', height:'18px', borderRadius:'50%', border: active ? '6px solid #111827' : '2px solid #D1D5DB', flexShrink:0, transition:'all 0.15s' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13px', fontWeight: active ? 700 : 500, color: active ? '#111827' : '#374151', marginBottom:'2px' }}>{m.label}</div>
                  <div style={{ fontSize:'11px', color:'#9CA3AF' }}>{m.sub}</div>
                </div>
                {active && (
                  <div style={{ fontSize:'11px', fontWeight:700, color:'#111827', background:'#F3F4F6', padding:'2px 9px', borderRadius:'6px' }}>선택됨</div>
                )}
              </button>
            )
          })}
        </div>

        {/* ── 집행 한도 */}
        {(role === 'staff' || role === 'admin' || role === 'manager') && (
          <div style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', marginBottom:'12px', border:'1px solid #EAECF0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ padding:'16px 16px 0' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.6px', textTransform:'uppercase' }}>집행 한도</div>
            </div>
            {[
              { label:'월 한도',  sub:'매월 초기화',    val:monthlyLimit, set:setMonthlyLim },
              { label:'1회 한도', sub:'건당 최대 금액',  val:singleLimit,  set:setSingleLim  },
            ].map((f, i, arr) => (
              <div key={f.label} style={{ padding:'14px 16px', borderTop:'1px solid #F0F1F3', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                <div>
                  <div style={{ fontSize:'13px', color:'#374151', fontWeight:500 }}>{f.label}</div>
                  <div style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'1px' }}>{f.sub}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                  <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder="제한 없음"
                    style={{ width:'110px', fontSize:'15px', fontWeight:700, color:'#111827', background:'transparent', border:'none', outline:'none', fontFamily:'inherit', textAlign:'right' }}/>
                  <span style={{ fontSize:'12px', color:'#9CA3AF', fontWeight:500, flexShrink:0 }}>원</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 가입일 정보 */}
        <div style={{ background:'#fff', borderRadius:'18px', padding:'14px 16px', marginBottom:'12px', border:'1px solid #EAECF0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:'13px', color:'#6B7280' }}>합류일</span>
          <span style={{ fontSize:'13px', fontWeight:600, color:'#374151' }}>{member.joinDate}</span>
        </div>

      </div>

      {/* ── 저장 버튼 */}
      <div style={{ position:'sticky', bottom:0, padding:'12px 16px 24px', background:'#fff', borderTop:'1px solid #EAECF0', boxShadow:'0 -2px 12px rgba(0,0,0,0.05)' }}>
        <button onClick={() => onSave({ ...member, role, dept, position, approvalMode, monthlyLimit: monthlyLimit ? Number(monthlyLimit) : null, singleLimit: singleLimit ? Number(singleLimit) : null })}
          style={{ width:'100%', height:'50px', background:'#111827', color:'#fff', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          저장
        </button>
      </div>

      {/* ── 퇴사 confirm */}
      {showResign && (
        <div onClick={() => setShowResign(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:200 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:'390px', background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px 36px' }}>
            <div style={{ width:'36px', height:'4px', background:'#E5E7EB', borderRadius:'2px', margin:'0 auto 20px' }} />
            <div style={{ fontSize:'16px', fontWeight:700, color:'#111827', marginBottom:'6px' }}>{member.name} 퇴사 처리</div>
            <div style={{ fontSize:'12px', color:'#6B7280', lineHeight:1.7, marginBottom:'18px' }}>
              퇴사 처리 즉시 아래 항목이 실행됩니다.
            </div>
            <div style={{ background:'#FEF2F2', borderRadius:'12px', padding:'14px 16px', marginBottom:'20px' }}>
              {['로그인 즉시 차단', '법인카드 즉시 정지', '승인 권한 제거', '자금 요청 제한'].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 0', fontSize:'12px', color:'#B91C1C' }}>
                  <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#EF4444', flexShrink:0 }} />
                  {item}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => setShowResign(false)}
                style={{ flex:1, height:'46px', background:'#F3F4F6', color:'#374151', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                취소
              </button>
              <button onClick={() => onResign(member.id)}
                style={{ flex:1, height:'46px', background:'#EF4444', color:'#fff', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                퇴사 처리
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 3. 기업 설정
// ═══════════════════════════════════════════════════════════
function CompanySettingsView({ onBack }) {
  const theme = getAccountTheme()
  const [twoFactor, setTwoFactor] = useState(true)

  const sections = [
    {
      label:'기업 정보',
      icon:'🏢',
      items:[
        { label:'회사명',     value:'㈜주다컴퍼니',           arrow:true },
        { label:'사업자번호', value:'123-45-67890',           arrow:true },
        { label:'업종',       value:'소프트웨어 개발',         arrow:true },
        { label:'담당자',     value:'이대표 · 010-1234-5678', arrow:true },
      ],
    },
    {
      label:'법인 계좌',
      icon:'🏦',
      items:[
        { label:'연결 계좌', value:'신한은행 110-XXX-123456',    arrow:true  },
        { label:'잔액',      value:fmt(128500000)+'원',          arrow:false },
      ],
    },
    {
      label:'API 연동',
      icon:'🔗',
      items:[
        { label:'API 키',      value:'sk-juda-*****abc',      arrow:true },
        { label:'Webhook URL', value:'미설정',                 arrow:true },
        { label:'세무사 연동', value:'kim@samil.com 연동중',   arrow:true },
      ],
    },
  ]

  return (
    <>
      <Header onBack={onBack} title="기업 설정" sub="회사정보 · 계좌 · API" />
      <div style={{ padding:'16px 16px 36px' }}>
        {sections.map(sec => (
          <div key={sec.label} style={{ marginBottom:'16px' }}>
            <SectionTitle label={sec.label} />
            <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${COLORS.borderSoft}` }}>
              {sec.items.map((item, i, arr) => (
                <div key={item.label} style={{ padding:'14px 16px', borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', justifyContent:'space-between', cursor: item.arrow ? 'pointer' : 'default' }}>
                  <span style={{ fontSize:'13px', color:COLORS.t3 }}>{item.label}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1 }}>{item.value}</span>
                    {item.arrow && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t5} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 보안 설정 */}
        <SectionTitle label="보안 설정" />
        <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${COLORS.borderSoft}` }}>
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${COLORS.borderSoft}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1, marginBottom:'2px' }}>2차 인증 (OTP)</div>
              <div style={{ fontSize:'10px', color:COLORS.t4 }}>로그인 시 추가 인증 요구</div>
            </div>
            <Toggle on={twoFactor} onChange={() => setTwoFactor(!twoFactor)} brand={theme.brand} />
          </div>
          <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
            <div>
              <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1, marginBottom:'2px' }}>감사 로그 조회</div>
              <div style={{ fontSize:'10px', color:COLORS.t4 }}>전체 활동 이력 확인</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t5} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 4. 보안 및 감사 (리디자인)
// ═══════════════════════════════════════════════════════════
function SecurityView({ onBack }) {
  const [tab, setTab] = useState('activity')

  const ACTION_STYLE = {
    '권한 변경':     { color:'#92590A', bg:'#FEF3E0' },
    '구성원 초대':   { color:'#1D4ED8', bg:'#EEF2FF' },
    '집행 승인':     { color:'#0D7750', bg:'#E6F6EF' },
    '증빙 다운로드': { color:'#6D28D9', bg:'#F3EEFF' },
    '이상 접근 탐지':{ color:'#C0392B', bg:'#FEE9E9' },
  }

  const DEMO_DEVICES = [
    { name:'iPhone 15 Pro',     os:'iOS 17',     last:'방금',     trusted:true  },
    { name:'MacBook Pro',       os:'macOS 14',   last:'1시간 전', trusted:true  },
    { name:'Chrome on Windows', os:'Windows 11', last:'3일 전',   trusted:false },
  ]

  const TABS = [
    { id:'activity', label:'활동 로그' },
    { id:'device',   label:'디바이스'  },
    { id:'anomaly',  label:'이상탐지'  },
  ]

  const DeviceIcon = ({ name }) => {
    if (name.includes('iPhone')) return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
    )
    if (name.includes('Mac')) return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
    )
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
    )
  }

  return (
    <>
      <Header onBack={onBack} title="보안 및 감사" sub="활동로그 · 디바이스 · 이상탐지" />
      <div style={{ background:'#F8F9FB', minHeight:'100%', paddingBottom:'36px' }}>

        {/* ── 이상 탐지 배너 */}
        <div style={{ padding:'16px 16px 0' }}>
          <div style={{ background:'#fff', border:'1px solid #FCCFCF', borderRadius:'14px', padding:'13px 14px', display:'flex', alignItems:'center', gap:'12px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'#FEE9E9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#111827', marginBottom:'2px' }}>이상 접근 탐지됨</div>
              <div style={{ fontSize:'11px', color:'#9CA3AF' }}>해외 IP 로그인 시도 — 2026.05.07</div>
            </div>
            <button onClick={() => setTab('anomaly')}
              style={{ padding:'6px 13px', background:'#111827', color:'#fff', border:'none', borderRadius:'8px', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              조치
            </button>
          </div>
        </div>

        {/* ── 탭 */}
        <div style={{ display:'flex', background:'#EAECF0', borderRadius:'10px', padding:'3px', gap:'2px', margin:'14px 16px 0' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, padding:'9px 4px', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', border:'none', fontSize:'12px', fontWeight:700, transition:'all 0.15s', background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? '#111827' : '#9CA3AF', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding:'16px' }}>

          {/* ── 활동 로그 탭 */}
          {tab === 'activity' && (
            <>
              <div style={{ fontSize:'11px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'9px' }}>관리자 활동 로그</div>
              <div style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', border:'1px solid #EAECF0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                {DEMO_AUDIT_LOGS.map((log, i, arr) => {
                  const s = ACTION_STYLE[log.action] || { bg:'#F3F4F6', color:'#6B7280' }
                  return (
                    <div key={log.id} style={{ padding:'14px 16px', borderBottom: i < arr.length-1 ? '1px solid #F0F1F3' : 'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'6px', background:s.bg, color:s.color, whiteSpace:'nowrap' }}>
                          {log.action}
                        </span>
                        <span style={{ fontSize:'12px', fontWeight:700, color:'#111827' }}>{log.actor}</span>
                      </div>
                      <div style={{ fontSize:'12px', color:'#374151', marginBottom:'4px' }}>{log.target}</div>
                      <div style={{ fontSize:'10px', color:'#9CA3AF' }}>{log.date} · IP {log.ip}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── 디바이스 탭 */}
          {tab === 'device' && (
            <>
              <div style={{ fontSize:'11px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'9px' }}>등록 디바이스</div>
              <div style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', border:'1px solid #EAECF0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', marginBottom:'12px' }}>
                {DEMO_DEVICES.map((d, i, arr) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'13px', padding:'14px 16px', borderBottom: i < arr.length-1 ? '1px solid #F0F1F3' : 'none' }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background: d.trusted ? '#E6F6EF' : '#F3F4F6', color: d.trusted ? '#0D7750' : '#9CA3AF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <DeviceIcon name={d.name} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:'#111827', marginBottom:'3px' }}>{d.name}</div>
                      <div style={{ fontSize:'10px', color:'#9CA3AF' }}>{d.os} · {d.last}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px' }}>
                      <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'6px', background: d.trusted ? '#E6F6EF' : '#FEF3E0', color: d.trusted ? '#0D7750' : '#92590A' }}>
                        {d.trusted ? '신뢰됨' : '미신뢰'}
                      </span>
                      {!d.trusted && (
                        <button style={{ fontSize:'10px', padding:'3px 10px', background:'#FEE9E9', color:'#C0392B', border:'none', borderRadius:'6px', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>
                          차단
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button style={{ width:'100%', height:'46px', background:'#fff', color:'#C0392B', border:'1px solid #FCCFCF', borderRadius:'13px', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                모든 디바이스 강제 로그아웃
              </button>
            </>
          )}

          {/* ── 이상탐지 탭 */}
          {tab === 'anomaly' && (
            <>
              <div style={{ fontSize:'11px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'9px' }}>이상 접근 탐지</div>

              {/* 탐지 상세 */}
              <div style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', border:'1px solid #FCCFCF', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', marginBottom:'14px' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid #F0F1F3', display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'#FEE9E9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#111827', marginBottom:'2px' }}>해외 IP 로그인 시도</div>
                    <div style={{ fontSize:'11px', color:'#9CA3AF' }}>2026.05.07 17:00 · 자동 차단 완료</div>
                  </div>
                </div>
                {[
                  { label:'IP 주소',   value:'123.45.67.89' },
                  { label:'위치',      value:'미국 캘리포니아' },
                  { label:'실패 횟수', value:'3회' },
                  { label:'대상 계정', value:'이대표 (ceo@company.com)' },
                ].map((row, i, arr) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom: i < arr.length-1 ? '1px solid #F0F1F3' : 'none' }}>
                    <span style={{ fontSize:'12px', color:'#9CA3AF' }}>{row.label}</span>
                    <span style={{ fontSize:'12px', fontWeight:600, color:'#111827' }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ padding:'14px 16px', display:'flex', gap:'8px' }}>
                  <button style={{ flex:1, height:'42px', background:'#111827', color:'#fff', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    IP 영구 차단
                  </button>
                  <button style={{ flex:1, height:'42px', background:'#F3F4F6', color:'#6B7280', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    무시
                  </button>
                </div>
              </div>

              {/* 최근 접근 IP */}
              <div style={{ fontSize:'11px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'9px' }}>최근 접근 IP</div>
              <div style={{ background:'#fff', borderRadius:'18px', overflow:'hidden', border:'1px solid #EAECF0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                {[
                  { ip:'192.168.1.1',  location:'서울, 한국',      time:'방금',     safe:true  },
                  { ip:'192.168.1.10', location:'서울, 한국',       time:'1시간 전', safe:true  },
                  { ip:'123.45.67.89', location:'캘리포니아, 미국', time:'2일 전',   safe:false },
                ].map((rec, i, arr) => (
                  <div key={i} style={{ padding:'13px 16px', borderBottom: i < arr.length-1 ? '1px solid #F0F1F3' : 'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:'12px', fontWeight:600, color:'#111827' }}>{rec.ip}</div>
                      <div style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'2px' }}>{rec.location} · {rec.time}</div>
                    </div>
                    <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 9px', borderRadius:'6px', background: rec.safe ? '#E6F6EF' : '#FEE9E9', color: rec.safe ? '#0D7750' : '#C0392B' }}>
                      {rec.safe ? '정상' : '차단됨'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
export default function AdminManagementBiz() {
  const [view, setView]       = useState('main')
  const [members, setMembers] = useState(DEMO_MEMBERS)

  const renderView = () => {
    switch (view) {
      case 'members': return <MembersView members={members} setMembers={setMembers} onBack={() => setView('main')} onInvite={() => setView('invite')} />
      case 'company': return <CompanySettingsView onBack={() => setView('main')} />
      case 'security':return <SecurityView onBack={() => setView('main')} />
      case 'invite':  return <InviteView   onBack={() => setView('members')} />
      default:        return <MainHub members={members} onNav={v => setView(v)} />
    }
  }

  return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto', background:COLORS.bg }}>
        {renderView()}
      </div>
    </PhoneShell>
  )
}
