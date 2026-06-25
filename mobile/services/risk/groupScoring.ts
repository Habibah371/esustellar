import type { Group } from '../../types/group';
import type { GroupRiskScore, RiskFactor, RiskLevel } from './riskTypes';

export function getRiskLevel(score: number): RiskLevel {
  if (score < 33) return 'low';
  if (score < 66) return 'medium';
  return 'high';
}

export function calculateGroupRiskScore(group: Group): GroupRiskScore {
  const factors: RiskFactor[] = [];

  const sizeScore = Math.min(group.memberCount * 5, 100);
  factors.push({
    name: 'Group Size',
    score: sizeScore,
    description: `Based on ${group.memberCount} members; larger groups have higher risk`,
  });

  const varianceScore = group.maxMembers
    ? Math.min(Math.abs(group.maxMembers - group.memberCount) * 2, 100)
    : 0;
  factors.push({
    name: 'Member Count Variance',
    score: varianceScore,
    description: `Variance between current (${group.memberCount}) and max (${group.maxMembers ?? 'unset'}) members`,
  });

  const consistencyScore = group.contributionAmount > 0 ? Math.min(100 - group.contributionAmount, 100) : 50;
  factors.push({
    name: 'Contribution Consistency',
    score: consistencyScore,
    description: `Based on contribution amount of ${group.contributionAmount}`,
  });

  const groupAgeScore = 0;
  factors.push({
    name: 'Group Age',
    score: groupAgeScore,
    description: 'Newer groups assessed with default age factor',
  });

  const overallScore = Math.round(
    factors.reduce((sum, f) => sum + f.score, 0) / factors.length,
  );

  return {
    groupId: group.id,
    overallScore,
    level: getRiskLevel(overallScore),
    factors,
    assessedAt: new Date().toISOString(),
  };
}
