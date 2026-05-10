import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../design/components'
import { COLORS, RADIUS, SHADOWS } from '../../design/tokens'
import { getAccountTheme } from '../../design/accountTokens'

const PAY_DAYS = ['1','5','10','15','20','25','28','말일']

const INSURANCE_TYPES = [
  { id:'group',     icon:'👥', label:'단체보험',    sub:'임직원 단체 생명·상해보험' },
  { id:'fire',      icon:'🔥', label:'화재보험',    sub:'사무실·창고·공장 화재' },
  { id:'liability', icon:'⚖️', label:'배상책임보험', sub:'대인·대물·제조물 배상' },
  { id:'vehicle',   icon:'🚗', label:'차량보험',    sub:'법인 차량 자동차보험' },
  { id:'cargo',     icon:'📦', label:'적하보험',    sub:'화물·수출입 운송 중 손해' },
  { id:'cyber',     icon:'🛡️', label:'사이버보험',  sub:'해킹·데이터 유출 배상' },
  { id:'etc',       icon:'📋', label:'기타보험',    sub:'직접 입력' },
]

const CYCLE_OPTS = [
  { id:'monthly',   label:'월납' },
  { id:'quarterly', label:'분기납' },
  { id:'annual',    label:'연납' },
]

const INIT_ITEMS = [
  { id:'p1', type:'group',     icon:'👥', name:'임직원 단체보험', amount:480000, payDay:'15', cycle:'monthly', active:true,  lastPayStatus:'success', insurer:'삼성화재',  policyNo:'SL-202401-0023', renewDate:'2027-01-15' },
  { id:'p2', type:'fire',      icon:'🔥', name:'사무실 화재보험', amount:120000, payDay:'1',  cycle:'monthly', active:true,  lastPayStatus:'fail',    insurer:'DB손해보험', policyNo:'DB-20240301',    renewDate:'2027-03-01' },
  { id:'p3', type:'liability', icon:'⚖️', name:'배상책임보험',    amount:85000,  payDay:'1',  cycle:'monthly', active:false, lastPayStatus:null,      insurer:'현대해상',   policyNo:'HD-2024-0891',   renewDate:'2026-12-31' },
]

const DEMO_LOGS = [
  { date:'2026.05.01', status:'success' },
  { date:'2026.04.01', status:'success' },
  { date:'2026.03.01', status:'fail', note:'잔액 부족' },
  { date:'2026.02.01', status:'success' },
  { date:'2026.01.01', status:'success' },
]

function fmt(n) { return Number(Math.floor(n||0)).toLocaleString('ko-KR') }

const STATUS_MAP = {
  active:  { label:'자동지급 ON',  bg:'#D1FAE5', color:'#059669' },
  overdue: { label:'미납 중',      bg:'#FEF3C7', color:'#D97706' },
  paused:  { label:'자동지급 OFF', bg:'#F3F4F6', color:'#6B7280' },
}
function getComputedStatus(item) {
  if (!item.active) return 'paused'
  if (item.lastPayStatus === 'fail') return 'overdue'
  return 'active'
}
function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.active
  return <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 8px', borderRadius:'20px', background:s.bg, color:s.color }}>{s.label}</span>
}

const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ width:'32px', height:'32px', background:'rgba(255,255,255,0.15)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, borderRadius:'10px' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  </button>
)
const XBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ width:'32px', height:'32px', background:'rgba(255,255,255,0.15)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, borderRadius:'10px' }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
)

function SectionControl({ vatMode, setVatMode, autoPay, setAutoPay, autoPayType, setAutoPayType }) {
  return (
    <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, overflow:'hidden', boxShadow: SHADOWS.card }}>
      <div style={{ padding:'14px 16px', borderBottom:`1px solid ${COLORS.borderSoft}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
          <span style={{ fontSize:'13px', fontWeight:600, color: COLORS.t1 }}>부가세 설정</span>
          <div style={{ display:'flex', gap:'6px' }}>
            {[{id:'include',label:'포함'},{id:'exclude',label:'별도'},{id:'exempt',label:'면세'}].map(opt => (
              <button key={opt.id} onClick={() => setVatMode(opt.id)}
                style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit',
                  background: vatMode === opt.id ? '#1D4ED8' : COLORS.bgMuted, color: vatMode === opt.id ? '#fff' : COLORS.t3 }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ fontSize:'11px', color: COLORS.t4 }}>보험료는 대부분 부가세 면세 항목입니다.</div>
      </div>
      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: autoPay ? '10px' : 0 }}>
          <span style={{ fontSize:'13px', fontWeight:600, color: COLORS.t1 }}>자동 지급</span>
          <button onClick={() => setAutoPay(!autoPay)}
            style={{ width:'40px', height:'22px', borderRadius:'11px', border:'none', cursor:'pointer', background: autoPay ? '#059669' : COLORS.bgMuted, position:'relative', transition:'background 0.2s' }}>
            <div style={{ position:'absolute', top:'3px', left: autoPay ? '21px' : '3px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
          </button>
        </div>
        {autoPay && (
          <div style={{ display:'flex', gap:'6px' }}>
            {[{id:'account',label:'계좌이체'},{id:'card',label:'카드결제'}].map(tp => (
              <button key={tp.id} onClick={() => setAutoPayType(tp.id)}
                style={{ flex:1, padding:'8px', borderRadius:'8px', fontSize:'11px', fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit',
                  background: autoPayType === tp.id ? '#059669' : COLORS.bgMuted, color: autoPayType === tp.id ? '#fff' : COLORS.t3 }}>
                {tp.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CommonBottomSections({ approvalLimit, setApprovalLimit, needReceipt, setNeedReceipt, notifyOnPay, setNotifyOnPay, notifyBeforeDays, setNotifyBeforeDays }) {
  return (
    <>
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, overflow:'hidden', boxShadow: SHADOWS.card }}>
        <div style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1, marginBottom:'10px' }}>승인 및 통제</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t2 }}>지급 한도 설정</div>
              <div style={{ fontSize:'11px', color: COLORS.t4, marginTop:'2px' }}>한도 초과 시 승인 요청</div>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:'4px' }}>
              <input type="number" inputMode="numeric" value={approvalLimit} onChange={e => setApprovalLimit(e.target.value)}
                style={{ width:'80px', textAlign:'right', border:'none', outline:'none', fontSize:'14px', fontWeight:700, color: COLORS.t1, background:'transparent', fontFamily:'inherit' }}/>
              <span style={{ fontSize:'12px', color: COLORS.t3 }}>원</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, overflow:'hidden', boxShadow: SHADOWS.card }}>
        <div style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1, marginBottom:'10px' }}>증빙 연동</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t2 }}>영수증 자동 수집</div>
              <div style={{ fontSize:'11px', color: COLORS.t4, marginTop:'2px' }}>납부 후 증빙 자동 등록</div>
            </div>
            <button onClick={() => setNeedReceipt(!needReceipt)}
              style={{ width:'40px', height:'22px', borderRadius:'11px', border:'none', cursor:'pointer', background: needReceipt ? '#059669' : COLORS.bgMuted, position:'relative', transition:'background 0.2s' }}>
              <div style={{ position:'absolute', top:'3px', left: needReceipt ? '21px' : '3px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
            </button>
          </div>
        </div>
      </div>
      <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, overflow:'hidden', boxShadow: SHADOWS.card }}>
        <div style={{ padding:'14px 16px', borderBottom:`1px solid ${COLORS.borderSoft}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t2 }}>지급 완료 알림</div>
              <div style={{ fontSize:'11px', color: COLORS.t4, marginTop:'2px' }}>지급 처리 후 즉시 알림</div>
            </div>
            <button onClick={() => setNotifyOnPay(!notifyOnPay)}
              style={{ width:'40px', height:'22px', borderRadius:'11px', border:'none', cursor:'pointer', background: notifyOnPay ? '#059669' : COLORS.bgMuted, position:'relative', transition:'background 0.2s' }}>
              <div style={{ position:'absolute', top:'3px', left: notifyOnPay ? '21px' : '3px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
            </button>
          </div>
        </div>
        <div style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t2, marginBottom:'8px' }}>사전 알림 (일 전)</div>
          <div style={{ display:'flex', gap:'6px' }}>
            {['1','3','7'].map(d => (
              <button key={d} onClick={() => setNotifyBeforeDays(d)}
                style={{ flex:1, padding:'8px', borderRadius:'8px', fontSize:'12px', fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit',
                  background: notifyBeforeDays === d ? '#059669' : COLORS.bgMuted, color: notifyBeforeDays === d ? '#fff' : COLORS.t3 }}>
                {d}일 전
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default function ExecuteInsurancePremium() {
  const theme = getAccountTheme()
  const navigate = useNavigate()

  const [items, setItems] = useState(INIT_ITEMS)
  const [screen, setScreen] = useState('list')
  const [selectedItem, setSelectedItem] = useState(null)
  const [exitModal, setExitModal] = useState(false)
  const [form, setForm] = useState({ type:'group', icon:'👥', name:'', amount:'', payDay:'1', cycle:'monthly', insurer:'', policyNo:'', renewDate:'' })

  const [vatMode, setVatMode] = useState('exempt')
  const [autoPay, setAutoPay] = useState(true)
  const [autoPayType, setAutoPayType] = useState('account')
  const [approvalLimit, setApprovalLimit] = useState('1000000')
  const [needReceipt, setNeedReceipt] = useState(true)
  const [notifyOnPay, setNotifyOnPay] = useState(true)
  const [notifyBeforeDays, setNotifyBeforeDays] = useState('3')
  const [saved, setSaved] = useState(false)

  const totalActive = items.filter(i => i.active).reduce((s,i) => s + i.amount, 0)
  const activeCount = items.filter(i => i.active).length
  const pausedCount = items.filter(i => !i.active).length
  const renewSoonCount = items.filter(i => {
    if (!i.renewDate) return false
    return Math.ceil((new Date(i.renewDate) - new Date()) / (1000*60*60*24)) <= 30
  }).length

  const toggleActive = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i))
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const submit = () => {
    if (!form.name || !form.amount || parseInt(form.amount) < 100) return
    setItems(prev => [{
      id: `p${Date.now()}`, type: form.type, icon: form.icon,
      name: form.name, amount: parseInt(form.amount),
      payDay: form.payDay, cycle: form.cycle, active: true,
      insurer: form.insurer, policyNo: form.policyNo, renewDate: form.renewDate,
    }, ...prev])
    setScreen('list')
    setForm({ type:'group', icon:'👥', name:'', amount:'', payDay:'1', cycle:'monthly', insurer:'', policyNo:'', renewDate:'' })
  }

  // ── 로그 화면 ────────────────────────────────────────────
  if (screen === 'log' && selectedItem) return (
    <PhoneShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', background: COLORS.bg }}>
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'24px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 16px' }}>
            <BackBtn onClick={() => setScreen('detail')} />
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff' }}>지급 로그</span>
          </div>
          <div style={{ padding:'0 20px' }}>
            <div style={{ fontSize:'22px', fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}>{selectedItem.name}</div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', marginTop:'3px' }}>반복 지급 이력 · 매월 {fmt(selectedItem.amount)}원</div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
          {DEMO_LOGS.map((log, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px 0', borderBottom: i < DEMO_LOGS.length - 1 ? `1px solid ${COLORS.borderSoft}` : 'none' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: log.status === 'success' ? '#D1FAE5' : '#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
                {log.status === 'success' ? '✓' : '✕'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13px', fontWeight:600, color: COLORS.t1 }}>{log.date}</div>
                {log.note && <div style={{ fontSize:'11px', color:'#DC2626', marginTop:'2px' }}>{log.note}</div>}
              </div>
              <div style={{ textAlign:'right' }}>
                {log.status === 'success'
                  ? <span style={{ fontSize:'13px', fontWeight:700, color:'#059669' }}>{fmt(selectedItem.amount)}원</span>
                  : <span style={{ fontSize:'13px', color: COLORS.t4 }}>—</span>
                }
                <div style={{ fontSize:'10px', color: log.status === 'success' ? '#059669' : '#DC2626', marginTop:'2px' }}>
                  {log.status === 'success' ? '정상 지급' : '지급 실패'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  )

  // ── 상세 화면 ────────────────────────────────────────────
  if (screen === 'detail' && selectedItem) return (
    <PhoneShell>
      {exitModal && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'flex-end' }}>
          <div style={{ width:'100%', background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px 32px' }}>
            <div style={{ fontSize:'17px', fontWeight:700, color: COLORS.t1, marginBottom:'8px' }}>설정을 저장하지 않고 나가시겠어요?</div>
            <div style={{ fontSize:'13px', color: COLORS.t3, marginBottom:'20px' }}>변경사항이 저장되지 않습니다.</div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => setExitModal(false)} style={{ flex:1, padding:'14px', borderRadius: RADIUS.md, border:`1px solid ${COLORS.border}`, background:'#fff', fontSize:'14px', fontWeight:600, color: COLORS.t2, cursor:'pointer', fontFamily:'inherit' }}>계속 편집</button>
              <button onClick={() => { setExitModal(false); setScreen('list') }} style={{ flex:1, padding:'14px', borderRadius: RADIUS.md, border:'none', background:'#DC2626', fontSize:'14px', fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>나가기</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ flex:1, display:'flex', flexDirection:'column', background: COLORS.bg }}>
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 12px' }}>
            <BackBtn onClick={() => setScreen('list')} />
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff', flex:1 }}>{selectedItem.name}</span>
            <button onClick={() => setScreen('log')} style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.85)', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'20px', padding:'5px 12px', cursor:'pointer', marginRight:'4px' }}>지급 로그</button>
            <XBtn onClick={() => setExitModal(true)} />
          </div>
          <div style={{ margin:'0 16px 16px', padding:'16px 18px', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:'16px' }}>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>월 납부 금액</div>
            <div style={{ fontSize:'28px', fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1.1 }}>
              {fmt(selectedItem.amount)}<span style={{ fontSize:'15px', fontWeight:500, opacity:0.7 }}>원</span>
            </div>
            <div style={{ display:'flex', gap:'16px', marginTop:'10px' }}>
              <div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>보험사</div><div style={{ fontSize:'12px', fontWeight:600, color:'#fff' }}>{selectedItem.insurer || '—'}</div></div>
              <div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>납부일</div><div style={{ fontSize:'12px', fontWeight:600, color:'#fff' }}>매월 {selectedItem.payDay}일</div></div>
              <div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>갱신일</div><div style={{ fontSize:'12px', fontWeight:600, color:'#fff' }}>{selectedItem.renewDate || '—'}</div></div>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
          {selectedItem.policyNo && (
            <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.md, padding:'14px 16px', boxShadow: SHADOWS.card }}>
              <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t3, marginBottom:'4px' }}>증권 번호</div>
              <div style={{ fontSize:'14px', fontWeight:600, color: COLORS.t1 }}>{selectedItem.policyNo}</div>
            </div>
          )}
          <SectionControl vatMode={vatMode} setVatMode={setVatMode} autoPay={autoPay} setAutoPay={setAutoPay} autoPayType={autoPayType} setAutoPayType={setAutoPayType} />
          <CommonBottomSections approvalLimit={approvalLimit} setApprovalLimit={setApprovalLimit} needReceipt={needReceipt} setNeedReceipt={setNeedReceipt} notifyOnPay={notifyOnPay} setNotifyOnPay={setNotifyOnPay} notifyBeforeDays={notifyBeforeDays} setNotifyBeforeDays={setNotifyBeforeDays} />
        </div>
        <div style={{ flexShrink:0, padding:'12px 16px 20px', background: COLORS.bg, borderTop:`1px solid ${COLORS.borderSoft}` }}>
          <button onClick={handleSave} style={{ width:'100%', padding:'15px', background: saved ? '#059669' : (theme.activeBtnGrad || theme.brand), color:'#fff', border:'none', borderRadius: RADIUS.md, fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .2s', boxShadow: saved ? 'none' : theme.activeShadow }}>
            {saved ? '✓  저장 완료' : '자동 설정 저장'}
          </button>
        </div>
      </div>
    </PhoneShell>
  )

  // ── 유형 선택 ────────────────────────────────────────────
  if (screen === 'addType') return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 16px' }}>
            <BackBtn onClick={() => setScreen('list')} />
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff' }}>보험료</span>
          </div>
          <div style={{ padding:'0 20px' }}>
            <div style={{ fontSize:'24px', fontWeight:700, color:'#fff', lineHeight:1.3 }}>어떤 보험인가요?</div>
          </div>
        </div>
        <div style={{ padding:'18px 16px 32px', display:'flex', flexDirection:'column', gap:'8px' }}>
          {INSURANCE_TYPES.map(tp => (
            <button key={tp.id} onClick={() => {
              setForm(f => ({ ...f, type: tp.id, icon: tp.icon, name: tp.id === 'etc' ? '' : tp.label }))
              setScreen('addForm')
            }} style={{ width:'100%', padding:'14px 16px', background: COLORS.bgCard, border:`1px solid ${COLORS.border}`, borderRadius: RADIUS.md, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'12px', textAlign:'left' }}>
              <span style={{ fontSize:'22px', width:'32px', textAlign:'center' }}>{tp.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'14px', fontWeight:600, color: COLORS.t1 }}>{tp.label}</div>
                <div style={{ fontSize:'11px', color: COLORS.t4 }}>{tp.sub}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
      </div>
    </PhoneShell>
  )

  // ── 등록 폼 ──────────────────────────────────────────────
  if (screen === 'addForm') return (
    <PhoneShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', background: COLORS.bg }}>
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'24px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 16px' }}>
            <BackBtn onClick={() => setScreen('addType')} />
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff' }}>보험료 등록</span>
          </div>
          <div style={{ padding:'0 20px' }}>
            <div style={{ fontSize:'24px', fontWeight:700, color:'#fff', lineHeight:1.3 }}>{form.icon} {INSURANCE_TYPES.find(tp=>tp.id===form.type)?.label}</div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'18px 16px', display:'flex', flexDirection:'column', gap:'14px' }}>
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.md, padding:'14px 16px', boxShadow: SHADOWS.card }}>
            <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t3, marginBottom:'8px' }}>보험 이름</div>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 임직원 단체보험, 사무실 화재보험"
              style={{ width:'100%', border:'none', outline:'none', fontSize:'14px', color: COLORS.t1, background:'transparent', fontFamily:'inherit' }}/>
          </div>
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.md, padding:'14px 16px', boxShadow: SHADOWS.card }}>
            <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t3, marginBottom:'8px' }}>보험사 (선택)</div>
            <input value={form.insurer} onChange={e => setForm(f => ({ ...f, insurer: e.target.value }))} placeholder="예: 삼성화재, DB손해보험"
              style={{ width:'100%', border:'none', outline:'none', fontSize:'14px', color: COLORS.t1, background:'transparent', fontFamily:'inherit' }}/>
          </div>
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.md, padding:'14px 16px', boxShadow: SHADOWS.card }}>
            <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t3, marginBottom:'8px' }}>납부 금액</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:'6px' }}>
              <input type="number" inputMode="numeric" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0"
                style={{ flex:1, border:'none', outline:'none', fontSize:'22px', fontWeight:700, color: COLORS.t1, background:'transparent', fontFamily:'inherit' }}/>
              <span style={{ fontSize:'16px', fontWeight:600, color: COLORS.t3 }}>원</span>
            </div>
          </div>
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.md, padding:'14px 16px', boxShadow: SHADOWS.card }}>
            <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t3, marginBottom:'10px' }}>납부 주기</div>
            <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
              {CYCLE_OPTS.map(c => (
                <button key={c.id} onClick={() => setForm(f => ({ ...f, cycle: c.id }))}
                  style={{ flex:1, padding:'9px', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', fontSize:'12px', fontWeight:600, border:'none',
                    background: form.cycle === c.id ? theme.brand : COLORS.bgMuted, color: form.cycle === c.id ? '#fff' : COLORS.t3 }}>
                  {c.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t3, marginBottom:'8px' }}>납부일</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {PAY_DAYS.map(d => (
                <button key={d} onClick={() => setForm(f => ({ ...f, payDay: d }))}
                  style={{ padding:'5px 10px', borderRadius:'7px', cursor:'pointer', fontFamily:'inherit', fontSize:'11px', fontWeight:600, border:'none',
                    background: form.payDay === d ? theme.brand : COLORS.bgMuted, color: form.payDay === d ? '#fff' : COLORS.t3 }}>
                  {d === '말일' ? '말일' : `${d}일`}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding:'10px 14px', background:'#FFFBEB', borderRadius: RADIUS.md, fontSize:'11px', color:'#854F0B', lineHeight:1.65 }}>
            ⓘ 보험료는 전액 손금 처리 가능합니다. 납부 후 증빙(영수증)이 자동 수집됩니다.
          </div>
          <button onClick={submit} style={{ width:'100%', padding:'15px', background: form.name && form.amount ? theme.brand : COLORS.bgMuted, color: form.name && form.amount ? '#fff' : COLORS.t4, border:'none', borderRadius: RADIUS.md, fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginBottom:'16px' }}>
            등록하기
          </button>
        </div>
      </div>
    </PhoneShell>
  )

  // ── 목록 ─────────────────────────────────────────────────
  return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 16px' }}>
            <BackBtn onClick={() => navigate(-1)} />
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff' }}>보험료</span>
          </div>
          <div style={{ margin:'0 16px', padding:'16px 18px', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:'16px' }}>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>이번 달 보험료 합계</div>
            <div style={{ fontSize:'28px', fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1.1 }}>
              {fmt(totalActive)}<span style={{ fontSize:'15px', fontWeight:500, opacity:0.7 }}>원</span>
            </div>
            <div style={{ display:'flex', gap:'16px', marginTop:'12px' }}>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>{activeCount}</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginTop:'2px' }}>자동지급</div>
              </div>
              <div style={{ width:'1px', background:'rgba(255,255,255,0.15)' }}/>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>{pausedCount}</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginTop:'2px' }}>정지</div>
              </div>
              <div style={{ width:'1px', background:'rgba(255,255,255,0.15)' }}/>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color: renewSoonCount > 0 ? '#FCD34D' : '#fff' }}>{renewSoonCount}</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginTop:'2px' }}>갱신예정</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:'16px 16px 32px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'14px' }}>
            {items.map(item => {
              const daysToRenew = item.renewDate ? Math.ceil((new Date(item.renewDate) - new Date()) / (1000*60*60*24)) : null
              const isRenewSoon = daysToRenew !== null && daysToRenew <= 30
              return (
                <button key={item.id}
                  onClick={() => { setSelectedItem(item); setScreen('detail') }}
                  style={{ width:'100%', background: COLORS.bgCard, borderRadius: RADIUS.lg, padding:'14px 16px', boxShadow: SHADOWS.card,
                    border: isRenewSoon ? '1px solid #FCA5A5' : `1px solid ${COLORS.border}`,
                    cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex', alignItems:'center', gap:'12px', opacity: item.active ? 1 : 0.6 }}>
                  <span style={{ fontSize:'24px', width:'36px', textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
                      <span style={{ fontSize:'14px', fontWeight:700, color: COLORS.t1 }}>{item.name}</span>
                      {!item.active && <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 5px', background: COLORS.bgMuted, color: COLORS.t4, borderRadius:'4px' }}>정지</span>}
                      {isRenewSoon && <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 5px', background:'#FEE2E2', color:'#B91C1C', borderRadius:'4px' }}>갱신 D-{daysToRenew}</span>}
                    </div>
                    <div style={{ fontSize:'11px', color: COLORS.t4 }}>{item.insurer || '보험사 미등록'} · 매월 {item.payDay}일</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:'14px', fontWeight:700, color: COLORS.t1, marginBottom:'4px' }}>{fmt(item.amount)}원</div>
                    <StatusBadge status={getComputedStatus(item)} />
                  </div>
                </button>
              )
            })}
          </div>
          <button onClick={() => setScreen('addType')} style={{ width:'100%', padding:'15px', background: theme.brand, color:'#fff', border:'none', borderRadius: RADIUS.md, fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            <span style={{ fontSize:'18px' }}>+</span> 보험 추가
          </button>
        </div>
      </div>
    </PhoneShell>
  )
}
