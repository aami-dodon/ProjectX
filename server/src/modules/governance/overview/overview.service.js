const { createLogger } = require('@/utils/logger');
const { getCheckAggregates } = require('../repositories/checks.repository');
const {
  fetchControlSnapshots,
  fetchEvidenceControlLinks,
  fetchFrameworkCoverage,
  fetchRecentRuns,
  fetchReviewQueueSnapshot,
  fetchScoreTrend,
  groupControlsByRiskTier,
  groupControlsByStatus,
} = require('./overview.repository');

const logger = createLogger('governance-overview-service');

const LOOKBACK_DAYS = 30;
const RISK_WEIGHTS = { HIGH: 3, MEDIUM: 2, LOW: 1 };
const CLASSIFICATION_WEIGHTS = { FAILING: 3, NEEDS_ATTENTION: 2, PASSING: 1 };

const reduceGroups = (groups = [], field) =>
  groups.reduce((acc, group) => {
    if (!group || !group[field]) {
      return acc;
    }
    const key = group[field];
    const value = group?._count?._all ?? 0;
    acc[key] = value;
    return acc;
  }, {});

const classifyScore = (score) => {
  if (score === null || typeof score === 'undefined') {
    return null;
  }
  if (score >= 0.85) return 'PASSING';
  if (score >= 0.6) return 'NEEDS_ATTENTION';
  return 'FAILING';
};

const formatTrend = (buckets = []) => {
  const labels = [];
  const values = [];

  buckets.forEach((bucket) => {
    if (!bucket?.windowStart) {
      return;
    }
    labels.push(bucket.windowStart.toISOString());
    values.push(Number((bucket?._avg?.score ?? 0).toFixed(4)));
  });

  return { labels, values };
};

const buildSpotlight = (controls = []) =>
  controls
    .map((control) => {
      const [latest, previous] = control.scores ?? [];
      const latestScore = latest?.score ?? null;
      return {
        id: control.id,
        slug: control.slug,
        title: control.title,
        riskTier: control.riskTier,
        status: control.status,
        ownerTeam: control.ownerTeam ?? null,
        frameworks: (control.frameworkLinks ?? [])
          .map((link) => ({
            id: link.framework?.id ?? link.frameworkId ?? null,
            title: link.framework?.title ?? null,
            slug: link.framework?.slug ?? null,
            coverageLevel: link.coverageLevel ?? null,
          }))
          .filter((framework) => framework.id),
        score: latestScore,
        classification: latest?.classification ?? classifyScore(latestScore),
        delta:
          latest && previous
            ? Number(((latest.score ?? 0) - (previous.score ?? 0)).toFixed(4))
            : null,
        updatedAt: control.updatedAt,
      };
    })
    .filter((entry) =>
      ['FAILING', 'NEEDS_ATTENTION'].includes(entry.classification),
    )
    .sort((a, b) => {
      const classificationDelta =
        (CLASSIFICATION_WEIGHTS[b.classification] ?? 0) -
        (CLASSIFICATION_WEIGHTS[a.classification] ?? 0);
      if (classificationDelta !== 0) {
        return classificationDelta;
      }
      const riskDelta =
        (RISK_WEIGHTS[b.riskTier] ?? 0) - (RISK_WEIGHTS[a.riskTier] ?? 0);
      if (riskDelta !== 0) {
        return riskDelta;
      }
      return (b.score ?? 0) - (a.score ?? 0);
    })
    .slice(0, 5);

const formatFrameworkCoverage = ({
  totalFrameworks,
  coverageGroups,
  frameworks,
}) => {
  const coverageMap = coverageGroups.reduce((acc, group) => {
    if (!group.frameworkId) {
      return acc;
    }
    acc[group.frameworkId] = group?._count?._all ?? 0;
    return acc;
  }, {});

  const frameworksWithCoverage = Object.keys(coverageMap).length;
  const coveragePercent =
    totalFrameworks > 0
      ? Math.round((frameworksWithCoverage / totalFrameworks) * 100)
      : 0;

  const topFrameworks = frameworks
    .map((framework) => ({
      id: framework.id,
      slug: framework.slug,
      title: framework.title,
      status: framework.status,
      coverage: coverageMap[framework.id] ?? 0,
    }))
    .sort((a, b) => b.coverage - a.coverage)
    .slice(0, 5);

  return {
    total: totalFrameworks,
    withCoverage: frameworksWithCoverage,
    coveragePercent,
    items: topFrameworks,
  };
};

const formatReviewQueue = ({ stateGroups, overdueCount, urgentItems }) => ({
  byState: reduceGroups(stateGroups, 'state'),
  overdue: overdueCount,
  urgent: urgentItems.map((item) => ({
    id: item.id,
    priority: item.priority,
    state: item.state,
    dueAt: item.dueAt,
    check: item.check
      ? {
          id: item.check.id,
          name: item.check.name,
          severity: item.check.severityDefault,
          type: item.check.type,
        }
      : null,
    result: item.result
      ? {
          id: item.result.id,
          status: item.result.status,
          severity: item.result.severity,
          executedAt: item.result.executedAt,
        }
      : null,
  })),
});

const formatRecentRuns = (runs = []) =>
  runs.map((run) => ({
    id: run.id,
    status: run.status,
    severity: run.severity,
    executedAt: run.executedAt,
    publicationState: run.publicationState,
    check: run.check
      ? {
          id: run.check.id,
          name: run.check.name,
        }
      : null,
    control: run.control
      ? {
          id: run.control.id,
          title: run.control.title,
          slug: run.control.slug,
        }
      : null,
  }));

const formatEvidenceMatrix = (links = []) =>
  links.map((link) => ({
    id: link.id,
    linkedAt: link.linkedAt,
    role: link.role ?? null,
    control: link.control
      ? {
          id: link.control.id,
          title: link.control.title,
          slug: link.control.slug,
          riskTier: link.control.riskTier,
        }
      : null,
    check: link.check
      ? {
          id: link.check.id,
          name: link.check.name,
        }
      : null,
    evidence: link.evidence
      ? {
          id: link.evidence.id,
          name: link.evidence.displayName,
          source: link.evidence.source,
          retentionState: link.evidence.retentionState,
          mimeType: link.evidence.mimeType,
          size: link.evidence.size,
        }
      : null,
  }));

const getGovernanceOverview = async () => {
  const lookbackStart = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const [
    controlsByStatus,
    controlsByRisk,
    controlSnapshots,
    trendBuckets,
    frameworkCoverage,
    reviewQueueSnapshot,
    recentRuns,
    evidenceLinks,
    checkAggregates,
  ] = await Promise.all([
    groupControlsByStatus(),
    groupControlsByRiskTier(),
    fetchControlSnapshots(),
    fetchScoreTrend({ since: lookbackStart }),
    fetchFrameworkCoverage(),
    fetchReviewQueueSnapshot(),
    fetchRecentRuns(),
    fetchEvidenceControlLinks(),
    getCheckAggregates(),
  ]);

  const trend = formatTrend(trendBuckets);
  const postureScore = trend.values.at(-1) ?? null;
  const previousScore = trend.values.length > 1 ? trend.values.at(-2) : null;
  const postureSummary = {
    postureScore,
    postureClassification: classifyScore(postureScore),
    postureChange:
      postureScore !== null && previousScore !== null
        ? Number((postureScore - previousScore).toFixed(4))
        : null,
  };

  const controlStatusCounts = reduceGroups(controlsByStatus, 'status');
  const controlRiskCounts = reduceGroups(controlsByRisk, 'riskTier');
  const controlSpotlight = buildSpotlight(controlSnapshots);

  const controlTotals = Object.values(controlStatusCounts).reduce(
    (sum, value) => sum + value,
    0,
  );
  const reviewQueue = formatReviewQueue(reviewQueueSnapshot);
  const frameworks = formatFrameworkCoverage(frameworkCoverage);
  const checks = {
    byStatus: reduceGroups(checkAggregates.status ?? [], 'status'),
    byType: reduceGroups(checkAggregates.type ?? [], 'type'),
    bySeverity: reduceGroups(
      checkAggregates.severity ?? [],
      'severityDefault',
    ),
  };

  logger.debug('Governance overview assembled', {
    postureClassification: postureSummary.postureClassification,
    totalControls: controlTotals,
    failingControls: controlSpotlight.length,
  });

  return {
    summary: {
      ...postureSummary,
      totalControls: controlTotals,
      activeControls: controlStatusCounts.ACTIVE ?? 0,
      failingControls: controlSpotlight.length,
      openReviewTasks:
        (reviewQueue.byState.OPEN ?? 0) + (reviewQueue.byState.IN_PROGRESS ?? 0),
      frameworksWithCoverage: frameworks.withCoverage,
    },
    controls: {
      byStatus: controlStatusCounts,
      byRiskTier: controlRiskCounts,
      spotlight: controlSpotlight,
    },
    trend,
    frameworks,
    reviewQueue,
    runs: formatRecentRuns(recentRuns),
    evidence: formatEvidenceMatrix(evidenceLinks),
    checks,
  };
};

module.exports = {
  getGovernanceOverview,
};
