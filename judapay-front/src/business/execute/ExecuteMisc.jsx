import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../design/components'
import { COLORS, RADIUS, SHADOWS } from '../../design/tokens'
import { getAccountTheme } from '../../design/accountTokens'

const PAY_DAYS = ['1','5','10','15','20','25','28','말일']
const CYCLE_OPTS = [
  { id:'monthly',   label:'매월' },
  { id:'quarterly', label:'분기' },
  { id:'annual',    label:'연간' },
]
const ICONS = ['📋','👨‍💼','⚖️','🏥','📚','🔧','🎨','🖥️','📊','🤝']

const INIT_ITEMS = [
  { id:'m1', icon:'👨‍💼', name:'세무사 자문료',   amount:330000, payDay:'25', cycle:'monthly', active:true,  lastPayStatus:'success' },
  { id:'m2', icon:'⚖️',  name:'법무법인 자문료', amount:500000, payDay:'25', cycle:'monthly', active:false, lastPayStatus:null },
]

const DEMO_LOGS = [
  { date:'2026.05.25', status:'success' },
  { date:'2026.04.25', status:'success' },
  { date:'2026.03.25', status:'fail', note:'잔액 부족 → 보류' },
  { date:'2026.02.25', status:'success' },
  { date:'2026.01.25', status:'success' },
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
        <div style={{ fontSize:'11px', color: COLORS.t4 }}>자문료·고문료는 VAT 별도인 경우가 많습니다.</div>
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

export default function ExecuteMisc() {
  const theme = getAccountTheme()
  const navigate = useNavigate()

  const [items, setItems] = useState(INIT_ITEMS)
  const [screen, setScreen] = useState('list')
  const [selectedItem, setSelectedItem] = useState(null)
  const [exitModal, setExitModal] = useState(false)
  const [form, setForm] = useState({ icon:'📋', name:'', amount:'', payDay:'25', cycle:'monthly' })

  const [vatMode, setVatMode] = useState('exclude')
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

  const toggleActive = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i))
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const submit = () => {
    if (!form.name || !form.amount) return
    setItems(prev => [{ id:`m${Date.now()}`, icon:form.icon, name:form.name, amount:parseInt(form.amount), payDay:form.payDay, cycle:form.cycle, active:true }, ...prev])
    setScreen('list')
    setForm({ icon:'📋', name:'', amount:'', payDay:'25', cycle:'monthly' })
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
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>월 지급 금액</div>
            <div style={{ fontSize:'28px', fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1.1 }}>
              {fmt(selectedItem.amount)}<span style={{ fontSize:'15px', fontWeight:500, opacity:0.7 }}>원</span>
            </div>
            <div style={{ display:'flex', gap:'16px', marginTop:'10px' }}>
              <div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>주기</div><div style={{ fontSize:'12px', fontWeight:600, color:'#fff' }}>{CYCLE_OPTS.find(c=>c.id===selectedItem.cycle)?.label}</div></div>
              <div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>납부일</div><div style={{ fontSize:'12px', fontWeight:600, color:'#fff' }}>매월 {selectedItem.payDay}일</div></div>
              <div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>상태</div><div style={{ fontSize:'12px', fontWeight:600, color: selectedItem.active ? '#86EFAC' : '#FCA5A5' }}>{selectedItem.active ? '활성' : '정지'}</div></div>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
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

  // ── 등록 폼 ──────────────────────────────────────────────
  if (screen === 'addForm') return (
    <PhoneShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', background: COLORS.bg }}>
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'24px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 16px' }}>
            <BackBtn onClick={() => setScreen('list')} />
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff' }}>기타 정기지출</span>
          </div>
          <div style={{ padding:'0 20px' }}>
            <div style={{ fontSize:'24px', fontWeight:700, color:'#fff', lineHeight:1.3 }}>직접 설정</div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'18px 16px', display:'flex', flexDirection:'column', gap:'14px' }}>
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.md, padding:'14px 16px', boxShadow: SHADOWS.card }}>
            <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t3, marginBottom:'10px' }}>아이콘</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  style={{ width:'36px', height:'36px', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', border:'none', fontSize:'18px',
                    background: form.icon === ic ? theme.brand + '20' : COLORS.bgMuted,
                    outline: form.icon === ic ? `2px solid ${theme.brand}` : 'none' }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.md, padding:'14px 16px', boxShadow: SHADOWS.card }}>
            <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t3, marginBottom:'8px' }}>항목명</div>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 세무사 자문료, 법률 고문료"
              style={{ width:'100%', border:'none', outline:'none', fontSize:'14px', color: COLORS.t1, background:'transparent', fontFamily:'inherit' }}/>
          </div>
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.md, padding:'14px 16px', boxShadow: SHADOWS.card }}>
            <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t3, marginBottom:'8px' }}>금액</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:'6px' }}>
              <input type="number" inputMode="numeric" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0"
                style={{ flex:1, border:'none', outline:'none', fontSize:'22px', fontWeight:700, color: COLORS.t1, background:'transparent', fontFamily:'inherit' }}/>
              <span style={{ fontSize:'16px', fontWeight:600, color: COLORS.t3 }}>원</span>
            </div>
          </div>
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.md, padding:'14px 16px', boxShadow: SHADOWS.card }}>
            <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t3, marginBottom:'10px' }}>주기</div>
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
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff' }}>기타 정기지출</span>
          </div>
          <div style={{ margin:'0 16px', padding:'16px 18px', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:'16px' }}>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>이번 달 기타 지출 합계</div>
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
                <div style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>{items.length}</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginTop:'2px' }}>전체</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:'16px 16px 32px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'14px' }}>
            {items.map(item => (
              <button key={item.id}
                onClick={() => { setSelectedItem(item); setScreen('detail') }}
                style={{ width:'100%', background: COLORS.bgCard, borderRadius: RADIUS.lg, padding:'14px 16px', boxShadow: SHADOWS.card,
                  border:`1px solid ${COLORS.border}`, cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                  display:'flex', alignItems:'center', gap:'12px', opacity: item.active ? 1 : 0.6 }}>
                <span style={{ fontSize:'24px', width:'36px', textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
                    <span style={{ fontSize:'14px', fontWeight:700, color: COLORS.t1 }}>{item.name}</span>
                    {!item.active && <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 5px', background: COLORS.bgMuted, color: COLORS.t4, borderRadius:'4px' }}>정지</span>}
                  </div>
                  <div style={{ fontSize:'11px', color: COLORS.t4 }}>{CYCLE_OPTS.find(c=>c.id===item.cycle)?.label} · 매월 {item.payDay}일</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:'14px', fontWeight:700, color: COLORS.t1, marginBottom:'4px' }}>{fmt(item.amount)}원</div>
                  <StatusBadge status={getComputedStatus(item)} />
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setScreen('addForm')} style={{ width:'100%', padding:'15px', background: theme.brand, color:'#fff', border:'none', borderRadius: RADIUS.md, fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            <span style={{ fontSize:'18px' }}>+</span> 직접 추가
          </button>
        </div>
      </div>
    </PhoneShell>
  )
}
