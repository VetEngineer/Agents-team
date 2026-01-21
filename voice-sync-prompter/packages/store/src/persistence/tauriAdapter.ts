import type { PersistenceAdapter } from './types'

/**
 * Tauri 파일 시스템 기반 영속성 어댑터
 * 데스크톱 앱에서 사용
 *
 * 참고: 실제 사용 시 @tauri-apps/api 패키지가 필요합니다.
 * 이 어댑터는 Tauri 환경에서만 동작합니다.
 */
export const createTauriAdapter = (): PersistenceAdapter => {
  // Tauri API 동적 임포트 (데스크톱 환경에서만 사용)
  const getTauriApi = async () => {
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      // @ts-expect-error - Tauri가 런타임에 주입하는 API
      const { invoke } = window.__TAURI__.core
      return { invoke }
    }
    return null
  }

  return {
    async setItem(key: string, value: string) {
      const api = await getTauriApi()
      if (api) {
        await api.invoke('store_set_item', { key, value })
      }
    },

    async getItem(key: string) {
      const api = await getTauriApi()
      if (api) {
        return await api.invoke('store_get_item', { key })
      }
      return null
    },

    async removeItem(key: string) {
      const api = await getTauriApi()
      if (api) {
        await api.invoke('store_remove_item', { key })
      }
    },
  }
}

/**
 * Tauri 어댑터 인스턴스
 */
export const tauriAdapter = createTauriAdapter()
