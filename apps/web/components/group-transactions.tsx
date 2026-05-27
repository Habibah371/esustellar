"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useSavingsContract } from "@/context/savingsContract"

interface GroupTransactionsProps {
  groupId: string
}

interface DisplayTransaction {
  type: "contribution" | "payout"
  address: string
  amount: number
  timestamp: string
  round: number
  rawTimestamp: bigint
}

function shortAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

function formatTxTimestamp(ts: bigint): string {
  const seconds = Number(ts)
  if (!Number.isFinite(seconds) || seconds <= 0) return "Unknown"
  const date = new Date(seconds * 1000)
  if (Number.isNaN(date.getTime())) return "Unknown"
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function GroupTransactions({ groupId }: GroupTransactionsProps) {
  const { getGroupById, getRoundContributionsByGroup, getRoundPayoutsByGroup, isReady } = useSavingsContract()
  const canFetch = Boolean(groupId) && isReady
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([])
  const [loading, setLoading] = useState(canFetch)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canFetch) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      try {
        // Fetch group details first to know the current round
        const group = await getGroupById(groupId)
        if (cancelled) return

        const currentRound = group.currentRound

        if (currentRound <= 0) {
          setTransactions([])
          setError(null)
          return
        }

        // Prepare parallel round fetching
        const roundPromises = []
        for (let r = 1; r <= currentRound; r++) {
          roundPromises.push(
            Promise.all([
              getRoundContributionsByGroup(groupId, r),
              getRoundPayoutsByGroup(groupId, r)
            ])
          )
        }

        const roundResults = await Promise.all(roundPromises)
        if (cancelled) return

        const allTx: DisplayTransaction[] = []

        // Process fetched contributions and payouts
        roundResults.forEach(([contributions, payouts]) => {
          contributions.forEach((c) => {
            allTx.push({
              type: "contribution",
              address: c.member,
              amount: Number(c.amount) / 10_000_000,
              timestamp: formatTxTimestamp(c.timestamp),
              round: c.round,
              rawTimestamp: c.timestamp,
            })
          })

          payouts.forEach((p) => {
            allTx.push({
              type: "payout",
              address: p.recipient,
              amount: Number(p.amount) / 10_000_000,
              timestamp: formatTxTimestamp(p.timestamp),
              round: p.round,
              rawTimestamp: p.timestamp,
            })
          })
        })

        // Sort by timestamp descending
        allTx.sort((a, b) => {
          if (b.rawTimestamp > a.rawTimestamp) return 1
          if (b.rawTimestamp < a.rawTimestamp) return -1
          return 0
        })

        setTransactions(allTx)
        setError(null)
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load transactions")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [canFetch, groupId, getGroupById, getRoundContributionsByGroup, getRoundPayoutsByGroup])

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-error">{error}</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      tx.type === "payout" ? "bg-primary/10" : "bg-warning/10"
                    }`}
                  >
                    {tx.type === "payout" ? (
                      <ArrowDownLeft className="h-5 w-5 text-primary" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {tx.type === "payout"
                        ? `Payout to ${shortAddress(tx.address)}`
                        : `Contribution from ${shortAddress(tx.address)}`}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{tx.timestamp}</span>
                      <span>•</span>
                      <span className="text-stellar font-medium font-mono text-[11px]">Round {tx.round}</span>
                    </div>
                  </div>
                </div>
                <span className={`font-semibold ${tx.type === "payout" ? "text-primary" : "text-foreground"}`}>
                  {tx.type === "payout" ? "+" : ""}
                  {tx.amount} XLM
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
