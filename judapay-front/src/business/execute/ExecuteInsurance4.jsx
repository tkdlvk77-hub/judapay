import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../design/components'
import { COLORS, RADIUS, SHADOWS } from '../../design/tokens'
import { getAccountTheme } from '../../design/accountTokens'

// ─── 4대보험 요율 (2026년 기준 근사치) ───────────────────
const RATES = {
  national: { emp: 0.045,   co: 0.045,   label: '국민연금',  icon: '🏛️', bg:'#EFF6FF' },
  health:   { emp: 0.0354,  co: 0.0354,  label: '건강보험',  icon: '🏥', bg:'#F0FDF4' },
  longterm: { emp: 0.00913, co: 0,        label: '장기요양',  icon: '♿', bg:'#FEF3C7' },
  employ:   { emp: 0.009,   co: 0.015,   label: '고용보험',  icon: '💼', bg:'#F5F3FF' },
  indust:   { emp: 0,       co: 0.009,   label: '산재보험',  icon: '⛑️', bg:'#FEE2E2' },
}

const PAY_DAYS = ['10','15','말일']

const DEMO_EMPLOYEES = [
  { id:'e1', name:'김지수', salary:3200000 },
  { id:'e2', name:'박성민', salary:2500000 },
  { id:'e3', name:'이유진', salary:2800000 },
]

const DEMO_LOGS = [
  { date:'2026.05.10', status:'success' },
  { date:'2026.04.10', status:'success' },
  { date:'2026.03.10', status:'fail', note:'잔액 부족' },
  { date:'2026.02.10', status:'success' },
  { date:'2026.01.10', status:'success' },
]

function fmt(n) { return Number(Math.floor(n||0)).toLocaleString('ko-KR') }

function calcContributions(totalSalary) {
  return {
    national: { emp: Math.floor(totalSalary * RATES.national.emp), co: Math.floor(totalSalary * RATES.national.co) },
    health:   { emp: Math.floor(totalSalary * RATES.health.emp),   co: Math.floor(totalSalary * RATES.health.co)   },
    longterm: { emp: Math.floor(totalSalary * RATES.longterm.emp), co: 0 },
    employ:   { emp: Math.floor(totalSalary * RATES.employ.emp),   co: Math.floor(totalSalary * RATES.employ.co)   },
    indust:   { emp: 0,                                             co: Math.floor(totalSalary * RATES.indust.co)   },
  }
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

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{ width:'40px', height:'22px', borderRadius:'11px', border:'none', cursor:'pointer', background: on ? '#059669' : COLORS.bgMuted, position:'relative', transition:'background 0.2s' }}>
      <div style={{ position:'absolute', top:'3px', left: on ? '21px' : '3px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
    </button>
  )
}

export default function ExecuteInsurance4() {
  const theme = getAccountTheme()
  const navigate = useNavigate()

  const totalSalary = DEMO_EMPLOYEES.reduce((s,e) => s + e.salary, 0)
  const contrib = calcContributions(totalSalary)
  const totalCo  = Object.values(contrib).reduce((s,c) => s + c.co, 0)
  const totalEmp = Object.values(contrib).reduce((s,c) => s + c.emp, 0)

  const [screen, setScreen] = useState('list') // list | detail | log
  const [selectedKey, setSelectedKey] = useState(null)
  const [exitModal, setExitModal] = useState(false)

  const [payDay, setPayDay] = useState('10')
  const [autoPay, setAutoPay] = useState(true)
  const [autoPayType, setAutoPayType] = useState('account')
  const [needReceipt, setNeedReceipt] = useState(true)
  const [notifyOnPay, setNotifyOnPay] = useState(true)
  const [notifyBeforeDays, setNotifyBeforeDays] = useState('3')
  const [saved, setSaved] = useState(false)
  const [showEmp, setShowEmp] = useState(false)

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const selectedRate = selectedKey ? RATES[selectedKey] : null
  const selectedContrib = selectedKey ? contrib[selectedKey] : null
  const logAmount = selectedContrib ? selectedContrib.co : 0

  // ── 로그 화면 ────────────────────────────────────────────
  if (screen === 'log' && selectedKey) return (
    <PhoneShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', background: COLORS.bg }}>
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'24px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 16px' }}>
            <BackBtn onClick={() => setScreen('detail')} />
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff' }}>납부 로그</span>
          </div>
          <div style={{ padding:'0 20px' }}>
            <div style={{ fontSize:'22px', fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}>{selectedRate.label}</div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', marginTop:'3px' }}>반복 납부 이력 · 매월 {fmt(logAmount)}원 (회사 부담분)</div>
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
                  ? <span style={{ fontSize:'13px', fontWeight:700, color:'#059669' }}>{fmt(logAmount)}원</span>
                  : <span style={{ fontSize:'13px', color: COLORS.t4 }}>—</span>
                }
                <div style={{ fontSize:'10px', color: log.status === 'success' ? '#059669' : '#DC2626', marginTop:'2px' }}>
                  {log.status === 'success' ? '정상 납부' : '납부 실패'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  )

  // ── 항목 상세 ────────────────────────────────────────────
  if (screen === 'detail' && selectedKey) return (
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
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff', flex:1 }}>{selectedRate.label}</span>
            <button onClick={() => setScreen('log')} style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.85)', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'20px', padding:'5px 12px', cursor:'pointer', marginRight:'4px' }}>납부 로그</button>
            <XBtn onClick={() => setExitModal(true)} />
          </div>
          <div style={{ margin:'0 16px 16px', padding:'16px 18px', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:'16px' }}>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>월 납부금 (회사 부담분)</div>
            <div style={{ fontSize:'28px', fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1.1 }}>
              {fmt(selectedContrib.co)}<span style={{ fontSize:'15px', fontWeight:500, opacity:0.7 }}>원</span>
            </div>
            <div style={{ display:'flex', gap:'16px', marginTop:'10px' }}>
              <div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>요율 (회사)</div><div style={{ fontSize:'12px', fontWeight:600, color:'#fff' }}>{(RATES[selectedKey].co * 100).toFixed(2)}%</div></div>
              <div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>요율 (직원)</div><div style={{ fontSize:'12px', fontWeight:600, color:'#fff' }}>{(RATES[selectedKey].emp * 100).toFixed(2)}%</div></div>
              <div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>직원 공제</div><div style={{ fontSize:'12px', fontWeight:600, color:'#fff' }}>{fmt(selectedContrib.emp)}원</div></div>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
          {/* 직원별 내역 */}
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, overflow:'hidden', boxShadow: SHADOWS.card }}>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1, marginBottom:'10px' }}>직원별 산출 내역</div>
              {DEMO_EMPLOYEES.map((emp, i) => {
                const empCo = Math.floor(emp.salary * RATES[selectedKey].co)
                const empEmp = Math.floor(emp.salary * RATES[selectedKey].emp)
                return (
                  <div key={emp.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderTop: i > 0 ? `1px solid ${COLORS.borderSoft}` : 'none' }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'50%', background: COLORS.bgMuted, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color: COLORS.t3, flexShrink:0 }}>
                      {emp.name[0]}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color: COLORS.t1 }}>{emp.name}</div>
                      <div style={{ fontSize:'11px', color: COLORS.t4 }}>급여 {fmt(emp.salary)}원</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t1 }}>회사 {fmt(empCo)}원</div>
                      <div style={{ fontSize:'11px', color: COLORS.t4 }}>직원 {fmt(empEmp)}원</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* 납부 설정 */}
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, overflow:'hidden', boxShadow: SHADOWS.card }}>
            <div style={{ padding:'14px 16px', borderBottom:`1px solid ${COLORS.borderSoft}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: autoPay ? '10px' : 0 }}>
                <span style={{ fontSize:'13px', fontWeight:600, color: COLORS.t1 }}>자동 납부</span>
                <Toggle on={autoPay} onToggle={() => setAutoPay(!autoPay)} />
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
            <div style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'13px', fontWeight:600, color: COLORS.t1 }}>증빙 자동 수집</span>
                <Toggle on={needReceipt} onToggle={() => setNeedReceipt(!needReceipt)} />
              </div>
            </div>
          </div>
          {/* 알림 설정 */}
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, overflow:'hidden', boxShadow: SHADOWS.card }}>
            <div style={{ padding:'14px 16px', borderBottom:`1px solid ${COLORS.borderSoft}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t2 }}>납부 완료 알림</div>
                  <div style={{ fontSize:'11px', color: COLORS.t4, marginTop:'2px' }}>납부 처리 후 즉시 알림</div>
                </div>
                <Toggle on={notifyOnPay} onToggle={() => setNotifyOnPay(!notifyOnPay)} />
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
          <div style={{ padding:'10px 14px', background:'#EFF6FF', borderRadius: RADIUS.md, fontSize:'11px', color:'#1E40AF', lineHeight:1.65 }}>
            ⓘ 회사 부담분은 비용 처리, 직원 공제분은 원천징수로 자동 분리됩니다.
          </div>
        </div>
        <div style={{ flexShrink:0, padding:'12px 16px 20px', background: COLORS.bg, borderTop:`1px solid ${COLORS.borderSoft}` }}>
          <button onClick={handleSave} style={{ width:'100%', padding:'15px', background: saved ? '#059669' : (theme.activeBtnGrad || theme.brand), color:'#fff', border:'none', borderRadius: RADIUS.md, fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .2s', boxShadow: saved ? 'none' : theme.activeShadow }}>
            {saved ? '✓  저장 완료' : '자동 설정 저장'}
          </button>
        </div>
      </div>
    </PhoneShell>
  )

  // ── 목록 (메인) ──────────────────────────────────────────
  return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 16px' }}>
            <BackBtn onClick={() => navigate(-1)} />
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff' }}>4대보험</span>
          </div>
          <div style={{ margin:'0 16px', padding:'16px 18px', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:'16px' }}>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>이번 달 회사 부담 합계</div>
            <div style={{ fontSize:'28px', fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1.1 }}>
              {fmt(totalCo)}<span style={{ fontSize:'15px', fontWeight:500, opacity:0.7 }}>원</span>
            </div>
            <div style={{ display:'flex', gap:'16px', marginTop:'12px' }}>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{DEMO_EMPLOYEES.length}명</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginTop:'2px' }}>등록 직원</div>
              </div>
              <div style={{ width:'1px', background:'rgba(255,255,255,0.15)' }}/>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{fmt(totalEmp)}</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginTop:'2px' }}>직원 공제분</div>
              </div>
              <div style={{ width:'1px', background:'rgba(255,255,255,0.15)' }}/>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>매월 {payDay}일</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginTop:'2px' }}>자동 납부일</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:'16px 16px 32px' }}>
          {/* 납부일 설정 */}
          <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, padding:'14px 16px', boxShadow: SHADOWS.card, marginBottom:'12px' }}>
            <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t3, marginBottom:'10px' }}>자동 납부일</div>
            <div style={{ display:'flex', gap:'8px' }}>
              {PAY_DAYS.map(d => (
                <button key={d} onClick={() => setPayDay(d)}
                  style={{ flex:1, padding:'10px', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', fontSize:'12px', fontWeight:600, border:'none',
                    background: payDay === d ? theme.brand : COLORS.bgMuted, color: payDay === d ? '#fff' : COLORS.t3 }}>
                  {d === '말일' ? '말일' : `매월 ${d}일`}
                </button>
              ))}
            </div>
          </div>

          {/* 항목별 카드 */}
          <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t3, marginBottom:'8px', marginTop:'4px' }}>항목별 내역 · 탭하여 설정</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'14px' }}>
            {Object.entries(RATES).map(([key, rate]) => {
              const c = contrib[key]
              return (
                <button key={key}
                  onClick={() => { setSelectedKey(key); setScreen('detail') }}
                  style={{ width:'100%', background: COLORS.bgCard, borderRadius: RADIUS.lg, padding:'14px 16px', boxShadow: SHADOWS.card,
                    border:`1px solid ${COLORS.border}`, cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'12px', background: rate.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
                    {rate.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'14px', fontWeight:700, color: COLORS.t1, marginBottom:'3px' }}>{rate.label}</div>
                    <div style={{ fontSize:'11px', color: COLORS.t4 }}>회사 {(rate.co*100).toFixed(2)}% · 직원 {(rate.emp*100).toFixed(2)}%</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:'14px', fontWeight:700, color: COLORS.t1 }}>{fmt(c.co)}원</div>
                    <div style={{ fontSize:'11px', color: COLORS.t4 }}>공제 {fmt(c.emp)}원</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 직원 목록 토글 */}
          <button onClick={() => setShowEmp(!showEmp)}
            style={{ width:'100%', padding:'13px 16px', background: COLORS.bgCard, border:`1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow: SHADOWS.card }}>
            <span style={{ fontSize:'13px', fontWeight:600, color: COLORS.t1 }}>👥 등록 직원 ({DEMO_EMPLOYEES.length}명)</span>
            <span style={{ fontSize:'12px', color: COLORS.t4 }}>{showEmp ? '▲ 접기' : '▼ 펼치기'}</span>
          </button>
          {showEmp && (
            <div style={{ background: COLORS.bgCard, borderRadius:`0 0 ${RADIUS.lg} ${RADIUS.lg}`, borderTop:'none', border:`1px solid ${COLORS.border}`, padding:'0 16px' }}>
              {DEMO_EMPLOYEES.map((emp, i) => (
                <div key={emp.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderTop: i > 0 ? `1px solid ${COLORS.borderSoft}` : 'none' }}>
                  <span style={{ fontSize:'13px', fontWeight:600, color: COLORS.t1 }}>{emp.name}</span>
                  <span style={{ fontSize:'13px', color: COLORS.t2 }}>{fmt(emp.salary)}원</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop:'12px', padding:'10px 14px', background:'#EFF6FF', borderRadius: RADIUS.md, fontSize:'11px', color:'#1E40AF', lineHeight:1.65 }}>
            🏛️ 국민연금공단·건강보험공단·고용노동부와 연동되어 고지서 금액이 자동 반영됩니다. 백엔드 연결 시 활성화.
          </div>
        </div>
      </div>
    </PhoneShell>
  )
}
