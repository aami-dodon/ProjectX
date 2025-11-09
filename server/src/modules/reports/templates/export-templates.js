const buildFrameworkRows = (payload) =>
  (payload?.items ?? []).map((item) => ({
    framework: item.framework?.title ?? 'Unknown',
    slug: item.framework?.slug ?? null,
    averageScore: item.avgScore ?? null,
    failingControls: item.controls?.failing ?? 0,
    atRiskControls: item.controls?.atRisk ?? 0,
    controlsWithEvidence: item.controls?.withEvidence ?? 0,
    trendDelta: item.trend?.delta ?? null,
  }));

const buildControlRows = (payload) =>
  (payload?.spotlight ?? []).map((entry) => ({
    control: entry.title,
    ownerTeam: entry.ownerTeam,
    domain: entry.domain,
    riskTier: entry.riskTier,
    score: entry.score,
    classification: entry.classification,
    openTasks: entry.tasks?.open ?? 0,
    overdueTasks: entry.tasks?.overdue ?? 0,
    escalatedTasks: entry.tasks?.escalated ?? 0,
  }));

const buildRemediationRows = (payload) =>
  (payload?.backlogByOwner ?? []).map((owner) => ({
    owner: owner.owner,
    backlog: owner.total,
    overdue: owner.overdue,
  }));

const buildEvidenceRows = (payload) =>
  (payload?.expiring ?? []).map((entry) => ({
    evidenceId: entry.id,
    displayName: entry.displayName,
    retentionState: entry.retentionState,
    purgeScheduledFor: entry.purgeScheduledFor,
    uploader: entry.uploader?.fullName ?? entry.uploader?.email ?? null,
  }));

const buildRowsForExport = (exportType, payload) => {
  switch (exportType) {
    case 'FRAMEWORK_ATTESTATION':
      return buildFrameworkRows(payload);
    case 'CONTROL_BREAKDOWN':
      return buildControlRows(payload);
    case 'REMEDIATION_DIGEST':
      return buildRemediationRows(payload);
    case 'EVIDENCE_OVERVIEW':
      return buildEvidenceRows(payload);
    default:
      return Array.isArray(payload) ? payload : [payload];
  }
};

module.exports = {
  buildRowsForExport,
};
