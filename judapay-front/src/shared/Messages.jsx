import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomTab from '../components/BottomTab'
import {
  PhoneShell, GradientHeader, PageTitle, Card, ProgressBar, Badge, FilterChips,
} from '../design/components'
import { COLORS, RADIUS, SHADOWS, GRADIENTS, progressGradient } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'
import { useUser } from '../contexts/UserContext'
import {
  getMyMessageThreads,
  getMessagesForThread,
  getTransactionById,
  TX_TYPE_META,
} from './transactionStore'
import { useStoreData } from '../hooks/useStoreData'

// userType → 데모 사용자 ID 매핑 (TODO: useUser 확장 시 동적)
function getCurrentUserId(userType) {
  if (userType === 'business') return 'biz_juda'
  if (userType === 'personal') return 'me_juda_kim'
  return null
}

// 자금 종류별 카드 색상 (THREADS에서 사용하는 typeBg/typeColor 매핑)
const TYPE_TONE_BY_KIND = {
  freelance:    { typeBg: '#EDF3FA', typeColor: '#2D6BB0' },
  bonus:        { typeBg: '#E6F5EF', typeColor: '#085041' },
  condolence:   { typeBg: '#FCE7F3', typeColor: '#9D174D' },
  otherIncome:  { typeBg: '#EEE8F7', typeColor: '#5D2E92' },
  lend:         { typeBg: '#FFF4E0', typeColor: '#C8821A' },
  support:      { typeBg: '#E6F5EF', typeColor: '#2A7D5E' },
  gift:         { typeBg: '#FCE7F3', typeColor: '#9D174D' },
  personalLend: { typeBg: '#FFF4E0', typeColor: '#C8821A' },
  invest:       { typeBg: '#E6F5EF', typeColor: '#2A7D5E' },
  realestate:   { typeBg: '#EDF3FA', typeColor: '#2D6BB0' },
}

// store thread (그룹) → THREADS 카드 형태로 어댑팅
function adaptStoreThread(t) {
  // t = { threadKey, lastMessage, messages: [...], otherSide }
  const lm = t.lastMessage
  const tx = getTransactionById(lm.txId)
  if (!tx) return null

  const meta = TX_TYPE_META[tx.type] || { icon: '💼', labelKo: tx.type }
  const tone = TYPE_TONE_BY_KIND[tx.type] || { typeBg: '#F2EFE9', typeColor: '#555550' }

  // 거래형: 진행률 + 상태 라벨, 통지형: 단순 완료
  const isContract = tx.category === 'contract'
  const totalExecuted = tx.executedAmount || 0
  const totalAmount = tx.amount

  // 상태 분기
  let status = 'normal'
  let statusLabel = '정상'
  let statusBg = '#E6F5EF'
  let statusColor = '#2A7D5E'
  if (tx.statusLabel) {
    if (tx.statusLabel.includes('검수') || tx.statusLabel.includes('서명') || tx.statusLabel.includes('대기')) {
      status = 'warning'
      statusLabel = tx.statusLabel
      statusBg = '#FFF4E0'
      statusColor = '#C8821A'
    } else {
      statusLabel = tx.statusLabel
    }
  } else if (tx.status === 'waiting') {
    status = 'warning'
    statusLabel = '인증 대기'
    statusBg = '#FFF4E0'
    statusColor = '#C8821A'
  } else if (tx.status === 'completed') {
    statusLabel = '완료'
  }

  // lastMsg 텍스트 (가장 최근 메시지) — "[진행 상태]" 같은 메타 표시는 제거
  let lastMsgText = lm.text || ''
  if (lastMsgText.startsWith('[진행 상태]')) {
    lastMsgText = lastMsgText.replace('[진행 상태] ', '')
  }

  return {
    id: t.threadKey,                      // string ID
    name: t.otherSide.name,
    initial: tx.toRecipientInitial || (t.otherSide.name?.charAt(0) || '?'),
    emoji: null,
    avatarBg: tx.toRecipientAvatarBg || '#F2EFE9',
    avatarFg: tx.toRecipientAvatarFg || '#555550',
    type: meta.labelKo,
    typeBg: tone.typeBg,
    typeColor: tone.typeColor,
    amount: totalAmount,
    balance: Math.max(0, totalAmount - totalExecuted),
    lastMsg: lastMsgText,
    time: formatThreadTime(lm.createdAt),
    unread: 0,                            // store는 아직 unread 추적 안 함 (추후)
    status,
    statusLabel,
    statusBg,
    statusColor,
    totalExecuted,
    totalAmount,
    role: isContract ? '거래 상대' : '수령인',
    _fromStore: true,
    _txId: tx.id,
    _category: tx.category,
    _createdAt: lm.createdAt,
  }
}

// 시간 표시 (스레드 카드용 — "14:22" / "어제" / "3일 전")
function formatThreadTime(iso) {
  if (!iso) return ''
  const now = new Date()
  const then = new Date(iso)
  const sameDay = now.toDateString() === then.toDateString()
  if (sameDay) {
    const hh = String(then.getHours()).padStart(2, '0')
    const mm = String(then.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }
  const diffDay = Math.floor((now - then) / 86400000)
  if (diffDay < 2) return '어제'
  if (diffDay < 7) return `${diffDay}일 전`
  const mm = String(then.getMonth() + 1).padStart(2, '0')
  const dd = String(then.getDate()).padStart(2, '0')
  return `${mm}.${dd}`
}

// store messages (스레드별) → CHATS 형태로 어댑팅
// 반환: { messages: [...], fdsAlert: null }
function adaptStoreChat(threadKey) {
  const storeMessages = getMessagesForThread(threadKey)   // 시간 오름차순
  let id = 1
  const messages = storeMessages.map(m => {
    const date = (m.createdAt || '').slice(0, 10).replaceAll('-', '.')
    const time = (() => {
      const d = new Date(m.createdAt)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    })()

    if (m.msgType === 'contract') {
      return {
        id: id++,
        from: 'system',
        type: 'contract',
        date, time,
        contract: {
          title: m.contract?.title || '',
          executor: m.contract?.executor || '',
          recipient: m.contract?.recipient || '',
          amount: m.contract?.amount || 0,
          type: m.contract?.typeLabel || '',
          mccAllowed: [],
          mccBlocked: [],
          expires: m.contract?.expires || '',
          milestones: (m.contract?.milestones || []).map(ms => ({
            text: ms.label || '',
            done: ms.status === 'paid',
            date: ms.date || '',
          })),
          signed: !!m.contract?.signed,
        },
      }
    }
    if (m.msgType === 'payment') {
      return {
        id: id++,
        from: 'system',
        type: 'payment',
        date, time,
        payment: {
          merchant: m.payment?.label || '',
          amount: m.payment?.amount || 0,
          status: 'done',
          mcc: m.payment?.mccLabel || '',
          code: m.payment?.milestoneId || '',
        },
      }
    }
    if (m.msgType === 'progress') {
      // 진행 상태 카드 (노란 톤 안내)
      return {
        id: id++,
        from: 'system',
        type: 'storeProgress',     // 새 type — ChatRoom에서 별도 렌더링
        date, time,
        progress: {
          statusLabel: m.progress?.statusLabel || m.text?.replace('[진행 상태] ', '') || '',
          actionLabel: m.progress?.actionLabel || null,
        },
      }
    }
    if (m.msgType === 'simple') {
      // 통지형 — 기존 payment 카드 스타일 (메뉴별 색상)
      const tx = getTransactionById(m.txId)
      const meta = tx ? TX_TYPE_META[tx.type] : null
      return {
        id: id++,
        from: 'system',
        type: 'storeNotification',  // 새 type — ChatRoom에서 메뉴별 톤으로 렌더링
        date, time,
        notification: {
          icon: meta?.icon || m.icon || '💸',
          typeKey: tx?.type || 'gift',
          typeLabel: meta?.labelKo || '',
          merchant: tx?.toRecipientName || '',     // 받는 사람
          amount: tx?.netAmount || 0,
          mcc: tx?.reason || '',                     // 사유
          status: tx?.status === 'waiting' ? 'waiting' : 'done',
        },
      }
    }
    // 그 외 fallback
    return {
      id: id++,
      from: 'system',
      text: m.text || '',
      date, time,
    }
  })

  // 미가입자(verified=false) 거래면 마지막에 안내 카드 추가
  // — 스레드의 가장 최근 거래의 받는 사람이 미가입이면 표시
  const lastTx = (() => {
    for (let i = storeMessages.length - 1; i >= 0; i--) {
      const tx = getTransactionById(storeMessages[i].txId)
      if (tx) return tx
    }
    return null
  })()

  if (lastTx && lastTx.toRecipientVerified === false) {
    const today = new Date()
    const date = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')}`
    const time = `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`
    messages.push({
      id: id++,
      from: 'system',
      type: 'pendingSignup',
      date, time,
      pendingSignup: {
        recipientName: lastTx.toRecipientName,
        hasEmail: !!lastTx.toRecipientEmail || !!lastTx.recipient?.vendorEmail,
      },
    })
  }

  return { messages, fdsAlert: null }
}

const THREADS = [
  {
    id: '1', name: '박철수', initial: '박', emoji: null,
    avatarBg: '#EF4444', avatarFg: '#FFFFFF', // 빨강
    type: '외주비', typeBg: '#EDF3FA', typeColor: '#2D6BB0',
    amount: 5000000, balance: 3500000,
    lastMsg: '검수 확인 후 잔금 부탁드립니다',
    time: '14:22', unread: 2,
    status: 'warning', statusLabel: '검수 대기', statusBg: '#FFF4E0', statusColor: '#C8821A',
    totalExecuted: 1500000, totalAmount: 5000000,
    role: '외주 수급인',
  },
  {
    id: '2', name: '이유진', initial: '이', emoji: '👧',
    avatarBg: '#FCD34D', avatarFg: '#92400E', // 노랑
    type: '대여금', typeBg: '#FFF4E0', typeColor: '#C8821A',
    amount: 5000000, balance: 45000,
    lastMsg: '차용증 서명 완료했습니다',
    time: '어제', unread: 0,
    status: 'normal', statusLabel: '정상', statusBg: '#E6F5EF', statusColor: '#2A7D5E',
    totalExecuted: 5000000, totalAmount: 5000000,
    role: '가족 구성원 (딸)',
  },
  {
    id: '3', name: 'ㄱ오로라', initial: 'ㄱ', emoji: null,
    avatarBg: '#1F2937', avatarFg: '#FFFFFF', // 검정
    type: '엔젤 투자', typeBg: '#E6F5EF', typeColor: '#2A7D5E',
    amount: 50000000, balance: 17600000,
    lastMsg: '4월 집행 내역 공유드립니다',
    time: '3일 전', unread: 0,
    status: 'warning', statusLabel: '소진 이상', statusBg: '#FCEBEB', statusColor: '#D94040',
    totalExecuted: 32400000, totalAmount: 50000000,
    role: '투자 수령인',
  },
  {
    id: '4', name: '김창업', initial: '김', emoji: null,
    avatarBg: '#7C3AED', avatarFg: '#FFFFFF', // 보라
    type: '외주비', typeBg: '#EDF3FA', typeColor: '#2D6BB0',
    amount: 5000000, balance: 3500000,
    lastMsg: '계약서 확인 부탁드립니다',
    time: '5일 전', unread: 0,
    status: 'normal', statusLabel: '정상', statusBg: '#E6F5EF', statusColor: '#2A7D5E',
    totalExecuted: 1500000, totalAmount: 5000000,
    role: '외주 수급인',
  },
]

const CHATS = {
  '1': {
    messages: [
      { id:1, from:'system', type:'contract', time:'10:00', date:'2026.04.25',
        contract: {
          title: '자금 집행 계약',
          executor: '㈜주다컴퍼니', recipient: '박철수',
          amount: 5000000, type: '외주비',
          mccAllowed: ['IT/소프트웨어', '디자인/크리에이티브'],
          mccBlocked: ['유흥/오락', '도박', '명품'],
          expires: '2026.08.06',
          milestones: [
            { text: 'UI 시안 1차 납품', done: true, date: '2026.05.15' },
            { text: '수정 및 최종본', done: false, date: '2026.06.15' },
            { text: '최종 납품 완료', done: false, date: '2026.07.15' },
          ],
          signed: true,
        }
      },
      { id:2, from:'other', text:'안녕하세요! 앱 디자인 작업 시작하겠습니다.', time:'10:05', date:'2026.04.25' },
      { id:3, from:'me', text:'네 잘 부탁드립니다. 선금 집행 완료했어요.', time:'10:10', date:'2026.04.25' },
      { id:4, from:'system', type:'payment', time:'10:10', date:'2026.04.25',
        payment: { merchant: '선금 집행', amount: 1500000, status: 'done', mcc: '외주비', code: 'EX_002' }
      },
      { id:5, from:'system', type:'blocked', time:'23:41', date:'2026.04.27',
        blocked: { merchant: 'GS강남게임센터', amount: 89000, mcc: 'MCC-7993 (유흥/오락)', code: 'AL_001' }
      },
      { id:6, from:'system', type:'justify', time:'23:50', date:'2026.04.27',
        justify: { merchant: 'GS강남게임센터', amount: 89000, deadline: '2026.04.30', status: 'pending', code: 'JU_001' }
      },
      { id:7, from:'other', text:'메인 5종 1차 시안 완료했습니다. 검수 부탁드립니다.', time:'13:40', date:'2026.05.06' },
      { id:8, from:'system', type:'milestone', time:'13:40', date:'2026.05.06',
        milestone: { text: 'UI 시안 1차 납품', done: true, code: 'SC_001' }
      },
      { id:9, from:'other', text:'검수 확인 후 잔금 부탁드립니다', time:'14:22', date:'2026.05.06' },
    ],
    fdsAlert: { text: '박철수 · GS강남게임센터 결제 시도 차단됨 · MCC 7993', level: 'block' },
  },
  '2': {
    messages: [
      { id:1, from:'me', text:'차용증 내용 확인해주세요.', time:'09:00', date:'2026.04.20' },
      { id:2, from:'other', text:'차용증 서명 완료했습니다', time:'09:30', date:'2026.04.20' },
      { id:3, from:'system', text:'대여금 5,000,000원 집행 완료 · 2026.04.20', time:'09:30', date:'2026.04.20' },
    ],
    fdsAlert: null,
  },
  '3': {
    messages: [
      { id:1, from:'other', text:'4월 집행 내역 공유드립니다', time:'11:00', date:'2026.05.03' },
      { id:2, from:'me', text:'소진 속도가 빨라서 확인 중입니다.', time:'11:30', date:'2026.05.03' },
    ],
    fdsAlert: { text: '소진 속도 전월 대비 40% 증가 · 이상 감지', level: 'warning' },
  },
  '4': {
    messages: [
      { id:1, from:'other', text:'계약서 확인 부탁드립니다', time:'14:00', date:'2026.05.01' },
      { id:2, from:'me', text:'확인하겠습니다.', time:'14:30', date:'2026.05.01' },
    ],
    fdsAlert: null,
  },
}

// 거래 카드 상세 데이터
const DETAIL_DATA = {
  '1': {
    trades: [
      {
        id: 1, icon: '📋', title: '앱 디자인 메인 5종 계약서', date: '2026.04.20', amount: 5000000, status: '진행중',
        detail: {
          steps: [
            { label: '선금', amount: 1500000, ratio: '30%', status: 'done', date: '2026.04.25' },
            { label: '중도금', amount: 2000000, ratio: '40%', status: 'waiting', date: null, action: '검수하기' },
            { label: '잔금', amount: 1500000, ratio: '30%', status: 'pending', date: null },
          ],
          note: '납품일: 2026.07.31 · 계약서 서명 완료',
        },
      },
      {
        id: 2, icon: '📄', title: '1차 시안 납품 확인서', date: '2026.05.06', amount: null, status: '완료',
        detail: { note: '메인 5종 1차 시안 납품 확인 · 검수 대기 중', steps: null },
      },
    ],
    attachments: [
      { name: '계약서_박철수_20260420.pdf', size: '2.1MB', date: '2026.04.20' },
      { name: '1차시안_메인5종.zip', size: '48MB', date: '2026.05.06' },
    ],
    memos: ['검수 기준: 피그마 완성도 85% 이상', '잔금 지급 전 반드시 확인 필요'],
    userInfo: { name: '박철수', role: '외주 수급인', phone: '010-1234-5678', bank: '국민 ****-901', kyc: 'KYC 2단계', joined: '2026.04.20' },
  },
  '2': {
    trades: [
      {
        id: 1, icon: '📋', title: '금전소비대차 계약서', date: '2026.04.01', amount: 5000000, status: '진행중',
        detail: { note: '상환일: 2027.05.05 · 연 4.6% · 만기 일시상환', steps: null },
      },
      {
        id: 2, icon: '🧾', title: '월 대여료 이자 납부 확인서', date: '2026.03.15', amount: 13750, status: '완료',
        detail: { note: '3월 이자 납부 완료 · 13,750원', steps: null },
      },
      {
        id: 3, icon: '📝', title: '긴급 지원금 신청서', date: '2026.02.20', amount: 300000, status: '완료',
        detail: { note: '긴급 생활비 지원 · 300,000원', steps: null },
      },
    ],
    attachments: [
      { name: '차용증_이유진_20260401.pdf', size: '1.2MB', date: '2026.04.01' },
    ],
    memos: ['상환일 1개월 전 자동 알림 설정됨'],
    userInfo: { name: '이유진', role: '가족 구성원 (딸)', phone: '010-9876-5432', bank: '신한 ****-789', kyc: 'KYC 2단계', joined: '2026.02.15' },
  },
  '3': {
    trades: [
      {
        id: 1, icon: '📋', title: '엔젤 투자 계약서', date: '2026.02.15', amount: 50000000, status: '진행중',
        detail: {
          steps: [
            { label: '1차 집행', amount: 20000000, ratio: '40%', status: 'done', date: '2026.02.20' },
            { label: '2차 집행', amount: 12400000, ratio: '25%', status: 'done', date: '2026.04.01' },
            { label: '3차 집행', amount: 17600000, ratio: '35%', status: 'pending', date: null },
          ],
          note: 'MCC 통제 · IT·개발 허용 · 월 1회 보고',
        },
      },
    ],
    attachments: [
      { name: '투자계약서_오로라_20260215.pdf', size: '3.8MB', date: '2026.02.15' },
      { name: '4월_집행내역보고서.pdf', size: '0.9MB', date: '2026.05.01' },
    ],
    memos: ['소진 속도 이상 → 5월 추가 확인 필요', '쿠폰 API 매출 대조 진행 중'],
    userInfo: { name: 'ㄱ오로라 (법인)', role: '투자 수령인', phone: '02-1234-5678', bank: '기업 ****-456', kyc: '기업 인증 완료', joined: '2026.02.15' },
  },
  '4': {
    trades: [
      {
        id: 1, icon: '📋', title: 'UI 컴포넌트 라이브러리 계약서', date: '2026.05.01', amount: 5000000, status: '진행중',
        detail: {
          steps: [
            { label: '선금', amount: 1500000, ratio: '30%', status: 'done', date: '2026.05.03' },
            { label: '중도금', amount: 2000000, ratio: '40%', status: 'pending', date: null },
            { label: '잔금', amount: 1500000, ratio: '30%', status: 'pending', date: null },
          ],
          note: '납품일: 2026.09.30',
        },
      },
    ],
    attachments: [{ name: '계약서_김창업_20260501.pdf', size: '1.9MB', date: '2026.05.01' }],
    memos: [],
    userInfo: { name: '김창업', role: '외주 수급인', phone: '010-5555-1234', bank: '카카오뱅크 ****-321', kyc: 'KYC 2단계', joined: '2026.05.01' },
  },
}

const STEP_STYLE = {
  done:    { dot: '#2A7D5E', label: '완료', color: '#2A7D5E', bg: '#E6F5EF' },
  waiting: { dot: '#C8821A', label: '검수 대기', color: '#C8821A', bg: '#FFF4E0' },
  upload:  { dot: '#D94040', label: '파일 필요', color: '#D94040', bg: '#FCEBEB' },
  pending: { dot: '#C8C5BE', label: '대기', color: '#C8C5BE', bg: '#F2EFE9' },
}

// ─── 상세 전체 화면 ───
// ─── 상세 전체 화면 ───
function DetailScreen({ thread, onBack }) {
  const theme = getAccountTheme()
  const [tab, setTab] = useState('거래')
  const [expandedTrade, setExpandedTrade] = useState(null)
  const data = DETAIL_DATA[thread.id]
  const pct = Math.round((thread.totalExecuted / thread.totalAmount) * 100)

  const tabs = [
    { key:'거래', icon:'📋', count: data.trades.length },
    { key:'첨부파일', icon:'📎', count: data.attachments.length },
    { key:'메모', icon:'📄', count: data.memos.length },
    { key:'상대정보', icon:'👤', count: 0 },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background: COLORS.bg }}>

      {/* 다크 그라데이션 헤더 (좌우 꽉) */}
      <div style={{
        background: theme.headerGrad,
        flexShrink:0,
        paddingTop:'20px',
        paddingBottom:'24px',
      }}>
        {/* 상단 네비 */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'4px 16px 18px',
        }}>
          <button onClick={onBack}
            style={{
              width:'32px', height:'32px',
              background:'transparent', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', padding:0,
            }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span style={{ fontSize:'14px', fontWeight:600, color:'#fff' }}>상세 정보</span>
          <div style={{ width:'32px' }} />
        </div>

        {/* 큰 컬러 아바타 + 이름 + 역할 */}
        <div style={{ padding:'0 20px', textAlign:'center' }}>
          <div style={{
            width:'72px', height:'72px',
            borderRadius:'20px',
            background: thread.avatarBg, color: thread.avatarFg,
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'8px auto 12px',
            fontSize: thread.emoji ? '36px' : '24px',
            fontWeight:700,
            boxShadow:'0 8px 20px rgba(0,0,0,0.25)',
          }}>
            {thread.emoji || thread.initial}
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', marginBottom:'4px' }}>
            <span style={{ fontSize:'18px', fontWeight:700, color:'#fff' }}>{thread.name}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" fill="#34D399"/>
              <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.65)', marginBottom:'18px' }}>
            {thread.role}
          </div>

          {/* 잔액/집행 요약 — 헤더 안 직접 표시 */}
          <div style={{
            display:'flex', justifyContent:'center', gap:'24px',
          }}>
            <div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginBottom:'4px' }}>총 거래</div>
              <div style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>
                {thread.totalAmount.toLocaleString()}원
              </div>
            </div>
            <div style={{ width:'1px', background:'rgba(255,255,255,0.15)' }} />
            <div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginBottom:'4px' }}>잔액</div>
              <div style={{ fontSize:'14px', fontWeight:700, color: pct >= 80 ? '#FCA5A5' : '#fff' }}>
                {thread.balance.toLocaleString()}원
              </div>
            </div>
            <div style={{ width:'1px', background:'rgba(255,255,255,0.15)' }} />
            <div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginBottom:'4px' }}>집행률</div>
              <div style={{ fontSize:'14px', fontWeight:700, color: pct >= 80 ? '#FCA5A5' : '#34D399' }}>
                {pct}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 — 라이트 영역 시작 */}
      <div style={{
        display:'flex',
        background: COLORS.bgCard,
        borderBottom: `1px solid ${COLORS.borderSoft}`,
        flexShrink:0,
      }}>
        {tabs.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex:1, padding:'12px 4px',
                background:'none', border:'none',
                borderBottom: active ? `2px solid ${theme.brand}` : '2px solid transparent',
                marginBottom:'-1px',
                cursor:'pointer', fontFamily:'inherit',
                display:'flex', flexDirection:'column', alignItems:'center', gap:'2px',
              }}>
              <span style={{
                fontSize:'12px',
                fontWeight: active ? 700 : 500,
                color: active ? theme.brand : COLORS.t4,
              }}>
                {t.icon} {t.key}
              </span>
              {t.count > 0 && (
                <span style={{
                  fontSize:'10px',
                  color: active ? theme.brand : COLORS.t4,
                  fontWeight: active ? 700 : 500,
                }}>
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>

        {/* ─ 거래 탭 ─ */}
        {tab === '거래' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {data.trades.map(trade => {
              const isExpanded = expandedTrade === trade.id
              return (
                <div key={trade.id} style={{
                  background: COLORS.bgCard,
                  borderRadius: RADIUS.lg,
                  boxShadow: SHADOWS.card,
                  overflow:'hidden',
                }}>
                  <button
                    onClick={() => setExpandedTrade(isExpanded ? null : trade.id)}
                    style={{
                      width:'100%', padding:'14px',
                      display:'flex', alignItems:'center', gap:'12px',
                      background:'none', border:'none',
                      cursor:'pointer', textAlign:'left',
                      fontFamily:'inherit',
                    }}>
                    <div style={{
                      width:'40px', height:'40px',
                      borderRadius:'11px',
                      background:`${theme.brand}18`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'19px',
                      flexShrink:0,
                    }}>
                      {trade.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{
                        fontSize:'13px', fontWeight:700, color: COLORS.t1,
                        marginBottom:'3px',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>
                        {trade.title}
                      </div>
                      <div style={{ fontSize:'11px', color: COLORS.t4 }}>{trade.date}</div>
                      {trade.amount && (
                        <div style={{
                          fontSize:'13px', fontWeight:700, color: theme.brand,
                          marginTop:'3px',
                        }}>
                          {trade.amount.toLocaleString()}원
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px', flexShrink:0 }}>
                      <span style={{
                        padding:'2px 8px',
                        background: trade.status === '완료' ? '#D1FAE5' : '#FEF3C7',
                        color: trade.status === '완료' ? '#047857' : '#854F0B',
                        borderRadius:'5px',
                        fontSize:'10px', fontWeight:700,
                      }}>
                        {trade.status}
                      </span>
                      <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2" strokeLinecap="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div style={{ padding:'0 14px 14px', borderTop: `1px solid ${COLORS.borderSoft}` }}>
                      {/* 단계별 지급 현황 */}
                      {trade.detail.steps && (
                        <div style={{ marginTop:'14px', display:'flex', flexDirection:'column', gap:'8px' }}>
                          <div style={{ fontSize:'11px', fontWeight:700, color: COLORS.t2, marginBottom:'4px' }}>
                            지급 현황
                          </div>
                          {trade.detail.steps.map((step, si) => {
                            const s = STEP_STYLE[step.status]
                            return (
                              <div key={si} style={{
                                display:'flex', alignItems:'center', gap:'10px',
                                padding:'10px 12px',
                                background: COLORS.bgMuted,
                                borderRadius: RADIUS.md,
                              }}>
                                <div style={{
                                  width:'8px', height:'8px',
                                  borderRadius:'50%',
                                  background: s.dot,
                                  flexShrink:0,
                                }} />
                                <div style={{ flex:1 }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px' }}>
                                    <span style={{ fontSize:'12px', fontWeight:700, color: COLORS.t1 }}>{step.label}</span>
                                    <span style={{
                                      padding:'1px 6px',
                                      background: s.bg, color: s.color,
                                      borderRadius:'4px',
                                      fontSize:'9px', fontWeight:700,
                                    }}>
                                      {s.label}
                                    </span>
                                    {step.date && (
                                      <span style={{ fontSize:'10px', color: COLORS.t4 }}>{step.date}</span>
                                    )}
                                  </div>
                                  <span style={{ fontSize:'11px', color: COLORS.t3 }}>
                                    {step.amount.toLocaleString()}원 ({step.ratio})
                                  </span>
                                </div>
                                {step.action && (
                                  <button style={{
                                    padding:'6px 12px',
                                    background: theme.brand, color:'#fff',
                                    border:'none', borderRadius:'8px',
                                    fontSize:'11px', fontWeight:700,
                                    cursor:'pointer', flexShrink:0, fontFamily:'inherit',
                                  }}>
                                    {step.action} →
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {trade.detail.note && (
                        <div style={{
                          marginTop:'10px',
                          padding:'10px 12px',
                          background:'#FFFBEB',
                          border:'1px solid #FCD34D',
                          borderRadius: RADIUS.md,
                          fontSize:'11px', color:'#854F0B', lineHeight:1.5,
                        }}>
                          {trade.detail.note}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ─ 첨부파일 탭 ─ */}
        {tab === '첨부파일' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {data.attachments.length === 0 && (
              <div style={{ textAlign:'center', color: COLORS.t5, fontSize:'13px', paddingTop:'40px' }}>
                첨부파일 없음
              </div>
            )}
            {data.attachments.map((f, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:'12px',
                padding:'12px 14px',
                background: COLORS.bgCard,
                borderRadius: RADIUS.md,
                boxShadow: SHADOWS.card,
              }}>
                <div style={{
                  width:'38px', height:'38px',
                  borderRadius: RADIUS.md,
                  background:`${theme.brand}18`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{
                    fontSize:'13px', fontWeight:600, color: COLORS.t1,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>
                    {f.name}
                  </div>
                  <div style={{ fontSize:'10px', color: COLORS.t4, marginTop:'2px' }}>
                    {f.size} · {f.date}
                  </div>
                </div>
                <div style={{ display:'flex', gap:'12px', flexShrink:0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
              </div>
            ))}
            <button style={{
              width:'100%', padding:'14px',
              background: COLORS.bgCard,
              border: `1px dashed ${COLORS.t5}`,
              borderRadius: RADIUS.md,
              fontSize:'12px', color: COLORS.t3,
              cursor:'pointer', fontFamily:'inherit',
              fontWeight:600,
            }}>
              + 파일 첨부
            </button>
          </div>
        )}

        {/* ─ 메모 탭 ─ */}
        {tab === '메모' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {data.memos.length === 0 && (
              <div style={{ textAlign:'center', color: COLORS.t5, fontSize:'13px', paddingTop:'40px' }}>
                메모 없음
              </div>
            )}
            {data.memos.map((m, i) => (
              <div key={i} style={{
                padding:'14px 16px',
                background:'#FFFBEB',
                border:'1px solid #FCD34D',
                borderRadius: RADIUS.md,
                fontSize:'12px', color:'#854F0B', lineHeight:1.6,
              }}>
                {m}
              </div>
            ))}
            <button style={{
              width:'100%', padding:'14px',
              background: COLORS.bgCard,
              border: `1px dashed ${COLORS.t5}`,
              borderRadius: RADIUS.md,
              fontSize:'12px', color: COLORS.t3,
              cursor:'pointer', fontFamily:'inherit',
              fontWeight:600,
            }}>
              + 메모 추가
            </button>
          </div>
        )}

        {/* ─ 상대정보 탭 ─ */}
        {tab === '상대정보' && (
          <div style={{
            background: COLORS.bgCard,
            borderRadius: RADIUS.lg,
            boxShadow: SHADOWS.card,
            overflow:'hidden',
          }}>
            {[
              ['이름', data.userInfo.name],
              ['역할', data.userInfo.role],
              ['연락처', data.userInfo.phone],
              ['입금 계좌', data.userInfo.bank],
              ['인증 등급', data.userInfo.kyc],
              ['거래 시작일', data.userInfo.joined],
            ].map(([k, v], i, arr) => (
              <div key={k} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'14px 16px',
                borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none',
              }}>
                <span style={{ fontSize:'12px', color: COLORS.t4 }}>{k}</span>
                <span style={{ fontSize:'13px', color: COLORS.t1, fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


// 스레드 카드의 상태 라벨을 짧게 줄임 (좁은 공간에 fit)
function shortStatusLabel(label) {
  if (!label) return ''
  return label
    .replace('상대방 서명 대기', '서명 대기')
    .replace('중도금 검수 대기', '검수 대기')
    .replace('잔금 검수 대기', '검수 대기')
    .replace('외부링크 인증 대기', '인증 대기')
    .replace('계약 서명 대기', '서명 대기')
    .replace('소진 이상', '소진 ↑')
}

// 통지형 카드 메뉴별 색상 톤 (ChatRoom의 storeNotification 카드용)
const NOTIF_TONE = {
  bonus:        { bg: '#F0FDF4', border: '#BBF7D0', text: '#047857', sub: '#065F46', badgeBg: '#D1FAE5', badgeText: '#047857' },   // 그린
  condolence:   { bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D', sub: '#831843', badgeBg: '#FCE7F3', badgeText: '#9D174D' },   // 핑크
  otherIncome:  { bg: '#F5F3FF', border: '#DDD6FE', text: '#5D2E92', sub: '#4C1D95', badgeBg: '#EDE9FE', badgeText: '#5D2E92' },   // 보라
  gift:         { bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D', sub: '#831843', badgeBg: '#FCE7F3', badgeText: '#9D174D' },   // 핑크
  // fallback (혹시 다른 통지형 추가될 경우)
  _default:     { bg: '#F0FDF4', border: '#BBF7D0', text: '#047857', sub: '#065F46', badgeBg: '#D1FAE5', badgeText: '#047857' },
}

// ─── 채팅방 ───
function ChatRoom({ thread, chat, onBack, onOpenDetail }) {
  const theme = getAccountTheme()
  const pct = Math.round((thread.totalExecuted / thread.totalAmount) * 100)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background: COLORS.bg }}>

      {/* 다크 그라데이션 헤더 (좌우 꽉) */}
      <div style={{
        background: theme.headerGrad,
        flexShrink:0,
        paddingTop:'20px',
        paddingBottom:'14px',
      }}>
        {/* 상단 네비 */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'4px 16px 14px' }}>
          <button onClick={onBack}
            style={{
              width:'32px', height:'32px',
              background:'transparent', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', padding:0,
            }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style={{
            width:'36px', height:'36px',
            borderRadius:'50%',
            background: thread.avatarBg,
            color: thread.avatarFg,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize: thread.emoji ? '20px' : '14px',
            fontWeight:700,
            flexShrink:0,
          }}>
            {thread.emoji || thread.initial}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'1px' }}>
              <span style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>{thread.name}</span>
              <span style={{
                padding:'1px 6px',
                background:'rgba(255,255,255,0.15)', color:'#fff',
                borderRadius:'4px', fontSize:'9px', fontWeight:700,
              }}>
                {thread.type}
              </span>
            </div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.65)' }}>
              총 {thread.totalAmount.toLocaleString()}원
            </div>
          </div>
          {/* 전화 */}
          <button style={{
            width:'32px', height:'32px',
            background:'transparent', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', padding:0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
          {/* ... 더보기 → 상세 화면 (store 스레드는 상세 화면 미구현이라 숨김) */}
          {onOpenDetail && (
            <button onClick={onOpenDetail}
              style={{
                width:'32px', height:'32px',
                background:'transparent', border:'none',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', padding:0,
              }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="5" cy="12" r="1.5" fill="#fff"/>
                <circle cx="12" cy="12" r="1.5" fill="#fff"/>
                <circle cx="19" cy="12" r="1.5" fill="#fff"/>
              </svg>
            </button>
          )}
        </div>

        {/* 집행 요약 3분할 */}
        <div style={{ display:'flex', padding:'0 16px', gap:'8px' }}>
          <div style={{ flex:1, background:'rgba(255,255,255,0.10)', borderRadius:'10px', padding:'8px 12px' }}>
            <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.55)', marginBottom:'2px' }}>총 집행</div>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#fff' }}>
              {thread.totalExecuted.toLocaleString()}원
            </div>
          </div>
          <div style={{ flex:1, background:'rgba(255,255,255,0.10)', borderRadius:'10px', padding:'8px 12px' }}>
            <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.55)', marginBottom:'2px' }}>잔액</div>
            <div style={{ fontSize:'12px', fontWeight:700, color: pct >= 80 ? '#FCA5A5' : '#fff' }}>
              {thread.balance.toLocaleString()}원
            </div>
          </div>
          <div style={{ flex:1, background:'rgba(255,255,255,0.10)', borderRadius:'10px', padding:'8px 12px' }}>
            <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.55)', marginBottom:'2px' }}>집행률</div>
            <div style={{ fontSize:'12px', fontWeight:700, color: pct >= 80 ? '#FCA5A5' : '#34D399' }}>
              {pct}%
            </div>
          </div>
        </div>
      </div>

      {/* FDS 경고 */}
      {chat.fdsAlert && (
        <div style={{
          background: chat.fdsAlert.level === 'block' ? '#FEF2F2' : '#FFFBEB',
          borderBottom: `1px solid ${chat.fdsAlert.level === 'block' ? '#FECACA' : '#FCD34D'}`,
          padding:'10px 16px',
          display:'flex', alignItems:'center', gap:'10px',
          flexShrink:0,
        }}>
          <div style={{
            width:'20px', height:'20px', borderRadius:'50%',
            background: chat.fdsAlert.level === 'block' ? COLORS.danger : COLORS.warning,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
              <path d="M12 9v4"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <span style={{
            fontSize:'11px',
            color: chat.fdsAlert.level === 'block' ? '#B91C1C' : '#854F0B',
            flex:1, lineHeight:1.45,
          }}>
            {chat.fdsAlert.text}
          </span>
          <button style={{
            fontSize:'11px',
            color: chat.fdsAlert.level === 'block' ? COLORS.danger : COLORS.warning,
            background:'none', border:'none', cursor:'pointer',
            fontWeight:600, fontFamily:'inherit', flexShrink:0,
          }}>
            확인 ›
          </button>
        </div>
      )}

      {/* 메시지 목록 */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
        {chat.messages.map((msg, i) => {
          const showDate = i === 0 || chat.messages[i-1].date !== msg.date
          return (
            <div key={msg.id}>
              {showDate && (
                <div style={{ textAlign:'center', margin:'14px 0 10px' }}>
                  <span style={{
                    padding:'3px 10px',
                    background:'rgba(0,0,0,0.04)',
                    borderRadius: RADIUS.pill,
                    fontSize:'10px', color: COLORS.t4,
                  }}>
                    {msg.date}
                  </span>
                </div>
              )}
              {msg.from === 'system' && msg.type === 'contract' ? (
                /* ── 계약 카드 ── */
                <div style={{ margin:'8px 0' }}>
                  <div style={{ background: COLORS.bgCard, border:`1.5px solid ${theme.brandDark}30`, borderRadius:'16px', overflow:'hidden', boxShadow: SHADOWS.card }}>
                    <div style={{ background: theme.headerGrad, padding:'12px 16px', display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'16px' }}>📋</span>
                      <span style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{msg.contract.title}</span>
                      {msg.contract.signed && <span style={{ marginLeft:'auto', padding:'2px 8px', background:'rgba(255,255,255,0.2)', borderRadius:'10px', fontSize:'10px', color:'#fff', fontWeight:700 }}>✓ 서명완료</span>}
                    </div>
                    <div style={{ padding:'14px 16px' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
                        {[
                          { label:'집행자', value: msg.contract.executor },
                          { label:'수신자', value: msg.contract.recipient },
                          { label:'금액',   value: msg.contract.amount.toLocaleString()+'원' },
                          { label:'유형',   value: msg.contract.type },
                          { label:'만료일', value: msg.contract.expires },
                        ].map((item,i) => (
                          <div key={i} style={{ background: COLORS.bg, borderRadius:'8px', padding:'8px 10px' }}>
                            <div style={{ fontSize:'9px', color: COLORS.t4, fontWeight:600, marginBottom:'2px' }}>{item.label}</div>
                            <div style={{ fontSize:'11px', fontWeight:700, color: COLORS.t1 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginBottom:'10px' }}>
                        <div style={{ fontSize:'10px', fontWeight:700, color: COLORS.t4, marginBottom:'5px' }}>허용/차단 MCC</div>
                        <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'4px' }}>
                          {msg.contract.mccAllowed.map((m,i) => (
                            <span key={i} style={{ padding:'2px 7px', borderRadius:'6px', background:'#F0FDF4', color:'#047857', fontSize:'10px', fontWeight:600 }}>✓ {m}</span>
                          ))}
                        </div>
                        <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                          {msg.contract.mccBlocked.map((m,i) => (
                            <span key={i} style={{ padding:'2px 7px', borderRadius:'6px', background:'#FEF2F2', color:'#DC2626', fontSize:'10px', fontWeight:600 }}>✕ {m}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:'10px', fontWeight:700, color: COLORS.t4, marginBottom:'6px' }}>마일스톤</div>
                        {msg.contract.milestones.map((ms,i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 0', borderBottom: i < msg.contract.milestones.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none' }}>
                            <div style={{ width:'18px', height:'18px', borderRadius:'5px', border:`2px solid ${ms.done ? theme.brandDark : COLORS.borderSoft}`, background: ms.done ? theme.brandDark : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              {ms.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                            </div>
                            <span style={{ flex:1, fontSize:'11px', color: ms.done ? COLORS.t4 : COLORS.t1, textDecoration: ms.done ? 'line-through' : 'none' }}>{ms.text}</span>
                            <span style={{ fontSize:'10px', color: COLORS.t4 }}>{ms.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'center', marginTop:'4px' }}>
                    <span style={{ fontSize:'10px', color: COLORS.t5 }}>{msg.time}</span>
                  </div>
                </div>

              ) : msg.from === 'system' && msg.type === 'payment' ? (
                /* ── 결제 완료 카드 ── */
                <div style={{ margin:'6px 0' }}>
                  <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'12px', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ fontSize:'18px', flexShrink:0 }}>💸</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'12px', fontWeight:700, color:'#047857' }}>{msg.payment.merchant} · {msg.payment.amount.toLocaleString()}원</div>
                      <div style={{ fontSize:'10px', color:'#065F46', marginTop:'1px' }}>{msg.payment.mcc} · {msg.payment.code}</div>
                    </div>
                    <span style={{ padding:'2px 8px', borderRadius:'8px', background:'#D1FAE5', color:'#047857', fontSize:'10px', fontWeight:700 }}>완료</span>
                  </div>
                  <div style={{ textAlign:'center', marginTop:'2px' }}>
                    <span style={{ fontSize:'10px', color: COLORS.t5 }}>{msg.time}</span>
                  </div>
                </div>

              ) : msg.from === 'system' && msg.type === 'storeNotification' ? (
                /* ── store 통지형 카드 (메뉴별 색상) ── */
                (() => {
                  const tone = NOTIF_TONE[msg.notification.typeKey] || NOTIF_TONE._default
                  const isWaiting = msg.notification.status === 'waiting'
                  return (
                    <div style={{ margin:'6px 0' }}>
                      <div style={{
                        background: tone.bg, border: `1px solid ${tone.border}`,
                        borderRadius:'12px', padding:'10px 14px',
                        display:'flex', alignItems:'center', gap:'10px',
                      }}>
                        <span style={{ fontSize:'18px', flexShrink:0 }}>{msg.notification.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'12px', fontWeight:700, color: tone.text }}>
                            {msg.notification.typeLabel} · {msg.notification.merchant} · {msg.notification.amount.toLocaleString()}원
                          </div>
                          <div style={{ fontSize:'10px', color: tone.sub, marginTop:'1px' }}>
                            {msg.notification.mcc || '메모 없음'}
                          </div>
                        </div>
                        <span style={{
                          padding:'2px 8px', borderRadius:'8px',
                          background: isWaiting ? '#FFF4E0' : tone.badgeBg,
                          color: isWaiting ? '#C8821A' : tone.badgeText,
                          fontSize:'10px', fontWeight:700, flexShrink:0,
                        }}>
                          {isWaiting ? '대기' : '완료'}
                        </span>
                      </div>
                      <div style={{ textAlign:'center', marginTop:'2px' }}>
                        <span style={{ fontSize:'10px', color: COLORS.t5 }}>{msg.time}</span>
                      </div>
                    </div>
                  )
                })()

              ) : msg.from === 'system' && msg.type === 'storeProgress' ? (
                /* ── store 진행 상태 카드 (노란 안내) ── */
                <div style={{ margin:'6px 0' }}>
                  <div style={{
                    background:'#FFFBEB', border:'1px solid #FCD34D',
                    borderRadius:'12px', padding:'10px 14px',
                    display:'flex', alignItems:'center', gap:'10px',
                  }}>
                    <span style={{ fontSize:'18px', flexShrink:0 }}>⏳</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'12px', fontWeight:700, color:'#854F0B' }}>
                        진행 상태 변경
                      </div>
                      <div style={{ fontSize:'11px', color:'#92400E', marginTop:'2px' }}>
                        {msg.progress.statusLabel}
                      </div>
                      {msg.progress.actionLabel && (
                        <div style={{ fontSize:'10px', color:'#B45309', marginTop:'3px', fontWeight:600 }}>
                          → {msg.progress.actionLabel}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign:'center', marginTop:'2px' }}>
                    <span style={{ fontSize:'10px', color: COLORS.t5 }}>{msg.time}</span>
                  </div>
                </div>

              ) : msg.from === 'system' && msg.type === 'pendingSignup' ? (
                /* ── 미가입자 안내 카드 (회색 톤) ── */
                <div style={{ margin:'10px 0' }}>
                  <div style={{
                    background:'#F8FAFC',
                    border:'1px solid #E2E8F0',
                    borderRadius:'12px',
                    padding:'14px',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                      <span style={{ fontSize:'18px', flexShrink:0 }}>📩</span>
                      <span style={{ fontSize:'12px', fontWeight:700, color: COLORS.t2 }}>
                        상대방 가입 대기
                      </span>
                    </div>
                    <div style={{ fontSize:'11px', color: COLORS.t3, lineHeight:1.65 }}>
                      <strong>{msg.pendingSignup.recipientName}</strong>은(는) 아직 주다페이에 가입하지 않았습니다.{' '}
                      {msg.pendingSignup.hasEmail
                        ? '이메일로 거래 계약서가 발송됐고, '
                        : '외부 인증 링크가 발송됐고, '}
                      가입 후 메시지가 가능합니다.
                    </div>
                  </div>
                </div>

              ) : msg.from === 'system' && msg.type === 'blocked' ? (
                /* ── 차단 결제 카드 ── */
                <div style={{ margin:'6px 0' }}>
                  <div style={{ background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:'12px', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ fontSize:'18px', flexShrink:0 }}>🚨</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'12px', fontWeight:700, color:'#DC2626' }}>{msg.blocked.merchant} · {msg.blocked.amount.toLocaleString()}원</div>
                      <div style={{ fontSize:'10px', color:'#B91C1C', marginTop:'1px' }}>{msg.blocked.mcc} · 차단됨 · {msg.blocked.code}</div>
                    </div>
                    <span style={{ padding:'2px 8px', borderRadius:'8px', background:'#FEE2E2', color:'#DC2626', fontSize:'10px', fontWeight:700 }}>차단</span>
                  </div>
                  <div style={{ textAlign:'center', marginTop:'2px' }}>
                    <span style={{ fontSize:'10px', color: COLORS.t5 }}>{msg.time}</span>
                  </div>
                </div>

              ) : msg.from === 'system' && msg.type === 'justify' ? (
                /* ── 소명 요청 카드 ── */
                <div style={{ margin:'6px 0' }}>
                  <div style={{ background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:'12px', padding:'10px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                      <span style={{ fontSize:'16px' }}>💬</span>
                      <span style={{ fontSize:'12px', fontWeight:700, color:'#92400E' }}>소명 요청</span>
                      <span style={{ marginLeft:'auto', padding:'2px 7px', borderRadius:'8px', background: msg.justify.status==='pending'?'#FEF3C7':'#D1FAE5', color: msg.justify.status==='pending'?'#92400E':'#047857', fontSize:'10px', fontWeight:700 }}>
                        {msg.justify.status==='pending'?'대기중':'완료'}
                      </span>
                    </div>
                    <div style={{ fontSize:'11px', color:'#78350F', marginBottom:'8px' }}>
                      {msg.justify.merchant} {msg.justify.amount.toLocaleString()}원 결제에 대한 소명을 제출해주세요.
                    </div>
                    <div style={{ fontSize:'10px', color:'#92400E' }}>기한: {msg.justify.deadline} · {msg.justify.code}</div>
                    {msg.justify.status === 'pending' && (
                      <button style={{ marginTop:'8px', width:'100%', padding:'8px', background:'#F59E0B', border:'none', borderRadius:'8px', color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                        소명 제출하기
                      </button>
                    )}
                  </div>
                  <div style={{ textAlign:'center', marginTop:'2px' }}>
                    <span style={{ fontSize:'10px', color: COLORS.t5 }}>{msg.time}</span>
                  </div>
                </div>

              ) : msg.from === 'system' && msg.type === 'milestone' ? (
                /* ── 마일스톤 카드 ── */
                <div style={{ margin:'6px 0' }}>
                  <div style={{ background: theme.brandDark+'0E', border:`1px solid ${theme.brandDark}25`, borderRadius:'12px', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'22px', height:'22px', borderRadius:'7px', background: theme.brandDark, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'11px', fontWeight:700, color: theme.brandDark }}>마일스톤 완료</div>
                      <div style={{ fontSize:'11px', color: COLORS.t2, marginTop:'1px' }}>{msg.milestone.text}</div>
                    </div>
                    <span style={{ fontSize:'10px', color: COLORS.t4 }}>{msg.milestone.code}</span>
                  </div>
                  <div style={{ textAlign:'center', marginTop:'2px' }}>
                    <span style={{ fontSize:'10px', color: COLORS.t5 }}>{msg.time}</span>
                  </div>
                </div>

              ) : msg.from === 'system' ? (
                /* ── 일반 시스템 텍스트 (fallback) ── */
                <div style={{ textAlign:'center', margin:'10px 0' }}>
                  <span style={{
                    padding:'5px 12px',
                    background: COLORS.bgMuted,
                    borderRadius: RADIUS.pill,
                    fontSize:'10px', color: COLORS.t3,
                  }}>
                    {msg.text}
                  </span>
                </div>

              ) : (
                <div style={{
                  display:'flex',
                  justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start',
                  marginBottom:'10px',
                  gap:'8px', alignItems:'flex-end',
                }}>
                  {msg.from === 'other' && (
                    <div style={{
                      width:'28px', height:'28px',
                      borderRadius:'50%',
                      background: thread.avatarBg, color: thread.avatarFg,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize: thread.emoji ? '15px' : '11px',
                      fontWeight:700, flexShrink:0,
                    }}>
                      {thread.emoji || thread.initial}
                    </div>
                  )}
                  <div style={{
                    maxWidth:'70%',
                    padding:'10px 14px',
                    borderRadius: msg.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.from === 'me' ? theme.brandDark : COLORS.bgCard,
                    color: msg.from === 'me' ? '#fff' : COLORS.t1,
                    fontSize:'13px', lineHeight:1.5,
                    boxShadow: msg.from === 'other' ? SHADOWS.card : 'none',
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize:'10px', color: COLORS.t5, flexShrink:0 }}>{msg.time}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 입력 바 */}
      <div style={{
        background: COLORS.bgCard,
        borderTop: `1px solid ${COLORS.borderSoft}`,
        padding:'8px 16px 12px',
        flexShrink:0,
      }}>
        {/* 빠른 액션 */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'10px', overflowX:'auto' }}>
          {[
            { label:'⚡ 자금집행', style:'primary' },
            { label:'요청하기', style:'secondary' },
            { label:'메모', style:'secondary' },
          ].map(action => (
            <button key={action.label}
              style={{
                padding:'6px 14px',
                background: action.style === 'primary'
                  ? theme.activeBtnGrad
                  : `${theme.brand}15`,
                color: action.style === 'primary' ? '#fff' : theme.brand,
                border: action.style === 'primary'
                  ? 'none'
                  : `1px solid ${theme.brand}30`,
                borderRadius: RADIUS.pill,
                fontSize:'11px', fontWeight:700,
                cursor:'pointer', flexShrink:0, fontFamily:'inherit',
                boxShadow: action.style === 'primary' ? theme.activeShadow : 'none',
              }}>
              {action.label}
            </button>
          ))}
        </div>

        {/* 입력 박스 */}
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <button style={{
            width:'36px', height:'36px',
            borderRadius:'50%',
            background: COLORS.bgMuted,
            border:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', flexShrink:0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t3} strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <div style={{
            flex:1,
            background: COLORS.bgMuted,
            borderRadius: RADIUS.pill,
            padding:'10px 16px',
            fontSize:'13px', color: COLORS.t5,
          }}>
            메시지 입력...
          </div>
          <button style={{
            width:'36px', height:'36px',
            borderRadius:'50%',
            background: theme.activeBtnGrad,
            border:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', flexShrink:0,
            boxShadow: theme.activeShadow,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 메인 컴포넌트 ───
export default function Messages() {
  const theme = getAccountTheme()
  const navigate = useNavigate()
  const { userType } = useUser()
  const currentUserId = getCurrentUserId(userType)
  const [activeThread, setActiveThread] = useState(null)  // null | string
  const [showDetail, setShowDetail]   = useState(false)
  const [filter, setFilter] = useState('전체')

  // store에서 본인 스레드 구독
  const storeThreadGroups = useStoreData(
    () => getMyMessageThreads({ userId: currentUserId })
  )

  // store thread → THREADS 카드 형태로 변환
  const storeThreads = storeThreadGroups
    .map(adaptStoreThread)
    .filter(Boolean)

  // 합쳐진 스레드 목록 (store + 정적), 미읽음 우선 → 시간 역순
  const allThreads = [...storeThreads, ...THREADS].sort((a, b) => {
    // 1) 미읽음 우선
    if ((a.unread > 0) !== (b.unread > 0)) {
      return a.unread > 0 ? -1 : 1
    }
    // 2) 시간 역순 — store는 _createdAt, 정적은 time 문자열 (대충 매핑)
    if (a._fromStore && b._fromStore) {
      return new Date(b._createdAt) - new Date(a._createdAt)
    }
    if (a._fromStore && !b._fromStore) return -1
    if (!a._fromStore && b._fromStore) return 1
    return 0   // 정적끼리는 원본 순서 유지
  })

  const filters = ['전체', '주의']
  const filtered = allThreads.filter(t => {
    if (filter === '전체') return true
    if (filter === '주의') return t.status !== 'normal'
    return true
  })
  const totalUnread = allThreads.reduce((s, t) => s + (t.unread || 0), 0)

  const thread = allThreads.find(t => t.id === activeThread)
  // 채팅 데이터 — store 스레드면 어댑터로, 정적이면 CHATS에서
  const chat = (() => {
    if (!thread) return null
    if (thread._fromStore) return adaptStoreChat(thread.id)
    return CHATS[thread.id] || null
  })()

  // 상세 화면
  if (activeThread && showDetail) {
    return (
      <div className="phone flex flex-col" style={{ height:'100vh', overflow:'hidden' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <DetailScreen thread={thread} onBack={() => setShowDetail(false)} />
        </div>
      </div>
    )
  }

  // 채팅방
  if (activeThread) {
    return (
      <div className="phone flex flex-col" style={{ height:'100vh', overflow:'hidden' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <ChatRoom
            thread={thread}
            chat={chat}
            onBack={() => setActiveThread(null)}
            onOpenDetail={thread._fromStore ? null : () => setShowDetail(true)}
          />
        </div>
      </div>
    )
  }

  // 목록
  return (
    <PhoneShell>
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* 다크 그라데이션 헤더 */}
        <GradientHeader paddingBottom="20px" bg={theme.headerGrad}>
          <PageTitle
            title="메시지"
            badge={totalUnread}
            right={
              <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.65)' }}>
                거래 관계 {allThreads.length}명
              </span>
            }
          />

          {/* 필터 칩 */}
          <FilterChips
            dark
            value={filter}
            onChange={setFilter}
            items={[
              { id:'전체', label:'전체' },
              { id:'외주비', label:'외주비' },
              { id:'대여금', label:'대여금' },
              { id:'투자', label:'투자' },
              { id:'주의', label:'⚠ 주의' },
            ]}
          />
        </GradientHeader>

        {/* 라이트 영역 — 메시지 카드 리스트 */}
        <div style={{ padding:'20px 16px 24px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding:'40px 16px', textAlign:'center', color:COLORS.t4, fontSize:'13px' }}>
              해당 유형의 거래가 없어요
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {filtered.map(t => {
                const pct = Math.round((t.totalExecuted / t.totalAmount) * 100)
                const isWarning = t.status !== 'normal'
                return (
                  <button
                    key={t.id}
                    onClick={() => { setActiveThread(t.id); setShowDetail(false) }}
                    style={{
                      width:'100%',
                      background: COLORS.bgCard,
                      borderRadius: RADIUS.lg,
                      boxShadow: SHADOWS.card,
                      padding:'14px 16px',
                      display:'flex', alignItems:'center', gap:'12px',
                      border:'none',
                      cursor:'pointer', textAlign:'left',
                      fontFamily:'inherit',
                    }}>
                    {/* 아바타 */}
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <div style={{
                        width:'48px', height:'48px',
                        borderRadius:'50%',
                        background: t.avatarBg,
                        color: t.avatarFg,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize: t.emoji ? '26px' : '17px',
                        fontWeight:'700',
                      }}>
                        {t.emoji || t.initial}
                      </div>
                      {t.unread > 0 && (
                        <div style={{
                          position:'absolute', top:'-3px', right:'-3px',
                          minWidth:'18px', height:'18px',
                          padding:'0 5px',
                          borderRadius:'9px',
                          background: COLORS.danger,
                          border:`2px solid ${COLORS.bgCard}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'10px', fontWeight:'700', color:'#fff',
                        }}>
                          {t.unread}
                        </div>
                      )}
                    </div>

                    {/* 본문 */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'4px' }}>
                        <span style={{
                          fontSize:'14px',
                          fontWeight: t.unread > 0 ? '700' : '600',
                          color: COLORS.t1,
                          whiteSpace:'nowrap',
                          overflow:'hidden',
                          textOverflow:'ellipsis',
                          minWidth:0,
                          flexShrink:1,
                        }}>
                          {t.name}
                        </span>
                        {isWarning && (
                          <Badge bg={t.statusBg} color={t.statusColor} size="sm">
                            {shortStatusLabel(t.statusLabel)}
                          </Badge>
                        )}
                      </div>
                      <div style={{
                        fontSize:'12px',
                        color: COLORS.t3,
                        marginBottom:'8px',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>
                        {t.lastMsg}
                      </div>

                      {/* 진행률 바 + 퍼센트 */}
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{
                          flex:1,
                          height:'3px',
                          background: COLORS.bgMuted,
                          borderRadius: RADIUS.pill,
                          overflow:'hidden',
                        }}>
                          <div style={{
                            width:`${pct}%`,
                            height:'100%',
                            background: progressGradient(pct, isWarning ? null : (pct >= 100 ? 'success' : null)),
                            borderRadius: RADIUS.pill,
                            transition:'width .3s',
                          }} />
                        </div>
                        <span style={{
                          fontSize:'11px',
                          fontWeight:'700',
                          color: pct >= 100 ? theme.brand
                                : isWarning ? COLORS.danger
                                : pct >= 70 ? COLORS.danger
                                : pct >= 40 ? COLORS.warning
                                : COLORS.danger,
                          flexShrink:0,
                          minWidth:'30px', textAlign:'right',
                        }}>
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* 시간 + 화살표 */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'14px', flexShrink:0 }}>
                      <span style={{ fontSize:'10px', color: COLORS.t4 }}>{t.time}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.t5} strokeWidth="2" strokeLinecap="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

      </div> {/* 스크롤 영역 끝 */}

      <BottomTab />
    </PhoneShell>
  )
}
