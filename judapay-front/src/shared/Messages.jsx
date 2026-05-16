import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import BottomTab from '../components/BottomTab'
import {
  PhoneShell, GradientHeader, PageTitle, Badge, FilterChips,
} from '../design/components'
import { COLORS, RADIUS, progressGradient } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'
import { useUser } from '../contexts/UserContext'
import { getMyMessageThreads } from './transactionStore'
import { useStoreData } from '../hooks/useStoreData'
import { getAllApprovalMsgs } from './approvalMessageBus'

import { THREADS, CHATS } from './messages/messagesData'
import { getCurrentUserId, adaptStoreThread, adaptStoreChat, shortStatusLabel } from './messages/messagesUtils'
import ChatRoom from './messages/ChatRoom'
import DetailScreen from './messages/DetailScreen'

// ─── 메인 컴포넌트 ───
export default function Messages() {
  const theme = getAccountTheme()
  const location = useLocation()
  const { userType } = useUser()
  const currentUserId = getCurrentUserId(userType)

  const [activeThread, setActiveThread] = useState(null)
  const [showDetail, setShowDetail]     = useState(false)
  const [filter, setFilter]             = useState('전체')
  // 결제 상세에서 소명요청 클릭 시 전달되는 채팅 자동 전송 메시지
  const [pendingPrefillMsg, setPendingPrefillMsg] = useState(location.state?.prefillMsg || null)

  // 외부에서 특정 스레드 자동 진입 (e.g. ApprovalCenter 검수 요청 전송 후)
  useEffect(() => {
    if (location.state?.threadId) {
      setActiveThread(location.state.threadId)
      setShowDetail(false)
    }
    if (location.state?.prefillMsg) {
      setPendingPrefillMsg(location.state.prefillMsg)
    }
  }, [location.state?.threadId, location.state?.prefillMsg])

  // store에서 본인 스레드 구독
  const storeThreadGroups = useStoreData(
    () => getMyMessageThreads({ userId: currentUserId })
  )

  // store thread → 카드 형태 변환
  const storeThreads = storeThreadGroups.map(adaptStoreThread).filter(Boolean)

  // 합쳐진 스레드 목록: 미읽음 우선 → 시간 역순 (개인은 처리센터 알림 제외)
  const baseThreads = [...storeThreads, ...THREADS]
    .filter(t => !(userType === 'personal' && t.id === 'approval'))
  const allThreads = baseThreads.sort((a, b) => {
    if ((a.unread > 0) !== (b.unread > 0)) return a.unread > 0 ? -1 : 1
    if (a._fromStore && b._fromStore) return new Date(b._createdAt) - new Date(a._createdAt)
    if (a._fromStore && !b._fromStore) return -1
    if (!a._fromStore && b._fromStore) return 1
    return 0
  })

  // ── 필터 칩 정의: userType에 따라 분기 ──
  const filterItems = userType === 'personal'
    ? [
        { id:'전체', label:'전체' },
        { id:'거래', label:'거래' },
        { id:'대여', label:'대여' },
        { id:'기관', label:'기관' },
        { id:'주의', label:'⚠ 주의' },
      ]
    : [
        { id:'전체', label:'전체' },
        { id:'내부', label:'내부' },
        { id:'외부', label:'외부' },
        { id:'기관', label:'기관' },
        { id:'주의', label:'⚠ 주의' },
      ]

  // ── 필터 적용: 개인은 txCat, 기업은 msgCat ──
  const filtered = allThreads.filter(t => {
    if (filter === '전체') return true
    if (filter === '주의') return t.status !== 'normal'
    if (userType === 'personal') return t.txCat === filter
    return t.msgCat === filter
  })

  const totalUnread = allThreads.reduce((s, t) => s + (t.unread || 0), 0)

  const thread = allThreads.find(t => t.id === activeThread)

  // 처리센터 알림 스레드 — approvalMessageBus의 동적 메시지 병합
  const approvalBusMsgs  = getAllApprovalMsgs()
  const approvalChatMsgs = approvalBusMsgs.map((m, idx) => {
    const d = new Date(m.createdAt)
    const date = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
    const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    return {
      id: `bus_${idx}`, from:'system', type:'approvalAction', date, time,
      approvalAction: { action: m.action, actor: m.actor, itemTitle: m.itemTitle || '', note: m.note || null, requestedDocs: m.requestedDocs || null },
    }
  })

  // 채팅 데이터
  const chat = (() => {
    if (!thread) return null
    if (thread._fromStore) return adaptStoreChat(thread.id)
    if (thread.id === 'approval') {
      const base = CHATS['approval'] || { messages:[], fdsAlert:null }
      return { ...base, messages: [...base.messages, ...approvalChatMsgs] }
    }
    return CHATS[thread.id] || null
  })()

  // ── 상세 화면 ──
  if (activeThread && showDetail) {
    return (
      <div className="phone flex flex-col" style={{ height:'100vh', overflow:'hidden' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <DetailScreen thread={thread} onBack={() => setShowDetail(false)} />
        </div>
      </div>
    )
  }

  // ── 채팅방 ──
  if (activeThread) {
    return (
      <div className="phone flex flex-col" style={{ height:'100vh', overflow:'hidden' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <ChatRoom
            thread={thread}
            chat={chat}
            onBack={() => setActiveThread(null)}
            onOpenDetail={thread._fromStore ? null : () => setShowDetail(true)}
            userType={userType}
            prefillMsg={pendingPrefillMsg}
            onPrefillUsed={() => setPendingPrefillMsg(null)}
          />
        </div>
      </div>
    )
  }

  // ── 목록 ──
  return (
    <PhoneShell>
      <div style={{ flex: 1, overflowY: 'auto' }}>

        <GradientHeader paddingBottom="20px" bg={theme.headerGrad}>
          <PageTitle
            title="메시지"
            badge={totalUnread}
            right={<span style={{ fontSize:'11px', color:'rgba(255,255,255,0.65)' }}>거래 관계 {allThreads.length}명</span>}
          />

          {/* 필터 칩 — userType에 따라 다른 항목 */}
          <FilterChips
            dark
            value={filter}
            onChange={setFilter}
            items={filterItems}
          />

          {/* 검색 바 */}
          <div style={{ padding:'8px 16px 4px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.14)', borderRadius:'12px', padding:'9px 14px', border:'1px solid rgba(255,255,255,0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>이름, 거래 유형 검색...</span>
            </div>
          </div>
        </GradientHeader>

        {/* 메시지 카드 리스트 */}
        <div style={{ padding:'12px 12px 24px', background:'#F4F5F7', minHeight:'100%' }}>
          {filtered.length === 0 ? (
            <div style={{ padding:'40px 16px', textAlign:'center', color:COLORS.t4, fontSize:'13px' }}>
              해당 유형의 거래가 없어요
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {filtered.map(t => {
                const pct = Math.round((t.totalExecuted / t.totalAmount) * 100)
                const isWarning = t.status !== 'normal'
                return (
                  <button
                    key={t.id}
                    onClick={() => { setActiveThread(t.id); setShowDetail(false) }}
                    style={{
                      width:'100%', background: isWarning ? '#FFFBF5' : COLORS.bgCard,
                      borderRadius: RADIUS.lg, padding:'13px 14px 13px 0',
                      display:'flex', alignItems:'center', gap:'0', border:'none',
                      borderLeft: isWarning ? '3.5px solid #F59E0B' : '3.5px solid transparent',
                      cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                      boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                    }}>

                    {/* 아바타 */}
                    <div style={{ position:'relative', flexShrink:0, padding:'0 12px' }}>
                      <div style={{ width:'46px', height:'46px', borderRadius:'14px',
                        background: t.avatarBg, color: t.avatarFg,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize: t.emoji ? '24px' : '16px', fontWeight:'700' }}>
                        {t.emoji || t.initial}
                      </div>
                      {/* 자금 유형 뱃지 */}
                      <div style={{ position:'absolute', bottom:'-4px', right:'8px', padding:'1px 5px',
                        background: t.typeBg, borderRadius:'6px', fontSize:'8px', fontWeight:700, color: t.typeColor,
                        border:`1.5px solid ${COLORS.bgCard}`, whiteSpace:'nowrap' }}>
                        {t.type}
                      </div>
                      {t.unread > 0 && (
                        <div style={{ position:'absolute', top:'-4px', right:'6px', minWidth:'16px', height:'16px',
                          padding:'0 4px', borderRadius:'8px', background: COLORS.danger, border:`2px solid ${COLORS.bgCard}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'9px', fontWeight:'700', color:'#fff', zIndex:1 }}>
                          {t.unread}
                        </div>
                      )}
                    </div>

                    {/* 본문 */}
                    <div style={{ flex:1, minWidth:0, paddingRight:'4px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'3px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px', flex:1, minWidth:0 }}>
                          <span style={{ fontSize:'14px', fontWeight: t.unread > 0 ? '700' : '600', color: COLORS.t1,
                            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {t.name}
                          </span>
                          {isWarning && (
                            <Badge bg={t.statusBg} color={t.statusColor} size="sm">
                              {shortStatusLabel(t.statusLabel)}
                            </Badge>
                          )}
                        </div>
                        <span style={{ fontSize:'10px', color: COLORS.t4, flexShrink:0, marginLeft:'6px' }}>{t.time}</span>
                      </div>

                      <div style={{ fontSize:'12px', color: COLORS.t3, marginBottom:'8px',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {t.lastMsg}
                      </div>

                      {/* 진행률 바 */}
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ flex:1, height:'3px', background: COLORS.bgMuted, borderRadius: RADIUS.pill, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%',
                            background: progressGradient(pct, isWarning ? null : (pct >= 100 ? 'success' : null)),
                            borderRadius: RADIUS.pill, transition:'width .3s' }} />
                        </div>
                        <span style={{ fontSize:'11px', fontWeight:'700', flexShrink:0, minWidth:'30px', textAlign:'right',
                          color: pct >= 100 ? theme.brand : isWarning ? COLORS.danger : pct >= 70 ? COLORS.danger : pct >= 40 ? COLORS.warning : COLORS.t3 }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

      </div>

      <BottomTab />
    </PhoneShell>
  )
}
