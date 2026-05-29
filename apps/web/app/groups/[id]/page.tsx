'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { GroupHeader } from '@/components/group-header'
import { GroupMembers } from '@/components/group-members'
import { GroupTransactions } from '@/components/group-transactions'
import { GroupPayoutSchedule } from '@/components/group-payout-schedule'
import { useSavingsContract, type Group } from '@/context/savingsContract'

interface DisplayGroup {
  groupId: string
  name: string
  description: string
  contributionAmount: number
  frequency: string
  totalMembers: number
  currentMembers: number
  currentRound: number
  status: string
  totalPool: number
  nextPayoutDate: string
  nextPayoutRecipient: string
  isMember: boolean
  hasPaidThisRound: boolean
  myPosition: number
}

function toDisplayGroup(g: Group): DisplayGroup {
  return {
    groupId: g.groupId,
    name: g.name,
    description: '',
    contributionAmount: Number(g.contributionAmount) / 10_000_000,
    frequency: g.frequency,
    totalMembers: g.totalMembers,
    currentMembers: g.totalMembers,
    currentRound: g.currentRound,
    status: g.status,
    totalPool: 0,
    nextPayoutDate: '',
    nextPayoutRecipient: '',
    isMember: false,
    hasPaidThisRound: false,
    myPosition: 0,
  }
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { getGroupById } = useSavingsContract()
  const [group, setGroup] = useState<DisplayGroup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchGroup = useCallback(async () => {
    const g = await getGroupById(id)
    setGroup(toDisplayGroup(g))
  }, [getGroupById, id])

  const refreshGroup = useCallback(() => {
    void fetchGroup().catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to refresh group.')
    })
  }, [fetchGroup])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const g = await getGroupById(id)
        if (cancelled) return
        setGroup(toDisplayGroup(g))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load group.')
      } finally {
        console.log('fetching group id:', id)
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, getGroupById])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background py-8 md:py-12">
        <div className="container mx-auto px-4">
          {loading && (
            <div className="text-muted-foreground py-12 text-center">Loading group…</div>
          )}
          {!loading && error && (
            <div className="text-destructive py-12 text-center">
              Could not load group: {error}
            </div>
          )}
          {!loading && !error && group && (
            <>
              <GroupHeader groupId={id} group={group} onActionSuccess={refreshGroup} />
              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <GroupMembers groupId={id} />
                  <GroupTransactions groupId={id} />
                </div>
                <div>
                  <GroupPayoutSchedule group={group} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
