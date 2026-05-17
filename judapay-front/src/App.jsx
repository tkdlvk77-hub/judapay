import { useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import AppRoutes from './AppRoutes'

// 하단 탭 루트 경로 — 탭 전환은 스택 초기화 (애니메이션 없음)
const TAB_PATHS = new Set(['/home', '/home-business', '/messages', '/alerts', '/more', '/business-menu'])

// 애니메이션 지속 시간 (CSS와 맞춤)
const ANIM_DURATION = 340

export default function App() {
  const location = useLocation()

  // 스택: [{ key, loc, animIn?, exiting? }, ...]
  // animIn: 'forward' | 'back' | undefined
  // exiting: true = 오른쪽으로 슬라이드 아웃 중
  const [stack, setStack] = useState([{ key: location.key, loc: location }])

  const isBackRef = useRef(false)       // popstate 감지
  const prevKeyRef = useRef(location.key)
  const animTimerRef = useRef(null)

  // popstate = 브라우저/Capacitor 뒤로가기, navigate(-1), iOS 스와이프 백
  useEffect(() => {
    const onPop = () => { isBackRef.current = true }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    // 같은 location이면 무시 (초기 마운트 시 중복 실행 방지)
    if (location.key === prevKeyRef.current) return

    const isBack = isBackRef.current
    const isTabSwap = !isBack && TAB_PATHS.has(location.pathname)

    // 플래그 리셋
    isBackRef.current = false
    prevKeyRef.current = location.key

    // 진행 중인 타이머 취소
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current)
      animTimerRef.current = null
    }

    if (isTabSwap) {
      // 탭 전환: 스택 완전 초기화, 애니메이션 없음
      setStack([{ key: location.key, loc: location }])
      return
    }

    if (isBack) {
      // 뒤로가기: 현재 top을 exiting으로, 타겟을 back 애니메이션으로
      setStack(prev => {
        const topIdx = prev.length - 1
        const targetIdx = prev.findIndex(s => s.key === location.key)

        if (targetIdx >= 0) {
          // 이전에 방문한 key가 스택에 있음 → 정상 pop
          return prev.map((s, i) => ({
            ...s,
            animIn: i === targetIdx ? 'back' : undefined,
            exiting: i === topIdx,
          }))
        }

        // 스택에 없음 (직접 URL 접근 등) → 새 항목으로 대체
        return [{ key: location.key, loc: location }]
      })

      // 애니메이션 끝나면 exiting 항목 제거
      animTimerRef.current = setTimeout(() => {
        setStack(prev => {
          const idx = prev.findIndex(s => s.key === location.key)
          if (idx < 0) return prev
          // targetIdx 이후 항목(exiting된 top) 제거, animIn 플래그 초기화
          return prev.slice(0, idx + 1).map(s => ({ ...s, animIn: undefined, exiting: false }))
        })
      }, ANIM_DURATION)
    } else {
      // 앞으로 push: 새 화면을 오른쪽에서 슬라이드 인
      setStack(prev => [
        ...prev.slice(-19), // 최대 20개 유지 (메모리 보호)
        { key: location.key, loc: location, animIn: 'forward' },
      ])

      // 애니메이션 끝나면 animIn 플래그 제거
      animTimerRef.current = setTimeout(() => {
        setStack(prev =>
          prev.map(s => s.key === location.key ? { ...s, animIn: undefined } : s)
        )
      }, ANIM_DURATION)
    }
  }, [location])

  // 상위 2개 레이어만 렌더 (이전 화면 + 현재 화면)
  // exiting 중일 때는 exiting 항목도 포함해야 하므로 마지막 3개까지 허용
  const visibleStart = Math.max(0, stack.length - 2)

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', height: '100%' }}>
      <div className="phone-stage">
        {stack.map((screen, index) => {
          const isVisible = index >= visibleStart || screen.exiting

          // 화면이 visible 범위 밖이고 exiting도 아니면 렌더 안 함 (성능)
          if (!isVisible) return null

          let animClass = ''
          if (screen.animIn === 'forward') animClass = 'page-enter-right'
          if (screen.animIn === 'back')    animClass = 'page-enter-left'
          if (screen.exiting)              animClass = 'page-exit-right'

          return (
            <div
              key={screen.key}
              className={animClass}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: index + 1,
              }}
            >
              <AppRoutes location={screen.loc} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
