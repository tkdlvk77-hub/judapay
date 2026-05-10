import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS, GRADIENTS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'
import { useT } from '../design/i18n'

// 데모 결제 로그 데이터 (확장)
// id가 PaymentDetail의 PAYMENTS 키와 일치해야 상세 매핑 됨
const ALL_LOGS = [
  // 오늘
  { id:'l1', name:'스타벅스 강남점', meta:'09:12', date:'2026-05-06', amount:-4500, type:'normal', emoji:'☕', mcc:'카페' },
  { id:'log_today_2', name:'CU 역삼점', meta:'07:45', date:'2026-05-06', amount:-3200, type:'normal', emoji:'🏪', mcc:'편의점' },

  // 어제
  { id:'l2', name:'서울시 교육비 지원', meta:'14:00', date:'2026-05-05', amount:200000, type:'plus', tag:'받은 자금', emoji:'↙', mcc:'정부 지원' },
  { id:'p1', name:'이마트 역삼점', meta:'14:32', date:'2026-05-05', amount:-32000, type:'normal', emoji:'🛒', mcc:'식료품' },
  { id:'log_y_3', name:'택시 카드결제', meta:'08:20', date:'2026-05-05', amount:-12500, type:'normal', emoji:'🚕', mcc:'교통' },

  // 이번 주
  { id:'log_w_1', name:'박민준에게 빌려줌', meta:'5월 4일', date:'2026-05-04', amount:-1000000, type:'normal', emoji:'↗', mcc:'개인 송금', tag:'빌려주기' },
  { id:'log_w_2', name:'올리브영 강남점', meta:'5월 3일', date:'2026-05-03', amount:-28900, type:'normal', emoji:'🧴', mcc:'생활' },

  // 지난 주 - 차단 케이스
  { id:'p2', name:'GS강남게임센터', meta:'4월 28일', date:'2026-04-28', amount:-150000, type:'blocked', emoji:'🎮', mcc:'오락/게임' },
  { id:'r1', name:'강남 룸살롱', meta:'4월 27일 23:41', date:'2026-04-27', amount:-89000, type:'risk', emoji:'🚨', mcc:'유흥/오락', riskReason:'MCC 차단 카테고리' },
  { id:'r2', name:'강원랜드 카지노', meta:'4월 26일 22:15', date:'2026-04-26', amount:-320000, type:'risk', emoji:'🚨', mcc:'도박', riskReason:'절대 차단 카테고리' },
  { id:'log_lw_2', name:'쿠팡 정기결제', meta:'4월 27일', date:'2026-04-27', amount:-29900, type:'normal', emoji:'📦', mcc:'쇼핑' },

  // 더 전
  { id:'log_old_1', name:'박철수 외주비 입금', meta:'4월 20일', date:'2026-04-20', amount:1500000, type:'plus', tag:'받은 자금', emoji:'↙', mcc:'외주비' },
  { id:'log_old_2', name:'이호형에게 송금', meta:'4월 18일', date:'2026-04-18', amount:-50000, type:'normal', emoji:'↗', mcc:'개인 송금', tag:'선물' },
]

// 날짜 그룹핑 헬퍼
function getGroup(dateStr) {
  const today = new Date('2026-05-06')
  const target = new Date(dateStr)
  const diffDays = Math.floor((today - target) / (1000*60*60*24))
  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays <= 7) return '이번 주'
  if (diffDays <= 14) return '지난 주'
  return '더 전'
}

const FILTER_TABS = [
  { id:'all',     label:'전체' },
  { id:'risk',    label:'위험' },
  { id:'blocked', label:'차단' },
  { id:'normal',  label:'정상' },
  { id:'plus',    label:'입금' },
]

// ─── 다크 헤더 ─────────────────────────
function DarkHeader({ smallTitle, count, onBack, onJustify, selectMode }) {
  const theme = getAccountTheme()
  return (
    <div style={{
      background: theme.headerGrad,
      paddingTop:'20px',
      paddingBottom:'18px',
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
        <button onClick={onJustify}
          style={{
            padding:'6px 14px',
            background: selectMode ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius:'20px', color: selectMode ? theme.brandDark : '#fff',
            fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
            display:'flex', alignItems:'center', gap:'5px',
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          소명요청
        </button>
      </div>

      <div style={{ padding:'0 20px' }}>
        <div style={{
          fontSize:'28px', fontWeight:700, color:'#fff',
          lineHeight:1.25, letterSpacing:'-1px',
        }}>
          결제 내역
        </div>
        <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.6)', marginTop:'4px' }}>
          전체 <strong style={{ color:'#fff' }}>{count}</strong>건
        </div>
      </div>
    </div>
  )
}

export default function PaymentLogs() {
  const theme = getAccountTheme()
  const t = useT()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState([])
  const [justifyModal, setJustifyModal] = useState(false)

  // 필터 + 검색 적용
  const filtered = useMemo(() => {
    return ALL_LOGS.filter(log => {
      // 필터
      if (filter !== 'all' && log.type !== filter) return false
      // 검색
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        if (!log.name.toLowerCase().includes(q) && !log.mcc?.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [filter, search])

  // 날짜 그룹핑
  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach(log => {
      const g = getGroup(log.date)
      if (!groups[g]) groups[g] = []
      groups[g].push(log)
    })
    return groups
  }, [filtered])

  const groupOrder = ['오늘', '어제', '이번 주', '지난 주', '더 전']
  const visibleGroups = groupOrder.filter(g => grouped[g]?.length > 0)

  // 카운트별 (필터 칩 옆에 표시)
  const counts = useMemo(() => ({
    all: ALL_LOGS.length,
    risk: ALL_LOGS.filter(l => l.type === 'risk').length,
    normal: ALL_LOGS.filter(l => l.type === 'normal').length,
    blocked: ALL_LOGS.filter(l => l.type === 'blocked').length,
    plus: ALL_LOGS.filter(l => l.type === 'plus').length,
  }), [])

  return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto' }}>
        <DarkHeader
          smallTitle="결제 내역"
          count={ALL_LOGS.length}
          onBack={() => navigate(-1)}
          selectMode={selectMode}
          onJustify={() => { setSelectMode(v => !v); setSelected([]) }}
        />

        <div style={{ padding:'18px 16px 24px' }}>


          {/* 선택 모드 바 */}
          {selectMode && (
            <div style={{
              background: COLORS.bgCard, boxShadow: SHADOWS.card,
              borderRadius: RADIUS.lg, padding:'10px 14px',
              display:'flex', alignItems:'center', gap:'10px',
              marginBottom:'12px',
            }}>
              <button onClick={() => {
                const allIds = filtered.map(l => l.id)
                setSelected(prev => prev.length === allIds.length ? [] : allIds)
              }}
                style={{
                  width:'22px', height:'22px', borderRadius:'7px', flexShrink:0,
                  border:`2px solid ${selected.length === filtered.length && filtered.length > 0 ? theme.brandDark : COLORS.borderSoft}`,
                  background: selected.length === filtered.length && filtered.length > 0 ? theme.brandDark : '#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', padding:0,
                }}>
                {selected.length === filtered.length && filtered.length > 0 && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
              <span style={{ flex:1, fontSize:'13px', color: COLORS.t2, fontWeight:600 }}>
                {selected.length > 0 ? `${selected.length}건 선택됨` : '전체 선택'}
              </span>
              {selected.length > 0 && (
                <button onClick={() => setJustifyModal(true)}
                  style={{
                    padding:'8px 16px',
                    background: theme.activeBtnGrad, border:'none',
                    borderRadius: RADIUS.pill, color:'#fff',
                    fontSize:'12px', fontWeight:700,
                    cursor:'pointer', fontFamily:'inherit',
                    boxShadow: theme.activeShadow,
                  }}>
                  💬 소명요청 {selected.length}건
                </button>
              )}
            </div>
          )}

          {/* 검색 input */}
          <div style={{
            background: COLORS.bgCard,
            boxShadow: SHADOWS.card,
            borderRadius: RADIUS.lg,
            padding:'12px 14px',
            display:'flex', alignItems:'center', gap:'10px',
            marginBottom:'14px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="가맹점·카테고리 검색"
              style={{
                flex:1, fontSize:'13px',
                color: COLORS.t1,
                background:'transparent', border:'none', outline:'none', fontFamily:'inherit',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{
                  width:'18px', height:'18px',
                  background: COLORS.bgMuted, border:'none', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', padding:0, flexShrink:0,
                }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* 필터 탭 (가로 스크롤) */}
          <div style={{
            display:'flex', gap:'6px',
            overflowX:'auto',
            paddingBottom:'4px',
            marginBottom:'14px',
            marginLeft:'-16px', marginRight:'-16px', paddingLeft:'16px', paddingRight:'16px',
            scrollbarWidth:'none',
          }}>
            {FILTER_TABS.map(tab => {
              const active = filter === tab.id
              const count = counts[tab.id] || 0
              return (
                <button key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  style={{
                    flexShrink:0,
                    padding:'8px 14px',
                    background: active ? theme.brandDark : COLORS.bgCard,
                    boxShadow: active ? SHADOWS.buttonBrand : SHADOWS.card,
                    color: active ? '#fff' : COLORS.t2,
                    border:'none',
                    borderRadius: RADIUS.pill,
                    fontSize:'12px', fontWeight: active ? 700 : 600,
                    cursor:'pointer', fontFamily:'inherit',
                    display:'flex', alignItems:'center', gap:'6px',
                  }}>
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize:'10px',
                    color: active ? 'rgba(255,255,255,0.7)' : COLORS.t4,
                    fontWeight:600,
                  }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 빈 상태 */}
          {filtered.length === 0 ? (
            <div style={{
              background: COLORS.bgCard,
              boxShadow: SHADOWS.card,
              borderRadius: RADIUS.lg,
              padding:'48px 20px',
              textAlign:'center',
            }}>
              <div style={{
                width:'56px', height:'56px',
                background: COLORS.bgMuted,
                borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 14px',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <div style={{ fontSize:'14px', fontWeight:700, color: COLORS.t2, marginBottom:'4px' }}>
                결과가 없어요
              </div>
              <div style={{ fontSize:'12px', color: COLORS.t4 }}>
                {search ? `"${search}" 검색 결과가 없어요` : '해당하는 결제 내역이 없어요'}
              </div>
            </div>
          ) : (
            // 그룹별 리스트
            visibleGroups.map(groupName => (
              <div key={groupName} style={{ marginBottom:'18px' }}>
                <div style={{
                  fontSize:'11px', fontWeight:700,
                  color: COLORS.t4,
                  marginBottom:'8px',
                  padding:'0 4px',
                  textTransform:'uppercase',
                  letterSpacing:'0.5px',
                }}>
                  {groupName} · {grouped[groupName].length}건
                </div>
                <div style={{
                  background: COLORS.bgCard,
                  boxShadow: SHADOWS.card,
                  borderRadius: RADIUS.lg,
                  overflow:'hidden',
                }}>
                  {grouped[groupName].map((log, i, arr) => {
                    const blocked = log.type === 'blocked'
                    const incoming = log.type === 'plus'
                    return (
                      <button key={log.id}
                        onClick={() => {
                          if (selectMode) {
                            setSelected(prev => prev.includes(log.id) ? prev.filter(x=>x!==log.id) : [...prev, log.id])
                          } else {
                            navigate(`/payments/${log.id}`)
                          }
                        }}
                        style={{
                          width:'100%', padding:'14px',
                          background: selectMode && selected.includes(log.id) ? theme.brandDark+'08' : 'transparent',
                          border:'none',
                          borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none',
                          display:'flex', alignItems:'center', gap:'12px',
                          cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                          transition:'background .1s',
                        }}>
                        {selectMode && (
                          <div style={{
                            width:'20px', height:'20px', borderRadius:'6px', flexShrink:0,
                            border:`2px solid ${selected.includes(log.id) ? theme.brandDark : COLORS.borderSoft}`,
                            background: selected.includes(log.id) ? theme.brandDark : '#fff',
                            display:'flex', alignItems:'center', justifyContent:'center',
                          }}>
                            {selected.includes(log.id) && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </div>
                        )}
                        <div style={{
                          width:'40px', height:'40px',
                          background: log.type==='risk' ? '#FEE2E2'
                                    : blocked ? COLORS.dangerBg
                                    : incoming ? '#D1FAE5'
                                    : COLORS.bgMuted,
                          borderRadius: RADIUS.md,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'17px',
                          color: log.type==='risk' ? '#DC2626'
                               : blocked ? '#B91C1C'
                               : incoming ? '#059669'
                               : COLORS.t3,
                          flexShrink:0,
                          position:'relative',
                        }}>
                          {log.emoji}
                          {blocked && (
                            <div style={{
                              position:'absolute',
                              right:'-3px', bottom:'-3px',
                              width:'18px', height:'18px',
                              borderRadius:'50%',
                              background: COLORS.danger,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              border:`2px solid ${COLORS.bgCard}`,
                            }}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{
                            display:'flex', alignItems:'center', gap:'6px',
                            marginBottom:'3px', flexWrap:'wrap',
                          }}>
                            <span style={{
                              fontSize:'13px', fontWeight:700,
                              color: blocked ? '#B91C1C' : COLORS.t1,
                            }}>
                              {log.name}
                            </span>
                            {log.tag && (
                              <span style={{
                                padding:'1px 6px',
                                background: incoming ? '#D1FAE5' : `${theme.brandDark}18`,
                                color: incoming ? '#047857' : '#7C3AED',
                                borderRadius:'3px',
                                fontSize:'9px', fontWeight:700,
                              }}>
                                {log.tag}
                              </span>
                            )}
                            {blocked && (
                              <span style={{
                                padding:'1px 6px',
                                background: COLORS.danger,
                                color:'#fff',
                                borderRadius:'3px',
                                fontSize:'9px', fontWeight:700,
                              }}>
                                차단됨
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize:'11px', color: COLORS.t4 }}>
                            {log.meta} · {log.mcc}
                          </div>
                        </div>
                        <span style={{
                          fontSize:'14px', fontWeight:700,
                          color: blocked ? COLORS.danger
                               : incoming ? '#10B981'
                               : COLORS.t2,
                          flexShrink:0,
                        }}>
                          {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString()}원
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 소명요청 모달 */}
      {justifyModal && (() => {
        const selLogs = filtered.filter(l => selected.includes(l.id))
        const recipients = [...new Set(selLogs.map(l => l.name))].slice(0,3).join(', ')
        return (
          <div style={{ position:'absolute', inset:0, zIndex:50, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
            <div onClick={() => setJustifyModal(false)} style={{ flex:1, background:'rgba(0,0,0,0.5)' }} />
            <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:'20px 20px 36px' }}>
              <div style={{ width:'36px', height:'4px', borderRadius:'2px', background:'#E5E7EB', margin:'0 auto 18px' }} />
              <div style={{ fontSize:'17px', fontWeight:700, color:COLORS.t1, marginBottom:'4px' }}>소명요청 메시지</div>
              <div style={{ fontSize:'12px', color:COLORS.t4, marginBottom:'14px' }}>
                {recipients} 외 · 플랫폼 메시지로 전송
              </div>
              <div style={{ background:COLORS.bg, borderRadius:RADIUS.md, padding:'10px 12px', marginBottom:'12px', maxHeight:'100px', overflowY:'auto' }}>
                {selLogs.map((l,i) => (
                  <div key={i} style={{ fontSize:'11px', color:COLORS.t2, padding:'2px 0', display:'flex', justifyContent:'space-between' }}>
                    <span>{l.name}</span>
                    <span style={{ fontWeight:700 }}>{Math.abs(l.amount).toLocaleString()}원</span>
                  </div>
                ))}
              </div>
              <textarea
                defaultValue={`[소명요청] 아래 ${selLogs.length}건의 결제에 대한 사용 목적 및 영수증을 소명해 주세요.`}
                style={{ width:'100%', height:'90px', padding:'12px', borderRadius:'12px', border:`1.5px solid ${COLORS.borderSoft}`, fontSize:'13px', color:COLORS.t1, fontFamily:'inherit', resize:'none', outline:'none', boxSizing:'border-box', lineHeight:1.6 }}
              />
              <div style={{ display:'flex', gap:'10px', marginTop:'12px' }}>
                <button onClick={() => setJustifyModal(false)}
                  style={{ flex:1, padding:'14px', background:COLORS.bgMuted, border:'none', borderRadius:'14px', fontSize:'14px', fontWeight:600, color:COLORS.t2, cursor:'pointer', fontFamily:'inherit' }}>
                  취소
                </button>
                <button onClick={() => { setJustifyModal(false); setSelectMode(false); setSelected([]) }}
                  style={{ flex:2, padding:'14px', background:theme.activeBtnGrad, border:'none', borderRadius:'14px', fontSize:'14px', fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'inherit', boxShadow:theme.activeShadow }}>
                  💬 메시지 발송
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </PhoneShell>
  )
}
