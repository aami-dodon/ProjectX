const { EvidenceRetentionState } = require('@prisma/client');

const clampDate = (value) => {
  if (!value) {
    return null;
  }

  return new Date(value);
};

const addMonths = (inputDate, months = 0) => {
  if (!inputDate || !Number.isFinite(months)) {
    return null;
  }

  const date = new Date(inputDate);
  const targetMonth = date.getMonth() + months;
  const year = date.getFullYear();

  date.setMonth(targetMonth);
  date.setFullYear(year + Math.floor(targetMonth / 12));
  return date;
};

const calculateRetentionTimeline = ({ createdAt, retentionPolicy }) => {
  const created = clampDate(createdAt) ?? new Date();
  const policyMonths = retentionPolicy?.retentionMonths ?? 36;
  const archiveMonths = retentionPolicy?.archiveAfterMonths ?? policyMonths - 6;

  const archiveAt = archiveMonths > 0 ? addMonths(created, archiveMonths) : null;
  const purgeAt = addMonths(created, policyMonths);

  return {
    archiveAt,
    purgeAt,
  };
};

const deriveNextRetentionState = ({ currentState, retentionPolicy }) => {
  if (currentState === EvidenceRetentionState.LEGAL_HOLD) {
    return EvidenceRetentionState.LEGAL_HOLD;
  }

  if (currentState === EvidenceRetentionState.PURGE_SCHEDULED) {
    return EvidenceRetentionState.PURGE_SCHEDULED;
  }

  if (currentState === EvidenceRetentionState.ARCHIVED) {
    return EvidenceRetentionState.ARCHIVED;
  }

  // Default flow: active -> archived -> purge
  if (retentionPolicy?.archiveAfterMonths) {
    return EvidenceRetentionState.ARCHIVED;
  }

  return EvidenceRetentionState.PURGE_SCHEDULED;
};

module.exports = {
  addMonths,
  calculateRetentionTimeline,
  deriveNextRetentionState,
};
