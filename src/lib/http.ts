import axios from 'axios'

import type { ApiEnvelope } from '@/types/domain'

/**
 * 백엔드 ErrorCode를 그대로 실어 나르는 에러.
 * 화면에서 code로 분기해야 하는 경우가 있다 (예: LOAD_TEST_TARGET_NOT_UNIQUE).
 */
export class ApiError extends Error {
  code: string
  httpStatus?: number

  constructor(code: string, message: string, httpStatus?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15_000,
})

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return typeof value === 'object' && value !== null && 'success' in value
}

/**
 * 모든 응답이 { success, data, error, traceId, timestamp } 봉투로 오므로
 * 여기서 한 번만 벗겨서, 각 API 함수가 알맹이만 다루게 한다.
 */
http.interceptors.response.use(
  (response) => {
    if (isEnvelope(response.data)) {
      const envelope = response.data
      if (!envelope.success) {
        throw new ApiError(
          envelope.error?.code ?? 'UNKNOWN',
          envelope.error?.message ?? '알 수 없는 오류가 발생했습니다.',
          response.status,
        )
      }
      response.data = envelope.data
    }
    return response
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const body = error.response?.data
      if (isEnvelope(body) && body.error) {
        return Promise.reject(
          new ApiError(body.error.code, body.error.message, error.response?.status),
        )
      }
      return Promise.reject(
        new ApiError(
          'NETWORK_ERROR',
          '서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.',
          error.response?.status,
        ),
      )
    }
    return Promise.reject(error)
  },
)

/** 화면에 그대로 띄울 수 있는 메시지로 변환 */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}
