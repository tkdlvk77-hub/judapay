import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../../design/components'
import { COLORS, RADIUS, SHADOWS } from '../../design/tokens'
import { getAccountTheme } from '../../design/accountTokens'

const TAX_TYPES = [
  { id:'vat',         icon:'🧾', label:'부가가치세',    sub:'매출세액 - 매입세액',       cycle:'반기 (1월·7월)',  iconBg:'#FEF3C7', nextDue:'2026-07-25', estimated:1240000, auto:true  },
  { id:'corporate',   icon:'🏛️', label:'법인세',        sub:'과세소득 × 세율',           cycle:'연 1회 (3월)',   iconBg:'#EFF6FF', nextDue:'2027-03-31', estimated:0,       auto:false },
  { id:'withholding', icon:'💳', label:'원천징수세',    sub:'급여·용역 지급 시 원천징수', cycle:'월별 (매월 10일)', iconBg:'#F5F3FF', nextDue:'2026-06-10', estimated:312000,  auto:true  },
  { id:'local',       icon:'🗂️', label:'지방소득세',    sub:'법인세의 10%',              cycle:'연 1회 (4월)',   iconBg:'#ECFDF5', nextDue:'2027-04-30', estimated:0,       auto:false },
  { id:'acquisition', icon:'🏠', label:'취득세 / 등록세', sub:'부동산·차량 취득 시',     cycle:'발생 시',        iconBg:'#FEE2E2', nextDue:null,         estimated:0,       auto:false },
]

const DEMO_LOGS = [
  { date:'2026.04.25', status:'success', note:'' },
  { date:'2026.01.25', status:'success', note:'' },
  { date:'2025.07.25', status:'success', note:'' },
  { date:'2025.01.25', status:'fail',    note:'잔액 부족 → 보류' },
  { date:'2024.07.25', status:'success', note:'' },
]

function fmt(n) { return Number(Math.floor(n||0)).toLocaleString('ko-KR') }
function daysUntil(iso) {
  if (!iso) return null
  return Math.ceil((new Date(iso) - new Date()) / (1000*60*60*24))
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

export default function ExecuteTax() {
  const theme = getAccountTheme()
  const navigate = useNavigate()

  const [items, setItems] = useState(TAX_TYPES)
  const [screen, setScreen] = useState('list')
  const [selectedItem, setSelectedItem] = useState(null)
  const [exitModal, setExitModal] = useState(false)

  const [autoPay, setAutoPay] = useState(true)
  const [autoPayType, setAutoPayType] = useState('account')
  const [approvalLimit, setApprovalLimit] = useState('2000000')
  const [needReceipt, setNeedReceipt] = useState(true)
  const [notifyOnPay, setNotifyOnPay] = useState(true)
  const [notifyBeforeDays, setNotifyBeforeDays] = useState('3')
  const [saved, setSaved] = useState(false)

  const autoCount = items.filter(i => i.auto).length
  const manualCount = items.filter(i => !i.auto).length
  const nextDueDays = items
    .map(t => daysUntil(t.nextDue))
    .filter(d => d !== null && d > 0)
    .sort((a,b) => a-b)[0] ?? null

  const toggleAuto = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, auto: !i.auto } : i))
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  // ── 로그 화면 ────────────────────────────────────────────
  if (screen === 'log' && selectedItem) return (
    <PhoneShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', background: COLORS.bg }}>
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'24px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 16px' }}>
            <BackBtn onClick={() => setScreen('detail')} />
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff' }}>납부 로그</span>
          </div>
          <div style={{ padding:'0 20px' }}>
            <div style={{ fontSize:'22px', fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}>{selectedItem.label}</div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', marginTop:'3px' }}>
              납부 이력 · {selectedItem.cycle}
              {selectedItem.estimated > 0 ? ` · 예상 ${fmt(selectedItem.estimated)}원` : ''}
            </div>
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
                {log.status === 'success' && selectedItem.estimated > 0
                  ? <span style={{ fontSize:'13px', fontWeight:700, color:'#059669' }}>{fmt(selectedItem.estimated)}원</span>
                  : log.status === 'success'
                    ? <span style={{ fontSize:'12px', color: COLORS.t4 }}>세무사 산출</span>
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

  // ── 상세 화면 ────────────────────────────────────────────
  if (screen === 'detail' && selectedItem) {
    const days = daysUntil(selectedItem.nextDue)
    const isUrgent = days !== null && days <= 30
    return (
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
              <span style={{ fontSize:'15px', fontWeight:600, color:'#fff', flex:1 }}>{selectedItem.label}</span>
              <button onClick={() => setScreen('log')} style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.85)', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'20px', padding:'5px 12px', cursor:'pointer', marginRight:'4px' }}>납부 로그</button>
              <XBtn onClick={() => setExitModal(true)} />
            </div>
            <div style={{ margin:'0 16px 16px', padding:'16px 18px', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:'16px' }}>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>예상 납부금액</div>
              <div style={{ fontSize:'28px', fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1.1 }}>
                {selectedItem.estimated > 0
                  ? <>{fmt(selectedItem.estimated)}<span style={{ fontSize:'15px', fontWeight:500, opacity:0.7 }}>원</span></>
                  : <span style={{ fontSize:'18px', fontWeight:600, opacity:0.7 }}>세무사 산출 예정</span>
                }
              </div>
              <div style={{ display:'flex', gap:'16px', marginTop:'10px' }}>
                <div><div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>납부 주기</div><div style={{ fontSize:'12px', fontWeight:600, color:'#fff' }}>{selectedItem.cycle}</div></div>
                <div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>납부 예정일</div>
                  <div style={{ fontSize:'12px', fontWeight:600, color: isUrgent ? '#FCD34D' : '#fff' }}>
                    {selectedItem.nextDue || '발생 시'}
                    {isUrgent && ` (D-${days})`}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
            {isUrgent && (
              <div style={{ background:'#FEE2E2', border:'1px solid #FCA5A5', borderRadius: RADIUS.md, padding:'12px 14px', display:'flex', gap:'10px' }}>
                <span style={{ fontSize:'18px' }}>🚨</span>
                <div style={{ fontSize:'12px', color:'#B91C1C', lineHeight:1.6 }}>납부 기한이 {days}일 남았습니다. 자동납부를 확인해 주세요.</div>
              </div>
            )}
            {/* 자동납부 설정 */}
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
                <div style={{ fontSize:'13px', fontWeight:600, color: COLORS.t1, marginBottom:'10px' }}>승인 한도</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:'12px', color: COLORS.t4 }}>한도 초과 시 승인 요청</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'4px' }}>
                    <input type="number" inputMode="numeric" value={approvalLimit} onChange={e => setApprovalLimit(e.target.value)}
                      style={{ width:'80px', textAlign:'right', border:'none', outline:'none', fontSize:'14px', fontWeight:700, color: COLORS.t1, background:'transparent', fontFamily:'inherit' }}/>
                    <span style={{ fontSize:'12px', color: COLORS.t3 }}>원</span>
                  </div>
                </div>
              </div>
            </div>
            {/* 증빙 연동 */}
            <div style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, overflow:'hidden', boxShadow: SHADOWS.card }}>
              <div style={{ padding:'14px 16px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1, marginBottom:'10px' }}>증빙 연동</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:'12px', fontWeight:600, color: COLORS.t2 }}>납부 확인서 자동 수집</div>
                    <div style={{ fontSize:'11px', color: COLORS.t4, marginTop:'2px' }}>납부 후 증빙 자동 등록</div>
                  </div>
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
            <div style={{ padding:'10px 14px', background:'#FFFBEB', borderRadius: RADIUS.md, fontSize:'11px', color:'#854F0B', lineHeight:1.65 }}>
              ⓘ 자동납부 설정 시 기한 당일 자동 이체됩니다. 납부 후 증빙은 자동 수집되어 세무사에게 전달됩니다.
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
  }

  // ── 목록 (메인) ──────────────────────────────────────────
  return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 16px' }}>
            <BackBtn onClick={() => navigate(-1)} />
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff' }}>세금</span>
          </div>
          <div style={{ margin:'0 16px', padding:'16px 18px', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:'16px' }}>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'4px' }}>다음 납부까지</div>
            <div style={{ fontSize:'28px', fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1.1 }}>
              {nextDueDays !== null
                ? <>{nextDueDays < 0 ? '기한 초과' : `D-${nextDueDays}`}</>
                : '—'
              }
            </div>
            <div style={{ display:'flex', gap:'16px', marginTop:'12px' }}>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>{autoCount}</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginTop:'2px' }}>자동납부</div>
              </div>
              <div style={{ width:'1px', background:'rgba(255,255,255,0.15)' }}/>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>{manualCount}</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginTop:'2px' }}>수동납부</div>
              </div>
              <div style={{ width:'1px', background:'rgba(255,255,255,0.15)' }}/>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>{items.length}</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginTop:'2px' }}>항목 수</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:'16px 16px 32px' }}>
          {/* 세무사 연동 안내 */}
          <div style={{ background:'#EFF6FF', border:`1px solid #BFDBFE`, borderRadius: RADIUS.md, padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'12px' }}>
            <span style={{ fontSize:'18px', marginTop:'1px' }}>👨‍💼</span>
            <div>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#1D4ED8', marginBottom:'3px' }}>세무사 연동</div>
              <div style={{ fontSize:'11px', color:'#1E40AF', lineHeight:1.6 }}>세무사와 연동 시 납부 금액이 자동 산출되어 기한 3일 전 알림이 발송됩니다.</div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {items.map(tax => {
              const days = daysUntil(tax.nextDue)
              const isUrgent = days !== null && days <= 30
              return (
                <button key={tax.id}
                  onClick={() => { setSelectedItem(tax); setScreen('detail') }}
                  style={{ width:'100%', background: COLORS.bgCard, borderRadius: RADIUS.lg, overflow:'hidden', boxShadow: SHADOWS.card,
                    border: isUrgent ? '1px solid #FCA5A5' : `1px solid ${COLORS.border}`,
                    cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                  <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'44px', height:'44px', borderRadius:'12px', background: tax.iconBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
                      {tax.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
                        <span style={{ fontSize:'14px', fontWeight:700, color: COLORS.t1 }}>{tax.label}</span>
                        {isUrgent && <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 5px', background:'#FEE2E2', color:'#B91C1C', borderRadius:'4px' }}>D-{days}</span>}
                      </div>
                      <div style={{ fontSize:'11px', color: COLORS.t4 }}>{tax.sub} · {tax.cycle}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
                      <button onClick={e => { e.stopPropagation(); toggleAuto(tax.id) }}
                        style={{ width:'40px', height:'22px', borderRadius:'11px', border:'none', cursor:'pointer',
                          background: tax.auto ? theme.brand : COLORS.bgMuted, position:'relative', transition:'background 0.2s' }}>
                        <div style={{ position:'absolute', top:'3px', left: tax.auto ? '21px' : '3px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                      </button>
                      <span style={{ fontSize:'10px', color: COLORS.t4 }}>자동납부</span>
                    </div>
                  </div>
                  {(tax.nextDue || tax.estimated > 0) && (
                    <div style={{ padding:'10px 16px 12px', background: COLORS.bgMuted, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:'11px', color: COLORS.t4, marginBottom:'1px' }}>납부 예정일</div>
                        <div style={{ fontSize:'12px', fontWeight:600, color: isUrgent ? '#DC2626' : COLORS.t2 }}>{tax.nextDue || '발생 시'}</div>
                      </div>
                      {tax.estimated > 0
                        ? <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:'11px', color: COLORS.t4, marginBottom:'1px' }}>예상 납부액</div>
                            <div style={{ fontSize:'13px', fontWeight:700, color: theme.brand }}>{fmt(tax.estimated)}원</div>
                          </div>
                        : tax.nextDue
                          ? <div style={{ fontSize:'11px', color: COLORS.t4 }}>세무사 산출 예정</div>
                          : null
                      }
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </PhoneShell>
  )
}
