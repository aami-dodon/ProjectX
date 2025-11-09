const crypto = require('crypto');

const { createValidationError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
const {
  loadFrameworkScoreData,
  loadControlHealthData,
  loadRemediationData,
  loadEvidenceData,
  persistMetricSnapshot,
} = require('../repositories/dashboards.repository');

const logger = createLogger('reports-dashboard-service');

const PASS_THRESHOLD = 0.85;
const ATTENTION_THRESHOLD = 0.6;
const DEFAULT_WINDOW_DAYS = 30;

const buildFiltersHash = (input = {}) =>
  crypto.createHash('sha1').update(JSON.stringify(input)).digest('hex');

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (date, days) => {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const safeAverage = (values = []) => {
  const filtered = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  if (!filtered.length) {
    return null;
  }
  const average = filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
  return Number(average.toFixed(4));
};

const classifyScore = (score) => {
  if (score === null || typeof score === 'undefined') return 'UNKNOWN';
  if (score >= PASS_THRESHOLD) return 'PASSING';
  if (score >= ATTENTION_THRESHOLD) return 'NEEDS_ATTENTION';
  return 'FAILING';
};

const parseWindow = ({ since, until, windowDays }) => {
  if (since || until) {
    const start = toDate(since) ?? new Date(Date.now() - (windowDays || DEFAULT_WINDOW_DAYS) * 86400000);
    const end = toDate(until) ?? new Date();
    if (start > end) {
      throw createValidationError('Invalid date window: since must be before until');
    }
    return { start, end };
  }

  const end = new Date();
  const start = new Date(end.getTime() - (windowDays || DEFAULT_WINDOW_DAYS) * 86400000);
  return { start, end };
};

const getFrameworkScoresDashboard = async (params = {}) => {
  const frameworkIds = Array.isArray(params.frameworkIds)
    ? params.frameworkIds
    : typeof params.frameworkIds === 'string' && params.frameworkIds.length
      ? params.frameworkIds.split(',').map((value) => value.trim()).filter(Boolean)
      : [];

  const domain = typeof params.domain === 'string' && params.domain.trim() ? params.domain.trim() : null;
  const granularity = ['DAILY', 'WEEKLY', 'MONTHLY'].includes(params.granularity)
    ? params.granularity
    : 'DAILY';

  const currentRange = parseWindow({ since: params.since, until: params.until, windowDays: params.windowDays });
  const previousRange = {
    start: addDays(currentRange.start, -Math.ceil((currentRange.end - currentRange.start) / 86400000)),
    end: currentRange.start,
  };

  const dataset = await loadFrameworkScoreData({
    frameworkIds,
    domain,
    granularity,
    currentRange,
    previousRange,
  });

  const currentScoreMap = new Map(dataset.currentScores.map((entry) => [entry.controlId, entry?._avg?.score ?? null]));
  const previousScoreMap = new Map(dataset.previousScores.map((entry) => [entry.controlId, entry?._avg?.score ?? null]));
  const evidenceMap = new Map(dataset.evidenceCounts.map((entry) => [entry.controlId, entry?._count?._all ?? 0]));

  const frameworkItems = dataset.frameworks.map((framework) => {
    const links = dataset.controlLinks.filter((entry) => entry.frameworkId === framework.id && entry.control);
    const controlSummaries = links.map((entry) => {
      const control = entry.control;
      const currentScore = currentScoreMap.get(control.id) ?? null;
      const previousScore = previousScoreMap.get(control.id) ?? null;
      return {
        control,
        currentScore,
        previousScore,
        evidenceCount: evidenceMap.get(control.id) ?? 0,
      };
    });

    const avgScore = safeAverage(controlSummaries.map((item) => item.currentScore));
    const previousAvg = safeAverage(controlSummaries.map((item) => item.previousScore));
    const delta =
      typeof avgScore === 'number' && typeof previousAvg === 'number'
        ? Number((avgScore - previousAvg).toFixed(4))
        : null;

    const failingControls = controlSummaries.filter((item) =>
      typeof item.currentScore === 'number' && item.currentScore < ATTENTION_THRESHOLD,
    ).length;
    const atRiskControls = controlSummaries.filter((item) =>
      typeof item.currentScore === 'number' && item.currentScore < PASS_THRESHOLD,
    ).length;
    const withEvidence = controlSummaries.filter((item) => item.evidenceCount > 0).length;

    const domainAggregation = {};
    controlSummaries.forEach((item) => {
      const key = item.control.domain || 'Unmapped';
      if (!domainAggregation[key]) {
        domainAggregation[key] = { domain: key, scores: [], failing: 0, total: 0 };
      }
      domainAggregation[key].total += 1;
      if (typeof item.currentScore === 'number') {
        domainAggregation[key].scores.push(item.currentScore);
        if (item.currentScore < ATTENTION_THRESHOLD) {
          domainAggregation[key].failing += 1;
        }
      }
    });

    const domains = Object.values(domainAggregation)
      .map((entry) => ({
        domain: entry.domain,
        avgScore: safeAverage(entry.scores),
        failing: entry.failing,
        total: entry.total,
      }))
      .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));

    return {
      framework,
      avgScore,
      trend: {
        current: avgScore,
        previous: previousAvg,
        delta,
      },
      controls: {
        total: controlSummaries.length,
        failing: failingControls,
        atRisk: atRiskControls,
        withEvidence,
      },
      domains,
    };
  });

  const summary = {
    totalFrameworks: dataset.frameworks.length,
    avgScore: safeAverage(frameworkItems.map((item) => item.avgScore)),
    failingControls: frameworkItems.reduce((sum, item) => sum + item.controls.failing, 0),
    withEvidence: frameworkItems.reduce((sum, item) => sum + item.controls.withEvidence, 0),
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    summary,
    filters: {
      frameworkIds,
      domain,
      granularity,
    },
    items: frameworkItems,
  };

  persistMetricSnapshot({
    metricType: 'FRAMEWORK',
    scope: 'global',
    filtersHash: buildFiltersHash({ frameworkIds, domain, granularity }),
    windowStart: currentRange.start,
    windowEnd: currentRange.end,
    payload,
  }).catch((error) => logger.debug('Metric snapshot skipped', { error: error.message }));

  return payload;
};

const getControlHealthDashboard = async (params = {}) => {
  const range = parseWindow({ since: params.since, until: params.until, windowDays: params.windowDays });
  const dataset = await loadControlHealthData({
    domain: params.domain,
    ownerTeam: params.ownerTeam,
    riskTier: params.riskTier,
    limit: params.limit ? Number(params.limit) : undefined,
    scoreRange: range,
  });

  const scoreMap = new Map(dataset.scoreSnapshots.map((entry) => [entry.controlId, entry?._avg?.score ?? null]));
  const taskMap = new Map();
  const now = new Date();

  dataset.taskRecords.forEach((task) => {
    if (!task.controlId) return;
    if (!taskMap.has(task.controlId)) {
      taskMap.set(task.controlId, { open: 0, overdue: 0, escalated: 0 });
    }
    const stats = taskMap.get(task.controlId);
    stats.open += 1;
    if (task.slaDueAt && task.slaDueAt < now) {
      stats.overdue += 1;
    }
    if ((task.escalationLevel ?? 0) > 0) {
      stats.escalated += 1;
    }
  });

  const matrix = {};
  const spotlight = [];

  dataset.controls.forEach((control) => {
    const score = scoreMap.get(control.id) ?? null;
    const classification = classifyScore(score);
    const tasks = taskMap.get(control.id) ?? { open: 0, overdue: 0, escalated: 0 };

    const domainKey = control.domain || 'Unmapped';
    const riskKey = control.riskTier || 'LOW';
    const ownerKey = control.ownerTeam || 'Unassigned';
    const key = `${domainKey}|${riskKey}|${ownerKey}`;

    if (!matrix[key]) {
      matrix[key] = {
        domain: domainKey,
        riskTier: riskKey,
        ownerTeam: ownerKey,
        controls: 0,
        failing: 0,
        avgScores: [],
        overdueTasks: 0,
      };
    }

    matrix[key].controls += 1;
    matrix[key].avgScores.push(score);
    matrix[key].overdueTasks += tasks.overdue;
    if (classification === 'FAILING') {
      matrix[key].failing += 1;
    }

    if (classification !== 'PASSING') {
      spotlight.push({
        id: control.id,
        title: control.title,
        ownerTeam: ownerKey,
        riskTier: riskKey,
        domain: domainKey,
        score,
        classification,
        tasks,
        updatedAt: control.updatedAt,
      });
    }
  });

  const matrixEntries = Object.values(matrix).map((entry) => ({
    domain: entry.domain,
    riskTier: entry.riskTier,
    ownerTeam: entry.ownerTeam,
    controls: entry.controls,
    failing: entry.failing,
    avgScore: safeAverage(entry.avgScores),
    overdueTasks: entry.overdueTasks,
  }));

  spotlight.sort((a, b) => {
    const classWeight = (value) => (value === 'FAILING' ? 2 : value === 'NEEDS_ATTENTION' ? 1 : 0);
    const diff = classWeight(b.classification) - classWeight(a.classification);
    if (diff !== 0) return diff;
    return (a.score ?? 0) - (b.score ?? 0);
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    totals: {
      controls: dataset.controls.length,
      failing: spotlight.filter((item) => item.classification === 'FAILING').length,
      overdueTasks: dataset.taskRecords.filter((task) => task.slaDueAt && task.slaDueAt < now).length,
    },
    matrix: matrixEntries,
    spotlight: spotlight.slice(0, 10),
  };

  persistMetricSnapshot({
    metricType: 'CONTROL_HEALTH',
    scope: 'global',
    filtersHash: buildFiltersHash(params),
    windowStart: range.start,
    windowEnd: range.end,
    payload,
  }).catch((error) => logger.debug('Control health snapshot skipped', { error: error.message }));

  return payload;
};

const getRemediationDashboard = async (params = {}) => {
  const since = toDate(params.since) ?? new Date(Date.now() - DEFAULT_WINDOW_DAYS * 86400000);
  const dataset = await loadRemediationData({ since });

  const statusCounts = dataset.statusGroups.reduce((acc, group) => {
    acc[group.status] = group?._count?._all ?? 0;
    return acc;
  }, {});

  const openTasks = dataset.openTasks.length;
  const overdueTasks = dataset.openTasks.filter((task) => task.slaDueAt && task.slaDueAt < new Date()).length;
  const escalatedTasks = dataset.openTasks.filter((task) => (task.escalationLevel ?? 0) > 0).length;

  const backlogByOwner = dataset.openTasks.reduce((acc, task) => {
    const owner = task.teamId || 'Unassigned';
    if (!acc[owner]) {
      acc[owner] = { owner, total: 0, overdue: 0 };
    }
    acc[owner].total += 1;
    if (task.slaDueAt && task.slaDueAt < new Date()) {
      acc[owner].overdue += 1;
    }
    return acc;
  }, {});

  const throughput = {};
  dataset.recentClosures.forEach((task) => {
    if (!task.resolvedAt) return;
    const key = task.resolvedAt.toISOString().slice(0, 10);
    throughput[key] = (throughput[key] || 0) + 1;
  });

  const slaStats = dataset.slaMetrics.reduce(
    (acc, metric) => {
      if (typeof metric.timeToClose === 'number' && metric.timeToClose > 0) {
        acc.samples += 1;
        acc.totalMinutes += metric.timeToClose;
      }
      if ((metric.breachCount ?? 0) > 0) {
        acc.breaches += metric.breachCount;
      }
      return acc;
    },
    { samples: 0, totalMinutes: 0, breaches: 0 },
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      openTasks,
      overdueTasks,
      escalatedTasks,
      meanTimeToCloseHours:
        slaStats.samples > 0 ? Number(((slaStats.totalMinutes / slaStats.samples) / 60).toFixed(2)) : null,
      slaBreaches: slaStats.breaches,
    },
    statusCounts,
    throughput: Object.entries(throughput)
      .map(([date, completed]) => ({ date, completed }))
      .sort((a, b) => (a.date < b.date ? -1 : 1)),
    backlogByOwner: Object.values(backlogByOwner).sort((a, b) => b.total - a.total),
  };

  persistMetricSnapshot({
    metricType: 'REMEDIATION',
    scope: 'global',
    filtersHash: buildFiltersHash({ since: since.toISOString() }),
    windowStart: since,
    windowEnd: new Date(),
    payload,
  }).catch((error) => logger.debug('Remediation snapshot skipped', { error: error.message }));

  return payload;
};

const getEvidenceDashboard = async () => {
  const dataset = await loadEvidenceData({ freshnessThreshold: DEFAULT_WINDOW_DAYS });
  const now = new Date();

  const freshnessBuckets = {
    '0-30': 0,
    '31-90': 0,
    '91+': 0,
  };

  const sources = {};
  const expiringSoon = [];

  dataset.evidence.forEach((item) => {
    const ageDays = Math.floor((now - item.updatedAt) / 86400000);
    if (ageDays <= 30) {
      freshnessBuckets['0-30'] += 1;
    } else if (ageDays <= 90) {
      freshnessBuckets['31-90'] += 1;
    } else {
      freshnessBuckets['91+'] += 1;
    }

    const sourceKey = item.source || 'MANUAL';
    sources[sourceKey] = (sources[sourceKey] || 0) + 1;

    if (item.purgeScheduledFor && item.purgeScheduledFor < addDays(now, 30)) {
      expiringSoon.push({
        id: item.id,
        displayName: item.displayName,
        purgeScheduledFor: item.purgeScheduledFor,
        retentionState: item.retentionState,
        uploader: item.uploader,
      });
    }
  });

  const coverageMap = dataset.coverageLinks.reduce((acc, entry) => {
    if (!entry.controlId) return acc;
    acc[entry.controlId] = entry?._count?._all ?? 0;
    return acc;
  }, {});

  const coveredControls = Object.keys(coverageMap).length;
  const payload = {
    generatedAt: new Date().toISOString(),
    freshness: Object.entries(freshnessBuckets).map(([bucket, count]) => ({ bucket, count })),
    coverage: {
      totalControls: dataset.controlCount,
      withEvidence: coveredControls,
      coveragePercent: dataset.controlCount > 0 ? Math.round((coveredControls / dataset.controlCount) * 100) : 0,
    },
    sources: Object.entries(sources).map(([source, count]) => ({ source, count })),
    expiring: expiringSoon.sort((a, b) => a.purgeScheduledFor - b.purgeScheduledFor).slice(0, 15),
  };

  persistMetricSnapshot({
    metricType: 'EVIDENCE',
    scope: 'global',
    filtersHash: buildFiltersHash({ type: 'evidence' }),
    payload,
  }).catch((error) => logger.debug('Evidence snapshot skipped', { error: error.message }));

  return payload;
};

module.exports = {
  getControlHealthDashboard,
  getEvidenceDashboard,
  getFrameworkScoresDashboard,
  getRemediationDashboard,
};
