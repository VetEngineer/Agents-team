/**
 * 영속성 어댑터 인터페이스
 * localStorage, Tauri fs, Supabase 등 다양한 저장소를 추상화
 */

export interface PersistenceAdapter {
  /**
   * 데이터 저장
   */
  setItem: (key: string, value: string) => Promise<void>

  /**
   * 데이터 조회
   */
  getItem: (key: string) => Promise<string | null>

  /**
   * 데이터 삭제
   */
  removeItem: (key: string) => Promise<void>
}

export interface AsyncStorageOptions {
  /**
   * 저장소 키 이름
   */
  name: string

  /**
   * 영속성 어댑터 (기본값: localStorage)
   */
  adapter?: PersistenceAdapter

  /**
   * 저장할 상태 필터 (일부 상태만 저장)
   */
  partialize?: <T>(state: T) => Partial<T>
}
