const { createLogger } = require('@/utils/logger');
const { createNotFoundError } = require('@/utils/errors');
const {
  CONTROL_SCORE_QUERY_SCHEMA,
} = require('./control.schemas');
const {
  getControlScoringContext,
  listCheckResultsForControl,
  listControlCheckLinks,
  listControlScores,
  upsertControlScores,
} = require('./repositories/control.repository');

const logger = createLogger('governance-control-scoring-service');

const SCORE_VALUE = {
  PASS: 1,
  WARNING: 0.5,
  FAIL: 0,
  ERROR: 0,
};

const ENFORCEMENT_MULTIPLIER = {
  MANDATORY: 1.5,
  RECOMMENDED: 1,
  OPTIONAL: 0.5,
};

const RISK_ADJUSTMENT = {
  HIGH: 1.5,
  MEDIUM: 1,
  LOW: 0.75,
};

const GRANULARITY_WINDOWS = {
  DAILY: { days: 1 },
  WEEKLY: { days: 7 },
  MONTHLY: { days: 30 },
};

const snapToWindowStart = (date, granularity) => {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  if (granularity === 'WEEKLY') {
    const day = utcDate.getUTCDay();
    const diff = (day + 6) % 7; // convert Sunday=0 to Monday=0 baseline
    utcDate.setUTCDate(utcDate.getUTCDate() - diff);
  } else if (granularity === 'MONTHLY') {
    utcDate.setUTCDate(1);
  }

  return utcDate;
};

const advanceWindow = (start, granularity) => {
  const end = new Date(start.getTime());
  switch (granularity) {
    case 'WEEKLY':
      end.setUTCDate(end.getUTCDate() + 7);
      break;
    case 'MONTHLY':
      end.setUTCMonth(end.getUTCMonth() + 1);
      break;
    default:
      end.setUTCDate(end.getUTCDate() + 1);
  }
  return end;
};

const classifyScore = (score) => {
  if (score >= 0.85) {
    return 'PASSING';
  }
  if (score >= 0.6) {
    return 'NEEDS_ATTENTION';
  }
  return 'FAILING';
};

const formatScoreHistory = (snapshots = []) =>
  snapshots
    .slice()
    .sort((a, b) => a.windowStart - b.windowStart)
    .map((entry) => ({
      id: entry.id,
      granularity: entry.granularity,
      windowStart: entry.windowStart,
      windowEnd: entry.windowEnd,
      score: entry.score,
      classification: entry.classification,
      sampleSize: entry.sampleSize ?? 0,
    }));

const formatResponse = (snapshots, context, granularity) => {
  const history = formatScoreHistory(snapshots);
  const averageScore = history.length
    ? Number(
        (
          history.reduce((sum, entry) => sum + (entry.score ?? 0), 0) /
          history.length
        ).toFixed(4),
      )
    : null;

  return {
    controlId: context.id,
    slug: context.slug,
    granularity,
    data: history,
    summary: {
      averageScore,
      latestClassification: history.at(-1)?.classification ?? null,
      sampleSize: history.reduce((sum, entry) => sum + (entry.sampleSize ?? 0), 0),
    },
  };
};

const aggregateResults = ({
  results = [],
  checkLinks = [],
  granularity,
  riskTier,
}) => {
  const weightMap = new Map(
    checkLinks.map((link) => [
      link.checkId,
      (link.weight ?? 1) * (ENFORCEMENT_MULTIPLIER[link.enforcementLevel] ?? 1),
    ]),
  );

  const buckets = new Map();

  results.forEach((result) => {
    const baseScore = SCORE_VALUE[result.status] ?? 0;
    const weight = weightMap.get(result.checkId) ?? 1;
    if (weight <= 0) {
      return;
    }

    const bucketStart = snapToWindowStart(result.executedAt, granularity);
    const bucketKey = bucketStart.toISOString();
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        windowStart: bucketStart,
        windowEnd: advanceWindow(bucketStart, granularity),
        numerator: 0,
        denominator: 0,
        sampleSize: 0,
      });
    }

    const bucket = buckets.get(bucketKey);
    bucket.numerator += baseScore * weight;
    bucket.denominator += weight;
    bucket.sampleSize += 1;
  });

  const riskAdjustment = RISK_ADJUSTMENT[riskTier] ?? 1;

  buckets.forEach((bucket) => {
    const baseAverage = bucket.denominator > 0 ? bucket.numerator / bucket.denominator : 0;
    const adjusted = baseAverage / (riskAdjustment || 1);
    const bounded = Math.max(0, Math.min(1, adjusted));
    bucket.score = Number(bounded.toFixed(4));
    bucket.classification = classifyScore(bucket.score);
  });

  return buckets;
};

const getControlScoreHistory = async ({ controlId, query = {} } = {}) => {
  const context = await getControlScoringContext(controlId);
  if (!context) {
    throw createNotFoundError('Control not found', { controlId });
  }

  const parsed = CONTROL_SCORE_QUERY_SCHEMA.parse(query ?? {});
  const existingSnapshots = await listControlScores({
    controlId,
    granularity: parsed.granularity,
    limit: parsed.limit,
  });

  if (existingSnapshots.length >= parsed.limit) {
    return formatResponse(existingSnapshots, context, parsed.granularity);
  }

  const checkLinks = await listControlCheckLinks(controlId);
  if (checkLinks.length === 0) {
    return formatResponse(existingSnapshots, context, parsed.granularity);
  }

  const windowConfig = GRANULARITY_WINDOWS[parsed.granularity] ?? GRANULARITY_WINDOWS.DAILY;
  const lookbackDays = windowConfig.days * parsed.limit;
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  const results = await listCheckResultsForControl({
    controlId,
    checkIds: checkLinks.map((link) => link.checkId),
    since,
  });

  if (results.length === 0) {
    return formatResponse(existingSnapshots, context, parsed.granularity);
  }

  const buckets = aggregateResults({
    results,
    checkLinks,
    granularity: parsed.granularity,
    riskTier: context.riskTier,
  });

  const snapshots = Array.from(buckets.values())
    .sort((a, b) => a.windowStart - b.windowStart)
    .slice(-parsed.limit)
    .map((bucket) => ({
      controlId,
      granularity: parsed.granularity,
      windowStart: bucket.windowStart,
      windowEnd: bucket.windowEnd,
      score: bucket.score,
      classification: bucket.classification,
      sampleSize: bucket.sampleSize,
      numerator: bucket.numerator,
      denominator: bucket.denominator,
      metadata: {
        source: 'check_results',
      },
    }));

  if (snapshots.length > 0) {
    await upsertControlScores(snapshots);
    logger.debug('Control scores recalculated', {
      controlId,
      granularity: parsed.granularity,
      windows: snapshots.length,
    });
  }

  const refreshed = await listControlScores({
    controlId,
    granularity: parsed.granularity,
    limit: parsed.limit,
  });

  return formatResponse(refreshed, context, parsed.granularity);
};

module.exports = {
  getControlScoreHistory,
};
