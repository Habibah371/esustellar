export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskFactor {
  name: string;
  score: number;
  description: string;
}

export interface GroupRiskScore {
  groupId: string;
  overallScore: number;
  level: RiskLevel;
  factors: RiskFactor[];
  assessedAt: string;
}
