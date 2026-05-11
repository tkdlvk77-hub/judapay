import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { getAccountTheme } from '../design/accountTokens'
import BottomTab from '../components/BottomTab'

// ─── 데이터 ───────────────────────────────────────────────
// type: 'mine' | 'external' | 'auto' | 'anomaly'
// status: 'normal' | 'blocked' | 'incoming'
// category: string | null (null = 미분류)
// categoryAuto: true = 자동추천
const ALL_PAYMENTS = [
  { id:'a1',   type:'anomaly',  status:'blocked',  merchant:'㈜오로라 · MCC 차단',    amount:0,        time:'방금',       user:'㈜오로라', wallet:'투자 자금',    card:'-',     category:null,    categoryAuto:false },
  { id:'pay7', type:'external', status:'normal',   merchant:'카페 결제',               amount:-4500,    time:'오늘 09:05', user:'박민준',   wallet:'외주비',       card:'-',     category:'카페',   categoryAuto:true  },
  { id:'a2',   type:'auto',     status:'normal',   merchant:'강남 임대료',             amount:-5800000, time:'오늘 09:00', user:'자동',     wallet:'법인 자금',    card:'주 카드', category:'임대료',  categoryAuto:true  },
  { id:'pay3', type:'mine',     status:'normal',   merchant:'스타벅스 강남점',         amount:-4500,    time:'오늘 09:12', user:'나',       wallet:'MY 지갑',      card:'주 카드', category:null,    categoryAuto:false },
  { id:'pay8', type:'external', status:'normal',   merchant:'사무용품 구매',           amount:-89000,   time:'오늘 11:30', user:'㈜오로라', wallet:'투자',         card:'-',     category:'사무용품', categoryAuto:true  },
  { id:'pay4', type:'mine',     status:'normal',   merchant:'이마트 역삼점',           amount:-32000,   time:'어제 14:32', user:'나',       wallet:'MY 지갑',      card:'주 카드', category:null,    categoryAuto:false },
  { id:'pay2', type:'auto',     status:'normal',   merchant:'AWS 클라우드',            amount:-847000,  time:'어제 15:22', user:'자동',     wallet:'법인 자금',    card:'법인카드B', category:'서버비', categoryAuto:true  },
  { id:'pay9', type:'external', status:'normal',   merchant:'편의점 결제',             amount:-3200,    time:'어제 18:44', user:'이민형',   wallet:'대여금',       card:'-',     category:'편의점',  categoryAuto:true  },
  { id:'pay5', type:'anomaly',  status:'blocked',  merchant:'GS강남게임센터',          amount:0,        time:'4.28 22:14', user:'나',       wallet:'MY 지갑',      card:'주 카드', category:null,    categoryAuto:false },
  { id:'a3',   type:'anomaly',  status:'blocked',  merchant:'카지노 결제 시도',        amount:0,        time:'4.29 23:11', user:'㈜오로라', wallet:'투자',         card:'-',     category:null,    categoryAuto:false },
  { id:'pay11',type:'external', status:'normal',   merchant:'마트 결제',               amount:-52000,   time:'4.29 10:20', user:'박민준',   wallet:'외주비',       card:'-',     category:'식료품',  categoryAuto:true  },
  { id:'pay6', type:'mine',     status:'normal',   merchant:'올리브영 강남점',         amount:-23000,   time:'4.27 16:44', user:'나',       wallet:'MY 지갑',      card:'주 카드', category:'생활비',  categoryAuto:false },
  { id:'pay12',type:'external', status:'normal',   merchant:'의료 결제',               amount:-18000,   time:'4.27 11:00', user:'서울시청', wallet:'자금 지원',    card:'-',     category:'의료비',  categoryAuto:true  },
  { id:'a4',   type:'anomaly',  status:'blocked',  merchant:'주류 구매 시도',          amount:0,        time:'4.28 01:33', user:'이민형',   wallet:'대여금',       card:'-',     category:null,    categoryAuto:false },
  { id:'pay14',type:'external', status:'normal',   merchant:'장비 구매',               amount:-450000,  time:'4.27 15:00', user:'㈜오로라', wallet:'투자',         card:'-',     category:'장비',    categoryAuto:true  },
  { id:'pay13',type:'auto',     status:'normal',   merchant:'쿠팡 구독 자동결제',      amount:-29900,   time:'4.27 03:00', user:'자동',     wallet:'법인 자금',    card:'법인카드B', category:'구독료', categoryAuto:true  },
]

const TABS = [
  { key:'all',      label:'전체' },
  { key:'mine',     label:'내 결제' },
  { key:'external', label:'외부 사용' },
  { key:'auto',     label:'자동 결제' },
  { key:'anomaly',  label:'이상 거래' },
]

const PURPOSE_OPTIONS = ['운영', '출장식대', '복리후생', '기타', '개인사용']

const CARD_STYLE = {
  background:'#FFFFFF',
  borderRadius:'14px',
  border:'1px solid #E9EAEC',
  overflow:'hidden',
}

function fmt(n) { return Math.abs(n).toLocaleString('ko-KR') }

// ─── 카테고리 태그 ────────────────────────────────────────
function CategoryTag({ item, override, onClassify }) {
  const cat = override ?? item.category
  const isAuto = !override && item.categoryAuto
  const isUnclassified = cat === null
  const isBlocked = item.status === 'blocked'
  if (isBlocked) return null

  if (isUnclassified) {
    return (
      <button onClick={e => { e.stopPropagation(); onClassify(item) }}
        style={{ display:'inline-flex', alignItems:'center', gap:'4px',
          padding:'2px 8px', borderRadius:'5px',
          background:'#FFFBEB', border:'1px solid #FDE68A',
          fontSize:'10px', fontWeight:700, color:'#92400E',
          cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
        ⚠ 미분류 · 분류하기
      </button>
    )
  }
  if (isAuto) {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'3px',
        padding:'2px 8px', borderRadius:'5px',
        background:'#F0FDF4', border:'1px solid #BBF7D0',
        fontSize:'10px', fontWeight:700, color:'#047857', flexShrink:0 }}>
        ✦ {cat} · 자동
      </span>
    )
  }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'3px',
      padding:'2px 8px', borderRadius:'5px',
      background:'#EFF6FF', border:'1px solid #BFDBFE',
      fontSize:'10px', fontWeight:700, color:'#1D4ED8', flexShrink:0 }}>
      ✓ {cat}
    </span>
  )
}

// ─── 결제 리스트 아이템 ───────────────────────────────────
function PaymentRow({ item, override, onClassify, onClick, theme, selectMode, isSelected, onToggle }) {
  const isBlocked  = item.status === 'blocked'
  const isIncoming = item.status === 'incoming'
  const isExternal = item.type === 'external'
  const hasExternalUser = isExternal && item.user && item.user !== '나' && item.user !== '자동'

  const dotColor = isBlocked ? '#EF4444' : isIncoming ? '#10B981' : '#D1D5DB'

  const amountColor = isBlocked ? '#DC2626' : isIncoming ? '#047857' : '#111827'
  const amountText  = isBlocked
    ? 'MCC 차단'
    : isIncoming
    ? `+${fmt(item.amount)}원`
    : `-${fmt(item.amount)}원`

  // 서브 정보 파츠 — 사용자는 별도 렌더링하므로 제외
  const subParts = [item.time]
  if (item.wallet && item.wallet !== '-') subParts.push(item.wallet)
  if (item.card && item.card !== '-') subParts.push(item.card)

  // 외부 사용자가 아닌 경우엔 기존대로 user도 포함
  if (!hasExternalUser && item.user !== '나' && item.user !== '자동') subParts.splice(1, 0, item.user)

  const handleClick = () => {
    if (selectMode) { onToggle(item.id); return }
    onClick()
  }

  return (
    <button onClick={handleClick}
      style={{ width:'100%', padding:'12px 16px', background: isSelected ? '#F0F6FF' : 'transparent',
        border:'none', borderBottom:'1px solid #F0F1F3',
        display:'flex', alignItems:'center', gap:'10px',
        cursor:'pointer', fontFamily:'inherit', textAlign:'left',
        transition:'background 0.1s' }}>

      {/* 선택 체크박스 */}
      {selectMode && (
        <div style={{ width:'22px', height:'22px', borderRadius:'7px', flexShrink:0,
          border:`2px solid ${isSelected ? theme.brandDark : '#D1D5DB'}`,
          background: isSelected ? theme.brandDark : '#fff',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          {isSelected && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
      )}

      {/* 상태 도트 */}
      <div style={{ width:'6px', height:'6px', borderRadius:'50%', flexShrink:0,
        background: dotColor }} />

      {/* 메인 콘텐츠 — 2줄 레이아웃 */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* 1줄: 가맹점명(좌) + 금액(우) */}
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:'8px', marginBottom:'4px' }}>
          <span style={{ fontSize:'13px', fontWeight:600,
            color: isBlocked ? '#DC2626' : '#111827',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
            {item.merchant}
          </span>
          <span style={{ fontSize:'13px', fontWeight:700, color: amountColor, flexShrink:0 }}>
            {amountText}
          </span>
        </div>
        {/* 2줄: 사용자명(브랜드 컬러) + 서브정보(좌) + 카테고리 태그(우) */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', flex:1, minWidth:0,
            overflow:'hidden' }}>
            {hasExternalUser && (
              <>
                <span style={{ fontSize:'11px', fontWeight:700,
                  color: theme.brandDark, flexShrink:0 }}>
                  {item.user}
                </span>
                {subParts.length > 0 && (
                  <span style={{ fontSize:'11px', color:'#D1D5DB', flexShrink:0 }}>·</span>
                )}
              </>
            )}
            <span style={{ fontSize:'11px', color:'#9CA3AF',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {subParts.join(' · ')}
            </span>
          </div>
          {!isBlocked && (
            <div style={{ flexShrink:0 }}>
              <CategoryTag item={item} override={override} onClassify={onClassify} />
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── 분류 바텀시트 ────────────────────────────────────────
function ClassifySheet({ target, onSelect, onClose }) {
  if (!target) return null
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', zIndex:300,
      display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'20px 16px 36px' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width:'36px', height:'4px', background:'#E9EAEC', borderRadius:'2px', margin:'0 auto 18px' }} />
        <div style={{ fontSize:'15px', fontWeight:700, color:'#111827', marginBottom:'4px' }}>결제 목적 분류</div>
        <div style={{ fontSize:'12px', color:'#9CA3AF', marginBottom:'16px' }}>{target.merchant}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'8px' }}>
          {PURPOSE_OPTIONS.map((opt, i) => (
            <button key={opt} onClick={() => onSelect(target.id, opt)}
              style={{ padding:'14px 0', background:'#F4F5F7', border:'1px solid #E9EAEC',
                borderRadius:'10px', fontSize:'14px', fontWeight:600, color:'#374151',
                cursor:'pointer', fontFamily:'inherit', textAlign:'center',
                gridColumn: i === PURPOSE_OPTIONS.length - 1 && PURPOSE_OPTIONS.length % 2 === 1 ? 'span 2' : undefined }}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 메인 ─────────────────────────────────────────────────
export default function PaymentAlerts() {
  const navigate = useNavigate()
  const theme = getAccountTheme()

  const [activeTab, setActiveTab] = useState('all')
  const [purposeOverrides, setPurposeOverrides] = useState({})
  const [classifyTarget, setClassifyTarget] = useState(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState([])
  const [justifyModal, setJustifyModal] = useState(false)
  const [justifyMsg, setJustifyMsg] = useState('')
  const [toast, setToast] = useState(null)

  const toggleSelect = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )
  const toggleAll = () => {
    const allIds = filtered.map(p => p.id)
    setSelected(prev => prev.length === allIds.length ? [] : allIds)
  }
  const openJustify = () => {
    const selItems = filtered.filter(p => selected.includes(p.id))
    const names = [...new Set(selItems.map(p => p.user))].filter(Boolean).slice(0,3).join(', ')
    setJustifyMsg(`[소명요청] 아래 ${selItems.length}건의 결제에 대한 사용 목적 및 영수증을 소명해 주세요.`)
    setJustifyModal(true)
  }
  const handleJustifySend = () => {
    setJustifyModal(false)
    setSelectMode(false)
    setSelected([])
    setToast('💬 소명요청 메시지 발송 완료')
    setTimeout(() => setToast(null), 2400)
  }

  // 탭별 필터
  const filtered = ALL_PAYMENTS.filter(p => {
    if (activeTab === 'all') return true
    return p.type === activeTab
  })

  const totalBlocked = ALL_PAYMENTS.filter(p => p.status === 'blocked').length
  const unclassified = ALL_PAYMENTS.filter(p =>
    !p.categoryAuto && p.category === null && !purposeOverrides[p.id] && p.status !== 'blocked'
  ).length

  const handleClassify = (id, value) => {
    setPurposeOverrides(prev => ({ ...prev, [id]: value }))
    setClassifyTarget(null)
  }

  return (
    <PhoneShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>

        {/* ── 헤더 ── */}
        <div style={{ background: theme.headerGrad, flexShrink:0, paddingTop:'20px', paddingBottom:'0' }}>
          {/* 상단 행: 백버튼 + 소명요청 */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 18px' }}>
            <button onClick={() => navigate(-1)}
              style={{ width:'32px', height:'32px',
                background:'transparent', border:'none',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', padding:0, flexShrink:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span style={{ fontSize:'15px', fontWeight:600, color:'#fff', flex:1 }}>
              실시간 결제
            </span>
            {/* 소명요청 버튼 */}
            <button onClick={() => { setSelectMode(v => !v); setSelected([]) }}
              style={{ padding:'6px 14px', flexShrink:0,
                background: selectMode ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.18)',
                border:'1px solid rgba(255,255,255,0.3)', borderRadius:'20px',
                color: selectMode ? theme.brandDark : '#fff',
                fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', gap:'5px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              소명요청
            </button>
          </div>

          {/* 큰 타이틀 영역 */}
          <div style={{ padding:'0 20px 18px' }}>
            <div style={{ fontSize:'28px', fontWeight:700, color:'#fff', lineHeight:1.25, letterSpacing:'-1px' }}>
              실시간 결제
            </div>
            <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.6)', marginTop:'4px' }}>
              전체 <strong style={{ color:'#fff' }}>{ALL_PAYMENTS.length}</strong>건
              {totalBlocked > 0 && <span style={{ color:'#FCA5A5', fontWeight:600 }}> · 차단 {totalBlocked}건</span>}
              {unclassified > 0 && <span style={{ color:'#FDE68A', fontWeight:600 }}> · 미분류 {unclassified}건</span>}
            </div>
          </div>

          {/* 탭 바 */}
          <div style={{ display:'flex', overflowX:'auto', padding:'0 16px',
            scrollbarWidth:'none', msOverflowStyle:'none' }}>
            {TABS.map(tab => {
              const count = tab.key === 'anomaly'
                ? ALL_PAYMENTS.filter(p => p.type === 'anomaly').length : 0
              const isActive = activeTab === tab.key
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{ flexShrink:0, padding:'10px 14px',
                    background:'none', border:'none',
                    borderBottom: isActive ? '2px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                    cursor:'pointer', fontFamily:'inherit',
                    display:'flex', alignItems:'center', gap:'5px' }}>
                  <span style={{ fontSize:'13px', fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                    {tab.label}
                  </span>
                  {tab.key === 'anomaly' && count > 0 && (
                    <span style={{ fontSize:'10px', fontWeight:700, color:'#FCA5A5',
                      background:'rgba(239,68,68,0.25)', padding:'1px 6px', borderRadius:'10px' }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 선택 모드 바 ── */}
        {selectMode && (
          <div style={{ background:'#fff', borderBottom:'1px solid #F0F1F3',
            padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
            <button onClick={toggleAll}
              style={{ width:'22px', height:'22px', borderRadius:'7px', flexShrink:0,
                border:`2px solid ${selected.length === filtered.length && filtered.length > 0 ? theme.brandDark : '#D1D5DB'}`,
                background: selected.length === filtered.length && filtered.length > 0 ? theme.brandDark : '#fff',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', padding:0 }}>
              {selected.length === filtered.length && filtered.length > 0 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
            <span style={{ flex:1, fontSize:'13px', color:'#374151', fontWeight:600 }}>
              {selected.length > 0 ? `${selected.length}건 선택됨` : '전체 선택'}
            </span>
            {selected.length > 0 && (
              <button onClick={openJustify}
                style={{ padding:'8px 16px', background: theme.activeBtnGrad, border:'none',
                  borderRadius:'20px', color:'#fff', fontSize:'12px', fontWeight:700,
                  cursor:'pointer', fontFamily:'inherit', boxShadow: theme.activeShadow }}>
                💬 소명요청 {selected.length}건
              </button>
            )}
          </div>
        )}

        {/* ── 리스트 ── */}
        <div style={{ flex:1, overflowY:'auto', background:'#F4F5F7', padding:'10px 14px 80px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding:'60px 0', textAlign:'center', color:'#9CA3AF', fontSize:'14px' }}>
              해당 내역이 없어요
            </div>
          ) : (
            <div style={CARD_STYLE}>
              {filtered.map((item, i) => (
                <PaymentRow
                  key={item.id}
                  item={item}
                  override={purposeOverrides[item.id] ?? null}
                  onClassify={setClassifyTarget}
                  onClick={() => navigate('/payments/' + item.id)}
                  theme={theme}
                  selectMode={selectMode}
                  isSelected={selected.includes(item.id)}
                  onToggle={toggleSelect}
                />
              ))}
              {/* 마지막 행 border 제거 */}
              <style>{`.payment-last { border-bottom: none !important; }`}</style>
            </div>
          )}

          {/* 외부 결제 안내 */}
          {(activeTab === 'all' || activeTab === 'external') && (
            <div style={{ marginTop:'10px', padding:'12px 16px', background:'#FFFFFF',
              borderRadius:'12px', border:'1px solid #E9EAEC' }}>
              <div style={{ fontSize:'11px', color:'#9CA3AF', lineHeight:1.6, textAlign:'center' }}>
                🔒 외부 사용자의 정확한 가맹점명은 단계형 공개 정책에 따라 보호됩니다
              </div>
            </div>
          )}
        </div>

        {/* ── 분류 바텀시트 ── */}
        <ClassifySheet
          target={classifyTarget}
          onSelect={handleClassify}
          onClose={() => setClassifyTarget(null)}
        />

        {/* ── 소명요청 모달 ── */}
        {justifyModal && (() => {
          const selItems = filtered.filter(p => selected.includes(p.id))
          return (
            <div style={{ position:'absolute', inset:0, zIndex:400,
              display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              <div onClick={() => setJustifyModal(false)}
                style={{ flex:1, background:'rgba(0,0,0,0.5)' }} />
              <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:'20px 20px 36px' }}>
                {/* 핸들 */}
                <div style={{ width:'36px', height:'4px', borderRadius:'2px',
                  background:'#E5E7EB', margin:'0 auto 18px' }} />
                <div style={{ fontSize:'17px', fontWeight:700, color:'#111827', marginBottom:'4px' }}>
                  소명요청 메시지
                </div>
                <div style={{ fontSize:'12px', color:'#9CA3AF', marginBottom:'14px' }}>
                  {[...new Set(selItems.map(p => p.user))].filter(Boolean).slice(0,3).join(', ')} · 플랫폼 메시지로 전송
                </div>
                {/* 선택된 항목 목록 */}
                <div style={{ background:'#F8F9FF', borderRadius:'10px',
                  padding:'10px 12px', marginBottom:'12px', maxHeight:'100px', overflowY:'auto' }}>
                  {selItems.map((p, i) => (
                    <div key={i} style={{ fontSize:'11px', color:'#374151',
                      padding:'2px 0', display:'flex', justifyContent:'space-between' }}>
                      <span>{p.merchant}</span>
                      <span style={{ fontWeight:700, color:'#111827' }}>
                        {p.amount === 0 ? 'MCC 차단' : `${Math.abs(p.amount).toLocaleString()}원`}
                      </span>
                    </div>
                  ))}
                </div>
                {/* 메시지 textarea */}
                <textarea value={justifyMsg} onChange={e => setJustifyMsg(e.target.value)}
                  style={{ width:'100%', height:'90px', padding:'12px', borderRadius:'12px',
                    border:'1.5px solid #E9EAEC', fontSize:'13px', color:'#111827',
                    fontFamily:'inherit', resize:'none', outline:'none',
                    boxSizing:'border-box', lineHeight:1.6, background:'#F8F9FF' }} />
                {/* 버튼 */}
                <div style={{ display:'flex', gap:'10px', marginTop:'12px' }}>
                  <button onClick={() => setJustifyModal(false)}
                    style={{ flex:1, padding:'14px', background:'#F4F5F7', border:'none',
                      borderRadius:'14px', fontSize:'14px', fontWeight:600, color:'#374151',
                      cursor:'pointer', fontFamily:'inherit' }}>
                    취소
                  </button>
                  <button onClick={handleJustifySend}
                    style={{ flex:2, padding:'14px', background: theme.activeBtnGrad, border:'none',
                      borderRadius:'14px', fontSize:'14px', fontWeight:700, color:'#fff',
                      cursor:'pointer', fontFamily:'inherit', boxShadow: theme.activeShadow }}>
                    💬 메시지 발송
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── 토스트 ── */}
        {toast && (
          <div style={{ position:'absolute', bottom:'90px', left:'50%', transform:'translateX(-50%)',
            background:'#111827', color:'#fff', padding:'9px 18px', borderRadius:'20px',
            fontSize:'12px', fontWeight:600, whiteSpace:'nowrap', zIndex:500,
            boxShadow:'0 4px 20px rgba(0,0,0,0.25)' }}>
            {toast}
          </div>
        )}
      </div>

      <BottomTab />
    </PhoneShell>
  )
}
