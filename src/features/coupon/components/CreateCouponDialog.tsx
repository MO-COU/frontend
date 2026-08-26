import { useState } from 'react'
import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateCoupon } from '@/hooks/useCoupons'
import { toLocalDateTimeString } from '@/lib/dateUtils'

export function CreateCouponDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [openAt, setOpenAt] = useState('')
  const [closeAt, setCloseAt] = useState('')
  const [totalQuantity, setTotalQuantity] = useState(10000)
  const createCoupon = useCreateCoupon()

  const canSubmit = openAt !== '' && totalQuantity > 0

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    createCoupon.mutate(
      {
        totalQuantity,
        openAt: toLocalDateTimeString(openAt),
        closeAt: closeAt === '' ? undefined : toLocalDateTimeString(closeAt),
        name: name.trim() === '' ? undefined : name.trim(),
      },
      {
        onSuccess: () => {
          setOpen(false)
          setName('')
          setOpenAt('')
          setCloseAt('')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon /> 쿠폰 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>쿠폰 추가</DialogTitle>
          <DialogDescription>
            부하 테스트용 회차를 새로 만듭니다. 이름과 종료 일시는 비워두면 서버가 정하고,
            만들어지는 즉시 발급이 가능합니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">쿠폰 이름 (선택)</Label>
            <Input
              id="name"
              placeholder="비우면 아메리카노 무료 쿠폰 {N}회차"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="openAt">오픈 일시</Label>
            <Input
              id="openAt"
              type="datetime-local"
              value={openAt}
              onChange={(e) => setOpenAt(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="closeAt">종료 일시 (선택)</Label>
            <Input
              id="closeAt"
              type="datetime-local"
              value={closeAt}
              onChange={(e) => setCloseAt(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="totalQuantity">총 수량</Label>
            <Input
              id="totalQuantity"
              type="number"
              min={1}
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(Number(e.target.value))}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!canSubmit || createCoupon.isPending}>
              {createCoupon.isPending ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
