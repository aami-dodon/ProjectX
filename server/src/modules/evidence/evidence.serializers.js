const toISOString = (value) => (value ? value.toISOString() : null);

const serializeRetentionPolicy = (policy) => {
  if (!policy) {
    return null;
  }

  return {
    id: policy.id,
    name: policy.name,
    retentionMonths: policy.retentionMonths,
    archiveAfterMonths: policy.archiveAfterMonths,
    description: policy.description ?? null,
    isDefault: Boolean(policy.isDefault),
    legalHoldAllowed: Boolean(policy.legalHoldAllowed),
  };
};

const serializeEvidenceLink = (link) => ({
  id: link.id,
  controlId: link.controlId ?? null,
  controlTitle: link.control?.title ?? null,
  checkId: link.checkId ?? null,
  checkName: link.check?.name ?? null,
  taskReference: link.taskReference ?? null,
  role: link.role ?? null,
  justification: link.justification ?? null,
  linkedBy: link.linkedBy ?? null,
  linkedAt: toISOString(link.linkedAt),
});

const serializeEvidenceEvent = (event) => ({
  id: event.id,
  action: event.action,
  actorId: event.actorId ?? null,
  ipAddress: event.ipAddress ?? null,
  userAgent: event.userAgent ?? null,
  metadata: event.metadata ?? null,
  createdAt: toISOString(event.createdAt),
});

const serializeEvidenceVersion = (version) => ({
  id: version.id,
  version: version.version,
  checksum: version.checksum,
  storageKey: version.storageKey,
  size: version.size,
  metadata: version.metadata ?? null,
  createdAt: toISOString(version.createdAt),
  createdBy: version.createdBy ?? null,
});

const serializeEvidenceRecord = (record, { includeEvents = false, includeVersions = false } = {}) => {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    name: record.displayName,
    description: record.description ?? null,
    mimeType: record.mimeType,
    size: record.size,
    checksum: record.checksum,
    version: record.version,
    source: record.source,
    tags: Array.isArray(record.tags) ? record.tags : [],
    retentionState: record.retentionState,
    retentionPolicy: serializeRetentionPolicy(record.retentionPolicy),
    retention: {
      state: record.retentionState,
      purgeScheduledFor: toISOString(record.purgeScheduledFor),
      archivedAt: toISOString(record.archivedAt),
      legalHoldAppliedAt: toISOString(record.legalHoldAppliedAt),
    },
    storage: {
      bucket: record.bucket,
      objectName: record.objectName,
      storageKey: record.storageKey,
    },
    downloadCount: record.downloadCount ?? 0,
    metadata: record.metadata ?? null,
    createdAt: toISOString(record.createdAt),
    updatedAt: toISOString(record.updatedAt),
    uploader: record.uploader
      ? {
          id: record.uploader.id,
          email: record.uploader.email,
          name: record.uploader.fullName ?? record.uploader.email,
        }
      : null,
    links: Array.isArray(record.links) ? record.links.map(serializeEvidenceLink) : [],
    events:
      includeEvents && Array.isArray(record.events)
        ? record.events.map(serializeEvidenceEvent)
        : undefined,
    versions:
      includeVersions && Array.isArray(record.versions)
        ? record.versions.map(serializeEvidenceVersion)
        : undefined,
  };
};

module.exports = {
  serializeEvidenceEvent,
  serializeEvidenceLink,
  serializeEvidenceRecord,
  serializeEvidenceVersion,
  serializeRetentionPolicy,
};
