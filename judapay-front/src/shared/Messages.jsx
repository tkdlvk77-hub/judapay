import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
import { getAllApprovalMsgs } from './approvalMessageBus'

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
    id: 'approval', name: '처리센터 알림', initial: '📋', emoji: '📋',
    avatarBg: '#1E3A5F', avatarFg: '#FFFFFF',
    type: '처리센터', typeBg: '#EDF3FA', typeColor: '#2D6BB0',
    amount: 0, balance: 0,
    lastMsg: '박철수 님이 검수 승인하였습니다.',
    time: '15:30', unread: 3,
    status: 'normal', statusLabel: '정상', statusBg: '#E6F5EF', statusColor: '#2A7D5E',
    totalExecuted: 0, totalAmount: 1,
    role: '처리 내역 알림',
  },
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
  'approval': {
    messages: [
      { id:1, from:'system', type:'approvalAction', time:'10:05', date:'2026.05.10',
        approvalAction: {
          action: 'approved',
          actor: '박철수',
          itemTitle: '5월 임금 지급 요청 — 3,200,000원',
          note: null,
        }
      },
      { id:2, from:'system', type:'approvalAction', time:'11:22', date:'2026.05.10',
        approvalAction: {
          action: 'inspection_approved',
          actor: '김재무',
          itemTitle: '4월 외주비 정산 — 박철수 1,500,000원',
          note: null,
        }
      },
      { id:3, from:'system', type:'approvalAction', time:'14:10', date:'2026.05.11',
        approvalAction: {
          action: 'inspection_rejected',
          actor: '이대표',
          itemTitle: '영업팀 법인카드 이용 내역 검수',
          note: '4월 27일 GS강남게임센터 결제 건 소명 필요',
        }
      },
      { id:4, from:'system', type:'approvalAction', time:'09:33', date:'2026.05.12',
        approvalAction: {
          action: 'extra_docs',
          actor: '박철수',
          itemTitle: '거래처 접대비 지출 승인 요청',
          note: '세금계산서 또는 영수증 원본 제출 요청',
          requestedDocs: ['세금계산서 원본', '사업자 등록증 사본'],
        }
      },
      { id:5, from:'system', type:'approvalAction', time:'15:30', date:'2026.05.12',
        approvalAction: {
          action: 'usage_confirmed',
          actor: '김재무',
          itemTitle: '앱 기능 개발 외주 결과물 — 사용내역확인',
          note: '내부 검토 완료. 지출 내역 이상 없음.',
        }
      },
    ],
    fdsAlert: null,
  },
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
      { id:6, from:'system', type:'usageCheck', time:'23:50', date:'2026.04.27',
        usageCheck: {
          merchant: 'GS강남게임센터', amount: 89000,
          deadline: '2026.04.30', status: 'pending', code: 'UC_001',
          requestTypes: ['사용내역요청', '첨부파일요청'],
          note: 'MCC 7993 허용 외 업종 결제 내역 확인 필요',
        }
      },
      { id:7, from:'other', text:'메인 5종 1차 시안 완료했습니다. 검수 부탁드립니다.', time:'13:40', date:'2026.05.06' },
      { id:8, from:'system', type:'milestone', time:'13:40', date:'2026.05.06',
        milestone: { text: 'UI 시안 1차 납품', done: true, code: 'SC_001' }
      },
      { id:9, from:'other', text:'검수 확인 후 잔금 부탁드립니다', time:'14:22', date:'2026.05.06' },
      { id:10, from:'system', type:'reviewRequest', time:'15:30', date:'2026.05.12',
        reviewRequest: {
          resubmitRequest: true,
          deadline: '2026.05.30',
          attachmentRequest: true,
          message: '알림 모듈 미구현 항목을 수정하여 재제출해 주세요. 완성된 소스코드와 납품 확인서를 첨부해 주세요.',
          itemTitle: '앱 기능 개발 외주 결과물 검수',
        }
      },
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
// 스레드별 동적 메모 저장소 (ChatRoom ↔ DetailScreen 공유)
const _threadMemosStore = {}
function saveThreadMemo(threadId, memo) {
  if (!_threadMemosStore[threadId]) _threadMemosStore[threadId] = []
  _threadMemosStore[threadId].push(memo)
}
function deleteThreadMemo(threadId, memoId) {
  if (_threadMemosStore[threadId])
    _threadMemosStore[threadId] = _threadMemosStore[threadId].filter(m => m.id !== memoId)
}
function getThreadMemos(threadId) {
  return _threadMemosStore[threadId] || []
}

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
function DetailScreen({ thread, onBack }) {
  const theme = getAccountTheme()
  const [tab, setTab] = useState('거래')
  const [expandedTrade, setExpandedTrade] = useState(null)
  const [tick, setTick] = useState(0)  // 메모 갱신용
  const data = DETAIL_DATA[thread.id] || { trades:[], attachments:[], memos:[], userInfo:{} }
  const pct = Math.round((thread.totalExecuted / thread.totalAmount) * 100)

  // 동적 메모 (ChatRoom에서 저장된 것 + 정적 데이터)
  const dynamicMemos = getThreadMemos(thread.id)
  const allDetailMemos = [
    ...data.memos.map(m => ({ id:'static_'+m, text: m, time:null, txLabel:null })),
    ...dynamicMemos,
  ]

  const tabs = [
    { key:'거래',    icon:'📋', count: data.trades.length },
    { key:'첨부파일', icon:'📎', count: data.attachments.length },
    { key:'메모',    icon:'📄', count: allDetailMemos.length },
    { key:'상대정보', icon:'👤', count: 0 },
  ]

  // 금액 → 만원 단위 포맷
  const fmt만 = (n) => n >= 10000
    ? (n / 10000).toFixed(1).replace(/\.0$/, '') + '만'
    : n.toLocaleString()

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F4F5F7' }}>

      {/* ── 헤더 ── */}
      <div style={{ background: theme.headerGrad, paddingTop:'16px', flexShrink:0 }}>

        {/* 네비 */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'4px 16px 16px',
        }}>
          <button onClick={onBack} style={{
            width:'32px', height:'32px',
            background:'rgba(255,255,255,0.12)', border:'none',
            borderRadius:'10px',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', padding:0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>상세 정보</span>
          <button style={{
            width:'32px', height:'32px',
            background:'rgba(255,255,255,0.12)', border:'none',
            borderRadius:'10px',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', padding:0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>

        {/* 아바타 + 인물 정보 */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', padding:'0 18px 16px' }}>
          {/* 큰 아바타 */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{
              width:'64px', height:'64px',
              borderRadius:'20px',
              background: thread.avatarBg, color: thread.avatarFg,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize: thread.emoji ? '32px' : '22px',
              fontWeight:700,
              boxShadow:'0 6px 20px rgba(0,0,0,0.25)',
            }}>
              {thread.emoji || thread.initial}
            </div>
            {/* KYC 뱃지 */}
            <div style={{
              position:'absolute', bottom:'-4px', right:'-4px',
              width:'20px', height:'20px', borderRadius:'50%',
              background:'#34D399',
              display:'flex', alignItems:'center', justifyContent:'center',
              border:'2px solid rgba(255,255,255,0.3)',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>

          {/* 이름 + 역할 */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
              <span style={{ fontSize:'18px', fontWeight:800, color:'#fff' }}>{thread.name}</span>
              <span style={{
                padding:'2px 7px',
                background:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.9)',
                borderRadius:'6px', fontSize:'9px', fontWeight:700,
                border:'1px solid rgba(255,255,255,0.2)',
              }}>
                {thread.type}
              </span>
            </div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.65)', marginBottom:'6px' }}>
              {thread.role}
            </div>
            {/* 상태 뱃지 */}
            <span style={{
              display:'inline-block',
              padding:'3px 9px',
              background: thread.status === 'normal' ? 'rgba(52,211,153,0.2)' : 'rgba(252,165,165,0.2)',
              color: thread.status === 'normal' ? '#6EE7B7' : '#FCA5A5',
              borderRadius:'6px', fontSize:'10px', fontWeight:700,
              border:`1px solid ${thread.status === 'normal' ? 'rgba(52,211,153,0.3)' : 'rgba(252,165,165,0.3)'}`,
            }}>
              {thread.status === 'normal' ? '● 정상' : `⚠ ${thread.statusLabel}`}
            </span>
          </div>
        </div>

        {/* 집행 현황 게이지 */}
        <div style={{ padding:'0 16px 18px', display:'flex', alignItems:'center', gap:'14px' }}>
          {/* 원형 게이지 */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5.5"/>
              <circle cx="32" cy="32" r="24" fill="none"
                stroke={pct >= 80 ? '#FCA5A5' : '#34D399'}
                strokeWidth="5.5" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 150.8} 150.8`}
                transform="rotate(-90 32 32)"
              />
            </svg>
            <div style={{
              position:'absolute', inset:0,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            }}>
              <span style={{ fontSize:'13px', fontWeight:800, color:'#fff', lineHeight:1 }}>{pct}%</span>
              <span style={{ fontSize:'7px', color:'rgba(255,255,255,0.5)', fontWeight:600, marginTop:'2px' }}>집행률</span>
            </div>
          </div>

          {/* 바 + 수치 */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ marginBottom:'10px' }}>
              <div style={{ height:'4px', background:'rgba(255,255,255,0.12)', borderRadius:'2px', overflow:'hidden' }}>
                <div style={{
                  width:`${pct}%`, height:'100%', borderRadius:'2px',
                  background: pct >= 80
                    ? 'linear-gradient(90deg,#FCA5A5,#EF4444)'
                    : 'linear-gradient(90deg,#34D399,#10B981)',
                }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
                <span style={{ fontSize:'8px', color:'rgba(255,255,255,0.35)' }}>집행 {fmt만(thread.totalExecuted)}원</span>
                <span style={{ fontSize:'8px', color:'rgba(255,255,255,0.35)' }}>총 {fmt만(thread.totalAmount)}원</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
              {[
                { label:'집행액', value: fmt만(thread.totalExecuted)+'원', alert: false },
                { label:'잔액', value: fmt만(thread.balance)+'원', alert: pct>=80 },
              ].map((item,i) => (
                <div key={i} style={{
                  background:'rgba(255,255,255,0.09)', borderRadius:'9px',
                  padding:'7px 10px',
                  border:'1px solid rgba(255,255,255,0.1)',
                }}>
                  <div style={{ fontSize:'8px', color:'rgba(255,255,255,0.4)', fontWeight:600, marginBottom:'2px' }}>{item.label}</div>
                  <div style={{ fontSize:'12px', fontWeight:700, color: item.alert ? '#FCA5A5' : '#fff' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 탭 바 ── */}
      <div style={{
        display:'flex',
        background:'#fff',
        borderBottom:`1px solid ${COLORS.borderSoft}`,
        flexShrink:0,
        padding:'0 8px',
      }}>
        {tabs.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex:1, padding:'12px 2px 11px',
                background:'none', border:'none',
                borderBottom: active ? `2.5px solid ${theme.brand}` : '2.5px solid transparent',
                cursor:'pointer', fontFamily:'inherit',
                display:'flex', flexDirection:'column', alignItems:'center', gap:'1px',
              }}>
              <span style={{ fontSize:'15px' }}>{t.icon}</span>
              <span style={{
                fontSize:'10px', fontWeight: active ? 700 : 500,
                color: active ? theme.brand : COLORS.t4,
                marginTop:'1px',
              }}>
                {t.key}{t.count > 0 ? ` ${t.count}` : ''}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── 탭 콘텐츠 ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 14px 24px' }}>

        {/* ─ 거래 탭 ─ */}
        {tab === '거래' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {data.trades.map(trade => {
              const isExpanded = expandedTrade === trade.id
              return (
                <div key={trade.id} style={{
                  background:'#fff',
                  borderRadius:'16px',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                  overflow:'hidden',
                }}>
                  <button
                    onClick={() => setExpandedTrade(isExpanded ? null : trade.id)}
                    style={{
                      width:'100%', padding:'14px',
                      display:'flex', alignItems:'center', gap:'12px',
                      background:'none', border:'none',
                      cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                    }}>
                    <div style={{
                      width:'42px', height:'42px', borderRadius:'13px',
                      background:`${theme.brand}14`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'20px', flexShrink:0,
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
                        <div style={{ fontSize:'13px', fontWeight:700, color: theme.brand, marginTop:'2px' }}>
                          {trade.amount.toLocaleString()}원
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px', flexShrink:0 }}>
                      <span style={{
                        padding:'3px 9px',
                        background: trade.status === '완료' ? '#D1FAE5' : '#FEF3C7',
                        color: trade.status === '완료' ? '#047857' : '#854F0B',
                        borderRadius:'7px', fontSize:'10px', fontWeight:700,
                      }}>
                        {trade.status}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2.2" strokeLinecap="round">
                        {isExpanded
                          ? <polyline points="18 15 12 9 6 15"/>
                          : <polyline points="6 9 12 15 18 9"/>
                        }
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${COLORS.borderSoft}` }}>
                      {trade.detail.steps && (
                        <div style={{ marginTop:'12px', display:'flex', flexDirection:'column', gap:'7px' }}>
                          <div style={{ fontSize:'11px', fontWeight:700, color: COLORS.t3, marginBottom:'2px' }}>지급 현황</div>
                          {trade.detail.steps.map((step, si) => {
                            const s = STEP_STYLE[step.status]
                            return (
                              <div key={si} style={{
                                display:'flex', alignItems:'center', gap:'10px',
                                padding:'10px 12px',
                                background:'#F8F9FB', borderRadius:'11px',
                              }}>
                                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: s.dot, flexShrink:0 }} />
                                <div style={{ flex:1 }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px' }}>
                                    <span style={{ fontSize:'12px', fontWeight:700, color: COLORS.t1 }}>{step.label}</span>
                                    <span style={{ padding:'1px 6px', background: s.bg, color: s.color, borderRadius:'4px', fontSize:'9px', fontWeight:700 }}>
                                      {s.label}
                                    </span>
                                    {step.date && <span style={{ fontSize:'10px', color: COLORS.t4 }}>{step.date}</span>}
                                  </div>
                                  <span style={{ fontSize:'11px', color: COLORS.t3 }}>
                                    {step.amount.toLocaleString()}원 ({step.ratio})
                                  </span>
                                </div>
                                {step.action && (
                                  <button style={{
                                    padding:'6px 12px', background: theme.brand, color:'#fff',
                                    border:'none', borderRadius:'9px', fontSize:'11px', fontWeight:700,
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
                          marginTop:'10px', padding:'10px 12px',
                          background:'#FFFBEB', border:'1px solid #FDE68A',
                          borderRadius:'10px', fontSize:'11px', color:'#854F0B', lineHeight:1.5,
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
                padding:'13px 14px', background:'#fff',
                borderRadius:'14px',
                boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  width:'40px', height:'40px', borderRadius:'12px',
                  background:`${theme.brand}12`,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <div style={{ fontSize:'10px', color: COLORS.t4, marginTop:'2px' }}>{f.size} · {f.date}</div>
                </div>
                <div style={{ display:'flex', gap:'10px', flexShrink:0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
              </div>
            ))}
            <button style={{
              width:'100%', padding:'14px',
              background:'#fff', border:`1.5px dashed ${COLORS.borderSoft}`,
              borderRadius:'14px', fontSize:'12px', color: COLORS.t4,
              cursor:'pointer', fontFamily:'inherit', fontWeight:600,
            }}>
              + 파일 첨부
            </button>
          </div>
        )}

        {/* ─ 메모 탭 ─ */}
        {tab === '메모' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {allDetailMemos.length === 0 && (
              <div style={{ textAlign:'center', color: COLORS.t5, fontSize:'13px', paddingTop:'40px' }}>
                메모 없음
              </div>
            )}
            {allDetailMemos.map((m, i) => (
              <div key={m.id || i} style={{
                padding:'14px 16px',
                background: m.time ? '#FFFDE7' : '#FFFBEB',
                border: m.time ? '1px solid #FDE68A' : '1px solid #FCD34D',
                borderRadius:'13px',
                fontSize:'12px', color:'#854F0B', lineHeight:1.65,
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
                  <span style={{ fontSize:'14px', flexShrink:0 }}>{m.time ? '📝' : '📌'}</span>
                  <div style={{ flex:1 }}>
                    <div>{m.text}</div>
                    {m.txLabel && (
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'6px', padding:'3px 7px', background:'rgba(217,119,6,0.1)', borderRadius:'6px', width:'fit-content' }}>
                        <span style={{ fontSize:'10px' }}>🔗</span>
                        <span style={{ fontSize:'10px', fontWeight:700, color:'#92400E' }}>{m.txLabel}</span>
                      </div>
                    )}
                    {m.time && (
                      <div style={{ fontSize:'10px', color:'#B45309', marginTop:'4px', fontWeight:500 }}>🔒 나만 보임 · {m.time}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─ 상대정보 탭 ─ */}
        {tab === '상대정보' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {/* 상대방 카드 */}
            <div style={{
              background:'#fff', borderRadius:'16px',
              boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
              overflow:'hidden',
            }}>
              {/* 카드 헤더 */}
              <div style={{
                padding:'12px 16px',
                background:`${theme.brand}08`,
                borderBottom:`1px solid ${theme.brand}15`,
                display:'flex', alignItems:'center', gap:'10px',
              }}>
                <div style={{
                  width:'36px', height:'36px', borderRadius:'11px',
                  background: thread.avatarBg, color: thread.avatarFg,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize: thread.emoji ? '18px' : '13px', fontWeight:700,
                }}>
                  {thread.emoji || thread.initial}
                </div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, color: COLORS.t1 }}>{data.userInfo.name}</div>
                  <div style={{ fontSize:'11px', color: COLORS.t4 }}>{data.userInfo.role}</div>
                </div>
                <div style={{ marginLeft:'auto' }}>
                  <span style={{
                    padding:'3px 9px',
                    background:'#D1FAE5', color:'#047857',
                    borderRadius:'7px', fontSize:'10px', fontWeight:700,
                  }}>
                    {data.userInfo.kyc}
                  </span>
                </div>
              </div>
              {/* 상세 항목 */}
              {[
                ['연락처', data.userInfo.phone],
                ['입금 계좌', data.userInfo.bank],
                ['거래 시작일', data.userInfo.joined],
              ].map(([k, v], i, arr) => (
                <div key={k} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'13px 16px',
                  borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none',
                }}>
                  <span style={{ fontSize:'12px', color: COLORS.t4 }}>{k}</span>
                  <span style={{ fontSize:'13px', color: COLORS.t1, fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
            {/* 빠른 액션 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginTop:'4px' }}>
              {[
                { icon:'📞', label:'전화 연결' },
                { icon:'💬', label:'문자 발송' },
                { icon:'📄', label:'계약서 보기' },
                { icon:'🔒', label:'거래 동결' },
              ].map(btn => (
                <button key={btn.label} style={{
                  padding:'12px 10px',
                  background:'#fff',
                  border:`1px solid ${COLORS.borderSoft}`,
                  borderRadius:'13px',
                  display:'flex', alignItems:'center', gap:'7px',
                  cursor:'pointer', fontFamily:'inherit',
                  fontSize:'12px', fontWeight:600, color: COLORS.t2,
                }}>
                  <span style={{ fontSize:'16px' }}>{btn.icon}</span>
                  {btn.label}
                </button>
              ))}
            </div>
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
  const isApprovalThread = thread.id === 'approval'
  const [actionSheet, setActionSheet] = useState(null)   // null | 'request' | 'memo' | 'submit'
  const [requestType, setRequestType] = useState(null)   // null | 'settlement' | 'evidence' | 'refund' | 'data'
  const [memoText, setMemoText] = useState('')
  const [settlementForm, setSettlementForm] = useState({ purpose:'', memo:'', method:'개인카드' })
  const [evidenceForm, setEvidenceForm] = useState({ types:[], deadline:'', reason:'', message:'' })
  const [refundForm, setRefundForm] = useState({ amount:'', deadline:'', reason:'' })
  const [dataReqForm, setDataReqForm] = useState({ types:[], deadline:'', reason:'' })
  const [submitForm, setSubmitForm] = useState({ selectedReq: null, message:'', files:[] })
  const closeSheet = () => { setActionSheet(null); setRequestType(null); setSelectedTx(null) }
  const [deletedMsgIds, setDeletedMsgIds] = useState(new Set())
  const [deleteTarget, setDeleteTarget] = useState(null)   // { id, isMemo }
  const lpTimer = useRef(null)
  const scrollContainerRef = useRef(null)
  const msgBottomRef = useRef(null)
  const [inputText, setInputText] = useState('')

  function sendText() {
    const txt = inputText.trim()
    if (!txt) return
    pushLocalMsg({ from:'me', type:'text', text: txt })
    setInputText('')
  }

  function canDelete(msg) {
    if (msg.type === 'memo') return true               // 메모: 항상 삭제 가능
    if (msg.from === 'me') return msg.read !== true    // 내 메시지: 미읽음만
    return false
  }

  const startLongPress = useCallback((msg) => {
    lpTimer.current = setTimeout(() => {
      if (canDelete(msg)) setDeleteTarget({ id: msg.id, isMemo: msg.type === 'memo' })
    }, 600)
  }, [])

  const cancelLongPress = useCallback(() => {
    clearTimeout(lpTimer.current)
  }, [])
  const [localMsgs, setLocalMsgs] = useState([])
  const [memos, setMemos] = useState([])

  // 새 메시지 추가될 때 자동 스크롤
  useEffect(() => {
    msgBottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [localMsgs.length])
  const [selectedTx, setSelectedTx] = useState(null)   // 선택된 거래건

  const MOCK_TRANSACTIONS = [
    { id:'t1', label:'광고대행 용역비', amount:'5,000,000원', date:'05.08', type:'자금집행', badge:'#1D4ED8', badgeBg:'#EFF6FF' },
    { id:'t2', label:'마케팅 결제', amount:'1,200,000원', date:'05.06', type:'카드결제', badge:'#059669', badgeBg:'#ECFDF5' },
    { id:'t3', label:'개발 외주비', amount:'8,000,000원', date:'04.30', type:'자금집행', badge:'#1D4ED8', badgeBg:'#EFF6FF' },
    { id:'t4', label:'사무용품 구매', amount:'340,000원', date:'04.22', type:'카드결제', badge:'#059669', badgeBg:'#ECFDF5' },
  ]
  const MOCK_LOANS = [
    { id:'l1', label:'박팀장 대여금', amount:'3,000,000원', date:'04.15', type:'자금대여', badge:'#DC2626', badgeBg:'#FEF2F2' },
    { id:'l2', label:'운영자금 대여', amount:'10,000,000원', date:'03.20', type:'대여금', badge:'#D97706', badgeBg:'#FFFBEB' },
  ]

  function pushLocalMsg(msg) {
    const now = new Date()
    const time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0')
    setLocalMsgs(prev => [...prev, { ...msg, id: 'local_' + Date.now(), date:'오늘', time }])
  }
  const pct = isApprovalThread ? 0 : Math.round((thread.totalExecuted / thread.totalAmount) * 100)

  const allMsgs = [...(chat ? chat.messages : []), ...localMsgs].filter(m => !deletedMsgIds.has(m.id))

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background: COLORS.bg }}>

      {/* 헤더+메시지 통합 스크롤 영역 */}
      <div ref={scrollContainerRef} style={{ flex:1, overflowY:'auto' }}>

      {/* 채팅방 헤더 */}
      <div style={{
        background: theme.headerGrad,
        paddingTop:'16px',
      }}>
        {/* 상단 네비 */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'4px 16px 14px' }}>
          <button onClick={onBack}
            style={{
              width:'32px', height:'32px',
              background:'rgba(255,255,255,0.12)', border:'none',
              borderRadius:'10px',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', padding:0,
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style={{
            width:'40px', height:'40px',
            borderRadius:'13px',
            background: thread.avatarBg,
            color: thread.avatarFg,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize: thread.emoji ? '22px' : '15px',
            fontWeight:700,
            flexShrink:0,
            boxShadow:'0 2px 8px rgba(0,0,0,0.2)',
          }}>
            {thread.emoji || thread.initial}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px' }}>
              <span style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>{thread.name}</span>
              <span style={{
                padding:'2px 7px',
                background:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.9)',
                borderRadius:'6px', fontSize:'9px', fontWeight:700,
                border:'1px solid rgba(255,255,255,0.2)',
              }}>
                {thread.type}
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#34D399' }} />
              <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)' }}>
                {thread.totalAmount.toLocaleString()}원
              </span>
            </div>
          </div>
          {/* 전화 */}
          <button style={{
            width:'32px', height:'32px',
            background:'rgba(255,255,255,0.12)', border:'none',
            borderRadius:'10px',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', padding:0,
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
          {/* 더보기 → 상세 화면 */}
          {onOpenDetail && (
            <button onClick={onOpenDetail}
              style={{
                width:'32px', height:'32px',
                background:'rgba(255,255,255,0.12)', border:'none',
                borderRadius:'10px',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', padding:0,
              }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="5" cy="12" r="1.5" fill="#fff"/>
                <circle cx="12" cy="12" r="1.5" fill="#fff"/>
                <circle cx="19" cy="12" r="1.5" fill="#fff"/>
              </svg>
            </button>
          )}
        </div>

        {/* 집행 현황 시각화 — 원형 게이지 + 바 (처리센터 알림 스레드에서는 숨김) */}
        {!isApprovalThread && <div style={{ padding:'0 16px 18px', display:'flex', alignItems:'center', gap:'16px' }}>

          {/* 원형 진행 게이지 */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              {/* 배경 트랙 */}
              <circle cx="36" cy="36" r="28"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="6.5"
              />
              {/* 진행 호 */}
              <circle cx="36" cy="36" r="28"
                fill="none"
                stroke={pct >= 80 ? '#FCA5A5' : '#34D399'}
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 175.93} 175.93`}
                transform="rotate(-90 36 36)"
              />
              {/* 잔액 호 (연한 색) — pct 이후 나머지 */}
              {pct < 100 && (
                <circle cx="36" cy="36" r="28"
                  fill="none"
                  stroke={pct >= 80 ? 'rgba(252,165,165,0.2)' : 'rgba(52,211,153,0.18)'}
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  strokeDasharray={`${((100 - pct) / 100) * 175.93} 175.93`}
                  strokeDashoffset={`${-1 * (pct / 100) * 175.93}`}
                  transform="rotate(-90 36 36)"
                />
              )}
            </svg>
            {/* 중앙 텍스트 */}
            <div style={{
              position:'absolute', inset:0,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
            }}>
              <span style={{ fontSize:'15px', fontWeight:800, color:'#fff', lineHeight:1 }}>
                {pct}%
              </span>
              <span style={{ fontSize:'8px', color:'rgba(255,255,255,0.5)', fontWeight:600, marginTop:'2px' }}>
                집행
              </span>
            </div>
          </div>

          {/* 오른쪽 — 바 + 수치 */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* 가로 진행 바 */}
            <div style={{ marginBottom:'11px' }}>
              <div style={{
                height:'5px',
                background:'rgba(255,255,255,0.12)',
                borderRadius:'3px', overflow:'hidden',
              }}>
                <div style={{
                  width:`${pct}%`,
                  height:'100%',
                  background: pct >= 80
                    ? 'linear-gradient(90deg,#FCA5A5,#EF4444)'
                    : 'linear-gradient(90deg,#34D399,#10B981)',
                  borderRadius:'3px',
                }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
                <span style={{ fontSize:'8px', color:'rgba(255,255,255,0.35)', fontWeight:500 }}>0</span>
                <span style={{ fontSize:'8px', color:'rgba(255,255,255,0.35)', fontWeight:500 }}>
                  {thread.totalAmount >= 10000
                    ? (thread.totalAmount / 10000).toFixed(0) + '만원'
                    : thread.totalAmount.toLocaleString() + '원'}
                </span>
              </div>
            </div>

            {/* 집행 / 잔액 카드 2칸 */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
              <div style={{
                background:'rgba(255,255,255,0.09)',
                borderRadius:'10px', padding:'8px 10px',
                border:'1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize:'8px', color:'rgba(255,255,255,0.4)', fontWeight:600, marginBottom:'3px' }}>
                  집행액
                </div>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>
                  {thread.totalExecuted >= 10000
                    ? (thread.totalExecuted / 10000).toFixed(1).replace(/\.0$/, '') + '만'
                    : thread.totalExecuted.toLocaleString()}원
                </div>
              </div>
              <div style={{
                background:'rgba(255,255,255,0.09)',
                borderRadius:'10px', padding:'8px 10px',
                border:'1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize:'8px', color:'rgba(255,255,255,0.4)', fontWeight:600, marginBottom:'3px' }}>
                  잔액
                </div>
                <div style={{ fontSize:'13px', fontWeight:700, color: pct >= 80 ? '#FCA5A5' : '#6EE7B7' }}>
                  {thread.balance >= 10000
                    ? (thread.balance / 10000).toFixed(1).replace(/\.0$/, '') + '만'
                    : thread.balance.toLocaleString()}원
                </div>
              </div>
            </div>
          </div>
        </div>}
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
      <div style={{ padding:'14px 14px 10px', background:'#F7F8FA', minHeight:'300px' }}>
        {allMsgs.map((msg, i) => {
          const prevMsg = i > 0 ? allMsgs[i-1] : null
          const showDate = !prevMsg || (prevMsg.date ?? '') !== (msg.date ?? '')
          return (
            <div key={msg.id}>
              {showDate && (
                <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'20px 0 14px' }}>
                  <div style={{ flex:1, height:'1px', background:'#D1D5DB' }} />
                  <span style={{
                    padding:'4px 12px',
                    background:'#1F2937',
                    borderRadius: RADIUS.pill,
                    fontSize:'10px', color:'#F9FAFB', fontWeight:700,
                    whiteSpace:'nowrap',
                    letterSpacing:'0.02em',
                  }}>
                    {msg.date}
                  </span>
                  <div style={{ flex:1, height:'1px', background:'#D1D5DB' }} />
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
                    <span style={{ fontSize:'10px', color: COLORS.t3, fontWeight:500 }}>{msg.time}</span>
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
                    <span style={{ fontSize:'10px', color: COLORS.t3, fontWeight:500 }}>{msg.time}</span>
                  </div>
                </div>

              ) : msg.from === 'system' && msg.type === 'reviewRequest' ? (
                /* ── 검수 추가 요청 카드 ── */
                (() => {
                  const rr = msg.reviewRequest
                  return (
                    <div style={{ margin:'6px 0' }}>
                      <div style={{
                        background:'#FAF5FF',
                        border:'1.5px solid #C4B5FD',
                        borderRadius:'14px',
                        overflow:'hidden',
                      }}>
                        {/* 헤더 */}
                        <div style={{
                          background:'linear-gradient(135deg,#7C3AED 0%,#6D28D9 100%)',
                          padding:'10px 14px',
                          display:'flex', alignItems:'center', gap:'8px',
                        }}>
                          <span style={{ fontSize:'16px' }}>🔄</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:'12px', fontWeight:800, color:'#fff' }}>검수 추가 요청</div>
                            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.7)', marginTop:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {rr.itemTitle}
                            </div>
                          </div>
                        </div>
                        {/* 요청 태그 */}
                        <div style={{ padding:'10px 14px 0', display:'flex', flexWrap:'wrap', gap:'6px' }}>
                          {rr.resubmitRequest && (
                            <span style={{
                              display:'inline-flex', alignItems:'center', gap:'4px',
                              padding:'3px 9px', borderRadius:'20px',
                              background:'#EDE9FE', color:'#6D28D9',
                              fontSize:'11px', fontWeight:700,
                            }}>
                              🔄 재제출요청
                            </span>
                          )}
                          {rr.deadline && (
                            <span style={{
                              display:'inline-flex', alignItems:'center', gap:'4px',
                              padding:'3px 9px', borderRadius:'20px',
                              background:'#FEF3C7', color:'#92400E',
                              fontSize:'11px', fontWeight:700,
                            }}>
                              📅 요청기한 · {rr.deadline}
                            </span>
                          )}
                          {rr.attachmentRequest && (
                            <span style={{
                              display:'inline-flex', alignItems:'center', gap:'4px',
                              padding:'3px 9px', borderRadius:'20px',
                              background:'#EFF6FF', color:'#1D4ED8',
                              fontSize:'11px', fontWeight:700,
                            }}>
                              📎 첨부파일요청
                            </span>
                          )}
                        </div>
                        {/* 메시지 본문 */}
                        <div style={{ padding:'8px 14px 12px' }}>
                          <div style={{
                            fontSize:'12px', color:'#374151', lineHeight:1.65,
                            background:'#F5F3FF', borderRadius:'8px',
                            padding:'8px 10px', borderLeft:'3px solid #7C3AED',
                          }}>
                            {rr.message}
                          </div>
                        </div>
                        {/* 하단 액션 */}
                        <div style={{
                          borderTop:'1px solid #EDE9FE',
                          padding:'8px 14px',
                          display:'flex', gap:'8px', justifyContent:'flex-end',
                        }}>
                          {rr.attachmentRequest && (
                            <button style={{
                              display:'inline-flex', alignItems:'center', gap:'5px',
                              padding:'5px 14px', borderRadius:'20px',
                              background:'#EFF6FF', color:'#1D4ED8',
                              border:'1.5px solid #BFDBFE',
                              fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                              </svg>
                              파일 첨부
                            </button>
                          )}
                          {rr.resubmitRequest && (
                            <button style={{
                              display:'inline-flex', alignItems:'center', gap:'5px',
                              padding:'5px 14px', borderRadius:'20px',
                              background:'#EDE9FE', color:'#6D28D9',
                              border:'1.5px solid #C4B5FD',
                              fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                              </svg>
                              재제출
                            </button>
                          )}
                          <button style={{
                            padding:'5px 14px', borderRadius:'20px',
                            background:'#7C3AED', color:'#fff', border:'none',
                            fontSize:'11px', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                          }}>
                            확인
                          </button>
                        </div>
                      </div>
                      <div style={{ textAlign:'center', marginTop:'3px' }}>
                        <span style={{ fontSize:'10px', color: COLORS.t3, fontWeight:500 }}>{msg.time}</span>
                      </div>
                    </div>
                  )
                })()

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
                        <span style={{ fontSize:'10px', color: COLORS.t3, fontWeight:500 }}>{msg.time}</span>
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
                    <span style={{ fontSize:'10px', color: COLORS.t3, fontWeight:500 }}>{msg.time}</span>
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
                    <span style={{ fontSize:'10px', color: COLORS.t3, fontWeight:500 }}>{msg.time}</span>
                  </div>
                </div>

              ) : msg.from === 'system' && msg.type === 'usageCheck' ? (
                /* ── 사용내역요청 카드 (구 소명+증빙 통합) ── */
                (() => {
                  const uc = msg.usageCheck
                  return (
                    <div style={{ margin:'6px 0' }}>
                      <div style={{ background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:'14px', overflow:'hidden' }}>
                        {/* 헤더 */}
                        <div style={{
                          background:'linear-gradient(135deg,#D97706 0%,#B45309 100%)',
                          padding:'10px 14px',
                          display:'flex', alignItems:'center', gap:'8px',
                        }}>
                          <span style={{ fontSize:'16px' }}>📋</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:'12px', fontWeight:800, color:'#fff' }}>사용내역 요청</div>
                            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.75)', marginTop:'1px' }}>
                              {uc.merchant} · {uc.amount.toLocaleString()}원
                            </div>
                          </div>
                          <span style={{
                            padding:'2px 8px', borderRadius:'8px',
                            background: uc.status==='pending' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)',
                            color:'#fff', fontSize:'10px', fontWeight:700,
                          }}>
                            {uc.status==='pending'?'미제출':'완료'}
                          </span>
                        </div>
                        {/* 요청 태그 */}
                        <div style={{ padding:'10px 14px 0', display:'flex', flexWrap:'wrap', gap:'6px' }}>
                          {(uc.requestTypes||[]).map((rt,i) => (
                            <span key={i} style={{
                              display:'inline-flex', alignItems:'center', gap:'4px',
                              padding:'3px 9px', borderRadius:'20px',
                              background:'#FEF3C7', color:'#92400E',
                              fontSize:'11px', fontWeight:700,
                            }}>
                              {rt === '사용내역요청' ? '📄' : rt === '첨부파일요청' ? '📎' : rt === '재제출요청' ? '🔄' : '📋'} {rt}
                            </span>
                          ))}
                        </div>
                        {/* 본문 */}
                        <div style={{ padding:'8px 14px 12px' }}>
                          {uc.note && (
                            <div style={{
                              fontSize:'12px', color:'#78350F', lineHeight:1.65,
                              background:'#FFF8E7', borderRadius:'8px',
                              padding:'8px 10px', borderLeft:'3px solid #F59E0B',
                              marginBottom:'8px',
                            }}>
                              {uc.note}
                            </div>
                          )}
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:'10px', color:'#92400E' }}>요청기한: {uc.deadline} · {uc.code}</span>
                          </div>
                        </div>
                        {/* 액션 */}
                        {uc.status === 'pending' && (
                          <div style={{ borderTop:'1px solid #FDE68A', padding:'8px 14px', display:'flex', gap:'8px' }}>
                            <button style={{
                              flex:1, padding:'7px',
                              background:'#F59E0B', border:'none', borderRadius:'9px',
                              color:'#fff', fontSize:'11px', fontWeight:700,
                              cursor:'pointer', fontFamily:'inherit',
                            }}>
                              사용내역 제출
                            </button>
                            <button style={{
                              flex:1, padding:'7px',
                              background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:'9px',
                              color:'#92400E', fontSize:'11px', fontWeight:700,
                              cursor:'pointer', fontFamily:'inherit',
                            }}>
                              파일 첨부
                            </button>
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign:'center', marginTop:'3px' }}>
                        <span style={{ fontSize:'10px', color: COLORS.t3, fontWeight:500 }}>{msg.time}</span>
                      </div>
                    </div>
                  )
                })()

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
                    <span style={{ fontSize:'10px', color: COLORS.t3, fontWeight:500 }}>{msg.time}</span>
                  </div>
                </div>

              ) : msg.from === 'system' && msg.type === 'approvalAction' ? (
                /* ── 처리센터 액션 결과 카드 ── */
                (() => {
                  const aa = msg.approvalAction
                  const actionMeta = {
                    approved:            { icon:'✅', label:'승인 완료',         bg:'#F0FDF4', border:'#BBF7D0', hg:'linear-gradient(135deg,#059669 0%,#047857 100%)', color:'#047857' },
                    inspection_approved: { icon:'🔍', label:'검수 승인',         bg:'#EFF6FF', border:'#BFDBFE', hg:'linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)', color:'#1D4ED8' },
                    inspection_rejected: { icon:'❌', label:'검수 반려',         bg:'#FEF2F2', border:'#FECACA', hg:'linear-gradient(135deg,#DC2626 0%,#B91C1C 100%)', color:'#DC2626' },
                    extra_docs:          { icon:'📎', label:'추가서류 요청',     bg:'#FFFBEB', border:'#FDE68A', hg:'linear-gradient(135deg,#D97706 0%,#B45309 100%)', color:'#92400E' },
                    usage_confirmed:     { icon:'📋', label:'사용내역확인 완료', bg:'#F5F3FF', border:'#DDD6FE', hg:'linear-gradient(135deg,#7C3AED 0%,#6D28D9 100%)', color:'#6D28D9' },
                  }
                  const m = actionMeta[aa.action] || actionMeta.approved
                  return (
                    <div style={{ margin:'8px 0' }}>
                      <div style={{
                        background: m.bg,
                        border: `1.5px solid ${m.border}`,
                        borderRadius:'14px', overflow:'hidden',
                      }}>
                        {/* 카드 헤더 */}
                        <div style={{
                          background: m.hg,
                          padding:'10px 14px',
                          display:'flex', alignItems:'center', gap:'8px',
                        }}>
                          <span style={{ fontSize:'16px' }}>{m.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:'12px', fontWeight:800, color:'#fff' }}>
                              {aa.actor} 님이 {m.label}하였습니다.
                            </div>
                            <div style={{
                              fontSize:'10px', color:'rgba(255,255,255,0.75)',
                              marginTop:'1px',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                            }}>
                              {aa.itemTitle}
                            </div>
                          </div>
                        </div>
                        {/* 메모 / 추가서류 내용 */}
                        {(aa.note || (aa.requestedDocs && aa.requestedDocs.length > 0)) && (
                          <div style={{ padding:'10px 14px' }}>
                            {aa.note && (
                              <div style={{
                                fontSize:'12px', color: m.color, lineHeight:1.65,
                                background:'rgba(0,0,0,0.04)', borderRadius:'8px',
                                padding:'7px 10px',
                                borderLeft:`3px solid ${m.border}`,
                                marginBottom: aa.requestedDocs?.length ? '8px' : 0,
                              }}>
                                {aa.note}
                              </div>
                            )}
                            {aa.requestedDocs && aa.requestedDocs.length > 0 && (
                              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginTop:'4px' }}>
                                {aa.requestedDocs.map((doc,i) => (
                                  <span key={i} style={{
                                    padding:'2px 9px', borderRadius:'20px',
                                    background:`${m.border}80`, color: m.color,
                                    fontSize:'11px', fontWeight:600,
                                  }}>
                                    📄 {doc}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign:'center', marginTop:'3px' }}>
                        <span style={{ fontSize:'10px', color: COLORS.t3, fontWeight:500 }}>{msg.time}</span>
                      </div>
                    </div>
                  )
                })()

              ) : msg.type === 'requestCard' ? (
                /* ── 요청하기 카드 ── */
                <div style={{ margin:'8px 0' }}
                  onMouseDown={() => startLongPress(msg)} onMouseUp={cancelLongPress} onMouseLeave={cancelLongPress}
                  onTouchStart={() => startLongPress(msg)} onTouchEnd={cancelLongPress} onContextMenu={e => { e.preventDefault(); if(canDelete(msg)) setDeleteTarget({ id: msg.id, isMemo:false }) }}>
                  <div style={{
                    background:'#fff', borderRadius:'14px', overflow:'hidden',
                    boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                    border:`1.5px solid ${msg.card.borderColor}`,
                  }}>
                    <div style={{
                      background: msg.card.headerGrad,
                      padding:'10px 14px', display:'flex', alignItems:'center', gap:'8px',
                    }}>
                      <span style={{ fontSize:'16px' }}>{msg.card.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'12px', fontWeight:800, color:'#fff' }}>{msg.card.title}</div>
                        {msg.card.txLabel && (
                          <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.75)', marginTop:'1px' }}>
                            연결: {msg.card.txLabel}
                          </div>
                        )}
                      </div>
                      <span style={{
                        padding:'2px 8px', background:'rgba(255,255,255,0.25)',
                        borderRadius:'8px', fontSize:'10px', fontWeight:700, color:'#fff',
                      }}>{msg.card.statusLabel}</span>
                    </div>
                    <div style={{ padding:'12px 14px' }}>
                      {msg.card.fields.map((f, fi) => (
                        <div key={fi} style={{
                          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                          padding:'4px 0',
                          borderBottom: fi < msg.card.fields.length-1 ? '1px solid #F3F4F6' : 'none',
                        }}>
                          <span style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:600, minWidth:'70px' }}>{f.label}</span>
                          <span style={{ fontSize:'11px', color:'#111827', fontWeight:600, textAlign:'right', flex:1 }}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', marginTop:'3px', paddingRight:'4px' }}>
                    <span style={{ fontSize:'10px', color: COLORS.t3, fontWeight:500 }}>{msg.time}</span>
                  </div>
                </div>

              ) : msg.from === 'me' && msg.type === 'memo' ? (
                /* ── 메모 버블 (나만 보임) ── */
                <div style={{ display:'flex', flexDirection:'row-reverse', marginBottom:'8px', gap:'8px', alignItems:'flex-end' }}
                  onMouseDown={() => startLongPress(msg)} onMouseUp={cancelLongPress} onMouseLeave={cancelLongPress}
                  onTouchStart={() => startLongPress(msg)} onTouchEnd={cancelLongPress} onContextMenu={e => { e.preventDefault(); setDeleteTarget({ id: msg.id, isMemo:true }) }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', maxWidth:'75%' }}>
                    <div style={{
                      padding:'10px 13px',
                      background:'#FFFDE7',
                      border:'1px solid #FDE68A',
                      borderRadius:'14px 14px 4px 14px',
                      boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'5px' }}>
                        <span style={{ fontSize:'10px' }}>📝</span>
                        <span style={{ fontSize:'9px', fontWeight:700, color:'#92400E' }}>개인 메모</span>
                        <span style={{ fontSize:'9px', color:'#D97706', marginLeft:'2px' }}>· 나만 보임</span>
                      </div>
                      <div style={{ fontSize:'12px', color:'#78350F', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                        {msg.text}
                      </div>
                      {msg.txLabel && (
                        <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'8px', padding:'5px 8px', background:'rgba(217,119,6,0.12)', borderRadius:'8px' }}>
                          <span style={{ fontSize:'10px' }}>🔗</span>
                          <span style={{ fontSize:'10px', fontWeight:700, color:'#92400E' }}>연결: {msg.txLabel}</span>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize:'10px', color: COLORS.t3, fontWeight:500, marginTop:'3px' }}>나만 보이는 메모입니다 · {msg.time}</span>
                  </div>
                </div>

              ) : msg.from === 'system' ? (
                /* ── 일반 시스템 텍스트 (fallback) ── */
                <div style={{ textAlign:'center', margin:'10px 0' }}>
                  <span style={{
                    padding:'4px 12px',
                    background:'rgba(0,0,0,0.05)',
                    borderRadius: RADIUS.pill,
                    fontSize:'10px', color: COLORS.t4, fontWeight:500,
                  }}>
                    {msg.text}
                  </span>
                </div>

              ) : (
                <div style={{
                  display:'flex',
                  flexDirection: msg.from === 'me' ? 'row-reverse' : 'row',
                  marginBottom:'8px',
                  gap:'8px', alignItems:'flex-end',
                }}>
                  {msg.from === 'other' && (
                    <div style={{
                      width:'28px', height:'28px',
                      borderRadius:'9px',
                      background: thread.avatarBg, color: thread.avatarFg,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize: thread.emoji ? '14px' : '10px',
                      fontWeight:700, flexShrink:0,
                    }}>
                      {thread.emoji || thread.initial}
                    </div>
                  )}
                  <div style={{ display:'flex', flexDirection:'column', alignItems: msg.from === 'me' ? 'flex-end' : 'flex-start', maxWidth:'70%' }}>
                    <div
                      onMouseDown={() => msg.from === 'me' && startLongPress(msg)}
                      onMouseUp={cancelLongPress} onMouseLeave={cancelLongPress}
                      onTouchStart={e => { if(msg.from==='me'){ e.stopPropagation(); startLongPress(msg) } }}
                      onTouchEnd={cancelLongPress}
                      onContextMenu={e => { if(msg.from==='me'){ e.preventDefault(); if(canDelete(msg)) setDeleteTarget({ id:msg.id, isMemo:false }) } }}
                      style={{
                        padding:'10px 14px',
                        borderRadius: msg.from === 'me' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: msg.from === 'me' ? theme.brandDark : '#fff',
                        color: msg.from === 'me' ? '#fff' : COLORS.t1,
                        fontSize:'13px', lineHeight:1.55,
                        boxShadow: msg.from === 'other' ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
                        userSelect:'none', cursor: msg.from === 'me' ? 'pointer' : 'default',
                      }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize:'10px', color: COLORS.t3, fontWeight:500, marginTop:'3px', paddingLeft:'2px', paddingRight:'2px' }}>
                      {msg.time}{msg.from==='me' && (msg.read ? <span style={{ color: COLORS.t4, fontSize:'9px' }}> · 읽음</span> : <span style={{ color: COLORS.t4, fontSize:'9px' }}> · 미읽음</span>)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        <div ref={msgBottomRef} style={{ height:'8px' }} />
      </div>
      </div>{/* 스크롤 래퍼 끝 */}

      {/* 입력 바 — 처리센터 알림은 안내 문구 + 닫기 버튼만 */}
      {isApprovalThread ? (
        <div style={{
          background: COLORS.bgCard,
          borderTop: `1px solid ${COLORS.borderSoft}`,
          padding:'12px 16px 16px',
          flexShrink:0,
        }}>
          <p style={{
            margin:'0 0 10px',
            fontSize:'11px', color: COLORS.t4, lineHeight:1.6, textAlign:'center',
          }}>
            처리센터에서 승인·반려·요청 액션을 취하면<br/>해당 내역이 여기에 자동으로 기록됩니다.
          </p>
          <button onClick={onBack} style={{
            width:'100%', padding:'11px',
            background: theme.activeBtnGrad,
            border:'none', borderRadius:'12px',
            color:'#fff', fontSize:'13px', fontWeight:700,
            cursor:'pointer', fontFamily:'inherit',
            boxShadow: theme.activeShadow,
          }}>
            처리센터 알림 나가기
          </button>
        </div>
      ) : (
        <div style={{
          background: COLORS.bgCard,
          borderTop: `1px solid ${COLORS.borderSoft}`,
          padding:'8px 12px 14px',
          flexShrink:0,
        }}>
          {/* 빠른 액션 칩 */}
          <div style={{ display:'flex', gap:'6px', marginBottom:'8px', overflowX:'auto', paddingBottom:'2px' }}>
            {[
              { id:'request', label:'요청하기', icon:'📤', primary:true },
              { id:'memo',    label:'메모',    icon:'📝', primary:false },
              { id:'submit',  label:'자료제출', icon:'📎', primary:false },
            ].map(chip => (
              <button key={chip.id}
                onClick={() => { setActionSheet(chip.id); setRequestType(null) }}
                style={{
                  display:'inline-flex', alignItems:'center', gap:'5px',
                  padding:'6px 14px',
                  background: chip.primary ? theme.activeBtnGrad : '#F7F8FA',
                  color: chip.primary ? '#fff' : COLORS.t3,
                  border: chip.primary ? 'none' : `1px solid ${COLORS.borderSoft}`,
                  borderRadius: RADIUS.pill,
                  fontSize:'11px', fontWeight:700,
                  cursor:'pointer', flexShrink:0, fontFamily:'inherit',
                  boxShadow: chip.primary ? theme.activeShadow : 'none',
                }}>
                <span style={{ fontSize:'12px' }}>{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>

          {/* 입력 박스 */}
          <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText() } }}
              placeholder="메시지를 입력하세요"
              rows={1}
              style={{
                flex:1,
                background: COLORS.bgMuted,
                borderRadius:'14px',
                padding:'10px 14px',
                fontSize:'13px', color: COLORS.t1,
                border:`1px solid ${COLORS.borderSoft}`,
                outline:'none', resize:'none',
                fontFamily:'inherit', lineHeight:1.5,
                maxHeight:'96px', overflowY:'auto',
              }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
              }}
            />
            <button
              onClick={sendText}
              style={{
                width:'36px', height:'36px',
                borderRadius:'12px',
                background: inputText.trim() ? theme.activeBtnGrad : COLORS.bgMuted,
                border: inputText.trim() ? 'none' : `1px solid ${COLORS.borderSoft}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor: inputText.trim() ? 'pointer' : 'default',
                flexShrink:0,
                boxShadow: inputText.trim() ? theme.activeShadow : 'none',
                transition:'all 0.2s',
              }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke={inputText.trim() ? '#fff' : COLORS.t4}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 다이얼로그 ── */}
      {deleteTarget && (
        <div style={{
          position:'absolute', inset:0, zIndex:300,
          background:'rgba(15,20,35,0.5)',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'0 32px',
        }} onClick={() => setDeleteTarget(null)}>
          <div style={{
            background:'#fff', borderRadius:'20px',
            padding:'24px 20px 16px',
            width:'100%', textAlign:'center',
            boxShadow:'0 16px 48px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:'28px', marginBottom:'10px' }}>
              {deleteTarget.isMemo ? '📝' : '🗑️'}
            </div>
            <div style={{ fontSize:'15px', fontWeight:700, color:'#111827', marginBottom:'6px' }}>
              메시지를 삭제하시겠습니까?
            </div>
            <div style={{ fontSize:'12px', color:'#9CA3AF', marginBottom:'20px', lineHeight:1.5 }}>
              {deleteTarget.isMemo
                ? '내 메모를 삭제합니다.'
                : '상대방이 아직 읽지 않은 메시지입니다. 삭제하면 복구할 수 없습니다.'}
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ flex:1, padding:'12px', background:'#F3F4F6', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:'inherit' }}>
                취소
              </button>
              <button onClick={() => {
                  const tid = deleteTarget.id
                  setDeletedMsgIds(prev => new Set([...prev, tid]))
                  setLocalMsgs(prev => prev.filter(m => m.id !== tid))
                  if (deleteTarget.isMemo) {
                    setMemos(prev => prev.filter(m => m.id !== tid))
                    deleteThreadMemo(thread.id, tid)
                  }
                  setDeleteTarget(null)
                }}
                style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#DC2626,#EF4444)', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────
          바텀시트 오버레이 (요청하기 / 메모 / 자료제출)
      ────────────────────────────────────────── */}
      {actionSheet && (
        <div style={{
          position:'absolute', inset:0, zIndex:200,
          background:'rgba(15,20,35,0.45)',
          display:'flex', flexDirection:'column', justifyContent:'flex-end',
        }} onClick={closeSheet}>
          <div style={{
            background:'#fff',
            borderRadius:'20px 20px 0 0',
            padding:'0 0 32px',
            maxHeight:'90vh', overflowY:'auto',
          }} onClick={e => e.stopPropagation()}>

            {/* 시트 핸들 */}
            <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
              <div style={{ width:'40px', height:'4px', borderRadius:'2px', background:'#E4E6EA' }} />
            </div>

            {/* ── 요청하기 메인 메뉴 ── */}
            {actionSheet === 'request' && !requestType && (
              <div style={{ padding:'8px 20px 0' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#111827', marginBottom:'4px' }}>요청하기</div>
                <div style={{ fontSize:'12px', color:'#9CA3AF', marginBottom:'20px' }}>상대방에게 정산·증빙·상환·자료를 요청합니다</div>
                {[
                  { id:'settlement', emoji:'💰', label:'정산 요청', desc:'개인 지출 비용을 회사에 청구' },
                  { id:'evidence',   emoji:'📋', label:'증빙 요청', desc:'영수증·세금계산서·사용사유 제출 요청' },
                  { id:'refund',     emoji:'🔄', label:'상환 요청', desc:'대여금·선지급금 반환 요청' },
                  { id:'data',       emoji:'📁', label:'자료 요청', desc:'계약서·견적서·결과물 등 파일 요청' },
                ].map(item => (
                  <button key={item.id} onClick={() => setRequestType(item.id)}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', gap:'14px',
                      padding:'14px 16px', marginBottom:'8px',
                      background:'#F9FAFB', border:'1px solid #F0F1F3',
                      borderRadius:'14px', cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                    }}>
                    <span style={{ fontSize:'22px', flexShrink:0 }}>{item.emoji}</span>
                    <div>
                      <div style={{ fontSize:'14px', fontWeight:700, color:'#111827' }}>{item.label}</div>
                      <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'2px' }}>{item.desc}</div>
                    </div>
                    <svg style={{ marginLeft:'auto', flexShrink:0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            )}

            {/* ── 정산 요청 폼 ── */}
            {actionSheet === 'request' && requestType === 'settlement' && (
              <div style={{ padding:'8px 20px 0' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                  <button onClick={() => setRequestType(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <span style={{ fontSize:'15px', fontWeight:700, color:'#111827' }}>💰 정산 요청</span>
                </div>
                <div style={{ fontSize:'11px', color:'#9CA3AF', marginBottom:'20px', paddingLeft:'28px' }}>개인 지출한 업무 비용을 회사에 정산 요청합니다</div>

                <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                  {['📷 영수증 첨부', '🖼 사진 추가'].map(t => (
                    <button key={t} style={{ flex:1, padding:'28px 0', background:'#F9FAFB', border:'2px dashed #E4E6EA', borderRadius:'12px', cursor:'pointer', fontFamily:'inherit', fontSize:'11px', color:'#9CA3AF', fontWeight:600 }}>{t}</button>
                  ))}
                </div>

                <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>사용 목적</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'14px' }}>
                  {['출장비','식비','교통비','숙박비','사무용품','접대비','복리후생','기타'].map(p => (
                    <button key={p} onClick={() => setSettlementForm(f => ({ ...f, purpose: f.purpose === p ? '' : p }))}
                      style={{ padding:'5px 12px', borderRadius:'20px', border:'1px solid', fontFamily:'inherit', fontSize:'11px', fontWeight:600, cursor:'pointer',
                        background: settlementForm.purpose === p ? '#1D4ED8' : '#F9FAFB',
                        color: settlementForm.purpose === p ? '#fff' : '#6B7280',
                        borderColor: settlementForm.purpose === p ? '#1D4ED8' : '#E4E6EA',
                      }}>{p}</button>
                  ))}
                </div>

                <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>결제 수단</label>
                <div style={{ display:'flex', gap:'6px', marginBottom:'14px' }}>
                  {['개인카드','개인계좌이체','현금','기타'].map(m => (
                    <button key={m} onClick={() => setSettlementForm(f => ({ ...f, method: m }))}
                      style={{ flex:1, padding:'6px 0', borderRadius:'10px', border:'1px solid', fontFamily:'inherit', fontSize:'11px', fontWeight:600, cursor:'pointer',
                        background: settlementForm.method === m ? '#EFF6FF' : '#F9FAFB',
                        color: settlementForm.method === m ? '#1D4ED8' : '#6B7280',
                        borderColor: settlementForm.method === m ? '#BFDBFE' : '#E4E6EA',
                      }}>{m}</button>
                  ))}
                </div>

                <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>요청 메모</label>
                <textarea value={settlementForm.memo} onChange={e => setSettlementForm(f => ({ ...f, memo: e.target.value }))}
                  placeholder="추가 설명이 있으면 입력하세요" rows={3}
                  style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', background:'#F9FAFB', border:'1px solid #E4E6EA', borderRadius:'10px', fontSize:'13px', color:'#111827', fontFamily:'inherit', resize:'none', outline:'none' }} />

                <button onClick={() => {
                    pushLocalMsg({ from:'me', type:'requestCard', card:{
                      emoji:'💰', title:'정산 요청', statusLabel:'전송됨',
                      headerGrad:'linear-gradient(135deg,#1D4ED8,#2563EB)',
                      borderColor:'#BFDBFE', txLabel: null,
                      fields:[
                        { label:'사용 목적', value: settlementForm.purpose || '미입력' },
                        { label:'결제 수단', value: settlementForm.method },
                        { label:'메모', value: settlementForm.memo || '없음' },
                      ],
                    }})
                    closeSheet()
                    setSettlementForm({ purpose:'', memo:'', method:'개인카드' })
                  }}
                  style={{ width:'100%', marginTop:'16px', padding:'14px', background:'linear-gradient(135deg,#1D4ED8,#2563EB)', color:'#fff', border:'none', borderRadius:'14px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  정산 요청 전송
                </button>
              </div>
            )}

            {/* ── 증빙 요청 ── */}
            {actionSheet === 'request' && requestType === 'evidence' && (
              <div style={{ padding:'8px 20px 0' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                  <button onClick={() => { setRequestType(null); setSelectedTx(null) }} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <span style={{ fontSize:'15px', fontWeight:700, color:'#111827' }}>📋 증빙 요청</span>
                </div>

                {/* ── 거래 선택 단계 ── */}
                {!selectedTx ? (
                  <>
                    <div style={{ fontSize:'11px', color:'#9CA3AF', marginBottom:'14px', paddingLeft:'28px' }}>증빙을 요청할 거래 건을 선택하세요</div>
                    {MOCK_TRANSACTIONS.map(tx => (
                      <button key={tx.id} onClick={() => setSelectedTx(tx)}
                        style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:'12px',
                          padding:'12px 14px', marginBottom:'8px', fontFamily:'inherit', cursor:'pointer',
                          background:'#F9FAFB', border:'1.5px solid #E4E6EA', borderRadius:'12px' }}>
                        <span style={{ padding:'3px 8px', borderRadius:'8px', background: tx.badgeBg, color: tx.badge, fontSize:'10px', fontWeight:700, flexShrink:0 }}>{tx.type}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'13px', fontWeight:600, color:'#111827' }}>{tx.label}</div>
                          <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'1px' }}>{tx.amount} · {tx.date}</div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'16px', paddingLeft:'28px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:'8px', background: selectedTx.badgeBg, color: selectedTx.badge, fontSize:'10px', fontWeight:700 }}>{selectedTx.type}</span>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'#374151' }}>{selectedTx.label}</span>
                      <button onClick={() => setSelectedTx(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:'11px', color:'#9CA3AF', fontFamily:'inherit' }}>변경</button>
                    </div>

                    <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>증빙 종류 선택 (복수 가능)</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'14px' }}>
                      {['영수증','세금계산서','사용사유 작성','첨부파일 보완','자료 요청'].map(t => {
                        const isOn = evidenceForm.types.includes(t)
                        return (
                          <button key={t} onClick={() => setEvidenceForm(f => ({ ...f, types: isOn ? f.types.filter(x => x!==t) : [...f.types, t] }))}
                            style={{ padding:'6px 12px', borderRadius:'20px', border:'1px solid', fontFamily:'inherit', fontSize:'11px', fontWeight:600, cursor:'pointer',
                              background: isOn ? '#7C3AED' : '#F9FAFB', color: isOn ? '#fff' : '#6B7280',
                              borderColor: isOn ? '#7C3AED' : '#E4E6EA' }}>{t}</button>
                        )
                      })}
                    </div>

                    <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>제출 기한</label>
                    <input type="date" value={evidenceForm.deadline} onChange={e => setEvidenceForm(f => ({ ...f, deadline: e.target.value }))}
                      style={{ width:'100%', boxSizing:'border-box', padding:'9px 12px', background:'#F9FAFB', border:'1px solid #E4E6EA', borderRadius:'10px', fontSize:'13px', color:'#111827', fontFamily:'inherit', outline:'none', marginBottom:'14px' }} />

                    <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>요청 메시지</label>
                    <textarea value={evidenceForm.message} onChange={e => setEvidenceForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="요청 사유나 추가 안내를 입력하세요" rows={3}
                      style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', background:'#F9FAFB', border:'1px solid #E4E6EA', borderRadius:'10px', fontSize:'13px', color:'#111827', fontFamily:'inherit', resize:'none', outline:'none' }} />

                    <button onClick={() => {
                        pushLocalMsg({ from:'me', type:'requestCard', card:{
                          emoji:'📋', title:'증빙 요청', statusLabel:'요청됨',
                          headerGrad:'linear-gradient(135deg,#7C3AED,#8B5CF6)',
                          borderColor:'#DDD6FE', txLabel: selectedTx.label,
                          fields:[
                            { label:'연결 거래', value: selectedTx.label + ' ' + selectedTx.amount },
                            { label:'증빙 종류', value: evidenceForm.types.length ? evidenceForm.types.join(', ') : '미선택' },
                            { label:'제출 기한', value: evidenceForm.deadline || '미지정' },
                            { label:'메시지', value: evidenceForm.message || '없음' },
                          ],
                        }})
                        closeSheet()
                        setEvidenceForm({ types:[], deadline:'', reason:'', message:'' })
                      }}
                      style={{ width:'100%', marginTop:'16px', padding:'14px', background:'linear-gradient(135deg,#7C3AED,#8B5CF6)', color:'#fff', border:'none', borderRadius:'14px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      증빙 요청 전송
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── 상환 요청 ── */}
            {actionSheet === 'request' && requestType === 'refund' && (
              <div style={{ padding:'8px 20px 0' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                  <button onClick={() => { setRequestType(null); setSelectedTx(null) }} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <span style={{ fontSize:'15px', fontWeight:700, color:'#111827' }}>🔄 상환 요청</span>
                </div>

                {!selectedTx ? (
                  <>
                    <div style={{ fontSize:'11px', color:'#9CA3AF', marginBottom:'14px', paddingLeft:'28px' }}>상환을 요청할 자금대여·대여금 건을 선택하세요</div>
                    {MOCK_LOANS.map(tx => (
                      <button key={tx.id} onClick={() => setSelectedTx(tx)}
                        style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:'12px',
                          padding:'12px 14px', marginBottom:'8px', fontFamily:'inherit', cursor:'pointer',
                          background:'#F9FAFB', border:'1.5px solid #E4E6EA', borderRadius:'12px' }}>
                        <span style={{ padding:'3px 8px', borderRadius:'8px', background: tx.badgeBg, color: tx.badge, fontSize:'10px', fontWeight:700, flexShrink:0 }}>{tx.type}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'13px', fontWeight:600, color:'#111827' }}>{tx.label}</div>
                          <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'1px' }}>{tx.amount} · {tx.date}</div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'16px', paddingLeft:'28px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:'8px', background: selectedTx.badgeBg, color: selectedTx.badge, fontSize:'10px', fontWeight:700 }}>{selectedTx.type}</span>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'#374151' }}>{selectedTx.label} {selectedTx.amount}</span>
                      <button onClick={() => setSelectedTx(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:'11px', color:'#9CA3AF', fontFamily:'inherit' }}>변경</button>
                    </div>

                    <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>상환 요청 금액</label>
                    <div style={{ position:'relative', marginBottom:'14px' }}>
                      <input type="number" value={refundForm.amount} onChange={e => setRefundForm(f => ({ ...f, amount: e.target.value }))}
                        placeholder="0"
                        style={{ width:'100%', boxSizing:'border-box', padding:'9px 44px 9px 12px', background:'#F9FAFB', border:'1px solid #E4E6EA', borderRadius:'10px', fontSize:'15px', fontWeight:700, color:'#111827', fontFamily:'inherit', outline:'none' }} />
                      <span style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'#9CA3AF', fontWeight:600 }}>원</span>
                    </div>

                    <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>상환 기한</label>
                    <input type="date" value={refundForm.deadline} onChange={e => setRefundForm(f => ({ ...f, deadline: e.target.value }))}
                      style={{ width:'100%', boxSizing:'border-box', padding:'9px 12px', background:'#F9FAFB', border:'1px solid #E4E6EA', borderRadius:'10px', fontSize:'13px', color:'#111827', fontFamily:'inherit', outline:'none', marginBottom:'14px' }} />

                    <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>요청 사유</label>
                    <textarea value={refundForm.reason} onChange={e => setRefundForm(f => ({ ...f, reason: e.target.value }))}
                      placeholder="반환 사유를 입력하세요" rows={3}
                      style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', background:'#F9FAFB', border:'1px solid #E4E6EA', borderRadius:'10px', fontSize:'13px', color:'#111827', fontFamily:'inherit', resize:'none', outline:'none' }} />

                    <button onClick={() => {
                        pushLocalMsg({ from:'me', type:'requestCard', card:{
                          emoji:'🔄', title:'상환 요청', statusLabel:'요청됨',
                          headerGrad:'linear-gradient(135deg,#DC2626,#EF4444)',
                          borderColor:'#FECACA', txLabel: selectedTx.label,
                          fields:[
                            { label:'원 거래', value: selectedTx.label + ' ' + selectedTx.amount },
                            { label:'상환 금액', value: refundForm.amount ? Number(refundForm.amount).toLocaleString() + '원' : '미입력' },
                            { label:'상환 기한', value: refundForm.deadline || '미지정' },
                            { label:'사유', value: refundForm.reason || '없음' },
                          ],
                        }})
                        closeSheet()
                        setRefundForm({ amount:'', deadline:'', reason:'' })
                      }}
                      style={{ width:'100%', marginTop:'16px', padding:'14px', background:'linear-gradient(135deg,#DC2626,#EF4444)', color:'#fff', border:'none', borderRadius:'14px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      상환 요청 전송
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── 자료 요청 ── */}
            {actionSheet === 'request' && requestType === 'data' && (
              <div style={{ padding:'8px 20px 0' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                  <button onClick={() => { setRequestType(null); setSelectedTx(null) }} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <span style={{ fontSize:'15px', fontWeight:700, color:'#111827' }}>📁 자료 요청</span>
                </div>

                {!selectedTx ? (
                  <>
                    <div style={{ fontSize:'11px', color:'#9CA3AF', marginBottom:'14px', paddingLeft:'28px' }}>자료를 요청할 거래·집행 건을 선택하세요</div>
                    {MOCK_TRANSACTIONS.map(tx => (
                      <button key={tx.id} onClick={() => setSelectedTx(tx)}
                        style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:'12px',
                          padding:'12px 14px', marginBottom:'8px', fontFamily:'inherit', cursor:'pointer',
                          background:'#F9FAFB', border:'1.5px solid #E4E6EA', borderRadius:'12px' }}>
                        <span style={{ padding:'3px 8px', borderRadius:'8px', background: tx.badgeBg, color: tx.badge, fontSize:'10px', fontWeight:700, flexShrink:0 }}>{tx.type}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'13px', fontWeight:600, color:'#111827' }}>{tx.label}</div>
                          <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'1px' }}>{tx.amount} · {tx.date}</div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'12px', paddingLeft:'28px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:'8px', background: selectedTx.badgeBg, color: selectedTx.badge, fontSize:'10px', fontWeight:700 }}>{selectedTx.type}</span>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'#374151' }}>{selectedTx.label}</span>
                      <button onClick={() => setSelectedTx(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', fontSize:'11px', color:'#9CA3AF', fontFamily:'inherit' }}>변경</button>
                    </div>

                    <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'10px', padding:'10px 12px', marginBottom:'14px' }}>
                      <div style={{ fontSize:'11px', fontWeight:700, color:'#92400E', marginBottom:'6px' }}>현재 자료 현황</div>
                      {[
                        { name:'계약서', status:'등록완료' },
                        { name:'견적서', status:'미등록' },
                        { name:'사업자등록증', status:'등록완료' },
                        { name:'통장사본', status:'미등록' },
                        { name:'결과물 파일', status:'제출대기' },
                      ].map(d => (
                        <div key={d.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'3px 0' }}>
                          <span style={{ fontSize:'12px', color:'#78350F' }}>{d.name}</span>
                          <span style={{ fontSize:'10px', fontWeight:700, color: d.status === '등록완료' ? '#059669' : d.status === '미등록' ? '#DC2626' : '#D97706' }}>{d.status}</span>
                        </div>
                      ))}
                    </div>

                    <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>요청 자료 선택 (복수 가능)</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'14px' }}>
                      {['계약서','견적서','결과물 파일','사업자등록증','통장사본','법인인감증명서','담당자 명함','기타 파일'].map(t => {
                        const isOn = dataReqForm.types.includes(t)
                        return (
                          <button key={t} onClick={() => setDataReqForm(f => ({ ...f, types: isOn ? f.types.filter(x => x!==t) : [...f.types, t] }))}
                            style={{ padding:'6px 12px', borderRadius:'20px', border:'1px solid', fontFamily:'inherit', fontSize:'11px', fontWeight:600, cursor:'pointer',
                              background: isOn ? '#0891B2' : '#F9FAFB', color: isOn ? '#fff' : '#6B7280',
                              borderColor: isOn ? '#0891B2' : '#E4E6EA' }}>{t}</button>
                        )
                      })}
                    </div>

                    <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>제출 기한</label>
                    <input type="date" value={dataReqForm.deadline} onChange={e => setDataReqForm(f => ({ ...f, deadline: e.target.value }))}
                      style={{ width:'100%', boxSizing:'border-box', padding:'9px 12px', background:'#F9FAFB', border:'1px solid #E4E6EA', borderRadius:'10px', fontSize:'13px', color:'#111827', fontFamily:'inherit', outline:'none', marginBottom:'14px' }} />

                    <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>요청 사유</label>
                    <textarea value={dataReqForm.reason} onChange={e => setDataReqForm(f => ({ ...f, reason: e.target.value }))}
                      placeholder="누락된 자료나 보완이 필요한 이유를 입력하세요" rows={2}
                      style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', background:'#F9FAFB', border:'1px solid #E4E6EA', borderRadius:'10px', fontSize:'13px', color:'#111827', fontFamily:'inherit', resize:'none', outline:'none' }} />

                    <button onClick={() => {
                        pushLocalMsg({ from:'me', type:'requestCard', card:{
                          emoji:'📁', title:'자료 요청', statusLabel:'요청됨',
                          headerGrad:'linear-gradient(135deg,#0891B2,#06B6D4)',
                          borderColor:'#A5F3FC', txLabel: selectedTx.label,
                          fields:[
                            { label:'연결 거래', value: selectedTx.label + ' ' + selectedTx.amount },
                            { label:'요청 자료', value: dataReqForm.types.length ? dataReqForm.types.join(', ') : '미선택' },
                            { label:'제출 기한', value: dataReqForm.deadline || '미지정' },
                            { label:'사유', value: dataReqForm.reason || '없음' },
                          ],
                        }})
                        closeSheet()
                        setDataReqForm({ types:[], deadline:'', reason:'' })
                      }}
                      style={{ width:'100%', marginTop:'16px', padding:'14px', background:'linear-gradient(135deg,#0891B2,#06B6D4)', color:'#fff', border:'none', borderRadius:'14px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      자료 요청 전송
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── 메모 시트 ── */}
            {actionSheet === 'memo' && (
              <div style={{ padding:'8px 20px 0' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#111827', marginBottom:'2px' }}>📝 메모</div>
                <div style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'14px' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{ fontSize:'11px', color:'#9CA3AF' }}>나만 볼 수 있는 메모입니다. 상대방에게 표시되지 않습니다.</span>
                </div>

                {/* 이전 메모 히스토리 — 가로 슬라이드 */}
                {memos.length > 0 && (
                  <div style={{ marginBottom:'16px' }}>
                    <div style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', marginBottom:'8px' }}>
                      이전 메모 <span style={{ color:'#D97706' }}>{memos.length}개</span>
                    </div>
                    <div style={{
                      display:'flex', gap:'10px',
                      overflowX:'auto', paddingBottom:'6px',
                      scrollbarWidth:'none', WebkitOverflowScrolling:'touch',
                    }}>
                      {memos.map((m, mi) => (
                        <div key={mi} style={{
                          minWidth:'180px', maxWidth:'180px', flexShrink:0,
                          background:'#FFFDE7', border:'1px solid #FDE68A',
                          borderRadius:'12px', padding:'10px 12px',
                          boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
                        }}>
                          <div style={{ fontSize:'9px', fontWeight:700, color:'#D97706', marginBottom:'5px' }}>
                            🔒 {m.time}
                          </div>
                          <div style={{ fontSize:'12px', color:'#78350F', lineHeight:1.6, whiteSpace:'pre-wrap',
                            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical' }}>
                            {m.text}
                          </div>
                          {m.txLabel && (
                            <div style={{ fontSize:'10px', color:'#92400E', marginTop:'6px', fontWeight:600 }}>
                              🔗 {m.txLabel}
                            </div>
                          )}
                        </div>
                      ))}
                      {/* peek spacer */}
                      <div style={{ minWidth:'20px', flexShrink:0 }} />
                    </div>
                  </div>
                )}

                <textarea value={memoText} onChange={e => setMemoText(e.target.value)}
                  placeholder={"이 업체는 다음 지급 전에 계약서 확인 필요\n담당자와 통화 완료\n내부 확인 후 다시 연락 필요"} rows={4}
                  style={{ width:'100%', boxSizing:'border-box', padding:'12px 14px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'12px', fontSize:'13px', color:'#111827', fontFamily:'inherit', resize:'none', outline:'none', lineHeight:1.6 }} />

                <div style={{ fontSize:'10px', color:'#D97706', marginTop:'6px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'4px' }}>
                  <span>🔒</span>
                  <span>개인 메모 · 작성자 본인만 열람 가능</span>
                </div>

                <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>거래 연결 (선택사항)</label>
                <select id="memo-tx-select"
                  style={{ width:'100%', padding:'9px 12px', background:'#F9FAFB', border:'1px solid #E4E6EA', borderRadius:'10px', fontSize:'13px', color:'#6B7280', fontFamily:'inherit', outline:'none', marginBottom:'16px' }}>
                  <option value="">거래 건 선택 안함</option>
                  {MOCK_TRANSACTIONS.map(tx => (
                    <option key={tx.id} value={tx.label}>{tx.type} | {tx.label} {tx.amount}</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    if (!memoText.trim()) return
                    const sel = document.getElementById('memo-tx-select')
                    const txLabel = sel?.value || null
                    const now = new Date()
                    const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0')
                    const memoMsgId = 'memo_' + Date.now()
                    const newMemo = { id: memoMsgId, text: memoText.trim(), time: timeStr, txLabel }
                    setMemos(prev => [...prev, newMemo])
                    saveThreadMemo(thread.id, newMemo)
                    setLocalMsgs(prev => [...prev, { from:'me', type:'memo', text: memoText.trim(), txLabel, id: memoMsgId, date:'오늘', time: timeStr }])
                    setMemoText('')
                    closeSheet()
                  }}
                  style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#D97706,#F59E0B)', color:'#fff', border:'none', borderRadius:'14px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  메모 저장
                </button>
              </div>
            )}

            {/* ── 자료 제출 시트 ── */}
            {actionSheet === 'submit' && (
              <div style={{ padding:'8px 20px 0' }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#111827', marginBottom:'4px' }}>📎 자료 제출</div>
                <div style={{ fontSize:'12px', color:'#9CA3AF', marginBottom:'16px' }}>나에게 들어온 미처리 요청을 선택해서 자료를 제출합니다</div>

                {[
                  { id:'r1', from:'김대표', type:'증빙 요청', label:'법인카드 영수증 제출 요청', deadline:'05.16', badge:'#7C3AED', badgeBg:'#F5F3FF' },
                  { id:'r2', from:'재무팀', type:'자료 요청', label:'3월 견적서 재업로드 요청', deadline:'05.18', badge:'#0891B2', badgeBg:'#ECFEFF' },
                  { id:'r3', from:'김대표', type:'증빙 요청', label:'출장 교통비 영수증 첨부', deadline:'05.20', badge:'#7C3AED', badgeBg:'#F5F3FF' },
                ].map(req => (
                  <button key={req.id}
                    onClick={() => setSubmitForm(f => ({ ...f, selectedReq: f.selectedReq === req.id ? null : req.id }))}
                    style={{
                      width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:'12px',
                      padding:'12px 14px', marginBottom:'8px', fontFamily:'inherit', cursor:'pointer',
                      background: submitForm.selectedReq === req.id ? '#EFF6FF' : '#F9FAFB',
                      border: `1.5px solid ${submitForm.selectedReq === req.id ? '#93C5FD' : '#F0F1F3'}`,
                      borderRadius:'12px',
                    }}>
                    <div style={{ width:'20px', height:'20px', borderRadius:'50%', border:`2px solid ${submitForm.selectedReq === req.id ? '#1D4ED8' : '#D1D5DB'}`,
                      background: submitForm.selectedReq === req.id ? '#1D4ED8' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    }}>
                      {submitForm.selectedReq === req.id && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px' }}>
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'6px', background: req.badgeBg, color: req.badge }}>{req.type}</span>
                        <span style={{ fontSize:'10px', color:'#D97706', fontWeight:700 }}>~ {req.deadline}</span>
                      </div>
                      <div style={{ fontSize:'12px', fontWeight:600, color:'#111827' }}>{req.label}</div>
                      <div style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'2px' }}>요청자: {req.from}</div>
                    </div>
                  </button>
                ))}

                {submitForm.selectedReq && (
                  <div style={{ marginTop:'12px' }}>
                    <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>파일 첨부</label>
                    <button style={{ width:'100%', padding:'24px 0', background:'#F9FAFB', border:'2px dashed #E4E6EA', borderRadius:'12px', cursor:'pointer', fontFamily:'inherit', fontSize:'12px', color:'#9CA3AF', fontWeight:600, marginBottom:'10px' }}>
                      📎 파일 선택 (여러 개 가능)
                    </button>
                    <label style={{ fontSize:'11px', fontWeight:700, color:'#6B7280', display:'block', marginBottom:'6px' }}>내용 작성 (선택)</label>
                    <textarea value={submitForm.message} onChange={e => setSubmitForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="제출 관련 추가 설명을 입력하세요" rows={2}
                      style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', background:'#F9FAFB', border:'1px solid #E4E6EA', borderRadius:'10px', fontSize:'13px', color:'#111827', fontFamily:'inherit', resize:'none', outline:'none' }} />
                    <button onClick={() => {
                        const req = [
                          { id:'r1', from:'김대표', type:'증빙 요청', label:'법인카드 영수증 제출 요청' },
                          { id:'r2', from:'재무팀', type:'자료 요청', label:'3월 견적서 재업로드 요청' },
                          { id:'r3', from:'김대표', type:'증빙 요청', label:'출장 교통비 영수증 첨부' },
                        ].find(r => r.id === submitForm.selectedReq)
                        pushLocalMsg({ from:'me', type:'requestCard', card:{
                          emoji:'📎', title:'자료 제출', statusLabel:'제출완료',
                          headerGrad:'linear-gradient(135deg,#059669,#10B981)',
                          borderColor:'#A7F3D0', txLabel: req?.label,
                          fields:[
                            { label:'제출 대상', value: req ? `[${req.type}] ${req.label}` : '미선택' },
                            { label:'요청자', value: req?.from || '-' },
                            { label:'내용', value: submitForm.message || '없음' },
                          ],
                        }})
                        closeSheet()
                        setSubmitForm({ selectedReq:null, message:'', files:[] })
                      }}
                      style={{ width:'100%', marginTop:'12px', padding:'14px', background:'linear-gradient(135deg,#059669,#10B981)', color:'#fff', border:'none', borderRadius:'14px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      제출 완료
                    </button>
                  </div>
                )}

                {!submitForm.selectedReq && (
                  <div style={{ textAlign:'center', padding:'8px 0 4px', fontSize:'11px', color:'#D1D5DB' }}>위 목록에서 제출할 요청을 선택하세요</div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

// ─── 메인 컴포넌트 ───
export default function Messages() {
  const theme = getAccountTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { userType } = useUser()
  const currentUserId = getCurrentUserId(userType)
  const [activeThread, setActiveThread] = useState(null)  // null | string
  const [showDetail, setShowDetail]   = useState(false)
  const [filter, setFilter] = useState('전체')

  // 외부에서 특정 스레드 자동 진입 (e.g. ApprovalCenter 검수 요청 전송 후)
  useEffect(() => {
    if (location.state?.threadId) {
      setActiveThread(location.state.threadId)
      setShowDetail(false)
    }
  }, [location.state?.threadId])

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
  // 처리센터 알림 스레드 — approvalMessageBus의 동적 메시지를 CHATS['approval']에 병합
  const approvalBusMsgs = getAllApprovalMsgs()
  const approvalChatMsgs = approvalBusMsgs.map((m, idx) => {
    const d = new Date(m.createdAt)
    const date = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
    const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    return {
      id: `bus_${idx}`,
      from: 'system',
      type: 'approvalAction',
      date, time,
      approvalAction: {
        action: m.action,
        actor: m.actor,
        itemTitle: m.itemTitle || '',
        note: m.note || null,
        requestedDocs: m.requestedDocs || null,
      },
    }
  })

  // 채팅 데이터 — store 스레드면 어댑터로, 정적이면 CHATS에서
  const chat = (() => {
    if (!thread) return null
    if (thread._fromStore) return adaptStoreChat(thread.id)
    if (thread.id === 'approval') {
      const base = CHATS['approval'] || { messages:[], fdsAlert:null }
      // bus 메시지 최신 순 → 가장 오래된 순으로 앞에 표시
      return { ...base, messages: [...base.messages, ...approvalChatMsgs] }
    }
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
          {/* 검색 바 */}
          <div style={{ padding:'8px 16px 4px' }}>
            <div style={{
              display:'flex', alignItems:'center', gap:'8px',
              background:'rgba(255,255,255,0.14)',
              borderRadius:'12px',
              padding:'9px 14px',
              border:'1px solid rgba(255,255,255,0.2)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>이름, 거래 유형 검색...</span>
            </div>
          </div>
        </GradientHeader>

        {/* 라이트 영역 — 메시지 카드 리스트 */}
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
                      width:'100%',
                      background: isWarning ? '#FFFBF5' : COLORS.bgCard,
                      borderRadius: RADIUS.lg,
                      padding:'13px 14px 13px 0',
                      display:'flex', alignItems:'center', gap:'0',
                      border:'none',
                      borderLeft: isWarning ? '3.5px solid #F59E0B' : '3.5px solid transparent',
                      cursor:'pointer', textAlign:'left',
                      fontFamily:'inherit',
                      boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                    }}>

                    {/* 아바타 영역 */}
                    <div style={{ position:'relative', flexShrink:0, padding:'0 12px' }}>
                      <div style={{
                        width:'46px', height:'46px',
                        borderRadius:'14px',
                        background: t.avatarBg,
                        color: t.avatarFg,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize: t.emoji ? '24px' : '16px',
                        fontWeight:'700',
                      }}>
                        {t.emoji || t.initial}
                      </div>
                      {/* 자금 유형 뱃지 */}
                      <div style={{
                        position:'absolute', bottom:'-4px', right:'8px',
                        padding:'1px 5px',
                        background: t.typeBg,
                        borderRadius:'6px',
                        fontSize:'8px', fontWeight:700, color: t.typeColor,
                        border:`1.5px solid ${COLORS.bgCard}`,
                        whiteSpace:'nowrap',
                      }}>
                        {t.type}
                      </div>
                      {t.unread > 0 && (
                        <div style={{
                          position:'absolute', top:'-4px', right:'6px',
                          minWidth:'16px', height:'16px',
                          padding:'0 4px',
                          borderRadius:'8px',
                          background: COLORS.danger,
                          border:`2px solid ${COLORS.bgCard}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'9px', fontWeight:'700', color:'#fff',
                          zIndex:1,
                        }}>
                          {t.unread}
                        </div>
                      )}
                    </div>

                    {/* 본문 */}
                    <div style={{ flex:1, minWidth:0, paddingRight:'4px' }}>
                      {/* 이름 + 시간 한 줄 */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'3px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px', flex:1, minWidth:0 }}>
                          <span style={{
                            fontSize:'14px',
                            fontWeight: t.unread > 0 ? '700' : '600',
                            color: COLORS.t1,
                            whiteSpace:'nowrap',
                            overflow:'hidden',
                            textOverflow:'ellipsis',
                          }}>
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
                          flex:1, height:'3px',
                          background: COLORS.bgMuted,
                          borderRadius: RADIUS.pill,
                          overflow:'hidden',
                        }}>
                          <div style={{
                            width:`${pct}%`, height:'100%',
                            background: progressGradient(pct, isWarning ? null : (pct >= 100 ? 'success' : null)),
                            borderRadius: RADIUS.pill,
                            transition:'width .3s',
                          }} />
                        </div>
                        <span style={{
                          fontSize:'11px', fontWeight:'700',
                          color: pct >= 100 ? theme.brand
                                : isWarning ? COLORS.danger
                                : pct >= 70 ? COLORS.danger
                                : pct >= 40 ? COLORS.warning
                                : COLORS.t3,
                          flexShrink:0, minWidth:'30px', textAlign:'right',
                        }}>
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

      </div> {/* 스크롤 영역 끝 */}

      <BottomTab />
    </PhoneShell>
  )
}
