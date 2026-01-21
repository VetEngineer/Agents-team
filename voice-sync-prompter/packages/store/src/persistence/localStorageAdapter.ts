import type { PersistenceAdapter } from './types'

/**
 * localStorage 기반 영속성 어댑터 (웹 브라우저용)
 */
export const createLocalStorageAdapter = (): PersistenceAdapter => ({
  async setItem(key: string, value: string) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value)
    }
  },

  async getItem(key: string) {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key)
    }
    return null
  },

  async removeItem(key: string) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key)
    }
  },
})

/**
 * 기본 localStorage 어댑터 인스턴스
 */
export const localStorageAdapter = createLocalStorageAdapter()
