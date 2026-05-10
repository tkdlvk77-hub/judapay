import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'

// ═══════════════════════════════════════════════════════════
// ── 상수
// ═══════════════════════════════════════════════════════════
const ROLES = {
  master:     { id:'master',     label:'대표',      icon:'👑', color:'#7C3AED', bg:'#EDE9FE', desc:'모든 권한' },
  admin:      { id:'admin',      label:'관리자',    icon:'🛠️', color:'#1D4ED8', bg:'#DBEAFE', desc:'집행·카드·승인 가능' },
  accounting: { id:'accounting', label:'회계',      icon:'💼', color:'#059669', bg:'#D1FAE5', desc:'증빙 조회·다운로드' },
  manager:    { id:'manager',    label:'팀장',      icon:'📋', color:'#0891B2', bg:'#CFFAFE', desc:'팀 집행 요청·1차 확인' },
  staff:      { id:'staff',      label:'일반직원',  icon:'✏️', color:'#6B7280', bg:'#F3F4F6', desc:'집행 요청만 가능' },
  viewer:     { id:'viewer',     label:'조회전용',  icon:'👁️', color:'#9CA3AF', bg:'#F9FAFB', desc:'보기만 가능' },
}

const MEMBER_STATUS = {
  active:   { label:'재직중',    color:'#059669', bg:'#D1FAE5' },
  invited:  { label:'초대 대기', color:'#D97706', bg:'#FEF3C7' },
  inactive: { label:'비활성',    color:'#6B7280', bg:'#F3F4F6' },
  resigned: { label:'퇴사',      color:'#DC2626', bg:'#FEE2E2' },
}

const DEPT_LIST = ['경영지원', '개발팀', '마케팅', '영업팀', '디자인', '재무', '기타']

const APPROVAL_MODES = [
  { id:'none',      label:'승인 없음',        sub:'바로 집행 가능',                   icon:'⚡' },
  { id:'single',    label:'1단계 승인',        sub:'관리자 또는 대표 1명 승인',        icon:'✅' },
  { id:'double',    label:'2단계 승인',        sub:'1차 팀장 → 2차 대표 순서 승인',   icon:'✅✅' },
  { id:'threshold', label:'금액 초과시 승인',  sub:'한도 이하 즉시·초과 시 승인 요청', icon:'💰' },
]

const DEMO_MEMBERS = [
  { id:'m1', name:'이대표',  role:'master',     status:'active',  dept:'경영지원', position:'대표이사', phone:'010-1234-5678', email:'ceo@company.com',   monthlyUsed:0,        cardIssued:true,  cardActive:true,  approvalMode:'none',      monthlyLimit:null,    singleLimit:null,    joinDate:'2026.01.01' },
  { id:'m2', name:'김관리',  role:'admin',      status:'active',  dept:'경영지원', position:'팀장',     phone:'010-2345-6789', email:'admin@company.com', monthlyUsed:1240000,  cardIssued:true,  cardActive:true,  approvalMode:'threshold', monthlyLimit:3000000, singleLimit:500000,  joinDate:'2026.02.15' },
  { id:'m3', name:'박팀장',  role:'manager',    status:'active',  dept:'개발팀',   position:'개발팀장', phone:'010-3456-7890', email:'mgr@company.com',   monthlyUsed:680000,   cardIssued:true,  cardActive:true,  approvalMode:'single',    monthlyLimit:2000000, singleLimit:300000,  joinDate:'2026.02.20' },
  { id:'m4', name:'최직원',  role:'staff',      status:'active',  dept:'마케팅',   position:'마케터',   phone:'010-4567-8901', email:'staff@company.com', monthlyUsed:320000,   cardIssued:false, cardActive:false, approvalMode:'single',    monthlyLimit:500000,  singleLimit:100000,  joinDate:'2026.03.01' },
  { id:'m5', name:'정세무',  role:'accounting', status:'active',  dept:'재무',     position:'세무사',   phone:'010-5678-9012', email:'tax@company.com',   monthlyUsed:0,        cardIssued:false, cardActive:false, approvalMode:'none',      monthlyLimit:null,    singleLimit:null,    joinDate:'2026.03.10' },
  { id:'m6', name:'한신입',  role:'staff',      status:'invited', dept:'마케팅',   position:'인턴',     phone:'010-6789-0123', email:'new@company.com',   monthlyUsed:0,        cardIssued:false, cardActive:false, approvalMode:'single',    monthlyLimit:200000,  singleLimit:50000,   joinDate:'-' },
]

const DEMO_EXEC_HISTORY = [
  { id:'e1', date:'2026.05.09', name:'AWS 서버비',        amount:480000,  status:'완료',    type:'자동' },
  { id:'e2', date:'2026.05.08', name:'복지몰 결제',       amount:85000,   status:'승인대기', type:'요청' },
  { id:'e3', date:'2026.05.07', name:'사무용품 구매',     amount:124000,  status:'완료',    type:'요청' },
  { id:'e4', date:'2026.05.06', name:'ChatGPT 구독',      amount:160000,  status:'완료',    type:'자동' },
  { id:'e5', date:'2026.05.05', name:'외주 디자인비',     amount:550000,  status:'실패',    type:'요청' },
]

const DEMO_AUDIT_LOGS = [
  { id:'a1', date:'2026.05.09 14:32', actor:'김관리',  action:'권한 변경',    target:'한신입 → 일반직원', ip:'192.168.1.10' },
  { id:'a2', date:'2026.05.09 11:15', actor:'이대표',  action:'카드 정지',    target:'최직원 카드',        ip:'192.168.1.1' },
  { id:'a3', date:'2026.05.08 16:44', actor:'박팀장',  action:'집행 승인',    target:'사무용품 124,000원', ip:'192.168.1.22' },
  { id:'a4', date:'2026.05.08 09:30', actor:'정세무',  action:'증빙 다운로드',target:'4월 세금계산서 전체', ip:'192.168.1.33' },
  { id:'a5', date:'2026.05.07 17:00', actor:'시스템',  action:'이상 접근 탐지',target:'미인증 IP 로그인 시도', ip:'123.45.67.89' },
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

function SecLabel({ label, color }) {
  const theme = getAccountTheme()
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'6px', marginBottom:'10px' }}>
      <div style={{ width:'3px', height:'14px', borderRadius:'2px', background: color || theme.brand }}/>
      <span style={{ fontSize:'11px', fontWeight:700, color: color || theme.brandDark, letterSpacing:'0.6px', textTransform:'uppercase' }}>{label}</span>
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

function Row({ label, value, accent }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:`1px solid ${COLORS.borderSoft}` }}>
      <span style={{ fontSize:'13px', color:COLORS.t3 }}>{label}</span>
      <span style={{ fontSize:'13px', fontWeight:600, color: accent || COLORS.t1 }}>{value}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 1. 메인 허브
// ═══════════════════════════════════════════════════════════
function MainHub({ members, onNav }) {
  const theme = getAccountTheme()
  const navigate = useNavigate()
  const active  = members.filter(m => m.status === 'active').length
  const invited = members.filter(m => m.status === 'invited').length
  const pending = DEMO_EXEC_HISTORY.filter(e => e.status === '승인대기').length
  const failed  = DEMO_EXEC_HISTORY.filter(e => e.status === '실패').length

  const modules = [
    { id:'members',   icon:'👥', label:'구성원 관리',  sub:`재직 ${active}명 · 초대 ${invited}명`, color:'#1D4ED8', bg:'#DBEAFE', badge: invited > 0 ? invited : null },
    { id:'cards',     icon:'💳', label:'카드 관리',     sub:'발급·정지·한도·영수증',               color:'#7C3AED', bg:'#EDE9FE' },
    { id:'execution', icon:'💸', label:'집행 관리',     sub:'내역·자동·예약·승인·한도',             color:'#059669', bg:'#D1FAE5', badge: pending + failed > 0 ? pending + failed : null, badgeColor:'#DC2626' },
    { id:'company',   icon:'🏢', label:'기업 설정',     sub:'회사정보·계좌·API',                   color:'#D97706', bg:'#FEF3C7' },
    { id:'security',  icon:'🔒', label:'보안 및 감사',  sub:'활동로그·이상탐지·세션',              color:'#DC2626', bg:'#FEE2E2', badge: 1, badgeColor:'#DC2626' },
  ]

  return (
    <>
      <div style={{ background:theme.headerGrad, paddingTop:'20px', paddingBottom:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'4px 16px 14px' }}>
          <button onClick={() => navigate(-1)} style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'19px', fontWeight:700, color:'#fff', letterSpacing:'-0.4px' }}>관리자</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.65)', marginTop:'2px' }}>구성원·카드·집행·보안 통합 관리</div>
          </div>
          <button onClick={() => onNav('invite')}
            style={{ padding:'6px 13px', background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.35)', borderRadius:'20px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'4px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            직원 초대
          </button>
        </div>
        <div style={{ display:'flex', gap:'8px', padding:'0 16px' }}>
          {[
            { label:'전체 구성원', value:`${members.length}명` },
            { label:'승인 대기',   value:`${pending}건`,   color: pending > 0 ? '#FCD34D' : '#fff' },
            { label:'지급 실패',   value:`${failed}건`,    color: failed  > 0 ? '#FCA5A5' : '#fff' },
          ].map(s => (
            <div key={s.label} style={{ flex:1, background:'rgba(255,255,255,0.12)', borderRadius:'12px', padding:'10px 12px', textAlign:'center' }}>
              <div style={{ fontSize:'16px', fontWeight:800, color: s.color || '#fff' }}>{s.value}</div>
              <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.65)', marginTop:'2px', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'16px 16px 36px' }}>
        {/* 긴급 배너 */}
        {(pending > 0 || failed > 0) && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'14px', padding:'12px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ fontSize:'22px', flexShrink:0 }}>🚨</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#B91C1C', marginBottom:'1px' }}>처리 필요 {pending + failed}건</div>
              <div style={{ fontSize:'11px', color:'#DC2626' }}>
                {pending > 0 && `승인 대기 ${pending}건`}
                {pending > 0 && failed > 0 && ' · '}
                {failed > 0 && `지급 실패 ${failed}건`}
              </div>
            </div>
            <button onClick={() => onNav('execution')}
              style={{ padding:'6px 12px', background:'#DC2626', color:'#fff', border:'none', borderRadius:'10px', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              확인
            </button>
          </div>
        )}

        {/* 5개 모듈 — 2열 + 마지막 1열 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          {modules.map((mod, i) => (
            <button key={mod.id} onClick={() => onNav(mod.id)}
              style={{ background:COLORS.bgCard, border:`1px solid ${COLORS.borderSoft}`, borderRadius:'16px', padding:'16px 14px', cursor:'pointer', fontFamily:'inherit', textAlign:'left', boxShadow:SHADOWS.card, display:'flex', flexDirection:'column', gap:'8px', position:'relative', gridColumn: modules.length % 2 !== 0 && i === modules.length - 1 ? 'span 2' : 'span 1' }}>
              {mod.badge && (
                <div style={{ position:'absolute', top:'12px', right:'12px', width:'18px', height:'18px', borderRadius:'50%', background: mod.badgeColor || '#DC2626', color:'#fff', fontSize:'10px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {mod.badge}
                </div>
              )}
              <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:mod.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>{mod.icon}</div>
              <div>
                <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1, marginBottom:'2px' }}>{mod.label}</div>
                <div style={{ fontSize:'10px', color:COLORS.t4, lineHeight:1.4 }}>{mod.sub}</div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={mod.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 2. 구성원 관리
// ═══════════════════════════════════════════════════════════
function MembersView({ members, setMembers, onBack, onInvite }) {
  const theme = getAccountTheme()
  const [filter, setFilter]           = useState('all')
  const [selectedMember, setSelected] = useState(null)
  const [showResignConfirm, setShowResignConfirm] = useState(false)
  const [editMember, setEditMember]   = useState(null)

  if (editMember) return (
    <MemberDetailView member={editMember} onBack={() => setEditMember(null)}
      onSave={updated => { setMembers(ms => ms.map(m => m.id === updated.id ? updated : m)); setEditMember(null) }}
      onResign={id => { setMembers(ms => ms.map(m => m.id === id ? { ...m, status:'resigned', cardActive:false, approvalMode:'none' } : m)); setEditMember(null) }}
    />
  )

  const filters = [{ id:'all', label:'전체' }, { id:'active', label:'재직중' }, { id:'invited', label:'초대중' }]
  const filtered = filter === 'all' ? members : members.filter(m => m.status === filter)

  return (
    <>
      <Header onBack={onBack} title="구성원 관리" sub={`총 ${members.length}명`}
        right={
          <button onClick={onInvite}
            style={{ padding:'6px 13px', background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.35)', borderRadius:'20px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'4px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            초대
          </button>
        }
      />
      <div style={{ padding:'16px 16px 36px' }}>
        <div style={{ display:'flex', background:COLORS.bgMuted, borderRadius:'12px', padding:'3px', gap:'2px', marginBottom:'16px' }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ flex:1, padding:'9px 4px', borderRadius:'10px', cursor:'pointer', fontFamily:'inherit', border:'none', fontSize:'12px', fontWeight:700, transition:'all 0.15s', background: filter === f.id ? '#fff' : 'transparent', color: filter === f.id ? theme.brand : COLORS.t4, boxShadow: filter === f.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none' }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {filtered.map(m => {
            const isMaster = m.role === 'master'
            return (
              <button key={m.id} onClick={() => !isMaster && setEditMember(m)}
                style={{ width:'100%', background:COLORS.bgCard, boxShadow:SHADOWS.card, border:`1px solid ${COLORS.borderSoft}`, borderRadius:'14px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px', cursor: isMaster ? 'default' : 'pointer', fontFamily:'inherit', textAlign:'left' }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:ROLES[m.role].bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:700, color:ROLES[m.role].color, flexShrink:0 }}>
                  {m.name[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'14px', fontWeight:700, color:COLORS.t1 }}>{m.name}</span>
                    <RoleBadge role={m.role} />
                    <StatusBadge status={m.status} />
                  </div>
                  <div style={{ fontSize:'11px', color:COLORS.t3, marginBottom:'2px' }}>{m.dept} · {m.position}</div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    {m.cardIssued && <span style={{ fontSize:'10px', color: m.cardActive ? '#059669' : '#DC2626', fontWeight:600 }}>💳 카드 {m.cardActive ? '활성' : '정지'}</span>}
                    {m.monthlyUsed > 0 && <span style={{ fontSize:'10px', color:COLORS.t4 }}>이달 {fmt(m.monthlyUsed)}원</span>}
                  </div>
                </div>
                {!isMaster && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

function MemberDetailView({ member, onBack, onSave, onResign }) {
  const theme = getAccountTheme()
  const [role, setRole]               = useState(member.role)
  const [dept, setDept]               = useState(member.dept)
  const [position, setPosition]       = useState(member.position)
  const [approvalMode, setApprovalMode] = useState(member.approvalMode)
  const [monthlyLimit, setMonthlyLimit] = useState(member.monthlyLimit ? String(member.monthlyLimit) : '')
  const [singleLimit, setSingleLimit]   = useState(member.singleLimit ? String(member.singleLimit) : '')
  const [cardActive, setCardActive]     = useState(member.cardActive)
  const [showResign, setShowResign]     = useState(false)

  return (
    <>
      <Header onBack={onBack} title={member.name} sub={`${ROLES[member.role].label} · ${member.dept}`}
        right={member.role !== 'master' && (
          <button onClick={() => setShowResign(true)}
            style={{ padding:'6px 12px', background:'rgba(239,68,68,0.15)', color:'#FCA5A5', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'20px', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            퇴사 처리
          </button>
        )}
      />
      <div style={{ padding:'16px 16px 100px' }}>

        {/* 프로필 */}
        <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, padding:'16px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'50px', height:'50px', borderRadius:'50%', background:ROLES[member.role].bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:700, color:ROLES[member.role].color, flexShrink:0 }}>
            {member.name[0]}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'16px', fontWeight:700, color:COLORS.t1, marginBottom:'3px' }}>{member.name}</div>
            <div style={{ fontSize:'11px', color:COLORS.t3 }}>{member.email} · {member.phone}</div>
          </div>
          <StatusBadge status={member.status} />
        </div>

        {/* 이달 사용 */}
        {member.monthlyUsed > 0 && member.monthlyLimit && (
          <div style={{ background:`${theme.brand}08`, border:`1px solid ${theme.brand}20`, borderRadius:RADIUS.lg, padding:'14px 16px', marginBottom:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
              <span style={{ fontSize:'12px', color:COLORS.t4 }}>이달 사용</span>
              <span style={{ fontSize:'12px', color:COLORS.t4 }}>한도 {fmt(member.monthlyLimit)}원</span>
            </div>
            <div style={{ height:'6px', background:COLORS.bgMuted, borderRadius:'3px', marginBottom:'6px' }}>
              <div style={{ height:'100%', borderRadius:'3px', background: member.monthlyUsed/member.monthlyLimit > 0.8 ? '#DC2626' : theme.brand, width:`${Math.min(100, member.monthlyUsed/member.monthlyLimit*100)}%`, transition:'width 0.3s' }}/>
            </div>
            <div style={{ fontSize:'14px', fontWeight:800, color:theme.brand }}>{fmt(member.monthlyUsed)}원 <span style={{ fontSize:'11px', fontWeight:400, color:COLORS.t4 }}>사용 ({Math.round(member.monthlyUsed/member.monthlyLimit*100)}%)</span></div>
          </div>
        )}

        {/* 부서/직책 */}
        <SecLabel label="부서 및 직책" />
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'10px' }}>
          {DEPT_LIST.map(d => (
            <button key={d} onClick={() => setDept(d)}
              style={{ padding:'6px 13px', borderRadius:'20px', border:`1.5px solid ${dept===d ? theme.brand : COLORS.borderSoft}`, background: dept===d ? theme.brand : '#fff', color: dept===d ? '#fff' : COLORS.t3, fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
              {d}
            </button>
          ))}
        </div>
        <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, padding:'12px 14px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'12px', color:COLORS.t3, fontWeight:600, whiteSpace:'nowrap' }}>직책</span>
          <input value={position} onChange={e => setPosition(e.target.value)} placeholder="직책 입력"
            style={{ flex:1, fontSize:'14px', fontWeight:600, color:COLORS.t1, background:'transparent', border:'none', outline:'none', fontFamily:'inherit' }}/>
        </div>

        {/* 역할 */}
        <SecLabel label="권한 (역할)" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px', marginBottom:'20px' }}>
          {['admin','accounting','manager','staff','viewer'].map(rid => {
            const info = ROLES[rid]
            const active = role === rid
            return (
              <button key={rid} onClick={() => setRole(rid)}
                style={{ background: active ? info.bg : COLORS.bgCard, border:`2px solid ${active ? info.color : COLORS.borderSoft}`, borderRadius:'12px', padding:'12px', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s', boxShadow: active ? `0 2px 10px ${info.color}25` : SHADOWS.card }}>
                <div style={{ fontSize:'18px', marginBottom:'5px' }}>{info.icon}</div>
                <div style={{ fontSize:'12px', fontWeight:700, color: active ? info.color : COLORS.t1 }}>{info.label}</div>
                <div style={{ fontSize:'9px', color:COLORS.t4, marginTop:'2px', lineHeight:1.4 }}>{info.desc}</div>
              </button>
            )
          })}
        </div>

        {/* 승인 방식 */}
        <SecLabel label="집행 승인 방식" />
        <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'20px' }}>
          {APPROVAL_MODES.map(m => {
            const active = approvalMode === m.id
            return (
              <button key={m.id} onClick={() => setApprovalMode(m.id)}
                style={{ width:'100%', background: active ? `${theme.brand}08` : COLORS.bgCard, border:`1.5px solid ${active ? theme.brand : COLORS.borderSoft}`, borderRadius:'12px', padding:'11px 14px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s', boxShadow:SHADOWS.card }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%', border: active ? `7px solid ${theme.brand}` : `2px solid ${COLORS.t5}`, background:COLORS.bgCard, flexShrink:0, transition:'all .15s' }}/>
                <span style={{ fontSize:'18px', flexShrink:0 }}>{m.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color: active ? theme.brand : COLORS.t1, marginBottom:'1px' }}>{m.label}</div>
                  <div style={{ fontSize:'10px', color:COLORS.t4 }}>{m.sub}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 집행 한도 */}
        {(role === 'staff' || role === 'admin' || role === 'manager') && (
          <>
            <SecLabel label="집행 한도" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'20px' }}>
              {[
                { label:'월 한도',  val:monthlyLimit, set:setMonthlyLimit },
                { label:'1회 한도', val:singleLimit,  set:setSingleLimit  },
              ].map(f => (
                <div key={f.label} style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, padding:'12px 14px', overflow:'hidden', minWidth:0 }}>
                  <div style={{ fontSize:'10px', color:COLORS.t4, fontWeight:600, marginBottom:'5px' }}>{f.label}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                    <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder="없음"
                      style={{ width:0, flex:1, fontSize:'15px', fontWeight:700, color:COLORS.t1, background:'transparent', border:'none', outline:'none', fontFamily:'inherit' }}/>
                    <span style={{ fontSize:'11px', color:COLORS.t3, fontWeight:600, flexShrink:0 }}>원</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 카드 */}
        <SecLabel label="법인카드" />
        <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, padding:'14px 16px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ fontSize:'24px' }}>💳</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1, marginBottom:'2px' }}>{member.cardIssued ? '카드 발급됨' : '카드 미발급'}</div>
            <div style={{ fontSize:'10px', color:COLORS.t4 }}>{member.cardIssued ? (cardActive ? '사용 가능' : '정지 상태') : '발급 신청 가능'}</div>
          </div>
          {member.cardIssued
            ? <Toggle on={cardActive} onChange={() => setCardActive(!cardActive)} brand={theme.brand} />
            : <button style={{ padding:'6px 12px', background:theme.brand, color:'#fff', border:'none', borderRadius:'10px', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>발급 신청</button>
          }
        </div>
      </div>

      <div style={{ position:'sticky', bottom:0, padding:'12px 16px 24px', background:COLORS.bgCard, borderTop:`1px solid ${COLORS.borderSoft}`, boxShadow:'0 -4px 16px rgba(0,0,0,0.06)' }}>
        <button onClick={() => onSave({ ...member, role, dept, position, approvalMode, monthlyLimit: monthlyLimit ? Number(monthlyLimit) : null, singleLimit: singleLimit ? Number(singleLimit) : null, cardActive })}
          style={{ width:'100%', height:'50px', background:theme.activeBtnGrad, color:'#fff', border:'none', borderRadius:RADIUS.md, fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:theme.activeShadow }}>
          저장
        </button>
      </div>

      {showResign && (
        <div onClick={() => setShowResign(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:'320px', background:'#fff', borderRadius:RADIUS.lg, padding:'24px 20px' }}>
            <div style={{ fontSize:'24px', textAlign:'center', marginBottom:'10px' }}>⚠️</div>
            <div style={{ fontSize:'16px', fontWeight:700, color:COLORS.t1, marginBottom:'8px', textAlign:'center' }}>{member.name} 퇴사 처리</div>
            <div style={{ fontSize:'12px', color:COLORS.t3, lineHeight:1.7, marginBottom:'16px', background:'#FEF2F2', borderRadius:'10px', padding:'12px' }}>
              즉시 실행 항목<br/>
              🚫 로그인 즉시 차단<br/>
              💳 법인카드 즉시 정지<br/>
              ✅ 승인 권한 제거<br/>
              💰 자금 요청 제한
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => setShowResign(false)} style={{ flex:1, height:'44px', background:COLORS.bgMuted, color:COLORS.t2, border:'none', borderRadius:RADIUS.md, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>취소</button>
              <button onClick={() => onResign(member.id)} style={{ flex:1, height:'44px', background:'#DC2626', color:'#fff', border:'none', borderRadius:RADIUS.md, fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>퇴사 처리</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 3. 카드 관리
// ═══════════════════════════════════════════════════════════
function CardsView({ members, onBack }) {
  const theme = getAccountTheme()
  const [expandedId, setExpandedId] = useState(null)
  const [cards, setCards] = useState(
    members.filter(m => m.cardIssued).map(m => ({
      memberId:m.id, name:m.name, role:m.role, dept:m.dept,
      active:m.cardActive, blockOverseas:false, blockOnline:false,
      monthlyLimit: m.monthlyLimit ? String(m.monthlyLimit) : '',
      receiptRequired: true,
    }))
  )

  const DEMO_CARD_USAGE = [
    { name:'이대표',  date:'2026.05.09', merchant:'강남 식당',       amount:45000,  receipt:true  },
    { name:'김관리',  date:'2026.05.09', merchant:'GS25 편의점',     amount:8900,   receipt:false },
    { name:'박팀장',  date:'2026.05.08', merchant:'쿠팡 비즈',       amount:124000, receipt:true  },
    { name:'김관리',  date:'2026.05.07', merchant:'Adobe 구독',      amount:66000,  receipt:true  },
    { name:'박팀장',  date:'2026.05.06', merchant:'주유소 SK에너지', amount:87000,  receipt:false },
  ]

  const updateCard = (id, field, val) => setCards(cs => cs.map(c => c.memberId === id ? { ...c, [field]: val } : c))
  const noReceiptCount = DEMO_CARD_USAGE.filter(u => !u.receipt).length

  return (
    <>
      <Header onBack={onBack} title="카드 관리" sub={`발급 ${cards.length}명`} />
      <div style={{ padding:'16px 16px 36px' }}>

        {/* 영수증 미제출 배너 */}
        {noReceiptCount > 0 && (
          <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:RADIUS.lg, padding:'12px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ fontSize:'20px' }}>🧾</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#92400E', marginBottom:'1px' }}>영수증 미제출 {noReceiptCount}건</div>
              <div style={{ fontSize:'11px', color:'#B45309' }}>7일 이내 미제출 시 카드 자동 정지</div>
            </div>
          </div>
        )}

        {/* 카드 목록 */}
        <SecLabel label="카드 발급 현황" />
        <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' }}>
          {cards.map(card => {
            const r = ROLES[card.role]
            const isExpanded = expandedId === card.memberId
            return (
              <div key={card.memberId} style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:'14px', overflow:'hidden', border:`1.5px solid ${isExpanded ? theme.brand : COLORS.borderSoft}` }}>
                <div onClick={() => setExpandedId(isExpanded ? null : card.memberId)}
                  style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer' }}>
                  <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:r.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:700, color:r.color, flexShrink:0 }}>
                    {card.name[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'14px', fontWeight:700, color:COLORS.t1, marginBottom:'3px' }}>{card.name}</div>
                    <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                      <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'8px', background: card.active ? '#D1FAE5' : '#FEE2E2', color: card.active ? '#059669' : '#DC2626' }}>
                        {card.active ? '활성' : '정지'}
                      </span>
                      {card.blockOverseas && <span style={{ fontSize:'10px', color:COLORS.t4 }}>해외차단</span>}
                      {card.blockOnline && <span style={{ fontSize:'10px', color:COLORS.t4 }}>온라인차단</span>}
                    </div>
                  </div>
                  <Toggle on={card.active} onChange={e => { e.stopPropagation(); updateCard(card.memberId, 'active', !card.active) }} brand={theme.brand} />
                </div>
                {isExpanded && (
                  <div style={{ padding:'0 16px 16px', borderTop:`1px solid ${COLORS.borderSoft}`, display:'flex', flexDirection:'column', gap:'12px' }}>
                    {[
                      { field:'blockOverseas', label:'해외 사용 차단',   sub:'해외 가맹점 결제 불가' },
                      { field:'blockOnline',   label:'온라인 결제 차단', sub:'인터넷·앱 결제 불가'  },
                      { field:'receiptRequired',label:'영수증 제출 필수', sub:'미제출 시 알림 발송'  },
                    ].map(opt => (
                      <div key={opt.field} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'12px' }}>
                        <div>
                          <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1 }}>{opt.label}</div>
                          <div style={{ fontSize:'10px', color:COLORS.t4 }}>{opt.sub}</div>
                        </div>
                        <Toggle on={card[opt.field]} onChange={() => updateCard(card.memberId, opt.field, !card[opt.field])} brand={opt.field === 'receiptRequired' ? theme.brand : '#DC2626'} />
                      </div>
                    ))}
                    <div style={{ paddingTop:'12px', borderTop:`1px solid ${COLORS.borderSoft}` }}>
                      <div style={{ fontSize:'11px', fontWeight:700, color:COLORS.t3, marginBottom:'8px' }}>월 한도</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', background:COLORS.bgMuted, borderRadius:'10px', padding:'10px 12px' }}>
                        <input type="number" value={card.monthlyLimit} onChange={e => updateCard(card.memberId, 'monthlyLimit', e.target.value)} placeholder="한도 없음"
                          style={{ flex:1, fontSize:'15px', fontWeight:700, color:COLORS.t1, background:'transparent', border:'none', outline:'none', fontFamily:'inherit' }}/>
                        <span style={{ fontSize:'12px', color:COLORS.t3, fontWeight:600 }}>원 / 월</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* 미발급 */}
          {members.filter(m => !m.cardIssued && m.status === 'active').map(m => (
            <div key={m.id} style={{ background:COLORS.bgCard, border:`1px solid ${COLORS.borderSoft}`, borderRadius:'12px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px', opacity:0.7 }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:COLORS.bgMuted, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:COLORS.t3, flexShrink:0 }}>{m.name[0]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t2 }}>{m.name}</div>
                <div style={{ fontSize:'10px', color:COLORS.t4 }}>카드 미발급</div>
              </div>
              <button style={{ padding:'6px 12px', background:theme.brand, color:'#fff', border:'none', borderRadius:'9px', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>발급</button>
            </div>
          ))}
        </div>

        {/* 최근 사용내역 */}
        <SecLabel label="최근 카드 사용내역" />
        <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, overflow:'hidden' }}>
          {DEMO_CARD_USAGE.map((u, i, arr) => (
            <div key={i} style={{ padding:'12px 16px', borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1, marginBottom:'2px' }}>{u.merchant}</div>
                <div style={{ fontSize:'10px', color:COLORS.t4 }}>{u.name} · {u.date}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1 }}>{fmt(u.amount)}원</div>
                <div style={{ fontSize:'10px', fontWeight:600, color: u.receipt ? '#059669' : '#DC2626' }}>
                  {u.receipt ? '🧾 제출됨' : '⚠️ 미제출'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 4. 집행 관리
// ═══════════════════════════════════════════════════════════
function ExecutionView({ members, onBack }) {
  const theme = getAccountTheme()
  const [tab, setTab] = useState('history')
  const [companyApprovalMode, setCompanyApprovalMode] = useState('double')
  const [threshold, setThreshold] = useState('500000')
  const [execLimit, setExecLimit] = useState('10000000')

  const tabs = [
    { id:'history',  label:'내역' },
    { id:'auto',     label:'자동지급' },
    { id:'approval', label:'승인 설정' },
  ]

  const STATUS_STYLE = {
    '완료':     { bg:'#D1FAE5', color:'#059669' },
    '승인대기': { bg:'#FEF3C7', color:'#D97706' },
    '실패':     { bg:'#FEE2E2', color:'#DC2626' },
    '예약':     { bg:'#DBEAFE', color:'#1D4ED8' },
  }

  const DEMO_AUTO = [
    { name:'AWS 서버비',   amount:480000,  day:'1일', next:'2026.06.01', icon:'☁️' },
    { name:'ChatGPT Team', amount:160000,  day:'15일', next:'2026.06.15', icon:'🤖' },
    { name:'임대료',       amount:1200000, day:'25일', next:'2026.06.25', icon:'🏢' },
  ]

  const approverCandidates = members.filter(m => ['master','admin','manager'].includes(m.role) && m.status === 'active')

  return (
    <>
      <Header onBack={onBack} title="집행 관리" sub="내역·자동·승인·한도" />
      <div style={{ padding:'0 0 36px' }}>
        <div style={{ display:'flex', background:COLORS.bgMuted, borderRadius:'12px', padding:'3px', gap:'2px', margin:'16px 16px 0' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, padding:'9px 4px', borderRadius:'10px', cursor:'pointer', fontFamily:'inherit', border:'none', fontSize:'12px', fontWeight:700, transition:'all 0.15s', background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? theme.brand : COLORS.t4, boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding:'16px' }}>
          {/* 내역 탭 */}
          {tab === 'history' && (
            <>
              <SecLabel label="집행 내역" />
              <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, overflow:'hidden', marginBottom:'16px' }}>
                {DEMO_EXEC_HISTORY.map((e, i, arr) => (
                  <div key={e.id} style={{ padding:'13px 16px', borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1, marginBottom:'2px' }}>{e.name}</div>
                      <div style={{ fontSize:'10px', color:COLORS.t4 }}>{e.date} · {e.type}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1, marginBottom:'3px' }}>{fmt(e.amount)}원</div>
                      <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'8px', ...(STATUS_STYLE[e.status] || {}) }}>
                        {e.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {DEMO_EXEC_HISTORY.filter(e => e.status === '실패').length > 0 && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:RADIUS.lg, padding:'12px 16px', display:'flex', gap:'10px', alignItems:'center' }}>
                  <div style={{ fontSize:'18px' }}>⚠️</div>
                  <div>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#B91C1C', marginBottom:'2px' }}>지급 실패 건 있음</div>
                    <div style={{ fontSize:'11px', color:'#DC2626' }}>외주 디자인비 550,000원 — 계좌 정보 불일치</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 자동지급 탭 */}
          {tab === 'auto' && (
            <>
              <SecLabel label="자동 지급 등록 현황" />
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
                {DEMO_AUTO.map(a => (
                  <div key={a.name} style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:'14px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>{a.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1, marginBottom:'2px' }}>{a.name}</div>
                      <div style={{ fontSize:'10px', color:COLORS.t4 }}>매월 {a.day} · 다음 {a.next}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:'14px', fontWeight:800, color:theme.brand }}>{fmt(a.amount)}원</div>
                    </div>
                  </div>
                ))}
              </div>
              <button style={{ width:'100%', height:'48px', background:`${theme.brand}10`, color:theme.brand, border:`1.5px dashed ${theme.brand}50`, borderRadius:RADIUS.lg, fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                자동 지급 추가
              </button>
            </>
          )}

          {/* 승인 설정 탭 */}
          {tab === 'approval' && (
            <>
              <SecLabel label="기본 승인 방식" />
              <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'16px' }}>
                {APPROVAL_MODES.map(m => {
                  const active = companyApprovalMode === m.id
                  return (
                    <button key={m.id} onClick={() => setCompanyApprovalMode(m.id)}
                      style={{ width:'100%', background: active ? `${theme.brand}08` : COLORS.bgCard, border:`1.5px solid ${active ? theme.brand : COLORS.borderSoft}`, borderRadius:'12px', padding:'11px 14px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s', boxShadow:SHADOWS.card }}>
                      <div style={{ width:'20px', height:'20px', borderRadius:'50%', border: active ? `7px solid ${theme.brand}` : `2px solid ${COLORS.t5}`, background:COLORS.bgCard, flexShrink:0, transition:'all .15s' }}/>
                      <span style={{ fontSize:'18px', flexShrink:0 }}>{m.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'12px', fontWeight:700, color: active ? theme.brand : COLORS.t1, marginBottom:'1px' }}>{m.label}</div>
                        <div style={{ fontSize:'10px', color:COLORS.t4 }}>{m.sub}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {companyApprovalMode === 'threshold' && (
                <>
                  <SecLabel label="즉시 집행 한도" />
                  <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, padding:'14px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
                    <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)}
                      style={{ flex:1, fontSize:'20px', fontWeight:800, color:theme.brand, background:'transparent', border:'none', outline:'none', fontFamily:'inherit' }}/>
                    <span style={{ fontSize:'14px', color:COLORS.t3, fontWeight:600 }}>원 이하 즉시</span>
                  </div>
                </>
              )}

              {companyApprovalMode !== 'none' && (
                <>
                  <SecLabel label="승인자" />
                  <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, overflow:'hidden', marginBottom:'16px' }}>
                    {approverCandidates.map((m, i, arr) => (
                      <div key={m.id} style={{ padding:'12px 16px', borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:ROLES[m.role].bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:ROLES[m.role].color, flexShrink:0 }}>{m.name[0]}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1 }}>{m.name}</div>
                          <div style={{ fontSize:'10px', color:COLORS.t4 }}>{ROLES[m.role].label}</div>
                        </div>
                        <RoleBadge role={m.role} />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <SecLabel label="전체 집행 한도" />
              <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, padding:'14px 16px', marginBottom:'6px', display:'flex', alignItems:'center', gap:'10px' }}>
                <input type="number" value={execLimit} onChange={e => setExecLimit(e.target.value)}
                  style={{ flex:1, fontSize:'18px', fontWeight:800, color:COLORS.t1, background:'transparent', border:'none', outline:'none', fontFamily:'inherit' }}/>
                <span style={{ fontSize:'14px', color:COLORS.t3, fontWeight:600 }}>원 / 월</span>
              </div>
              <div style={{ fontSize:'10px', color:COLORS.t4, padding:'0 4px', marginBottom:'16px' }}>
                회사 전체 월 집행 한도 — 초과 시 대표 승인 필요
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 5. 기업 설정
// ═══════════════════════════════════════════════════════════
function CompanySettingsView({ onBack }) {
  const theme = getAccountTheme()
  const [twoFactor, setTwoFactor] = useState(true)

  const sections = [
    {
      label:'기업 정보',
      items:[
        { label:'회사명',    value:'㈜주다컴퍼니',         arrow:true },
        { label:'사업자번호', value:'123-45-67890',         arrow:true },
        { label:'업종',      value:'소프트웨어 개발',       arrow:true },
        { label:'담당자',    value:'이대표 · 010-1234-5678', arrow:true },
      ],
    },
    {
      label:'법인계좌',
      items:[
        { label:'연결 계좌',  value:'신한은행 110-XXX-123456', arrow:true },
        { label:'잔액',      value:fmt(128500000)+'원',       arrow:false },
      ],
    },
    {
      label:'API 연동',
      items:[
        { label:'API 키',       value:'sk-juda-*****abc',  arrow:true },
        { label:'Webhook URL',  value:'미설정',            arrow:true },
        { label:'세무사 연동',  value:'kim@samil.com 연동중', arrow:true },
      ],
    },
  ]

  return (
    <>
      <Header onBack={onBack} title="기업 설정" sub="회사정보·계좌·보안·API" />
      <div style={{ padding:'16px 16px 36px' }}>
        {sections.map(sec => (
          <div key={sec.label} style={{ marginBottom:'20px' }}>
            <SecLabel label={sec.label} />
            <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, overflow:'hidden' }}>
              {sec.items.map((item, i, arr) => (
                <div key={item.label} style={{ padding:'13px 16px', borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', justifyContent:'space-between', cursor: item.arrow ? 'pointer' : 'default' }}>
                  <span style={{ fontSize:'13px', color:COLORS.t3 }}>{item.label}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <span style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1 }}>{item.value}</span>
                    {item.arrow && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 보안 설정 */}
        <SecLabel label="보안 설정" />
        <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, overflow:'hidden' }}>
          <div style={{ padding:'13px 16px', borderBottom:`1px solid ${COLORS.borderSoft}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1, marginBottom:'2px' }}>2차 인증 (OTP)</div>
              <div style={{ fontSize:'10px', color:COLORS.t4 }}>로그인·집행 시 추가 인증</div>
            </div>
            <Toggle on={twoFactor} onChange={() => setTwoFactor(!twoFactor)} brand={theme.brand} />
          </div>
          <div style={{ padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
            <div>
              <div style={{ fontSize:'13px', fontWeight:600, color:COLORS.t1, marginBottom:'2px' }}>감사 로그 조회</div>
              <div style={{ fontSize:'10px', color:COLORS.t4 }}>전체 활동 이력 확인</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 6. 보안 및 감사
// ═══════════════════════════════════════════════════════════
function SecurityView({ onBack }) {
  const theme = getAccountTheme()
  const [tab, setTab] = useState('activity')

  const ANOMALY = { id:'a5', date:'2026.05.07 17:00', actor:'미인증 IP', action:'이상 접근 탐지', detail:'해외 IP(123.45.67.89) 로그인 시도 3회 실패', risk:'high' }

  const ACTION_STYLE = {
    '권한 변경':    { bg:'#FEF3C7', color:'#D97706' },
    '카드 정지':    { bg:'#FEE2E2', color:'#DC2626' },
    '집행 승인':    { bg:'#D1FAE5', color:'#059669' },
    '증빙 다운로드':{ bg:'#DBEAFE', color:'#1D4ED8' },
    '이상 접근 탐지':{ bg:'#FEE2E2', color:'#DC2626' },
  }

  const DEMO_DEVICES = [
    { name:'iPhone 15 Pro',    os:'iOS 17',     last:'방금',         trusted:true  },
    { name:'MacBook Pro',      os:'macOS 14',   last:'1시간 전',     trusted:true  },
    { name:'Chrome on Windows',os:'Windows 11', last:'3일 전',       trusted:false },
  ]

  const tabs = [{ id:'activity', label:'활동 로그' }, { id:'device', label:'디바이스' }, { id:'anomaly', label:'이상탐지' }]

  return (
    <>
      <Header onBack={onBack} title="보안 및 감사" sub="활동로그·디바이스·이상탐지" />
      <div style={{ padding:'0 0 36px' }}>

        {/* 이상 탐지 경고 배너 */}
        <div style={{ margin:'16px 16px 0', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:RADIUS.lg, padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ fontSize:'20px' }}>🚨</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#B91C1C', marginBottom:'1px' }}>이상 접근 탐지</div>
            <div style={{ fontSize:'11px', color:'#DC2626' }}>해외 IP 로그인 시도 — 2026.05.07</div>
          </div>
          <button style={{ padding:'5px 10px', background:'#DC2626', color:'#fff', border:'none', borderRadius:'8px', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            조치
          </button>
        </div>

        <div style={{ display:'flex', background:COLORS.bgMuted, borderRadius:'12px', padding:'3px', gap:'2px', margin:'12px 16px 0' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, padding:'9px 4px', borderRadius:'10px', cursor:'pointer', fontFamily:'inherit', border:'none', fontSize:'12px', fontWeight:700, transition:'all 0.15s', background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? theme.brand : COLORS.t4, boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding:'16px' }}>
          {/* 활동 로그 */}
          {tab === 'activity' && (
            <>
              <SecLabel label="관리자 활동 로그" />
              <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, overflow:'hidden' }}>
                {DEMO_AUDIT_LOGS.map((log, i, arr) => {
                  const style = ACTION_STYLE[log.action] || { bg:'#F3F4F6', color:'#6B7280' }
                  return (
                    <div key={log.id} style={{ padding:'12px 16px', borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'8px', background:style.bg, color:style.color }}>{log.action}</span>
                        <span style={{ fontSize:'11px', fontWeight:600, color:COLORS.t1 }}>{log.actor}</span>
                      </div>
                      <div style={{ fontSize:'11px', color:COLORS.t3, marginBottom:'2px' }}>{log.target}</div>
                      <div style={{ fontSize:'10px', color:COLORS.t4 }}>{log.date} · IP {log.ip}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* 디바이스 */}
          {tab === 'device' && (
            <>
              <SecLabel label="등록 디바이스" />
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
                {DEMO_DEVICES.map((d, i) => (
                  <div key={i} style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:'14px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background: d.trusted ? '#D1FAE5' : '#FEF3C7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
                      {d.name.includes('iPhone') ? '📱' : d.name.includes('Mac') ? '💻' : '🖥️'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:COLORS.t1, marginBottom:'2px' }}>{d.name}</div>
                      <div style={{ fontSize:'10px', color:COLORS.t4 }}>{d.os} · {d.last}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
                      <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'8px', background: d.trusted ? '#D1FAE5' : '#FEF3C7', color: d.trusted ? '#059669' : '#D97706' }}>
                        {d.trusted ? '신뢰됨' : '미신뢰'}
                      </span>
                      {!d.trusted && (
                        <button style={{ fontSize:'10px', padding:'3px 8px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:'6px', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>
                          차단
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button style={{ width:'100%', height:'46px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:RADIUS.md, fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                🚪 모든 디바이스 강제 로그아웃
              </button>
            </>
          )}

          {/* 이상탐지 */}
          {tab === 'anomaly' && (
            <>
              <SecLabel label="이상 접근 탐지" color="#DC2626" />
              <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:RADIUS.lg, padding:'16px', marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>🚨</div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#B91C1C', marginBottom:'2px' }}>해외 IP 로그인 시도</div>
                    <div style={{ fontSize:'11px', color:'#DC2626' }}>2026.05.07 17:00</div>
                  </div>
                </div>
                <div style={{ fontSize:'12px', color:'#B91C1C', lineHeight:1.7, background:'#fff', borderRadius:'10px', padding:'12px', marginBottom:'12px' }}>
                  IP: 123.45.67.89 (해외 — 미국 캘리포니아)<br/>
                  실패 횟수: 3회<br/>
                  대상 계정: 이대표 (ceo@company.com)<br/>
                  상태: 자동 차단 완료
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button style={{ flex:1, height:'40px', background:'#DC2626', color:'#fff', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    IP 영구 차단
                  </button>
                  <button style={{ flex:1, height:'40px', background:COLORS.bgMuted, color:COLORS.t2, border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    무시
                  </button>
                </div>
              </div>

              <SecLabel label="IP 접근 기록 (최근)" />
              <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, overflow:'hidden' }}>
                {[
                  { ip:'192.168.1.1',  location:'서울, 한국',        time:'방금',     safe:true  },
                  { ip:'192.168.1.10', location:'서울, 한국',         time:'1시간 전', safe:true  },
                  { ip:'123.45.67.89', location:'캘리포니아, 미국',   time:'2일 전',   safe:false },
                ].map((record, i, arr) => (
                  <div key={i} style={{ padding:'11px 16px', borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:'12px', fontWeight:600, color:COLORS.t1 }}>{record.ip}</div>
                      <div style={{ fontSize:'10px', color:COLORS.t4 }}>{record.location} · {record.time}</div>
                    </div>
                    <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'8px', background: record.safe ? '#D1FAE5' : '#FEE2E2', color: record.safe ? '#059669' : '#DC2626' }}>
                      {record.safe ? '정상' : '차단됨'}
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
// ── 7. 직원 초대
// ═══════════════════════════════════════════════════════════
function InviteView({ onBack }) {
  const theme = getAccountTheme()
  const [method, setMethod] = useState('phone')
  const [input, setInput]   = useState('')
  const [role, setRole]     = useState('staff')
  const [dept, setDept]     = useState('')
  const [sent, setSent]     = useState(false)

  if (sent) return (
    <>
      <Header onBack={onBack} title="초대 완료" />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', gap:'12px', textAlign:'center' }}>
        <div style={{ fontSize:'52px' }}>🎉</div>
        <div style={{ fontSize:'18px', fontWeight:700, color:COLORS.t1 }}>초대를 보냈어요!</div>
        <div style={{ fontSize:'13px', color:COLORS.t3, lineHeight:1.6 }}>상대방이 수락하면 구성원 목록에 자동으로 추가됩니다.</div>
        <button onClick={onBack} style={{ marginTop:'20px', padding:'12px 32px', background:theme.activeBtnGrad, color:'#fff', border:'none', borderRadius:RADIUS.md, fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:theme.activeShadow }}>확인</button>
      </div>
    </>
  )

  return (
    <>
      <Header onBack={onBack} title="직원 초대" />
      <div style={{ padding:'16px 16px 100px' }}>
        <SecLabel label="초대 방식" />
        <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
          {[{ id:'phone', label:'전화번호', icon:'📱' }, { id:'email', label:'이메일', icon:'📧' }, { id:'link', label:'링크 공유', icon:'🔗' }].map(m => (
            <button key={m.id} onClick={() => { setMethod(m.id); setInput('') }}
              style={{ flex:1, height:'60px', background: method===m.id ? theme.brand : COLORS.bgCard, boxShadow: method===m.id ? theme.activeShadow : SHADOWS.card, color: method===m.id ? '#fff' : COLORS.t2, border:'none', borderRadius:RADIUS.md, fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'4px', transition:'all 0.15s' }}>
              <span style={{ fontSize:'20px' }}>{m.icon}</span>{m.label}
            </button>
          ))}
        </div>

        {method !== 'link'
          ? <input type={method === 'email' ? 'email' : 'tel'} value={input} onChange={e => setInput(e.target.value)} placeholder={method === 'phone' ? '010-0000-0000' : 'email@company.com'}
              style={{ width:'100%', height:'50px', background:COLORS.bgCard, boxShadow:SHADOWS.card, border:`1.5px solid ${input ? theme.brand : COLORS.borderSoft}`, borderRadius:RADIUS.lg, padding:'0 16px', fontSize:'15px', color:COLORS.t1, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:'20px', transition:'border 0.15s' }}/>
          : <div style={{ background:COLORS.bgCard, boxShadow:SHADOWS.card, borderRadius:RADIUS.lg, padding:'14px 16px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ flex:1, fontSize:'13px', color:COLORS.t3 }}>https://judapay.com/invite/abc123</div>
              <button style={{ padding:'6px 12px', background:theme.brand, color:'#fff', border:'none', borderRadius:'8px', fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>복사</button>
            </div>
        }

        <SecLabel label="역할 부여" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px', marginBottom:'20px' }}>
          {['admin','accounting','manager','staff','viewer'].map(rid => {
            const info = ROLES[rid]
            const active = role === rid
            return (
              <button key={rid} onClick={() => setRole(rid)}
                style={{ background: active ? info.bg : COLORS.bgCard, border:`2px solid ${active ? info.color : COLORS.borderSoft}`, borderRadius:'12px', padding:'12px', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s', boxShadow:SHADOWS.card }}>
                <div style={{ fontSize:'18px', marginBottom:'5px' }}>{info.icon}</div>
                <div style={{ fontSize:'12px', fontWeight:700, color: active ? info.color : COLORS.t1 }}>{info.label}</div>
                <div style={{ fontSize:'9px', color:COLORS.t4, marginTop:'2px', lineHeight:1.4 }}>{info.desc}</div>
              </button>
            )
          })}
        </div>

        <SecLabel label="부서 (선택)" />
        <div style={{ display:'flex', flexWrap:'wrap', gap:'7px' }}>
          {DEPT_LIST.map(d => (
            <button key={d} onClick={() => setDept(prev => prev === d ? '' : d)}
              style={{ padding:'7px 14px', borderRadius:'20px', border:`1.5px solid ${dept===d ? theme.brand : COLORS.borderSoft}`, background: dept===d ? theme.brand : '#fff', color: dept===d ? '#fff' : COLORS.t3, fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position:'sticky', bottom:0, padding:'12px 16px 24px', background:COLORS.bgCard, borderTop:`1px solid ${COLORS.borderSoft}`, boxShadow:'0 -4px 16px rgba(0,0,0,0.06)' }}>
        <button onClick={() => (method === 'link' || input.trim()) && setSent(true)} disabled={method !== 'link' && !input.trim()}
          style={{ width:'100%', height:'50px', background: (method === 'link' || input.trim()) ? theme.activeBtnGrad : COLORS.bgMuted, color: (method === 'link' || input.trim()) ? '#fff' : COLORS.t4, border:'none', borderRadius:RADIUS.md, fontSize:'15px', fontWeight:700, cursor:(method === 'link' || input.trim()) ? 'pointer' : 'default', fontFamily:'inherit', boxShadow:(method === 'link' || input.trim()) ? theme.activeShadow : 'none', transition:'all 0.2s' }}>
          {method === 'link' ? '링크로 초대' : '초대 보내기'}
        </button>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// ── 메인
// ═══════════════════════════════════════════════════════════
export default function AdminManagementBiz() {
  const [view, setView]       = useState('main')
  const [members, setMembers] = useState(DEMO_MEMBERS)

  const renderView = () => {
    switch (view) {
      case 'members':   return <MembersView   members={members} setMembers={setMembers} onBack={() => setView('main')} onInvite={() => setView('invite')} />
      case 'cards':     return <CardsView     members={members} onBack={() => setView('main')} />
      case 'execution': return <ExecutionView members={members} onBack={() => setView('main')} />
      case 'company':   return <CompanySettingsView onBack={() => setView('main')} />
      case 'security':  return <SecurityView  onBack={() => setView('main')} />
      case 'invite':    return <InviteView    onBack={() => setView('main')} />
      default:          return <MainHub members={members} onNav={v => setView(v)} />
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
