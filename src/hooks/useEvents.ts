import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminApi } from '@/api/adminApi'
import type { CreateEventInput } from '@/types/domain'

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: adminApi.listEvents,
  })
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId],
    queryFn: () => adminApi.getEvent(eventId),
    enabled: Boolean(eventId),
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEventInput) => adminApi.createEvent(input),
    onSuccess: (event) => {
      toast.success(`이벤트 "${event.name}"를 생성했습니다.`)
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: () => {
      toast.error('이벤트 생성에 실패했습니다.')
    },
  })
}
