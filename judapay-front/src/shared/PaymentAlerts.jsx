import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'
import BottomTab from '../components/BottomTab'

// ─── 내 결제 데모 데이터 ─────────────────────────────────
const MY_PAYMENTS = [
  { id:'m1', name:'강남 사무실 임대료', meta:'오늘 09:00 · 법인 자금', amount:-5800000, status:'normal',  wallet:'법인 자금' },
  { id:'m2', name:'AWS 클라우드',       meta:'어제 15:22 · 법인 자금', amount:-847000,  status:'normal',  wallet:'법인 자금' },
  { id:'m3', name:'스타벅스 강남점',    meta:'오늘 09:12 · MY 지갑',   amount:-4500,   status:'normal',  wallet:'MY 지갑' },
  { id:'m4', name:'이마트 역삼점',      meta:'어제 14:32 · MY 지갑',   amount:-32000,  status:'normal',  wallet:'MY 지갑' },
  { id:'m5', name:'GS강남게임센터',     meta:'4.28 22:14 · MCC 차단',  amount:0,       status:'blocked', wallet:'MY 지갑' },
  { id:'m6', name:'올리브영',           meta:'4.27 16:44 · MY 지갑',   amount:-23000,  status:'normal',  wallet:'MY 지갑' },
]

// ─── 상대방 결제 데모 데이터 ─────────────────────────────
const OTHER_PAYMENTS = [
  { id:'o1', name:'박민준',   category:'카페',    amount:4500,   meta:'방금',    fund:'외주비',   status:'normal'  },
  { id:'o2', name:'㈜오로라',  category:'사무용품',amount:89000,  meta:'오늘',    fund:'투자',     status:'normal'  },
  { id:'o3', name:'이민형',   category:'편의점',  amount:3200,   meta:'오늘',    fund:'대여금',   status:'normal'  },
  { id:'o4', name:'㈜오로라',  category:'카지노',  amount:89000,  meta:'어제',    fund:'투자',     status:'blocked' },
  { id:'o5', name:'박민준',   category:'마트',    amount:52000,  meta:'어제',    fund:'외주비',   status:'normal'  },
  { id:'o6', name:'서울시청', category:'의료',    amount:18000,  meta:'4.29',    fund:'자금 지원',status:'normal'  },
  { id:'o7', name:'이민형',   category:'주류',    amount:34000,  meta:'4.28',    fund:'대여금',   status:'blocked' },
  { id:'o8', name:'㈜오로라',  category:'장비',    amount:450000, meta:'4.27',    fund:'투자',     status:'normal'  },
]

const OTHER_FUND_FILTERS = ['전체', '외주비', '투자', '대여금', '자금 지원']

function fmt(n) { return Number(Math.abs(n) || 0).toLocaleString('ko-KR') }

const BlockSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
)
const CardSvg = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="13" rx="2"/><line x1="2" y1="11" x2="22" y2="11"/>
  </svg>
)

export default function PaymentAlerts() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = getAccountTheme()

  // URL hash로 초기 탭 결정 (#other → 상대방 탭)
  const [activeTab, setActiveTab] = useState(
    location.hash === '#other' ? 'other' : 'mine'
  )
  const [fundFilter, setFundFilter] = useState('전체')
  const [onlyBlocked, setOnlyBlocked] = useState(false)

  const myBlocked  = MY_PAYMENTS.filter(p => p.status === 'blocked').length
  const othBlocked = OTHER_PAYMENTS.filter(p => p.status === 'blocked').length
  const totalBlocked = myBlocked + othBlocked

  const filteredMine = MY_PAYMENTS
    .filter(p => !onlyBlocked || p.status === 'blocked')

  const filteredOther = OTHER_PAYMENTS
    .filter(p => fundFilter === '전체' || p.fund === fundFilter)
    .filter(p => !onlyBlocked || p.status === 'blocked')

  return (
    <PhoneShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* ── 헤더 ── */}
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'0', flexShrink:0 }}>
          {/* 타이틀 행 */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 12px' }}>
            <button onClick={() => navigate(-1)} style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'17px', fontWeight:700, color:'#fff' }}>결제 알림</div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'1px' }}>내 결제 + 상대방 사용 내역</div>
            </div>
            {totalBlocked > 0 && (
              <button onClick={() => setOnlyBlocked(v => !v)} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px', background: onlyBlocked ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.2)', border:`1px solid ${onlyBlocked ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.35)'}`, borderRadius:'20px', cursor:'pointer', fontFamily:'inherit' }}>
                <span style={{ fontSize:'13px' }}>🚫</span>
                <span style={{ fontSize:'11px', fontWeight:700, color:'#FCA5A5' }}>차단 {totalBlocked}건</span>
              </button>
            )}
          </div>

          {/* 탭 */}
          <div style={{ display:'flex', padding:'0 16px' }}>
            {[
              { key:'mine',  label:'내 결제',    count: myBlocked },
              { key:'other', label:'상대방 결제', count: othBlocked },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex:1, padding:'10px 0', background:'none', border:'none', borderBottom: activeTab===tab.key ? '2px solid #fff' : '2px solid rgba(255,255,255,0.15)', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                <span style={{ fontSize:'13px', fontWeight: activeTab===tab.key ? 700 : 500, color: activeTab===tab.key ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                  {tab.label}
                </span>
                {tab.count > 0 && (
                  <span style={{ padding:'1px 6px', background:'rgba(239,68,68,0.35)', color:'#FCA5A5', borderRadius:'8px', fontSize:'10px', fontWeight:700 }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── 내 결제 탭 ── */}
        {activeTab === 'mine' && (
          <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>
            <div style={{ padding:'12px 16px 32px', display:'flex', flexDirection:'column', gap:'8px' }}>
              {filteredMine.length === 0 ? (
                <div style={{ padding:'60px 0', textAlign:'center', color: COLORS.t4, fontSize:'14px' }}>차단 내역이 없어요</div>
              ) : filteredMine.map((p, i) => {
                const blocked = p.status === 'blocked'
                return (
                  <button key={p.id} onClick={() => !blocked && navigate('/payments/'+p.id)} style={{ width:'100%', background: COLORS.bgCard, boxShadow: SHADOWS.card, borderRadius: RADIUS.lg, padding:'13px 14px', display:'flex', alignItems:'center', gap:'12px', border: blocked ? '1px solid #FECACA' : 'none', cursor: blocked ? 'default' : 'pointer', fontFamily:'inherit', textAlign:'left' }}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'11px', background: blocked ? '#FEE2E2' : COLORS.bgMuted, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {blocked ? <BlockSvg /> : <CardSvg color={COLORS.t3} />}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color: blocked ? '#DC2626' : COLORS.t1, marginBottom:'3px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ fontSize:'11px', color: COLORS.t4 }}>{p.meta.split(' · ')[0]}</span>
                        <span style={{ fontSize:'11px', padding:'1px 6px', background: COLORS.bgMuted, color: COLORS.t3, borderRadius:'4px' }}>{p.wallet}</span>
                      </div>
                    </div>
                    {blocked
                      ? <span style={{ padding:'3px 10px', borderRadius:'8px', background:'#FEE2E2', color:'#DC2626', fontSize:'11px', fontWeight:700, flexShrink:0 }}>차단</span>
                      : <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1, flexShrink:0 }}>-{fmt(p.amount)}원</span>
                    }
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 상대방 결제 탭 ── */}
        {activeTab === 'other' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {/* 자금 종류 필터 */}
            <div style={{ background: COLORS.bgCard, borderBottom:`1px solid ${COLORS.borderSoft}`, padding:'10px 16px', display:'flex', gap:'6px', overflowX:'auto', flexShrink:0 }}>
              {OTHER_FUND_FILTERS.map(f => (
                <button key={f} onClick={() => setFundFilter(f)} style={{ flexShrink:0, padding:'5px 13px', background: fundFilter===f ? theme.brandDark : COLORS.bgMuted, color: fundFilter===f ? '#fff' : COLORS.t3, border:'none', borderRadius: RADIUS.pill, fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
                  {f}
                </button>
              ))}
            </div>

            <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>
              <div style={{ padding:'12px 16px 32px', display:'flex', flexDirection:'column', gap:'8px' }}>
                {filteredOther.length === 0 ? (
                  <div style={{ padding:'60px 0', textAlign:'center', color: COLORS.t4, fontSize:'14px' }}>해당 내역이 없어요</div>
                ) : filteredOther.map(p => {
                  const blocked = p.status === 'blocked'
                  return (
                    <div key={p.id} style={{ background: COLORS.bgCard, boxShadow: SHADOWS.card, borderRadius: RADIUS.lg, padding:'14px', display:'flex', alignItems:'center', gap:'12px', border: blocked ? '1px solid #FECACA' : 'none' }}>
                      <div style={{ width:'38px', height:'38px', borderRadius:'11px', background: blocked ? '#FEE2E2' : `${theme.brandDark}12`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color: blocked ? '#DC2626' : theme.brandDark, flexShrink:0 }}>
                        {p.name[0]}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                          <span style={{ fontSize:'13px', fontWeight:600, color: blocked ? '#DC2626' : COLORS.t1 }}>{p.name}</span>
                          <span style={{ fontSize:'11px', padding:'1px 6px', borderRadius:'4px', background: blocked ? '#FEE2E2' : COLORS.bgMuted, color: blocked ? '#DC2626' : COLORS.t3, fontWeight:500 }}>
                            {blocked ? '🚫 ' : ''}{p.category}
                          </span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          <span style={{ fontSize:'11px', padding:'1px 6px', borderRadius:'4px', background:`${theme.brandDark}12`, color: theme.brandDark, fontWeight:600 }}>{p.fund}</span>
                          <span style={{ fontSize:'11px', color: COLORS.t4 }}>{p.meta}</span>
                        </div>
                      </div>
                      {blocked
                        ? (
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            <div style={{ padding:'3px 10px', borderRadius:'8px', background:'#FEE2E2', color:'#DC2626', fontSize:'11px', fontWeight:700, marginBottom:'2px' }}>차단됨</div>
                            <div style={{ fontSize:'11px', color:'#DC2626' }}>{fmt(p.amount)}원 시도</div>
                          </div>
                        ) : (
                          <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1, flexShrink:0 }}>{fmt(p.amount)}원</span>
                        )
                      }
                    </div>
                  )
                })}

                <div style={{ background: COLORS.bgMuted, borderRadius: RADIUS.md, padding:'12px 14px', marginTop:'4px' }}>
                  <div style={{ fontSize:'11px', color: COLORS.t4, lineHeight:1.6, textAlign:'center' }}>
                    🔒 상대방의 정확한 가맹점명은 단계형 공개 정책에 따라 보호됩니다
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <BottomTab />
    </PhoneShell>
  )
}
