import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS, GRADIENTS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'
import { useT } from '../design/i18n'

const ACCOUNTS = [
  { id:0, bank:'국민은행', bankCode:'KB', bankColor:'#F9C906', num:'123-**-456', name:'본인 인증 계좌 · 이호형', primary:true },
  { id:1, bank:'농협은행', bankCode:'NH', bankColor:'#1DA462', num:'789-**-012', name:'이호형', primary:false },
]

const KEYS = [1,2,3,4,5,6,7,8,9,null,0,'del']

const MY_BALANCE = 1932000

// ─── 다크 헤더 ─────────────────────────
function DarkHeader({ smallTitle, bigTitle, sub, onBack, bg }) {
  return (
    <div style={{
      background: bg || GRADIENTS.header,
      paddingTop:'20px',
      paddingBottom:'24px',
    }}>
      <div style={{
        display:'flex', alignItems:'center',
        padding:'4px 16px 18px',
        gap:'8px',
      }}>
        <button onClick={onBack}
          style={{
            width:'32px', height:'32px',
            background:'transparent', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', padding:0, flexShrink:0,
          }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={{ fontSize:'15px', fontWeight:600, color:'#fff', flex:1 }}>
          {smallTitle}
        </span>
      </div>

      {bigTitle && (
        <div style={{ padding:'0 20px' }}>
          <div style={{
            fontSize:'28px', fontWeight:700, color:'#fff',
            lineHeight:1.25, letterSpacing:'-1px',
            marginBottom: sub ? '10px' : 0,
            whiteSpace:'pre-line',
          }}>
            {bigTitle}
          </div>
          {sub && (
            <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.6)', lineHeight:1.55 }}>
              {sub}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 금액 입력 ─────────────────────────
function AmountDisplay({ amount, onChange, onClear }) {
  const len = amount ? amount.length : 1
  const fontSize = len <= 6 ? 44 : len <= 8 ? 36 : len <= 10 ? 28 : 22

  return (
    <div style={{ position:'relative', height:'60px', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'inline-flex', alignItems:'baseline', gap:'3px', transform:'translateX(18px)' }}>
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          style={{
            fontSize:`${fontSize}px`,
            fontWeight:700, lineHeight:1,
            color: amount ? COLORS.t1 : COLORS.t5,
            background:'transparent', border:'none', outline:'none',
            textAlign:'center', fontFamily:'inherit',
            width:'200px', transition:'font-size 0.15s',
            WebkitAppearance:'none', MozAppearance:'textfield',
          }}
        />
        <span style={{
          fontSize: fontSize >= 36 ? '26px' : fontSize >= 28 ? '20px' : '16px',
          fontWeight:700, lineHeight:1,
          color: amount ? COLORS.t1 : COLORS.t5,
          transition:'font-size 0.15s',
        }}>원</span>
      </div>
      {amount > 0 && (
        <button onClick={onClear}
          style={{
            position:'absolute', right:'16px', top:'50%', transform:'translateY(-50%)',
            width:'28px', height:'28px', borderRadius:'50%',
            background: COLORS.bgMuted, border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export default function Charge() {
  const theme = getAccountTheme()
  const t = useT()
  const headerBg = theme.headerGrad
  const navigate = useNavigate()
  const [step, setStep] = useState('main')
  const [amount, setAmount] = useState('')
  const [selectedAcc, setSelectedAcc] = useState(0)
  const [pin, setPin] = useState('')

  const amtNum = parseInt(amount) || 0
  const amtFmt = amtNum.toLocaleString('ko-KR')
  const acc = ACCOUNTS[selectedAcc]

  const pinInput = (k) => {
    if (k === 'del') { setPin(p => p.slice(0,-1)); return }
    if (k === null) return
    if (pin.length >= 6) return
    const next = pin + k
    setPin(next)
    if (next.length === 6) setTimeout(() => { setPin(''); setStep('done') }, 400)
  }

  const goBack = () => {
    if (step === 'main') navigate('/home')
    else if (step === 'confirm') setStep('main')
    else if (step === 'pin') setStep('confirm')
  }

  // ───────────── 메인 입력 ─────────────
  if (step === 'main') return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto' }}>
        <DarkHeader
          bg={headerBg}
          smallTitle="충전"
          bigTitle="얼마 충전할까요?"
          sub="외부 계좌 → MY 지갑 · 수수료 0원"
          onBack={goBack}
        />

        <div style={{ padding:'18px 16px 24px' }}>

          {/* 충전 금액 입력 */}
          <div style={{ textAlign:'center', marginBottom:'12px' }}>
            <div style={{ fontSize:'13px', color: COLORS.t4, marginBottom:'10px' }}>충전 금액</div>
            <AmountDisplay amount={amount} onChange={setAmount} onClear={() => setAmount('')} />
            <div style={{ fontSize:'11px', color: COLORS.t4, marginTop:'8px' }}>
              이번 달 충전 1,200,000원 · 한도 200,000,000원
            </div>
          </div>

          {/* 빠른 금액 */}
          <div style={{ display:'flex', gap:'6px', marginBottom:'22px' }}>
            {[10000, 50000, 100000, 500000].map(v => (
              <button key={v}
                onClick={() => setAmount(String(amtNum + v))}
                style={{
                  flex:1, height:'36px',
                  background: COLORS.bgCard,
                  boxShadow: SHADOWS.card,
                  border:'none', borderRadius:'10px',
                  fontSize:'12px', fontWeight:600,
                  color: COLORS.t2,
                  cursor:'pointer', fontFamily:'inherit',
                }}>
                +{v >= 10000 ? `${v/10000}만` : v}
              </button>
            ))}
          </div>

          {/* 출금 계좌 */}
          <div style={{ fontSize:'12px', fontWeight:700, color: COLORS.t3, marginBottom:'8px', padding:'0 4px' }}>
            출금 계좌
          </div>
          <div style={{
            background: COLORS.bgCard,
            boxShadow: SHADOWS.card,
            borderRadius: RADIUS.lg,
            overflow:'hidden',
            marginBottom:'10px',
          }}>
            {ACCOUNTS.map((a, i) => {
              const active = selectedAcc === a.id
              return (
                <button key={a.id}
                  onClick={() => setSelectedAcc(a.id)}
                  style={{
                    width:'100%', padding:'14px 16px',
                    display:'flex', alignItems:'center', gap:'12px',
                    border:'none',
                    borderBottom: i < ACCOUNTS.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none',
                    background: active ? '#fff' : COLORS.bgMuted,
                    cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                    transition:'background .15s',
                  }}>
                  {/* 라디오 버튼 */}
                  <div style={{
                    width:'20px', height:'20px',
                    borderRadius:'50%',
                    border: active ? `2px solid ${theme.brandDark}` : `2px solid ${COLORS.t5}`,
                    background: '#fff',
                    flexShrink:0, transition:'all .15s',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {active && (
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: theme.brandDark }} />
                    )}
                  </div>
                  <div style={{
                    width:'34px', height:'34px',
                    borderRadius:'9px',
                    background: a.bankColor,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'10px', fontWeight:700, color:'#fff',
                    flexShrink:0,
                    opacity: active ? 1 : 0.6,
                    transition:'opacity .15s',
                  }}>
                    {a.bankCode}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'2px', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'13px', fontWeight:700, color: active ? theme.brandDark : COLORS.t3 }}>
                        {a.bank} {a.num}
                      </span>
                      {a.primary && (
                        <span style={{
                          padding:'1px 5px',
                          background:'#D1FAE5', color:'#047857',
                          borderRadius:'3px',
                          fontSize:'9px', fontWeight:700,
                        }}>
                          본인 인증
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:'11px', color: active ? COLORS.t3 : COLORS.t5 }}>{a.name}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <button style={{
            width:'100%', padding:'12px',
            background:'transparent',
            border:`1px solid ${COLORS.borderSoft}`,
            borderRadius: RADIUS.md,
            fontSize:'12px', fontWeight:600,
            color: theme.brand,
            cursor:'pointer', fontFamily:'inherit',
            marginBottom:'20px',
          }}>
            출금 계좌 변경하기 ›
          </button>

          {/* 요약 */}
          <div style={{
            background: COLORS.bgCard,
            boxShadow: SHADOWS.card,
            borderRadius: RADIUS.lg,
            overflow:'hidden',
            marginBottom:'12px',
          }}>
            {[
              { label:'충전 금액', value: amtNum ? `${amtFmt}원` : '-' },
              { label:'수수료', value:'0원', success:true },
              { label:'MY 지갑 예상 잔액', value: `${(MY_BALANCE + amtNum).toLocaleString()}원`, bold:true },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'13px 16px',
                borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none',
              }}>
                <span style={{ fontSize:'12px', color: COLORS.t4 }}>{row.label}</span>
                <span style={{
                  fontSize: row.bold ? '15px' : '13px',
                  fontWeight: row.bold ? 700 : 600,
                  color: row.success ? '#047857' : COLORS.t1,
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* 법령 안내 */}
          <div style={{
            padding:'12px 14px',
            background:'#EDF3FA',
            borderRadius: RADIUS.md,
            fontSize:'11px', color:'#1E5294', lineHeight:1.65,
          }}>
            ⓘ 30만원 초과 충전 시 실명확인이 필요합니다 (전자금융거래법). 이미 인증되어 자동 처리됩니다.
          </div>
        </div>
      </div>

      <div style={{
        padding:'12px 16px 24px',
        borderTop: `1px solid ${COLORS.borderSoft}`,
        background: COLORS.bgCard,
      }}>
        <button onClick={() => amtNum >= 1000 && setStep('confirm')}
          disabled={amtNum < 1000}
          style={{
            width:'100%', height:'52px',
            background: amtNum >= 1000 ? theme.brand : COLORS.bgMuted,
            color: amtNum >= 1000 ? '#fff' : COLORS.t4,
            border:'none', borderRadius: RADIUS.md,
            fontSize:'15px', fontWeight:700,
            cursor: amtNum >= 1000 ? 'pointer' : 'default',
            fontFamily:'inherit',
            boxShadow: amtNum >= 1000 ? SHADOWS.buttonBrand : 'none',
          }}>
          {amtNum >= 1000 ? '충전하기' : '금액을 입력하세요'}
        </button>
      </div>
    </PhoneShell>
  )

  // ───────────── 확인 ─────────────
  if (step === 'confirm') return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto' }}>
        <DarkHeader
          bg={headerBg}
          smallTitle="충전 확인"
          bigTitle={`${amtFmt}원`}
          sub={`${acc.bank} ${acc.num} → MY 지갑`}
          onBack={goBack}
        />

        <div style={{ padding:'18px 16px 24px' }}>

          <div style={{
            background: COLORS.bgCard,
            boxShadow: SHADOWS.card,
            borderRadius: RADIUS.lg,
            overflow:'hidden',
            marginBottom:'12px',
          }}>
            {[
              { label:'충전 금액', value:`${amtFmt}원`, bold:true },
              { label:'출금 계좌', value:`${acc.bank} ${acc.num}`, sub: acc.name },
              { label:'입금 지갑', value:'MY 지갑' },
              { label:'수수료', value:'0원', success:true },
              { label:'MY 지갑 예상 잔액', value:`${(MY_BALANCE + amtNum).toLocaleString()}원`, bold:true },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                padding:'14px 16px',
                borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none',
                display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                gap:'10px',
              }}>
                <span style={{ fontSize:'12px', color: COLORS.t4, paddingTop:'2px' }}>{row.label}</span>
                <div style={{ textAlign:'right' }}>
                  <div style={{
                    fontSize: row.bold ? '15px' : '13px',
                    fontWeight: row.bold ? 700 : 600,
                    color: row.success ? '#047857' : COLORS.t1,
                  }}>
                    {row.value}
                  </div>
                  {row.sub && (
                    <div style={{ fontSize:'11px', color: COLORS.t4, marginTop:'2px' }}>{row.sub}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            padding:'12px 14px',
            background:'#EDF3FA',
            borderRadius: RADIUS.md,
            fontSize:'11px', color:'#1E5294', lineHeight:1.65,
          }}>
            PIN 입력 후 즉시 처리됩니다. 본인 인증 계좌로만 충전 가능합니다 (전자금융거래법).
          </div>
        </div>
      </div>

      <div style={{
        padding:'12px 16px 24px',
        borderTop: `1px solid ${COLORS.borderSoft}`,
        background: COLORS.bgCard,
        display:'flex', flexDirection:'column', gap:'8px',
      }}>
        <button onClick={() => setStep('pin')}
          style={{
            width:'100%', height:'52px',
            background: theme.brand, color:'#fff',
            border:'none', borderRadius: RADIUS.md,
            fontSize:'15px', fontWeight:700,
            cursor:'pointer', fontFamily:'inherit',
            boxShadow: SHADOWS.buttonBrand,
          }}>
          충전하기
        </button>
        <button onClick={() => setStep('main')}
          style={{
            width:'100%', height:'42px',
            background:'transparent', color: COLORS.t4,
            border:'none',
            fontSize:'13px', cursor:'pointer', fontFamily:'inherit',
          }}>
          취소
        </button>
      </div>
    </PhoneShell>
  )

  // ───────────── PIN ─────────────
  if (step === 'pin') return (
    <PhoneShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflowY:'auto' }}>
        <DarkHeader smallTitle="비밀번호 입력" onBack={goBack} bg={headerBg} />

        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 24px 0' }}>
          <div style={{
            width:'100%', maxWidth:'320px',
            padding:'12px 14px',
            background: COLORS.bgCard,
            boxShadow: SHADOWS.card,
            borderRadius: RADIUS.md,
            display:'flex', justifyContent:'space-between', alignItems:'center',
            marginBottom:'34px',
          }}>
            <span style={{ fontSize:'12px', color: COLORS.t3 }}>{acc.bank} → MY 지갑</span>
            <span style={{ fontSize:'14px', fontWeight:700, color: COLORS.t1 }}>{amtFmt}원</span>
          </div>

          <div style={{ fontSize:'13px', color: COLORS.t4, marginBottom:'20px' }}>6자리 비밀번호</div>

          <div style={{ display:'flex', gap:'16px', marginBottom:'24px' }}>
            {Array.from({ length:6 }).map((_, i) => (
              <div key={i} style={{
                width:'14px', height:'14px',
                borderRadius:'50%',
                background: i < pin.length ? theme.brand : 'transparent',
                border: i < pin.length ? `2px solid ${theme.brand}` : `2px solid ${COLORS.border}`,
                transition:'all .15s',
              }} />
            ))}
          </div>

          <button style={{
            background:'none', border:'none',
            display:'flex', alignItems:'center', gap:'5px',
            color: theme.brand,
            fontSize:'12px', fontWeight:600,
            cursor:'pointer', fontFamily:'inherit',
          }}>
            <svg width="14" height="14" viewBox="0 0 42 42" fill="none">
              <rect x="9" y="4" width="24" height="34" rx="5" stroke={theme.brand} strokeWidth="2"/>
              <circle cx="21" cy="21" r="6" stroke={theme.brand} strokeWidth="2"/>
              <circle cx="21" cy="21" r="2" fill={theme.brand}/>
            </svg>
            Face ID로 인증
          </button>
        </div>

        <div style={{
          display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px',
          padding:'0 28px', marginBottom:'18px',
        }}>
          {KEYS.map((k, i) => (
            <button key={i} onClick={() => pinInput(k)}
              style={{
                height:'58px', borderRadius:'16px',
                background: k === null || k === 'del' ? 'transparent' : COLORS.bgCard,
                boxShadow: k === null || k === 'del' ? 'none' : SHADOWS.card,
                border:'none',
                fontSize:'22px', fontWeight:500,
                color: k === 'del' ? COLORS.t4 : COLORS.t1,
                cursor: k === null ? 'default' : 'pointer',
                fontFamily:'inherit',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px',
              }}>
              {k === 'del' ? '⌫' : k !== null ? (
                <>
                  <span style={{ lineHeight:1 }}>{k}</span>
                  {[2,3,4,5,6,7,8,9].includes(k) && (
                    <span style={{ fontSize:'9px', color: COLORS.t5, letterSpacing:'1.5px' }}>
                      {{2:'ABC',3:'DEF',4:'GHI',5:'JKL',6:'MNO',7:'PQRS',8:'TUV',9:'WXYZ'}[k]}
                    </span>
                  )}
                </>
              ) : null}
            </button>
          ))}
        </div>

        <div style={{ paddingBottom:'24px', textAlign:'center', fontSize:'10px', color: COLORS.t5 }}>
          비밀번호 5회 오류 시 30분 잠금
        </div>
      </div>
    </PhoneShell>
  )

  // ───────────── 완료 (즉시 — 녹색 ✓) ─────────────
  return (
    <PhoneShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflowY:'auto' }}>

        {/* 다크 그라데이션 + 녹색 ✓ */}
        <div style={{
          background: GRADIENTS.header,
          paddingTop:'40px',
          paddingBottom:'40px',
          textAlign:'center',
        }}>
          <div style={{
            width:'80px', height:'80px',
            borderRadius:'50%',
            background:'rgba(52,211,153,0.20)',
            border:'2px solid #34D399',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 18px',
          }}>
            <svg width="40" height="32" viewBox="0 0 36 30" fill="none">
              <path d="M2 15l11 11L34 2" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize:'24px', fontWeight:700, color:'#fff', marginBottom:'10px', letterSpacing:'-0.5px' }}>
            충전 완료!
          </div>
          <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)', lineHeight:1.7, padding:'0 24px' }}>
            MY 지갑에{' '}
            <strong style={{ color:'#34D399' }}>{amtFmt}원</strong>이 충전됐어요
          </div>
        </div>

        {/* 라이트 영역 — 거래 요약 */}
        <div style={{ padding:'18px 16px 24px' }}>
          <div style={{
            background: COLORS.bgCard,
            boxShadow: SHADOWS.card,
            borderRadius: RADIUS.lg,
            padding:'14px 16px',
            marginBottom:'12px',
          }}>
            {[
              { label:'충전 금액', value:`+${amtFmt}원`, accent:true },
              { label:'출금 계좌', value:`${acc.bank} ****${acc.num.slice(-3)}` },
              { label:'충전 후 잔액', value:`${(MY_BALANCE+amtNum).toLocaleString()}원`, bold:true },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display:'flex', justifyContent:'space-between',
                fontSize:'13px',
                paddingBottom: i < arr.length-1 ? '10px' : 0,
                marginBottom: i < arr.length-1 ? '10px' : 0,
                borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none',
              }}>
                <span style={{ color: COLORS.t4 }}>{row.label}</span>
                <span style={{
                  fontWeight: row.bold ? 700 : 600,
                  color: row.accent ? '#047857' : COLORS.t1,
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div style={{ textAlign:'center', fontSize:'11px', color: COLORS.t5 }}>
            2026.05.06 · 09:41
          </div>
        </div>
      </div>

      <div style={{
        padding:'12px 16px 24px',
        borderTop: `1px solid ${COLORS.borderSoft}`,
        background: COLORS.bgCard,
        display:'flex', flexDirection:'column', gap:'8px',
      }}>
        <button onClick={() => { setAmount(''); setStep('main') }}
          style={{
            width:'100%', height:'46px',
            background: COLORS.bgMuted, color: COLORS.t2,
            border:'none', borderRadius: RADIUS.md,
            fontSize:'13px', fontWeight:600,
            cursor:'pointer', fontFamily:'inherit',
          }}>
          한 번 더 충전
        </button>
        <button onClick={() => navigate('/home')}
          style={{
            width:'100%', height:'52px',
            background: theme.brand, color:'#fff',
            border:'none', borderRadius: RADIUS.md,
            fontSize:'15px', fontWeight:700,
            cursor:'pointer', fontFamily:'inherit',
            boxShadow: SHADOWS.buttonBrand,
          }}>
          홈으로
        </button>
      </div>
    </PhoneShell>
  )
}
