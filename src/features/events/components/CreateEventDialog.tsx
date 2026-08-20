import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusIcon } from 'lucide-react'

import { useCreateEvent } from '@/hooks/useEvents'
import { datetimeLocalToKstIso } from '@/lib/dateUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const formSchema = z.object({
  name: z.string().min(1, '이벤트 제목을 입력하세요'),
  totalStock: z.coerce.number().int().positive('1 이상이어야 합니다'),
  startAt: z.string().min(1, '시작 일시를 선택하세요'),
})

type FormInput = z.input<typeof formSchema>
type FormValues = z.output<typeof formSchema>

export function CreateEventDialog() {
  const [open, setOpen] = useState(false)
  const createEvent = useCreateEvent()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      totalStock: 10000,
      startAt: '',
    },
  })

  const onSubmit = (values: FormValues) => {
    createEvent.mutate(
      {
        name: values.name,
        totalStock: values.totalStock,
        startAt: datetimeLocalToKstIso(values.startAt),
      },
      {
        onSuccess: () => {
          setOpen(false)
          reset()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon /> 새 이벤트 생성
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 이벤트 생성</DialogTitle>
          <DialogDescription>선착순 쿠폰 발급 이벤트를 새로 엽니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">이벤트 제목</Label>
            <Input id="name" placeholder="예: 9월 1주차 선착순 쿠폰" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="totalStock">쿠폰 재고</Label>
            <Input id="totalStock" type="number" min={1} {...register('totalStock')} />
            {errors.totalStock && (
              <p className="text-xs text-destructive">{errors.totalStock.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startAt">시작 일시 (KST)</Label>
            <Input id="startAt" type="datetime-local" {...register('startAt')} />
            {errors.startAt && (
              <p className="text-xs text-destructive">{errors.startAt.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={createEvent.isPending}>
              {createEvent.isPending ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
