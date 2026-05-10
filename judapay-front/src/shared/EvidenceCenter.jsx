import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../design/components'
import { COLORS, RADIUS, SHADOWS } from '../design/tokens'
import { getAccountTheme } from '../design/accountTokens'
import BottomTab from '../components/BottomTab'

// ─────────────────────────────────────────────────────────
// 데모 데이터
// ─────────────────────────────────────────────────────────

// 정기 대장 (매월 반복 — 급여, 임대료 등)
const RECURRING_LEDGERS = [
  {
    id: 'salary_2026',
    title: '2026년 정기 급여 대장',
    subtitle: '인건비 집행 (매월 반복)',
    type: '인건비',
    typeColor: '#10B981',
    typeBg: '#D1FAE5',
    entries: [
      {
        date: '2026-04-25', label: '4월분 급여', amount: 85000000,
        evidences: [
          { label: '급여명세서', status: 'done' },
          { label: '4대보험 영수증', status: 'missing' },
        ],
      },
      {
        date: '2026-03-25', label: '3월분 급여', amount: 82500000,
        evidences: [
          { label: '급여대장', status: 'done' },
          { label: '이체확인증', status: 'done' },
          { label: '원천세신고', status: 'done' },
        ],
      },
      {
        date: '2026-02-25', label: '2월분 급여', amount: 81000000,
        evidences: [
          { label: '급여대장', status: 'done' },
          { label: '이체확인증', status: 'done' },
          { label: '원천세신고', status: 'done' },
        ],
      },
    ],
    zipName: '인건비_증빙_패키지',
    treeBuilder: () => ({
      name: '2026_04_인건비_패키지',
      children: [
        { name: '00_전직원_근로계약서_모음.zip', type: 'zip' },
        {
          name: '03월분_급여',
          children: [
            { name: '급여대장.xlsx', type: 'xlsx' },
            { name: '원천세신고서.pdf', type: 'pdf' },
          ],
        },
        {
          name: '04월분_급여',
          children: [
            { name: '개인별_급여명세서.pdf', type: 'pdf' },
            { name: '[누락] 4대보험_완납증명.pdf', type: 'missing' },
          ],
        },
      ],
    }),
  },
  {
    id: 'realestate_pentaport',
    title: '분당 펜타포트 임대차',
    subtitle: '부동산 잔금 분할 집행',
    type: '부동산',
    typeColor: '#6B21A8',
    typeBg: '#F5F3FF',
    entries: [
      {
        date: '2026-04-25', label: '5회차 월세', amount: 4500000,
        evidences: [
          { label: '이체확인증', status: 'done' },
          { label: '영수증', status: 'missing' },
        ],
      },
      {
        date: '2026-04-10', label: '중도금', amount: 350000000,
        evidences: [
          { label: '이체확인증', status: 'done' },
          { label: '영수증', status: 'done' },
        ],
      },
      {
        date: '2026-03-10', label: '계약금', amount: 50000000,
        evidences: [
          { label: '이체확인증', status: 'done' },
          { label: '계약서', status: 'done' },
        ],
      },
    ],
    zipName: '부동산_펜타포트_증빙_패키지',
    treeBuilder: () => ({
      name: '분당_펜타포트_증빙_패키지',
      children: [
        { name: '00_마스터_임대차계약서.pdf', type: 'pdf' },
        {
          name: '01_계약금_2026-03-10',
          children: [
            { name: '이체확인증.pdf', type: 'pdf' },
          ],
        },
        {
          name: '02_중도금_2026-04-10',
          children: [
            { name: '이체확인증.pdf', type: 'pdf' },
            { name: '영수증.png', type: 'image' },
          ],
        },
        {
          name: '05회차_월세_2026-04-25',
          children: [
            { name: '이체확인증.pdf', type: 'pdf' },
            { name: '[누락] 영수증_미업로드.txt', type: 'missing' },
          ],
        },
        { name: '부동산_집행_리포트.xlsx', type: 'xlsx' },
      ],
    }),
  },
  {
    id: 'outsource_app',
    title: '앱 고도화 외주 패키지',
    subtitle: '외주비 단계별 집행',
    type: '외주비',
    typeColor: '#2D6BB0',
    typeBg: '#EDF3FA',
    entries: [
      {
        date: '2026-04-30', label: '1차 기성', amount: 15000000,
        evidences: [
          { label: '계약서', status: 'done' },
          { label: '검수확인서', status: 'done' },
          { label: '세금계산서', status: 'pending' },
        ],
      },
      {
        date: '2026-03-15', label: '선금', amount: 10000000,
        evidences: [
          { label: '계약서', status: 'done' },
          { label: '이체확인증', status: 'done' },
          { label: '세금계산서', status: 'done' },
        ],
      },
    ],
    zipName: '앱_고도화_외주_증빙_패키지',
    treeBuilder: () => ({
      name: '앱_고도화_외주_증빙_패키지',
      children: [
        { name: '00_외주_계약서_원본.pdf', type: 'pdf' },
        {
          name: '01_선금_2026-03-15',
          children: [
            { name: '이체확인증.pdf', type: 'pdf' },
            { name: '세금계산서_선금.pdf', type: 'pdf' },
          ],
        },
        {
          name: '02_1차기성_2026-04-30',
          children: [
            { name: '검수확인서.pdf', type: 'pdf' },
            { name: '이체확인증.pdf', type: 'pdf' },
            { name: '[대기] 세금계산서_1차.pdf', type: 'missing' },
          ],
        },
      ],
    }),
  },
  {
    id: 'invest_jang',
    title: '장학_투자 자금유치 패키지',
    subtitle: '투자 (1회 집행 · 정기 보고)',
    type: '투자',
    typeColor: '#065F46',
    typeBg: '#ECFDF5',
    entries: [
      {
        date: '2026-04-15', label: '투자 집행', amount: 100000000,
        evidences: [
          { label: '투자계약서', status: 'done' },
          { label: '이체확인증', status: 'done' },
          { label: 'CB 발행', status: 'done' },
        ],
      },
    ],
    zipName: '장학_투자_증빙_패키지',
    treeBuilder: () => ({
      name: '장학_투자_증빙_패키지',
      children: [
        { name: '00_투자계약서_CB.pdf', type: 'pdf' },
        { name: '01_이체확인증.pdf', type: 'pdf' },
        { name: '02_CB발행확인서.pdf', type: 'pdf' },
        { name: '03_정기보고서_2026Q1.xlsx', type: 'xlsx' },
      ],
    }),
  },
]

const TABS = ['전체', '인건비', '외주비', '부동산', '투자', '누락']

// ─────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────
function fmt(n) { return Number(n || 0).toLocaleString('ko-KR') }

function countMissing(ledger) {
  return ledger.entries.reduce((sum, e) =>
    sum + e.evidences.filter(ev => ev.status === 'missing' || ev.status === 'pending').length
  , 0)
}

function countAllFiles(ledger) {
  return ledger.entries.reduce((sum, e) => sum + e.evidences.length, 0)
}

// 트리 노드 렌더 (재귀)
function TreeNode({ node, depth = 0, isLast = false, parentLines = [] }) {
  const isFolder = !!node.children
  const isMissing = node.type === 'missing'

  // 들여쓰기 + 트리 라인
  const indent = []
  for (let i = 0; i < depth; i++) {
    const isLastLine = i === depth - 1
    const showVertical = !parentLines[i]
    indent.push(
      <span key={i} style={{ display:'inline-block', width:'18px', textAlign:'left', color:'rgba(255,255,255,0.4)', fontFamily:'monospace', fontSize:'13px' }}>
        {isLastLine ? (isLast ? '└' : '├') : (showVertical ? '│' : ' ')}
      </span>
    )
  }

  // 아이콘
  let iconEl = null
  if (isFolder) {
    iconEl = <span style={{ color:'#FCD34D', fontSize:'14px', marginRight:'5px' }}>📁</span>
  } else if (isMissing) {
    iconEl = <span style={{ color:'#FBBF24', fontSize:'13px', marginRight:'5px' }}>⚠</span>
  } else if (node.type === 'image') {
    iconEl = <span style={{ color:'#10B981', fontSize:'13px', marginRight:'5px' }}>🖼</span>
  } else if (node.type === 'xlsx') {
    iconEl = <span style={{ color:'#10B981', fontSize:'13px', marginRight:'5px' }}>📊</span>
  } else if (node.type === 'zip') {
    iconEl = <span style={{ color:'#F59E0B', fontSize:'13px', marginRight:'5px' }}>🗜</span>
  } else {
    iconEl = <span style={{ color:'#94A3B8', fontSize:'13px', marginRight:'5px' }}>📄</span>
  }

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', padding:'3px 0', fontFamily:'monospace', fontSize:'12.5px', color: isMissing ? '#FBBF24' : '#E2E8F0', lineHeight:1.6 }}>
        {indent}
        {iconEl}
        <span style={{ flex:1, fontFamily:'inherit' }}>{node.name}</span>
      </div>
      {isFolder && node.children.map((child, idx) => (
        <TreeNode
          key={idx}
          node={child}
          depth={depth + 1}
          isLast={idx === node.children.length - 1}
          parentLines={[...parentLines, isLast]}
        />
      ))}
    </>
  )
}

// ─────────────────────────────────────────────────────────
// ZIP 디렉토리 모달
// ─────────────────────────────────────────────────────────
function ZipTreeModal({ ledger, onClose }) {
  const tree = ledger.treeBuilder()
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', backdropFilter:'blur(4px)' }}>
      <div style={{ width:'100%', maxHeight:'82%', background:'#0F172A', borderRadius: RADIUS.lg, border:'1px solid rgba(255,255,255,0.1)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* 모달 헤더 */}
        <div style={{ padding:'18px 18px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'2px' }}>{ledger.type} ZIP Directory Structure</div>
            <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.5)' }}>{ledger.zipName}.zip</div>
          </div>
          <button onClick={onClose} style={{ width:'28px', height:'28px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* 트리 영역 */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', background:'#0B1220' }}>
          <TreeNode node={tree} depth={0} isLast={true} parentLines={[]} />
        </div>

        {/* 모달 푸터 */}
        <div style={{ padding:'12px 18px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:'8px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', background:'rgba(255,255,255,0.08)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>닫기</button>
          <button onClick={() => alert(`${ledger.zipName}.zip 다운로드`)} style={{ flex:2, padding:'12px', background:'linear-gradient(135deg, #5B4FE8, #3D2090)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            ZIP 다운로드
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// 증빙 칩 (✓/!)
// ─────────────────────────────────────────────────────────
function EvidenceChip({ ev }) {
  if (ev.status === 'done') {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'3px 8px', background:'#ECFDF5', color:'#065F46', border:'1px solid #A7F3D0', borderRadius:'6px', fontSize:'11px', fontWeight:600 }}>
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#065F46" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3"/></svg>
        {ev.label}
      </span>
    )
  }
  if (ev.status === 'pending') {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'3px 8px', background:'#FEF3C7', color:'#92400E', border:'1px solid #FCD34D', borderRadius:'6px', fontSize:'11px', fontWeight:600 }}>
        <span style={{ fontSize:'9px' }}>⏳</span>
        {ev.label}
      </span>
    )
  }
  // missing
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'3px 8px', background:'#FEE2E2', color:'#B91C1C', border:'1px solid #FCA5A5', borderRadius:'6px', fontSize:'11px', fontWeight:600 }}>
      <span style={{ fontSize:'10px' }}>!</span>
      {ev.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────
export default function EvidenceCenter() {
  const navigate = useNavigate()
  const theme = getAccountTheme()
  const [activeTab, setActiveTab] = useState('전체')
  const [zipModal, setZipModal] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const totalMissing = RECURRING_LEDGERS.reduce((s, l) => s + countMissing(l), 0)
  const totalFiles = RECURRING_LEDGERS.reduce((s, l) => s + countAllFiles(l), 0)

  const filtered = RECURRING_LEDGERS.filter(l => {
    if (activeTab === '전체') return true
    if (activeTab === '누락') return countMissing(l) > 0
    return l.type === activeTab
  })

  return (
    <PhoneShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* ── 헤더 ── */}
        <div style={{ background: theme.headerGrad, paddingTop:'20px', paddingBottom:'14px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 16px 12px' }}>
            <button onClick={() => navigate(-1)} style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'17px', fontWeight:700, color:'#fff' }}>통합 증빙센터</div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'1px' }}>세무사·회계사·정부 제출용</div>
            </div>
            <button style={{ width:'32px', height:'32px', background:'transparent', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>

          {/* 요약 KPI */}
          <div style={{ padding:'0 16px 12px', display:'flex', gap:'8px' }}>
            <div style={{ flex:1, padding:'9px 12px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px' }}>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', marginBottom:'2px' }}>전체 증빙</div>
              <div style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>{totalFiles}건</div>
            </div>
            <div style={{ flex:1, padding:'9px 12px', background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'10px' }}>
              <div style={{ fontSize:'10px', color:'rgba(167,243,208,0.85)', marginBottom:'2px' }}>완료</div>
              <div style={{ fontSize:'15px', fontWeight:700, color:'#86EFAC' }}>{totalFiles - totalMissing}건</div>
            </div>
            <div style={{ flex:1, padding:'9px 12px', background: totalMissing > 0 ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.06)', border:`1px solid ${totalMissing > 0 ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius:'10px' }}>
              <div style={{ fontSize:'10px', color: totalMissing > 0 ? 'rgba(252,165,165,0.85)' : 'rgba(255,255,255,0.55)', marginBottom:'2px' }}>누락·대기</div>
              <div style={{ fontSize:'15px', fontWeight:700, color: totalMissing > 0 ? '#FCA5A5' : '#fff' }}>{totalMissing}건</div>
            </div>
          </div>

          {/* 탭 */}
          <div style={{ display:'flex', gap:'6px', padding:'0 16px', overflowX:'auto' }}>
            {TABS.map(tab => {
              const isSel = activeTab === tab
              const isAlert = tab === '누락' && totalMissing > 0
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ flexShrink:0, padding:'6px 14px', background: isSel ? '#fff' : 'rgba(255,255,255,0.12)', color: isSel ? theme.brandDark : '#fff', border: isAlert && !isSel ? '1px solid rgba(239,68,68,0.6)' : 'none', borderRadius: RADIUS.pill, fontSize:'12px', fontWeight: isSel ? 700 : 500, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'5px' }}>
                  {isAlert && <span style={{ fontSize:'10px' }}>⚠</span>}
                  {tab}
                  {tab === '누락' && totalMissing > 0 && (
                    <span style={{ background: isSel ? '#EF4444' : 'rgba(239,68,68,0.4)', color: isSel ? '#fff' : '#FCA5A5', borderRadius:'8px', padding:'0 5px', fontSize:'10px', fontWeight:700 }}>{totalMissing}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 본문 ── */}
        <div style={{ flex:1, overflowY:'auto', background: COLORS.bg }}>
          <div style={{ padding:'14px 16px 24px', display:'flex', flexDirection:'column', gap:'12px' }}>

            {filtered.length === 0 ? (
              <div style={{ padding:'60px 0', textAlign:'center', color: COLORS.t4, fontSize:'13px' }}>해당 항목이 없어요</div>
            ) : filtered.map(ledger => {
              const missing = countMissing(ledger)
              const isOpen = expandedId === ledger.id
              return (
                <div key={ledger.id} style={{ background: COLORS.bgCard, borderRadius: RADIUS.lg, boxShadow: SHADOWS.card, overflow:'hidden' }}>

                  {/* 헤더 — 클릭으로 펼치기 */}
                  <button
                    onClick={() => setExpandedId(isOpen ? null : ledger.id)}
                    style={{ width:'100%', padding:'14px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex', alignItems:'center', gap:'10px' }}
                  >
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
                        <span style={{ fontSize:'14px', fontWeight:700, color: COLORS.t1 }}>{ledger.title}</span>
                        <span style={{ padding:'2px 8px', background: ledger.typeBg, color: ledger.typeColor, borderRadius:'6px', fontSize:'10px', fontWeight:700 }}>
                          {ledger.type}
                        </span>
                      </div>
                      <div style={{ fontSize:'11px', color: COLORS.t4 }}>{ledger.subtitle} · {ledger.entries.length}회차</div>
                    </div>
                    {missing > 0 && (
                      <span style={{ padding:'3px 8px', background:'#FEE2E2', color:'#B91C1C', border:'1px solid #FCA5A5', borderRadius:'7px', fontSize:'11px', fontWeight:700, flexShrink:0, display:'flex', alignItems:'center', gap:'3px' }}>
                        <span style={{ fontSize:'10px' }}>⚠</span>
                        {missing}건
                      </span>
                    )}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, transform: isOpen ? 'rotate(90deg)' : 'none', transition:'transform .2s' }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>

                  {/* 펼쳐진 영역 — 타임라인 */}
                  {isOpen && (
                    <div style={{ borderTop:`1px solid ${COLORS.borderSoft}`, padding:'8px 16px 12px' }}>
                      {ledger.entries.map((e, i) => (
                        <div key={i} style={{ display:'flex', gap:'10px', padding:'10px 0', borderBottom: i < ledger.entries.length-1 ? `1px dashed ${COLORS.borderSoft}` : 'none' }}>
                          {/* 좌측 도트 + 라인 */}
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, paddingTop:'4px' }}>
                            <div style={{ width:'9px', height:'9px', borderRadius:'50%', background: e.evidences.some(ev => ev.status==='missing') ? '#EF4444' : ledger.typeColor, border:'2px solid #fff', boxShadow:`0 0 0 2px ${e.evidences.some(ev => ev.status==='missing') ? '#FECACA' : ledger.typeBg}` }} />
                            {i < ledger.entries.length-1 && (
                              <div style={{ width:'2px', flex:1, background: COLORS.borderSoft, marginTop:'4px', minHeight:'30px' }} />
                            )}
                          </div>

                          {/* 우측 본문 */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'7px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                                <span style={{ fontSize:'12px', fontWeight:600, color: COLORS.t2 }}>{e.date}</span>
                                <span style={{ fontSize:'11px', color: COLORS.t4 }}>({e.label})</span>
                              </div>
                              <span style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1 }}>₩ {fmt(e.amount)}</span>
                            </div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                              {e.evidences.map((ev, j) => <EvidenceChip key={j} ev={ev} />)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 하단 ZIP 버튼 — 항상 표시 */}
                  <div style={{ padding:'10px 16px 14px', borderTop:`1px solid ${COLORS.borderSoft}` }}>
                    <button onClick={(ev) => { ev.stopPropagation(); setZipModal(ledger) }} style={{ width:'100%', padding:'10px', background: ledger.typeBg, color: ledger.typeColor, border:`1px solid ${ledger.typeColor}30`, borderRadius:'9px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      {ledger.type} 증빙 패키지 (ZIP)
                    </button>
                  </div>
                </div>
              )
            })}

            {/* 전체 일괄 다운로드 */}
            <button onClick={() => alert('전체 증빙 ZIP 다운로드')} style={{ width:'100%', padding:'16px', background:`linear-gradient(135deg, ${theme.brand}, ${theme.brandDark})`, border:'none', borderRadius: RADIUS.lg, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:`0 4px 16px ${theme.brand}40`, marginTop:'4px' }}>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'3px' }}>전체 일괄 다운로드 (ZIP)</div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)' }}>누락 항목 제외 · {totalFiles - totalMissing}/{totalFiles}건 · 약 32MB</div>
              </div>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
            </button>

            {/* 세무사 자동 전송 */}
            <button onClick={() => alert('세무사 자동 전송 설정')} style={{ width:'100%', padding:'14px', background: COLORS.bgCard, boxShadow: SHADOWS.card, border:'none', borderRadius: RADIUS.lg, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:`${theme.brandDark}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.brandDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.6 4.35 2 2 0 0 1 3.58 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.27-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div style={{ flex:1, textAlign:'left' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color: COLORS.t1, marginBottom:'2px' }}>세무사에게 자동 전송 설정</div>
                <div style={{ fontSize:'11px', color: COLORS.t4 }}>매월 마감 시 누락 없는 항목만 자동 발송</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.t4} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
            </button>

          </div>
        </div>

      </div>

      {/* ZIP 트리 모달 */}
      {zipModal && <ZipTreeModal ledger={zipModal} onClose={() => setZipModal(null)} />}

      <BottomTab />
    </PhoneShell>
  )
}
