import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS, GRADIENTS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'
import { useT } from '../design/i18n'

const KEYS = [1,2,3,4,5,6,7,8,9,null,0,'del']
const MY_BALANCE = 1932000
const ACCOUNT = {
  bank:'국민은행', bankCode:'KB', bankColor:'#F9C906',
  num:'123-**-456', name:'본인 인증 계좌 · 이호형',
}

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
function AmountDisplay({ amount, onChange, onClear, dangerOver }) {
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
            color: dangerOver ? COLORS.danger : amount ? COLORS.t1 : COLORS.t5,
            background:'transparent', border:'none', outline:'none',
            textAlign:'center', fontFamily:'inherit',
            width:'200px', transition:'font-size 0.15s, color 0.15s',
            WebkitAppearance:'none', MozAppearance:'textfield',
          }}
        />
        <span style={{
          fontSize: fontSize >= 36 ? '26px' : fontSize >= 28 ? '20px' : '16px',
          fontWeight:700, lineHeight:1,
          color: dangerOver ? COLORS.danger : amount ? COLORS.t1 : COLORS.t5,
          transition:'font-size 0.15s, color 0.15s',
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

export default function Withdraw() {
  const theme = getAccountTheme()
  const t = useT()
  const headerBg = theme.headerGrad
  const navigate = useNavigate()
  const [step, setStep] = useState('main')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')

  const amtNum = parseInt(amount) || 0
  const amtFmt = amtNum.toLocaleString('ko-KR')
  const remaining = MY_BALANCE - amtNum
  const overBalance = amtNum > MY_BALANCE

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
          smallTitle="출금"
          bigTitle="얼마 출금할까요?"
          sub="MY 지갑 → 본인 계좌 · 즉시 입금"
          onBack={goBack}
        />

        <div style={{ padding:'18px 16px 24px' }}>

          {/* MY 지갑 잔액 다크 카드 */}
          <div style={{
            background: GRADIENTS.header,
            borderRadius: RADIUS.lg,
            padding:'18px',
            marginBottom:'12px',
            position:'relative',
            overflow:'hidden',
            boxShadow: SHADOWS.glass,
          }}>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'6px', fontWeight:500 }}>
              MY 지갑 잔액
            </div>
            <div style={{
              fontSize:'28px', fontWeight:700, color:'#fff',
              marginBottom:'4px', letterSpacing:'-1px',
            }}>
              {MY_BALANCE.toLocaleString()}원
            </div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>
              출금 가능 잔액
            </div>
          </div>

          {/* 권한 자금 안내 (노란) */}
          <div style={{
            display:'flex', alignItems:'flex-start', gap:'10px',
            padding:'12px 14px',
            background:'#FFFBEB',
            borderRadius: RADIUS.md,
            marginBottom:'20px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:'1px' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize:'11px', color:'#854F0B', lineHeight:1.6 }}>
              MY 지갑만 출금 가능. 받은 지갑(권한 자금)은 카드 결제만 가능합니다.
            </span>
          </div>

          {/* 출금 금액 */}
          <div style={{ textAlign:'center', marginBottom:'14px' }}>
            <div style={{ fontSize:'13px', color: COLORS.t4, marginBottom:'10px' }}>출금 금액</div>
            <AmountDisplay
              amount={amount}
              onChange={setAmount}
              onClear={() => setAmount('')}
              dangerOver={overBalance}
            />
            {overBalance && (
              <div style={{ fontSize:'11px', color: COLORS.danger, marginTop:'8px' }}>
                잔액 초과 · 최대 {MY_BALANCE.toLocaleString()}원
              </div>
            )}
          </div>

          {/* 빠른 금액 */}
          <div style={{ display:'flex', gap:'6px', marginBottom:'22px' }}>
            {[
              { label:'+10만', val:100000 },
              { label:'+50만', val:500000 },
              { label:'전액', val:'all' },
            ].map(b => (
              <button key={b.label}
                onClick={() => setAmount(b.val === 'all' ? String(MY_BALANCE) : String(amtNum + b.val))}
                style={{
                  flex:1, height:'36px',
                  background: b.val === 'all' ? theme.brand : COLORS.bgCard,
                  boxShadow: b.val === 'all' ? SHADOWS.buttonBrand : SHADOWS.card,
                  color: b.val === 'all' ? '#fff' : COLORS.t2,
                  border:'none', borderRadius:'10px',
                  fontSize:'12px', fontWeight: b.val === 'all' ? 700 : 600,
                  cursor:'pointer', fontFamily:'inherit',
                }}>
                {b.label}
              </button>
            ))}
          </div>

          {/* 입금 계좌 */}
          <div style={{ fontSize:'12px', fontWeight:700, color: COLORS.t3, marginBottom:'8px', padding:'0 4px' }}>
            입금 계좌
          </div>
          <div style={{
            background: COLORS.bgCard,
            boxShadow: SHADOWS.card,
            borderRadius: RADIUS.lg,
            padding:'14px 16px',
            display:'flex', alignItems:'center', gap:'12px',
            marginBottom:'20px',
          }}>
            <div style={{
              width:'34px', height:'34px',
              borderRadius:'9px',
              background: ACCOUNT.bankColor,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'10px', fontWeight:700, color:'#fff',
              flexShrink:0,
            }}>
              {ACCOUNT.bankCode}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'2px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1 }}>
                  {ACCOUNT.bank} {ACCOUNT.num}
                </span>
                <span style={{
                  padding:'1px 5px',
                  background:'#D1FAE5', color:'#047857',
                  borderRadius:'3px',
                  fontSize:'9px', fontWeight:700,
                }}>
                  본인 인증
                </span>
              </div>
              <div style={{ fontSize:'11px', color: COLORS.t4 }}>{ACCOUNT.name}</div>
            </div>
            <button style={{
              fontSize:'12px', fontWeight:600,
              color: theme.brand,
              background:'none', border:'none', cursor:'pointer', fontFamily:'inherit',
              flexShrink:0,
            }}>
              변경
            </button>
          </div>

          {/* 요약 */}
          <div style={{
            background: COLORS.bgCard,
            boxShadow: SHADOWS.card,
            borderRadius: RADIUS.lg,
            overflow:'hidden',
            marginBottom:'12px',
          }}>
            {[
              { label:'출금 금액', value: amtNum ? `${amtFmt}원` : '-' },
              { label:'수수료', value:'0원', success:true },
              { label:'예상 입금 시간', value:'즉시 (실시간)' },
              {
                label:'출금 후 MY 잔액',
                value: amtNum ? `${remaining.toLocaleString()}원` : `${MY_BALANCE.toLocaleString()}원`,
                bold:true, danger: overBalance,
              },
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
                  color: row.danger ? COLORS.danger
                       : row.success ? '#047857'
                       : COLORS.t1,
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
            ⓘ 본인 인증 계좌로만 출금 가능합니다 (전자금융거래법). 수수료 0원 · 5년 보관.
          </div>
        </div>
      </div>

      <div style={{
        padding:'12px 16px 24px',
        borderTop: `1px solid ${COLORS.borderSoft}`,
        background: COLORS.bgCard,
      }}>
        <button onClick={() => amtNum >= 1000 && !overBalance && setStep('confirm')}
          disabled={!(amtNum >= 1000 && !overBalance)}
          style={{
            width:'100%', height:'52px',
            background: amtNum >= 1000 && !overBalance ? theme.brand : COLORS.bgMuted,
            color: amtNum >= 1000 && !overBalance ? '#fff' : COLORS.t4,
            border:'none', borderRadius: RADIUS.md,
            fontSize:'15px', fontWeight:700,
            cursor: amtNum >= 1000 && !overBalance ? 'pointer' : 'default',
            fontFamily:'inherit',
            boxShadow: amtNum >= 1000 && !overBalance ? SHADOWS.buttonBrand : 'none',
          }}>
          {overBalance ? '잔액 초과' : amtNum >= 1000 ? '출금하기' : '금액을 입력하세요'}
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
          smallTitle="출금 확인"
          bigTitle={`${amtFmt}원`}
          sub={`MY 지갑 → ${ACCOUNT.bank} ${ACCOUNT.num}`}
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
              { label:'출금 금액', value:`${amtFmt}원`, bold:true },
              { label:'입금 계좌', value:`${ACCOUNT.bank} ${ACCOUNT.num}`, sub: ACCOUNT.name },
              { label:'출금 지갑', value:'MY 지갑' },
              { label:'수수료', value:'0원', success:true },
              { label:'예상 입금 시간', value:'즉시 (실시간)' },
              { label:'출금 후 MY 잔액', value:`${remaining.toLocaleString()}원`, bold:true },
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
            PIN 입력 후 즉시 처리됩니다. 본인 인증 계좌로만 출금 가능합니다 (전자금융거래법).
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
          출금하기
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
            <span style={{ fontSize:'12px', color: COLORS.t3 }}>MY 지갑 → {ACCOUNT.bank}</span>
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
            출금 완료!
          </div>
          <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)', lineHeight:1.7, padding:'0 24px' }}>
            <strong style={{ color:'#34D399' }}>{amtFmt}원</strong>이{' '}
            {ACCOUNT.bank} 계좌로 입금됐어요
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
              { label:'출금 금액', value:`-${amtFmt}원`, danger:true },
              { label:'입금 계좌', value:`${ACCOUNT.bank} ****${ACCOUNT.num.slice(-3)}` },
              { label:'출금 후 잔액', value:`${remaining.toLocaleString()}원`, bold:true },
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
                  color: row.danger ? COLORS.danger : COLORS.t1,
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
          한 번 더 출금
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
