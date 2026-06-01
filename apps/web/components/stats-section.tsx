 "use client"

import { useEffect, useState } from "react"
import { useRegistryContract } from "@/context/registryContract"
import { useSavingsContract } from "@/context/savingsContract"
import { formatXLM } from "@/lib/format"

type Stats = {
  groups: number
  members: number
  saved: number
  payouts: number
}

const DEFAULT_STATS: Stats = {
  groups: 0,
  members: 0,
  saved: 0,
  payouts: 0,
}

export function StatsSection() {
  const registry = useRegistryContract()
  const savings = useSavingsContract()
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS)

  useEffect(() => {
    let active = true

    const loadStats = async () => {
      try {
        const groupIds = await savings.getAllGroups()
        const groups = await Promise.all(groupIds.map((groupId) => savings.getGroupById(groupId)))
        const members = await Promise.all(groupIds.map((groupId) => savings.getMembersByGroup(groupId)))
        const userGroups = registry.isReady ? await registry.getAllGroups() : []

        if (!active) return

        const totalSaved = groups.reduce(
          (sum, group) => sum + Number(group.contributionAmount) * Number(group.totalMembers),
          0,
        )

        setStats({
          groups: userGroups.length > 0 ? userGroups.length : groupIds.length,
          members: members.reduce((sum, groupMembers) => sum + groupMembers.length, 0),
          saved: totalSaved,
          payouts: groupIds.length,
        })
      } catch {
        if (!active) return
        setStats(DEFAULT_STATS)
      }
    }

    void loadStats()

    return () => {
      active = false
    }
  }, [registry, savings])

  const statsToShow = [
    { value: `${stats.groups}+`, label: "Savings Groups" },
    { value: `${stats.members}+`, label: "Active Members" },
    { value: formatXLM(stats.saved), label: "Total Saved" },
    { value: `${stats.payouts > 0 ? "100" : "0"}%`, label: "Payout Success" },
  ]

  return (
    <section className="border-b border-border bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {statsToShow.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
