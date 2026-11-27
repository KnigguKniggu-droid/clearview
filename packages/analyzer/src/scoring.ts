import type { AuditFinding } from './types';

export function calculateScores(findings: AuditFinding[]): {trustScore:number;accessibilityScore:number;overallScore:number} {
  const penalty={critical:18,warning:8,info:3};
  const score=(accessibility:boolean)=>Math.max(0,100-findings.filter(finding=>(finding.category==='accessibility')===accessibility).reduce((sum,finding)=>sum+penalty[finding.severity],0));
  const trustScore=score(false),accessibilityScore=score(true);
  return {trustScore,accessibilityScore,overallScore:Math.round((trustScore+accessibilityScore)/2)};
}
