// ─── 정적 더미 데이터 ───────────────────────────────────────
// 서버 연동 시 이 파일을 API 호출로 교체
// ────────────────────────────────────────────────────────────

export const THREADS = [
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
    msgCat: '내부', txCat: '내부',
  },
  {
    id: '1', name: '박철수', initial: '박', emoji: null,
    avatarBg: '#EF4444', avatarFg: '#FFFFFF',
    type: '외주비', typeBg: '#EDF3FA', typeColor: '#2D6BB0',
    amount: 5000000, balance: 3500000,
    lastMsg: '검수 확인 후 잔금 부탁드립니다',
    time: '14:22', unread: 2,
    status: 'warning', statusLabel: '검수 대기', statusBg: '#FFF4E0', statusColor: '#C8821A',
    totalExecuted: 1500000, totalAmount: 5000000,
    role: '외주 수급인',
    msgCat: '외부', txCat: '거래',
  },
  {
    id: '2', name: '이유진', initial: '이', emoji: '👧',
    avatarBg: '#FCD34D', avatarFg: '#92400E',
    type: '대여금', typeBg: '#FFF4E0', typeColor: '#C8821A',
    amount: 5000000, balance: 45000,
    lastMsg: '차용증 서명 완료했습니다',
    time: '어제', unread: 0,
    status: 'normal', statusLabel: '정상', statusBg: '#E6F5EF', statusColor: '#2A7D5E',
    totalExecuted: 5000000, totalAmount: 5000000,
    role: '가족 구성원 (딸)',
    msgCat: '외부', txCat: '대여',
  },
  {
    id: '3', name: 'ㄱ오로라', initial: 'ㄱ', emoji: null,
    avatarBg: '#1F2937', avatarFg: '#FFFFFF',
    type: '엔젤 투자', typeBg: '#E6F5EF', typeColor: '#2A7D5E',
    amount: 50000000, balance: 17600000,
    lastMsg: '4월 집행 내역 공유드립니다',
    time: '3일 전', unread: 0,
    status: 'warning', statusLabel: '소진 이상', statusBg: '#FCEBEB', statusColor: '#D94040',
    totalExecuted: 32400000, totalAmount: 50000000,
    role: '투자 수령인',
    msgCat: '기관', txCat: '기관',
  },
  {
    id: '4', name: '김창업', initial: '김', emoji: null,
    avatarBg: '#7C3AED', avatarFg: '#FFFFFF',
    type: '외주비', typeBg: '#EDF3FA', typeColor: '#2D6BB0',
    amount: 5000000, balance: 3500000,
    lastMsg: '계약서 확인 부탁드립니다',
    time: '5일 전', unread: 0,
    status: 'normal', statusLabel: '정상', statusBg: '#E6F5EF', statusColor: '#2A7D5E',
    totalExecuted: 1500000, totalAmount: 5000000,
    role: '외주 수급인',
    msgCat: '외부', txCat: '거래',
  },
]

export const CHATS = {
  'approval': {
    messages: [
      { id:1, from:'system', type:'approvalAction', time:'10:05', date:'2026.05.10',
        approvalAction: { action:'approved', actor:'박철수', itemTitle:'5월 임금 지급 요청 — 3,200,000원', note:null } },
      { id:2, from:'system', type:'approvalAction', time:'11:22', date:'2026.05.10',
        approvalAction: { action:'inspection_approved', actor:'김재무', itemTitle:'4월 외주비 정산 — 박철수 1,500,000원', note:null } },
      { id:3, from:'system', type:'approvalAction', time:'14:10', date:'2026.05.11',
        approvalAction: { action:'inspection_rejected', actor:'이대표', itemTitle:'영업팀 법인카드 이용 내역 검수', note:'4월 27일 GS강남게임센터 결제 건 소명 필요' } },
      { id:4, from:'system', type:'approvalAction', time:'09:33', date:'2026.05.12',
        approvalAction: { action:'extra_docs', actor:'박철수', itemTitle:'거래처 접대비 지출 승인 요청', note:'세금계산서 또는 영수증 원본 제출 요청', requestedDocs:['세금계산서 원본','사업자 등록증 사본'] } },
      { id:5, from:'system', type:'approvalAction', time:'15:30', date:'2026.05.12',
        approvalAction: { action:'usage_confirmed', actor:'김재무', itemTitle:'앱 기능 개발 외주 결과물 — 사용내역확인', note:'내부 검토 완료. 지출 내역 이상 없음.' } },
    ],
    fdsAlert: null,
  },
  '1': {
    messages: [
      { id:1, from:'system', type:'contract', time:'10:00', date:'2026.04.25',
        contract: { title:'자금 집행 계약', executor:'㈜주다컴퍼니', recipient:'박철수', amount:5000000, type:'외주비',
          mccAllowed:['IT/소프트웨어','디자인/크리에이티브'], mccBlocked:['유흥/오락','도박','명품'], expires:'2026.08.06',
          milestones:[{ text:'UI 시안 1차 납품', done:true, date:'2026.05.15' },{ text:'수정 및 최종본', done:false, date:'2026.06.15' },{ text:'최종 납품 완료', done:false, date:'2026.07.15' }],
          signed:true } },
      { id:2, from:'other', text:'안녕하세요! 앱 디자인 작업 시작하겠습니다.', time:'10:05', date:'2026.04.25' },
      { id:3, from:'me', text:'네 잘 부탁드립니다. 선금 집행 완료했어요.', time:'10:10', date:'2026.04.25' },
      { id:4, from:'system', type:'payment', time:'10:10', date:'2026.04.25',
        payment:{ merchant:'선금 집행', amount:1500000, status:'done', mcc:'외주비', code:'EX_002' } },
      { id:5, from:'system', type:'blocked', time:'23:41', date:'2026.04.27',
        blocked:{ merchant:'GS강남게임센터', amount:89000, mcc:'MCC-7993 (유흥/오락)', code:'AL_001' } },
      { id:6, from:'system', type:'usageCheck', time:'23:50', date:'2026.04.27',
        usageCheck:{ merchant:'GS강남게임센터', amount:89000, deadline:'2026.04.30', status:'pending', code:'UC_001',
          requestTypes:['사용내역요청','첨부파일요청'], note:'MCC 7993 허용 외 업종 결제 내역 확인 필요' } },
      { id:7, from:'other', text:'메인 5종 1차 시안 완료했습니다. 검수 부탁드립니다.', time:'13:40', date:'2026.05.06' },
      { id:8, from:'system', type:'milestone', time:'13:40', date:'2026.05.06',
        milestone:{ text:'UI 시안 1차 납품', done:true, code:'SC_001' } },
      { id:9, from:'other', text:'검수 확인 후 잔금 부탁드립니다', time:'14:22', date:'2026.05.06' },
      { id:10, from:'system', type:'reviewRequest', time:'15:30', date:'2026.05.12',
        reviewRequest:{ resubmitRequest:true, deadline:'2026.05.30', attachmentRequest:true,
          message:'알림 모듈 미구현 항목을 수정하여 재제출해 주세요. 완성된 소스코드와 납품 확인서를 첨부해 주세요.',
          itemTitle:'앱 기능 개발 외주 결과물 검수' } },
    ],
    fdsAlert:{ text:'박철수 · GS강남게임센터 결제 시도 차단됨 · MCC 7993', level:'block' },
  },
  '2': {
    messages: [
      { id:1, from:'me', text:'안녕하세요. 대여금 계약서 확인 후 서명 부탁드립니다.', time:'09:00', date:'2026.05.12' },
      { id:2, from:'system', type:'contract', time:'09:01', date:'2026.05.12',
        contract:{ title:'대여금 집행 계약', executor:'㈜주다컴퍼니', recipient:'이호형', amount:3000000, type:'개인 대여',
          mccAllowed:[], mccBlocked:[], expires:'2026.11.12',
          milestones:[{ text:'대여금 지급', done:false, date:'2026.05.15' },{ text:'중간 상환 (50%)', done:false, date:'2026.08.15' },{ text:'잔금 상환 완료', done:false, date:'2026.11.12' }],
          signed:false } },
      { id:3, from:'other', text:'확인했습니다. 검토 후 서명할게요.', time:'09:15', date:'2026.05.12' },
    ],
    fdsAlert: null,
  },
  '3': {
    messages: [
      { id:1, from:'other', text:'4월 집행 내역 공유드립니다', time:'11:00', date:'2026.05.03' },
      { id:2, from:'me', text:'소진 속도가 빨라서 확인 중입니다.', time:'11:30', date:'2026.05.03' },
    ],
    fdsAlert:{ text:'소진 속도 전월 대비 40% 증가 · 이상 감지', level:'warning' },
  },
  '4': {
    messages: [
      { id:1, from:'other', text:'계약서 확인 부탁드립니다', time:'14:00', date:'2026.05.01' },
      { id:2, from:'me', text:'확인하겠습니다.', time:'14:30', date:'2026.05.01' },
    ],
    fdsAlert: null,
  },
}

export const DETAIL_DATA = {
  '1': {
    trades: [
      { id:1, icon:'📋', title:'앱 디자인 메인 5종 계약서', date:'2026.04.20', amount:5000000, status:'진행중',
        detail:{ steps:[
          { label:'선금', amount:1500000, ratio:'30%', status:'done', date:'2026.04.25' },
          { label:'중도금', amount:2000000, ratio:'40%', status:'waiting', date:null, action:'검수하기' },
          { label:'잔금', amount:1500000, ratio:'30%', status:'pending', date:null },
        ], note:'납품일: 2026.07.31 · 계약서 서명 완료' } },
      { id:2, icon:'📄', title:'1차 시안 납품 확인서', date:'2026.05.06', amount:null, status:'완료',
        detail:{ note:'메인 5종 1차 시안 납품 확인 · 검수 대기 중', steps:null } },
    ],
    attachments:[{ name:'계약서_박철수_20260420.pdf', size:'2.1MB', date:'2026.04.20' },{ name:'1차시안_메인5종.zip', size:'48MB', date:'2026.05.06' }],
    memos:['검수 기준: 피그마 완성도 85% 이상','잔금 지급 전 반드시 확인 필요'],
    userInfo:{ name:'박철수', role:'외주 수급인', phone:'010-1234-5678', bank:'국민 ****-901', kyc:'KYC 2단계', joined:'2026.04.20' },
  },
  '2': {
    trades: [
      { id:1, icon:'📋', title:'금전소비대차 계약서', date:'2026.04.01', amount:5000000, status:'진행중',
        detail:{ note:'상환일: 2027.05.05 · 연 4.6% · 만기 일시상환', steps:null } },
      { id:2, icon:'🧾', title:'월 대여료 이자 납부 확인서', date:'2026.03.15', amount:13750, status:'완료',
        detail:{ note:'3월 이자 납부 완료 · 13,750원', steps:null } },
      { id:3, icon:'📝', title:'긴급 지원금 신청서', date:'2026.02.20', amount:300000, status:'완료',
        detail:{ note:'긴급 생활비 지원 · 300,000원', steps:null } },
    ],
    attachments:[{ name:'차용증_이유진_20260401.pdf', size:'1.2MB', date:'2026.04.01' }],
    memos:['상환일 1개월 전 자동 알림 설정됨'],
    userInfo:{ name:'이유진', role:'가족 구성원 (딸)', phone:'010-9876-5432', bank:'신한 ****-789', kyc:'KYC 2단계', joined:'2026.02.15' },
  },
  '3': {
    trades: [
      { id:1, icon:'📋', title:'엔젤 투자 계약서', date:'2026.02.15', amount:50000000, status:'진행중',
        detail:{ steps:[
          { label:'1차 집행', amount:20000000, ratio:'40%', status:'done', date:'2026.02.20' },
          { label:'2차 집행', amount:12400000, ratio:'25%', status:'done', date:'2026.04.01' },
          { label:'3차 집행', amount:17600000, ratio:'35%', status:'pending', date:null },
        ], note:'MCC 통제 · IT·개발 허용 · 월 1회 보고' } },
    ],
    attachments:[{ name:'투자계약서_오로라_20260215.pdf', size:'3.8MB', date:'2026.02.15' },{ name:'4월_집행내역보고서.pdf', size:'0.9MB', date:'2026.05.01' }],
    memos:['소진 속도 이상 → 5월 추가 확인 필요','쿠폰 API 매출 대조 진행 중'],
    userInfo:{ name:'ㄱ오로라 (법인)', role:'투자 수령인', phone:'02-1234-5678', bank:'기업 ****-456', kyc:'기업 인증 완료', joined:'2026.02.15' },
  },
  '4': {
    trades: [
      { id:1, icon:'📋', title:'UI 컴포넌트 라이브러리 계약서', date:'2026.05.01', amount:5000000, status:'진행중',
        detail:{ steps:[
          { label:'선금', amount:1500000, ratio:'30%', status:'done', date:'2026.05.03' },
          { label:'중도금', amount:2000000, ratio:'40%', status:'pending', date:null },
          { label:'잔금', amount:1500000, ratio:'30%', status:'pending', date:null },
        ], note:'납품일: 2026.09.30' } },
    ],
    attachments:[{ name:'계약서_김창업_20260501.pdf', size:'1.9MB', date:'2026.05.01' }],
    memos:[],
    userInfo:{ name:'김창업', role:'외주 수급인', phone:'010-5555-1234', bank:'카카오뱅크 ****-321', kyc:'KYC 2단계', joined:'2026.05.01' },
  },
}

export const STEP_STYLE = {
  done:    { dot:'#2A7D5E', label:'완료',      color:'#2A7D5E', bg:'#E6F5EF' },
  waiting: { dot:'#C8821A', label:'검수 대기', color:'#C8821A', bg:'#FFF4E0' },
  upload:  { dot:'#D94040', label:'파일 필요', color:'#D94040', bg:'#FCEBEB' },
  pending: { dot:'#C8C5BE', label:'대기',      color:'#C8C5BE', bg:'#F2EFE9' },
}

// ─── 메모 저장소 (ChatRoom ↔ DetailScreen 공유) ───
const _threadMemosStore = {}

export function saveThreadMemo(threadId, memo) {
  if (!_threadMemosStore[threadId]) _threadMemosStore[threadId] = []
  _threadMemosStore[threadId].push(memo)
}

export function deleteThreadMemo(threadId, memoId) {
  if (_threadMemosStore[threadId])
    _threadMemosStore[threadId] = _threadMemosStore[threadId].filter(m => m.id !== memoId)
}

export function getThreadMemos(threadId) {
  return _threadMemosStore[threadId] || []
}
