import { useNavigate, useParams } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS, GRADIENTS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'
import { useT } from '../design/i18n'

// 데모 데이터 — 실제는 백엔드
const PAYMENTS = {
  p1: {
    id:'p1',
    status:'normal',
    amount:32000,
    merchant:'이마트 역삼점',
    mcc:'5411 · 식료품/마트',
    mccBlocked:false,
    timestamp:'2026.05.05 14:32',
    walletLabel:'서울시 · 4월 교육비',
    walletSub:'만료 D-3 · 우선순위 1위',
    receiver:'이유진',
    allowedMcc:[
      { code:'식료품 5411', allowed:true },
      { code:'교육 8299', allowed:true },
      { code:'의료 8099', allowed:true },
      { code:'게임 7993', allowed:false },
    ],
  },
  p2: {
    id:'p2',
    status:'blocked',
    amount:150000,
    merchant:'GS강남게임센터',
    mcc:'7993 · 오락/게임',
    mccBlocked:true,
    timestamp:'2026.04.28 22:14',
    receiver:'박철수',
    blockReason:'박철수 지갑 허용 MCC에 오락/게임(7993)이 포함되지 않아 자동 차단됐어요.',
    blockRecord:'발신자(서울시)에게 자동 통보됨 · 5년 보관',
    allowedMcc:[
      { code:'식료품 5411', allowed:true },
      { code:'교통 4111', allowed:true },
      { code:'의료 8099', allowed:true },
      { code:'게임 7993', allowed:false },
    ],
  },
  // 홈 결제 로그용
  l1: {
    id:'l1',
    status:'normal',
    amount:4500,
    merchant:'스타벅스 강남점',
    mcc:'5814 · 카페/패스트푸드',
    mccBlocked:false,
    timestamp:'2026.05.06 09:12',
    walletLabel:'MY 지갑',
    walletSub:'자유 사용',
    receiver:'이호형',
    allowedMcc:[
      { code:'전체 허용', allowed:true },
    ],
  },
  l2: {
    id:'l2',
    status:'incoming',
    amount:200000,
    merchant:'서울시 교육비 지원',
    mcc:'정부 지원금',
    mccBlocked:false,
    timestamp:'2026.05.05 14:00',
    walletLabel:'서울시 · 4월 교육비',
    walletSub:'권한 자금 · MCC 교육 한정',
    receiver:'이호형',
    allowedMcc:[
      { code:'교육 8299', allowed:true },
      { code:'식료품 5411', allowed:true },
      { code:'의료 8099', allowed:true },
      { code:'게임 7993', allowed:false },
    ],
  },
  log_today_2: {
    id:'log_today_2',
    status:'normal',
    amount:3200,
    merchant:'CU 역삼점',
    mcc:'5411 · 편의점',
    mccBlocked:false,
    timestamp:'2026.05.06 07:45',
    walletLabel:'MY 지갑',
    walletSub:'자유 사용',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  log_y_3: {
    id:'log_y_3',
    status:'normal',
    amount:12500,
    merchant:'택시 카드결제',
    mcc:'4111 · 교통',
    mccBlocked:false,
    timestamp:'2026.05.05 08:20',
    walletLabel:'MY 지갑',
    walletSub:'자유 사용',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  log_w_1: {
    id:'log_w_1',
    status:'normal',
    amount:1000000,
    merchant:'박민준에게 빌려줌',
    mcc:'개인 송금 · 빌려주기',
    mccBlocked:false,
    timestamp:'2026.05.04 16:30',
    walletLabel:'MY 지갑',
    walletSub:'자유 사용',
    receiver:'박민준',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  log_w_2: {
    id:'log_w_2',
    status:'normal',
    amount:28900,
    merchant:'올리브영 강남점',
    mcc:'5912 · 생활/뷰티',
    mccBlocked:false,
    timestamp:'2026.05.03 19:12',
    walletLabel:'MY 지갑',
    walletSub:'자유 사용',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  log_lw_2: {
    id:'log_lw_2',
    status:'normal',
    amount:29900,
    merchant:'쿠팡 정기결제',
    mcc:'5732 · 쇼핑/구독',
    mccBlocked:false,
    timestamp:'2026.04.27 03:00',
    walletLabel:'MY 지갑',
    walletSub:'자유 사용',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  log_old_1: {
    id:'log_old_1',
    status:'incoming',
    amount:1500000,
    merchant:'박철수 외주비 입금',
    mcc:'외주비 · 검수 완료',
    mccBlocked:false,
    timestamp:'2026.04.20 14:00',
    walletLabel:'MY 지갑',
    walletSub:'외주비 · 검수 후 자동 출금',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  log_old_2: {
    id:'log_old_2',
    status:'normal',
    amount:50000,
    merchant:'이호형에게 송금',
    mcc:'개인 송금 · 선물',
    mccBlocked:false,
    timestamp:'2026.04.18 21:05',
    walletLabel:'MY 지갑',
    walletSub:'자유 사용',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  // 지갑 상세 거래 내역용 (MY 지갑)
  txn_my_1: {
    id:'txn_my_1',
    status:'incoming',
    amount:500000,
    merchant:'(주)오로라 디자인 외주',
    mcc:'외주비 · 사업자 발신',
    mccBlocked:false,
    timestamp:'2026.05.06 10분 전',
    walletLabel:'MY 지갑',
    walletSub:'사업자 발신 · 검수 후 출금',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  txn_my_3: {
    id:'txn_my_3',
    status:'normal',
    amount:450000,
    merchant:'국민은행 1234***5678',
    mcc:'본인 명의 계좌 출금',
    mccBlocked:false,
    timestamp:'2026.05.05 18:42',
    walletLabel:'MY 지갑',
    walletSub:'자유 사용',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  txn_my_4: {
    id:'txn_my_4',
    status:'incoming',
    amount:1200000,
    merchant:'(주)오로라 11월 급여',
    mcc:'급여 · 정기 입금',
    mccBlocked:false,
    timestamp:'2026.05.05 09:00',
    walletLabel:'MY 지갑',
    walletSub:'사업자 발신 · 정기',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  txn_my_5: {
    id:'txn_my_5',
    status:'incoming',
    amount:432000,
    merchant:'카카오뱅크 충전',
    mcc:'본인 명의 충전',
    mccBlocked:false,
    timestamp:'2026.05.01 15:00',
    walletLabel:'MY 지갑',
    walletSub:'자유 사용',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  // 지갑 상세 — 교육비 지갑
  txn_edu_4: {
    id:'txn_edu_4',
    status:'normal',
    amount:18000,
    merchant:'예스24 인터넷서점',
    mcc:'5942 · 서적/교육',
    mccBlocked:false,
    timestamp:'2026.05.03 11:00',
    walletLabel:'서울시 · 교육비 지원',
    walletSub:'학원·서점 MCC 전용',
    receiver:'이호형',
    allowedMcc:[
      { code:'교육 8299', allowed:true },
      { code:'서적 5942', allowed:true },
      { code:'식료품 5411', allowed:true },
      { code:'게임 7993', allowed:false },
    ],
  },
  // 엄마 용돈 지갑
  txn_mom_1: {
    id:'txn_mom_1',
    status:'normal',
    amount:8500,
    merchant:'스타벅스 강남점',
    mcc:'5814 · 카페',
    mccBlocked:false,
    timestamp:'2026.05.04 15:20',
    walletLabel:'엄마 · 용돈',
    walletSub:'카드 결제만',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  txn_mom_2: {
    id:'txn_mom_2',
    status:'normal',
    amount:15000,
    merchant:'CGV 강남',
    mcc:'7832 · 영화',
    mccBlocked:false,
    timestamp:'2026.05.02 19:30',
    walletLabel:'엄마 · 용돈',
    walletSub:'카드 결제만',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  txn_mom_3: {
    id:'txn_mom_3',
    status:'incoming',
    amount:200000,
    merchant:'엄마 용돈',
    mcc:'선물 · 가족',
    mccBlocked:false,
    timestamp:'2026.05.01 10:00',
    walletLabel:'엄마 · 용돈',
    walletSub:'선물 · 카드 결제만',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  // 박민준 빌려준 지갑
  txn_lent_1: {
    id:'txn_lent_1',
    status:'normal',
    amount:300000,
    merchant:'농협 ATM 출금',
    mcc:'박민준 카드 사용',
    mccBlocked:false,
    timestamp:'2026.05.05 14:20',
    walletLabel:'박민준 · 빌려준 돈',
    walletSub:'대여 자금 · 차용증',
    receiver:'박민준',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  txn_lent_2: {
    id:'txn_lent_2',
    status:'incoming',
    amount:1000000,
    merchant:'박민준 빌려주기',
    mcc:'대여 · 차용증',
    mccBlocked:false,
    timestamp:'2026.05.01 16:30',
    walletLabel:'박민준 · 빌려준 돈',
    walletSub:'차용증 모두싸인 완료',
    receiver:'박민준',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  // 외주비 지갑
  txn_fl_1: {
    id:'txn_fl_1',
    status:'incoming',
    amount:1500000,
    merchant:'박철수 외주 의뢰 입금',
    mcc:'외주비 · 검수 대기',
    mccBlocked:false,
    timestamp:'2026.04.28 10:00',
    walletLabel:'박철수 · 외주비',
    walletSub:'검수 대기 중',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
  // 카드 관리 화면 최근 결제용
  p_card_1: {
    id:'p_card_1',
    status:'normal',
    amount:32000,
    merchant:'이마트 역삼점',
    mcc:'5411 · 식료품/마트',
    mccBlocked:false,
    timestamp:'2026.05.05 14:32',
    walletLabel:'서울시 · 4월 교육비',
    walletSub:'만료 D-3 · 우선순위 1위',
    receiver:'이호형',
    allowedMcc:[
      { code:'식료품 5411', allowed:true },
      { code:'교육 8299', allowed:true },
      { code:'의료 8099', allowed:true },
      { code:'게임 7993', allowed:false },
    ],
  },
  p_card_2: {
    id:'p_card_2',
    status:'normal',
    amount:7500,
    merchant:'스타벅스 강남점',
    mcc:'5814 · 카페',
    mccBlocked:false,
    timestamp:'2026.05.05 09:15',
    walletLabel:'엄마 · 용돈',
    walletSub:'식비·마트 결제 가능',
    receiver:'이호형',
    allowedMcc:[
      { code:'식료품 5411', allowed:true },
      { code:'카페 5814', allowed:true },
      { code:'음식점 5812', allowed:true },
    ],
  },
  p_card_4: {
    id:'p_card_4',
    status:'normal',
    amount:23000,
    merchant:'올리브영 강남점',
    mcc:'5912 · 생활/뷰티',
    mccBlocked:false,
    timestamp:'2026.04.27 16:44',
    walletLabel:'MY 지갑',
    walletSub:'자유 사용',
    receiver:'이호형',
    allowedMcc:[{ code:'전체 허용', allowed:true }],
  },
}

// ─── 다크 헤더 ─────────────────────────
function DarkHeader({ smallTitle, smallSub, smallSubColor, onBack, onMore }) {
  const theme = getAccountTheme()
  return (
    <div style={{
      background: theme.headerGrad,
      paddingTop:'20px',
      paddingBottom:'24px',
    }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'4px 16px 0',
      }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'8px', flex:1 }}>
          <button onClick={onBack}
            style={{
              width:'32px', height:'32px',
              background:'transparent', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', padding:0, flexShrink:0,
              marginTop:'2px',
            }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <div style={{ fontSize:'18px', fontWeight:700, color:'#fff', lineHeight:1.2 }}>
              {smallTitle}
            </div>
            {smallSub && (
              <div style={{
                fontSize:'12px', fontWeight:600,
                color: smallSubColor || 'rgba(255,255,255,0.55)',
                marginTop:'4px',
              }}>
                {smallSub}
              </div>
            )}
          </div>
        </div>
        {onMore && (
          <button onClick={onMore}
            style={{
              width:'32px', height:'32px',
              background:'transparent', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', padding:0, flexShrink:0,
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default function PaymentDetail() {
  const theme = getAccountTheme()
  const t = useT()
  const { id } = useParams()
  const navigate = useNavigate()
  const payment = PAYMENTS[id] || PAYMENTS.p1

  const isBlocked = payment.status === 'blocked'
  const isIncoming = payment.status === 'incoming'

  return (
    <PhoneShell>
      <div style={{ flex:1, overflowY:'auto' }}>
        <DarkHeader
          smallTitle="결제 상세"
          smallSub={
            isBlocked ? '차단된 결제'
            : isIncoming ? '입금 완료'
            : '정상 결제'
          }
          smallSubColor={
            isBlocked ? '#FCA5A5'
            : isIncoming ? '#34D399'
            : 'rgba(255,255,255,0.55)'
          }
          onBack={() => navigate(-1)}
          onMore={() => {}}
        />

        <div style={{ padding:'18px 16px 24px' }}>

          {/* 결제 금액 카드 — 상태별 */}
          {isBlocked ? (
            <div style={{
              background: COLORS.dangerBg,
              border: `1px solid ${COLORS.danger}`,
              borderRadius: RADIUS.lg,
              padding:'24px 20px',
              textAlign:'center',
              marginBottom:'14px',
            }}>
              <div style={{ fontSize:'12px', fontWeight:600, color:'#B91C1C', marginBottom:'10px' }}>
                차단된 결제 시도
              </div>
              <div style={{
                fontSize:'34px', fontWeight:700, color: COLORS.danger,
                letterSpacing:'-1.5px', marginBottom:'12px',
              }}>
                {payment.amount.toLocaleString()}원
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px' }}>
                <span style={{
                  padding:'3px 10px',
                  background: COLORS.danger, color:'#fff',
                  borderRadius: RADIUS.pill,
                  fontSize:'11px', fontWeight:700,
                }}>
                  차단
                </span>
                <span style={{ fontSize:'11px', color:'#B91C1C', fontWeight:600 }}>
                  MCC 불일치
                </span>
              </div>
            </div>
          ) : isIncoming ? (
            <div style={{
              background:'#ECFDF5',
              border:'1px solid #10B981',
              borderRadius: RADIUS.lg,
              padding:'24px 20px',
              textAlign:'center',
              marginBottom:'14px',
            }}>
              <div style={{ fontSize:'12px', fontWeight:600, color:'#047857', marginBottom:'10px' }}>
                받은 자금
              </div>
              <div style={{
                fontSize:'34px', fontWeight:700, color:'#047857',
                letterSpacing:'-1.5px', marginBottom:'12px',
              }}>
                +{payment.amount.toLocaleString()}원
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px' }}>
                <span style={{
                  padding:'3px 10px',
                  background:'#10B981', color:'#fff',
                  borderRadius: RADIUS.pill,
                  fontSize:'11px', fontWeight:700,
                }}>
                  입금 완료
                </span>
                <span style={{ fontSize:'11px', color:'#047857', fontWeight:600 }}>
                  {payment.walletLabel}
                </span>
              </div>
            </div>
          ) : (
            <div style={{
              background:'#1F1F2E',
              borderRadius: RADIUS.lg,
              padding:'24px 20px',
              textAlign:'center',
              marginBottom:'14px',
              boxShadow: SHADOWS.glass,
            }}>
              <div style={{ fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.5)', marginBottom:'10px' }}>
                결제 금액
              </div>
              <div style={{
                fontSize:'34px', fontWeight:700, color:'#fff',
                letterSpacing:'-1.5px', marginBottom:'12px',
              }}>
                {payment.amount.toLocaleString()}원
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px' }}>
                <span style={{
                  padding:'3px 10px',
                  background:'rgba(52,211,153,0.20)',
                  color:'#34D399',
                  borderRadius: RADIUS.pill,
                  fontSize:'11px', fontWeight:700,
                }}>
                  정상
                </span>
                <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)', fontWeight:500 }}>
                  {payment.walletLabel}
                </span>
              </div>
            </div>
          )}

          {/* 거래 정보 카드 */}
          <div style={{
            background: COLORS.bgCard,
            boxShadow: SHADOWS.card,
            borderRadius: RADIUS.lg,
            overflow:'hidden',
            marginBottom:'14px',
          }}>
            {[
              { label:'가맹점', value: payment.merchant },
              {
                label:'MCC',
                value: payment.mcc,
                danger: payment.mccBlocked,
                suffix: payment.mccBlocked ? '×' : null,
              },
              { label:'일시', value: payment.timestamp },
              ...(payment.walletLabel && !isIncoming ? [{
                label:'차감 지갑',
                value: payment.walletLabel,
                sub: payment.walletSub,
              }] : []),
              { label:'수령인', value: payment.receiver },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                padding:'14px 16px',
                borderBottom: i < arr.length-1 ? `1px solid ${COLORS.borderSoft}` : 'none',
                display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                gap:'10px',
              }}>
                <span style={{ fontSize:'12px', color: COLORS.t4, paddingTop:'2px', flexShrink:0 }}>
                  {row.label}
                </span>
                <div style={{ textAlign:'right' }}>
                  <div style={{
                    fontSize:'13px', fontWeight:600,
                    color: row.danger ? COLORS.danger : COLORS.t1,
                  }}>
                    {row.value}{row.suffix && (
                      <span style={{ marginLeft:'6px', color: COLORS.danger, fontWeight:700 }}>
                        {row.suffix}
                      </span>
                    )}
                  </div>
                  {row.sub && (
                    <div style={{ fontSize:'11px', color: COLORS.t4, marginTop:'2px', lineHeight:1.45 }}>
                      {row.sub}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 차단 이유 + 기록 (차단된 결제만) */}
          {isBlocked && (
            <div style={{
              background:'#FFFBEB',
              borderRadius: RADIUS.lg,
              padding:'14px 16px',
              marginBottom:'14px',
            }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#854F0B', marginBottom:'6px' }}>
                차단 이유
              </div>
              <div style={{ fontSize:'12px', color:'#854F0B', lineHeight:1.6, marginBottom:'12px' }}>
                {payment.blockReason}
              </div>
              <div style={{ fontSize:'12px', fontWeight:700, color:'#854F0B', marginBottom:'4px' }}>
                차단 기록
              </div>
              <div style={{ fontSize:'11px', color:'#854F0B', lineHeight:1.55 }}>
                {payment.blockRecord}
              </div>
            </div>
          )}

          {/* 허용 MCC 정책 */}
          <div style={{
            background: COLORS.bgCard,
            boxShadow: SHADOWS.card,
            borderRadius: RADIUS.lg,
            padding:'14px 16px',
            marginBottom:'14px',
          }}>
            <div style={{ fontSize:'12px', fontWeight:700, color: COLORS.t3, marginBottom:'10px' }}>
              {isBlocked ? `${payment.receiver} 허용 MCC` : '허용 MCC 정책'}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px' }}>
              {payment.allowedMcc.map(m => (
                <span key={m.code} style={{
                  display:'inline-flex', alignItems:'center', gap:'4px',
                  padding:'4px 8px',
                  background: m.allowed ? '#D1FAE5' : COLORS.dangerBg,
                  color: m.allowed ? '#047857' : '#B91C1C',
                  borderRadius:'5px',
                  fontSize:'11px', fontWeight:700,
                }}>
                  {m.code}
                  {m.allowed
                    ? <span style={{ fontSize:'10px' }}>✓</span>
                    : <span style={{ fontSize:'12px' }}>×</span>
                  }
                </span>
              ))}
            </div>
            <button style={{
              background:'none', border:'none', padding:0,
              fontSize:'12px', fontWeight:600,
              color: theme.brand,
              cursor:'pointer', fontFamily:'inherit',
            }}>
              MCC 정책 변경 ›
            </button>
          </div>
        </div>
      </div>

      {/* 하단 액션 — 1:1 문의 + 즉시 차단 */}
      <div style={{
        padding:'12px 16px 24px',
        borderTop: `1px solid ${COLORS.borderSoft}`,
        background: COLORS.bgCard,
        display:'flex', gap:'10px',
      }}>
        <button onClick={() => navigate('/messages')}
          style={{
            flex:1, height:'52px',
            background: COLORS.bgMuted, color: COLORS.t2,
            border:'none', borderRadius: RADIUS.md,
            fontSize:'13px', fontWeight:600,
            cursor:'pointer', fontFamily:'inherit',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'5px',
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          1:1 문의
        </button>
        <button
          disabled={isBlocked || isIncoming}
          style={{
            flex:1.5, height:'52px',
            background: isBlocked || isIncoming ? COLORS.dangerBg : COLORS.danger,
            color: isBlocked || isIncoming ? '#B91C1C' : '#fff',
            border:'none', borderRadius: RADIUS.md,
            fontSize:'13px', fontWeight:700,
            cursor: isBlocked || isIncoming ? 'default' : 'pointer',
            fontFamily:'inherit',
            opacity: isBlocked || isIncoming ? 0.6 : 1,
          }}>
          {isBlocked ? '이미 차단됨' : isIncoming ? '환불 신청' : '즉시 차단'}
        </button>
      </div>
    </PhoneShell>
  )
}
