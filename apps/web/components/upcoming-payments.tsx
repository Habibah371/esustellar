'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'
import { useUpcomingPayments } from '@/hooks/useUpcomingPayments'
import { useState } from 'react'
import type { PaymentInfo } from '@/lib/paymentDeadlines'
import { useWallet } from '@/hooks/use-wallet'

function formatDeadline(deadlineTs: number): string {
  return new Date(deadlineTs * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function urgencyBorder(urgency: PaymentInfo['urgency']): string {
  if (urgency === 'critical') return 'border-error/50 bg-error/5'
  if (urgency === 'urgent') return 'border-warning/50 bg-warning/5'
  return 'border-border'
}

function PaymentCard({
  payment,
  isPaying,
  error,
  onPay,
}: {
  payment: PaymentInfo
  isPaying: boolean
  error: string | null
  onPay: () => void
}) {
  return (
    <div className={`rounded-lg border p-4 ${urgencyBorder(payment.urgency)}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-foreground text-sm">{payment.groupName}</h4>
        {(payment.urgency === 'critical' || payment.urgency === 'urgent') && (
          <AlertTriangle
            className={`h-4 w-4 ${payment.urgency === 'critical' ? 'text-error' : 'text-warning'}`}
          />
        )}
      </div>

      <p className="text-lg font-bold text-foreground">{payment.amountXLM} XLM</p>

      {payment.inGracePeriod ? (
        <p className="text-xs font-semibold text-error mt-1">
          OVERDUE — {payment.graceDaysRemaining} day{payment.graceDaysRemaining !== 1 ? 's' : ''}{' '}
          grace remaining
        </p>
      ) : (
        <p className="text-xs text-muted-foreground mt-1">
          Due {formatDeadline(payment.deadline)} •{' '}
          {payment.daysRemaining} day{payment.daysRemaining !== 1 ? 's' : ''} left
        </p>
      )}

      <Button
        size="sm"
        className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary-dark"
        disabled={isPaying}
        onClick={onPay}
      >
        {isPaying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          'Pay Now'
        )}
      </Button>

      {error && <p className="text-xs text-error mt-2">{error}</p>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border p-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-2/3 mb-3" />
      <div className="h-6 bg-muted rounded w-1/3 mb-2" />
      <div className="h-3 bg-muted rounded w-1/2 mb-3" />
      <div className="h-8 bg-muted rounded w-full" />
    </div>
  )
}

export function UpcomingPayments() {
  const { payments, loading, error, payingGroupId, payNow, refetch } = useUpcomingPayments()
  const { isConnected } = useWallet()
  const [payErrors, setPayErrors] = useState<Record<string, string>>({})

  const handlePay = async (payment: PaymentInfo) => {
    setPayErrors((current) => {
      const next = { ...current }
      delete next[payment.groupId]
      return next
    })

    try {
      await payNow(payment.groupId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setPayErrors((current) => ({ ...current, [payment.groupId]: message }))
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-warning" />
          Upcoming Payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Connect your wallet to view upcoming payments.</p>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-error mb-3">{error}</p>
            <Button size="sm" variant="outline" onClick={refetch}>
              Retry
            </Button>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="mx-auto h-8 w-8 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming payments due</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <PaymentCard
                key={payment.groupId}
                payment={payment}
                isPaying={payingGroupId === payment.groupId}
                error={payErrors[payment.groupId] ?? null}
                onPay={() => handlePay(payment)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
