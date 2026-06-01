export type ExperimentalFeature = {
  key: string
  title: string
  description: string
  status: "planned" | "prototype"
}

export const EXPERIMENTAL_FEATURES: ExperimentalFeature[] = [
  {
    key: "cross-chain",
    title: "Cross-chain support",
    description: "Roadmap placeholder for future wallet/network expansion.",
    status: "planned",
  },
  {
    key: "governance",
    title: "Community governance voting",
    description: "Roadmap placeholder for group decision making and proposals.",
    status: "prototype",
  },
]
