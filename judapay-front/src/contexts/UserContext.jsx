import { createContext, useContext, useState, useEffect } from 'react'

// userType: 'personal' | 'business' | null (로그인 안 함)
const UserContext = createContext({
  userType: null,
  login: () => {},
  logout: () => {},
})

export function UserProvider({ children }) {
  // 초기값: sessionStorage에서 한 번 읽음 (새로고침 대응)
  const [userType, setUserType] = useState(() => {
    const stored = sessionStorage.getItem('bizType')
    return stored === 'business' ? 'business' : stored === 'personal' ? 'personal' : null
  })

  // sessionStorage 동기화 (다른 탭에서 변경되면 반영)
  useEffect(() => {
    const handler = () => {
      const stored = sessionStorage.getItem('bizType')
      setUserType(stored === 'business' ? 'business' : stored === 'personal' ? 'personal' : null)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const login = (type) => {
    sessionStorage.setItem('bizType', type)
    setUserType(type)
  }

  const logout = () => {
    sessionStorage.removeItem('bizType')
    setUserType(null)
  }

  return (
    <UserContext.Provider value={{ userType, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
