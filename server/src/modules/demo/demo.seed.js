const { randomUUID } = require("node:crypto");

const bcrypt = require("bcryptjs");
const { prisma } = require("@/integrations/prisma");
const { createLogger } = require("@/utils/logger");

const logger = createLogger("demo-seed");

const DEMO = {
  seedId: "project-x-demo-seed",
  brandingId: "demo-branding-profile",
  healthProbeId: 999999,
  users: {
    admin: {
      email: "demo.admin@project-x.local",
      fullName: "Demo Platform Admin",
      avatar: "avatars/demo-admin.png"
    },
    analyst: {
      email: "demo.analyst@project-x.local",
      fullName: "Demo Risk Analyst",
      avatar: "avatars/demo-analyst.png"
    },
    reviewer: {
      email: "demo.reviewer@project-x.local",
      fullName: "Demo Governance Reviewer",
      avatar: "avatars/demo-reviewer.png"
    }
  },
  roles: {
    admin: "demo:governance:admin",
    analyst: "demo:governance:analyst"
  },
  policy: {
    type: "governance",
    description: "Demo policy that grants governance management permissions."
  },
  frameworks: {
    primarySlug: "demo-project-x-ai-governance",
    referenceSlug: "demo-iso-42001"
  },
  frameworkControls: {
    primaryCode: "DEMO-PX-AI-01",
    referenceCode: "DEMO-ISO-DR-01"
  },
  controlSlug: "demo-drift-monitoring",
  checkName: "Demo – Model Drift Guard",
  retentionPolicyName: "Demo Default Discovery",
  evidence: {
    storageKey: "demo/evidence/drift-snapshot/v1",
    objectName: "demo-drift-snapshot.json",
    bucket: "demo-evidence"
  },
  task: {
    title: "[Demo] Investigate drift alert",
    justification: "[Demo] Need reviewer validation",
    externalIssueKey: "DEMO-ISSUE-123"
  },
  report: {
    widgetSlug: "demo-control-health-overview",
    metricHash: "demo-control-health",
    artifactObjectName: "demo-control-breakdown.json"
  },
  notificationCorrelationId: "demo-check-alert",
  probeSlug: "demo-model-drift-probe",
  tokenName: "[Demo] CLI Token",
  eventType: "demo:user:login",
  scheduleExpression: "*/30 * * * *"
};

const MODEL_CHECK_LIST = [
  "reportAuditLog",
  "reportExport",
  "reportMetric",
  "reportScore",
  "reportWidget",
  "reviewQueueItem",
  "checkNotification",
  "checkResult",
  "checkVersion",
  "checkControlLink",
  "controlAuditEvent",
  "controlScore",
  "controlFrameworkLink",
  "taskEvidenceLink",
  "taskSlaMetric",
  "taskAssignment",
  "taskEvent",
  "task",
  "evidenceLink",
  "evidenceEvent",
  "evidenceVersion",
  "evidence",
  "evidenceRetentionPolicy",
  "frameworkMappingHistory",
  "frameworkImport",
  "frameworkExport",
  "frameworkAuditLog",
  "frameworkMapping",
  "frameworkControl",
  "frameworkVersion",
  "framework",
  "probeDeployment",
  "probeSchedule",
  "probeMetric",
  "probeCredential",
  "probeEvent",
  "probe",
  "authPolicyRevision",
  "authPolicy",
  "authRoleAssignment",
  "authRole",
  "authServiceToken",
  "authEventLedger",
  "authEmailVerification",
  "authPasswordReset",
  "authSession",
  "authUser",
  "auditLog",
  "customerBrandingSetting",
  "healthProbe"
];

const jsonDemoFilter = { path: ["demoSeedId"], equals: DEMO.seedId };
const demoUserEmails = Object.values(DEMO.users).map((user) => user.email);
const demoRoleNames = Object.values(DEMO.roles);

const withDemoMetadata = (extra = {}) => ({
  demoSeedId: DEMO.seedId,
  ...extra
});

async function ensureTablesExist(client) {
  const runtimeModels = client._runtimeDataModel?.models ?? {};
  const tableChecks = [];

  for (const model of MODEL_CHECK_LIST) {
    const pascalName = model.charAt(0).toUpperCase() + model.slice(1);
    const runtime = runtimeModels[pascalName];
    if (!runtime) {
      continue;
    }

    const tableName = runtime.dbName ?? runtime.name ?? pascalName;
    const qualified = `public."${tableName.replace(/"/g, '""')}"`;
    tableChecks.push({ model, tableName, qualified });
  }

  if (tableChecks.length === 0) {
    return;
  }

  const presenceCheck = await client.$queryRaw`
    SELECT name, to_regclass(name) IS NOT NULL AS present
    FROM UNNEST(${tableChecks.map(({ qualified }) => qualified)}) AS name(name)
  `;

  const presenceMap = new Map(presenceCheck.map((entry) => [entry?.name, entry?.present]));
  const missing = [];

  for (const { model, tableName, qualified } of tableChecks) {
    if (!presenceMap.get(qualified)) {
      missing.push(`${tableName} (${model})`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `The following tables are missing: ${missing.join(
        ", "
      )}. Run Prisma migrations (e.g. "cd server && npx prisma migrate deploy") before running the seed script.`
    );
  }
}

async function removeDemoData(client) {
  await client.reportAuditLog.deleteMany({ where: { payload: jsonDemoFilter } });
  await client.reportExport.deleteMany({ where: { artifactObjectName: DEMO.report.artifactObjectName } });
  await client.reportMetric.deleteMany({ where: { filtersHash: DEMO.report.metricHash } });
  await client.reportScore.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.reportWidget.deleteMany({ where: { slug: DEMO.report.widgetSlug } });

  await client.reviewQueueItem.deleteMany({ where: { check: { is: { metadata: jsonDemoFilter } } } });
  await client.checkNotification.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.checkResult.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.checkVersion.deleteMany({ where: { check: { is: { metadata: jsonDemoFilter } } } });
  await client.checkControlLink.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.check.deleteMany({ where: { metadata: jsonDemoFilter } });

  await client.taskEvidenceLink.deleteMany({ where: { linkType: "DEMO_CONTROL_EVIDENCE" } });
  await client.taskSlaMetric.deleteMany({ where: { task: { is: { title: DEMO.task.title } } } });
  await client.taskAssignment.deleteMany({ where: { justification: DEMO.task.justification } });
  await client.taskEvent.deleteMany({ where: { payload: jsonDemoFilter } });
  await client.task.deleteMany({ where: { title: DEMO.task.title } });

  await client.evidenceLink.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.evidenceEvent.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.evidenceVersion.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.evidence.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.evidenceRetentionPolicy.deleteMany({ where: { name: DEMO.retentionPolicyName } });

  await client.frameworkMappingHistory.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.frameworkMapping.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.frameworkControl.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.frameworkVersion.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.frameworkImport.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.frameworkExport.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.frameworkAuditLog.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.framework.deleteMany({ where: { metadata: jsonDemoFilter } });

  await client.controlAuditEvent.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.controlScore.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.controlFrameworkLink.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.control.deleteMany({ where: { metadata: jsonDemoFilter } });

  await client.probeDeployment.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.probeSchedule.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.probeMetric.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.probeCredential.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.probeEvent.deleteMany({ where: { payload: jsonDemoFilter } });
  await client.probe.deleteMany({ where: { metadata: jsonDemoFilter } });

  await client.authPolicyRevision.deleteMany({ where: { policy: { is: { metadata: jsonDemoFilter } } } });
  await client.authPolicy.deleteMany({ where: { metadata: jsonDemoFilter } });
  await client.authRoleAssignment.deleteMany({ where: { role: { name: { in: demoRoleNames } } } });
  await client.authRole.deleteMany({ where: { name: { in: demoRoleNames } } });
  await client.authServiceToken.deleteMany({ where: { name: DEMO.tokenName } });
  await client.authEventLedger.deleteMany({ where: { eventType: DEMO.eventType } });
  await client.authUser.deleteMany({ where: { email: { in: demoUserEmails } } });

  await client.auditLog.deleteMany({ where: { changes: jsonDemoFilter } });
  await client.customerBrandingSetting.deleteMany({ where: { id: DEMO.brandingId } });
  await client.healthProbe.deleteMany({ where: { id: DEMO.healthProbeId } });
}

async function seedDemoData(client) {
  await ensureTablesExist(client);
  logger.info("Removing any existing demo data (without touching user content)...");
  await removeDemoData(client);

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  logger.info("Seeding demo workspace settings...");
  await client.customerBrandingSetting.create({
    data: {
      id: DEMO.brandingId,
      name: "Demo Customer Workspace",
      sidebarTitle: "Project X · Demo",
      logoObjectName: "branding/demo-logo.png",
      searchPlaceholder: "Search demo workspace..."
    }
  });

  await client.healthProbe.create({
    data: { id: DEMO.healthProbeId }
  });

  logger.info("Creating demo users, roles, and policies...");
  const passwordHash = bcrypt.hashSync("DemoPass123!", 10);

  const adminUser = await client.authUser.create({
    data: {
      email: DEMO.users.admin.email,
      passwordHash,
      fullName: DEMO.users.admin.fullName,
      avatarObjectName: DEMO.users.admin.avatar,
      status: "ACTIVE",
      emailVerifiedAt: now,
      lastLoginAt: new Date(now.getTime() - 60 * 60 * 1000),
      mfaEnabled: true
    }
  });

  const analystUser = await client.authUser.create({
    data: {
      email: DEMO.users.analyst.email,
      passwordHash,
      fullName: DEMO.users.analyst.fullName,
      avatarObjectName: DEMO.users.analyst.avatar,
      status: "ACTIVE",
      emailVerifiedAt: now,
      lastLoginAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
    }
  });

  const reviewerUser = await client.authUser.create({
    data: {
      email: DEMO.users.reviewer.email,
      passwordHash,
      fullName: DEMO.users.reviewer.fullName,
      avatarObjectName: DEMO.users.reviewer.avatar,
      status: "ACTIVE",
      emailVerifiedAt: now
    }
  });

  await client.authSession.create({
    data: {
      userId: adminUser.id,
      refreshTokenHash: bcrypt.hashSync(randomUUID(), 8),
      userAgent: "ProjectX CLI/1.0",
      ipAddress: "127.0.0.1",
      expiresAt: nextWeek
    }
  });

  await client.authPasswordReset.create({
    data: {
      userId: analystUser.id,
      tokenHash: bcrypt.hashSync(randomUUID(), 8),
      expiresAt: tomorrow
    }
  });

  await client.authEmailVerification.create({
    data: {
      userId: reviewerUser.id,
      tokenHash: bcrypt.hashSync(randomUUID(), 8),
      expiresAt: tomorrow
    }
  });

  await client.authServiceToken.create({
    data: {
      userId: adminUser.id,
      name: DEMO.tokenName,
      tokenHash: bcrypt.hashSync(randomUUID(), 8),
      scopes: ["governance:read", "governance:write"]
    }
  });

  await client.authEventLedger.create({
    data: {
      userId: adminUser.id,
      eventType: DEMO.eventType,
      payload: withDemoMetadata({ source: "seed-script" })
    }
  });

  const adminRole = await client.authRole.create({
    data: {
      name: DEMO.roles.admin,
      description: "Demo role with full governance access.",
      domain: "demo",
      isSystemDefault: true,
      metadata: withDemoMetadata()
    }
  });

  const analystRole = await client.authRole.create({
    data: {
      name: DEMO.roles.analyst,
      description: "Demo role for analysts and reviewers.",
      domain: "demo",
      metadata: withDemoMetadata()
    }
  });

  await client.authRoleAssignment.createMany({
    data: [
      {
        userId: adminUser.id,
        roleId: adminRole.id,
        assignedBy: adminUser.id
      },
      {
        userId: analystUser.id,
        roleId: analystRole.id,
        assignedBy: adminUser.id,
        expiresAt: nextWeek
      }
    ]
  });

  const policy = await client.authPolicy.create({
    data: {
      type: DEMO.policy.type,
      subject: "checks:*",
      action: "manage",
      effect: "allow",
      description: DEMO.policy.description,
      createdById: adminUser.id,
      metadata: withDemoMetadata()
    }
  });

  await client.authPolicyRevision.create({
    data: {
      policyId: policy.id,
      changeType: "initial",
      summary: "Seeded governance scope for demo users.",
      payload: withDemoMetadata({ subject: "checks:*", action: "manage" }),
      createdById: adminUser.id
    }
  });

  await client.auditLog.create({
    data: {
      model: "Check",
      action: "CREATE",
      performedById: adminUser.id,
      affectedUserId: analystUser.id,
      changes: withDemoMetadata({ severity: "HIGH" }),
      ip: "127.0.0.1",
      userAgent: "seed-script"
    }
  });

  logger.info("Creating demo frameworks, controls, and mappings...");
  const aiFramework = await client.framework.create({
    data: {
      slug: DEMO.frameworks.primarySlug,
      title: "Demo AI Governance Framework",
      description: "Continuous compliance principles for AI operations.",
      domain: "AI",
      jurisdiction: "Global",
      publisher: "Project X",
      status: "ACTIVE",
      tags: ["demo", "ai"],
      metadata: withDemoMetadata()
    }
  });

  const isoFramework = await client.framework.create({
    data: {
      slug: DEMO.frameworks.referenceSlug,
      title: "Demo ISO/IEC 42001 Reference",
      description: "Reference maturity requirements.",
      domain: "AI Ethics",
      jurisdiction: "Global",
      publisher: "ISO",
      status: "ACTIVE",
      tags: ["demo", "reference"],
      metadata: withDemoMetadata()
    }
  });

  const aiVersion = await client.frameworkVersion.create({
    data: {
      frameworkId: aiFramework.id,
      version: "1.0.0",
      status: "PUBLISHED",
      changelog: "Initial demo release",
      effectiveFrom: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      metadata: withDemoMetadata()
    }
  });

  const isoVersion = await client.frameworkVersion.create({
    data: {
      frameworkId: isoFramework.id,
      version: "1.0",
      status: "PUBLISHED",
      changelog: "Reference version",
      effectiveFrom: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      metadata: withDemoMetadata()
    }
  });

  await client.framework.update({
    where: { id: aiFramework.id },
    data: { activeVersionId: aiVersion.id }
  });

  await client.framework.update({
    where: { id: isoFramework.id },
    data: { activeVersionId: isoVersion.id }
  });

  const control = await client.control.create({
    data: {
      slug: DEMO.controlSlug,
      title: "Demo – Monitor model drift thresholds",
      description: "Track drift metrics and trigger remediation when thresholds are exceeded.",
      ownerTeam: "AI Ops",
      status: "ACTIVE",
      riskTier: "HIGH",
      enforcementLevel: "MANDATORY",
      domain: "model-risk",
      tags: ["demo", "drift"],
      metadata: withDemoMetadata({ slo: "99.9%" })
    }
  });

  const frameworkControl = await client.frameworkControl.create({
    data: {
      frameworkId: aiFramework.id,
      frameworkVersionId: aiVersion.id,
      code: DEMO.frameworkControls.primaryCode,
      title: "Demo Model Drift Guard",
      description: "Controls for drift detection.",
      status: "ACTIVE",
      metadata: withDemoMetadata()
    }
  });

  const referenceControl = await client.frameworkControl.create({
    data: {
      frameworkId: isoFramework.id,
      frameworkVersionId: isoVersion.id,
      code: DEMO.frameworkControls.referenceCode,
      title: "Demo Risk Monitoring",
      status: "ACTIVE",
      metadata: withDemoMetadata()
    }
  });

  await client.controlFrameworkLink.create({
    data: {
      controlId: control.id,
      frameworkId: aiFramework.id,
      frameworkControlId: frameworkControl.id,
      coverageLevel: "FULL",
      metadata: withDemoMetadata()
    }
  });

  await client.controlScore.create({
    data: {
      controlId: control.id,
      granularity: "DAILY",
      windowStart: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      windowEnd: now,
      score: 92,
      classification: "PASSING",
      sampleSize: 58,
      numerator: 54,
      denominator: 59,
      metadata: withDemoMetadata()
    }
  });

  await client.controlAuditEvent.create({
    data: {
      controlId: control.id,
      action: "UPDATE",
      actorId: adminUser.id,
      changeSummary: "Enabled enforcement for demo drift control.",
      payloadAfter: withDemoMetadata({ enforcementLevel: "MANDATORY" }),
      metadata: withDemoMetadata()
    }
  });

  const frameworkMapping = await client.frameworkMapping.create({
    data: {
      sourceFrameworkId: aiFramework.id,
      targetFrameworkId: isoFramework.id,
      sourceControlId: frameworkControl.id,
      targetControlId: referenceControl.id,
      justification: "Same drift guard intent",
      mappingStrength: "EXACT",
      metadata: withDemoMetadata()
    }
  });

  await client.frameworkMappingHistory.create({
    data: {
      mappingId: frameworkMapping.id,
      changeType: "CREATED",
      actorId: adminUser.id,
      payloadAfter: withDemoMetadata({ mappingStrength: "EXACT" }),
      metadata: withDemoMetadata()
    }
  });

  await client.frameworkImport.create({
    data: {
      frameworkId: aiFramework.id,
      source: "s3://demo/frameworks/source.json",
      format: "JSON",
      status: "COMPLETED",
      artifactUri: "s3://demo/frameworks/source.json",
      metadata: withDemoMetadata(),
      startedAt: new Date(now.getTime() - 60000),
      completedAt: now
    }
  });

  await client.frameworkExport.create({
    data: {
      frameworkId: aiFramework.id,
      format: "JSON",
      status: "COMPLETED",
      artifactUri: "s3://demo/frameworks/export.json",
      metadata: withDemoMetadata(),
      startedAt: new Date(now.getTime() - 120000),
      completedAt: new Date(now.getTime() - 60000)
    }
  });

  await client.frameworkAuditLog.create({
    data: {
      frameworkId: aiFramework.id,
      entityType: "framework",
      action: "UPDATE",
      actorId: adminUser.id,
      payloadAfter: withDemoMetadata({ status: "ACTIVE" }),
      metadata: withDemoMetadata()
    }
  });

  logger.info("Creating demo checks and evidence...");
  const check = await client.check.create({
    data: {
      name: DEMO.checkName,
      description: "Ensure drift stays within tolerances.",
      controlId: control.id,
      status: "ACTIVE",
      type: "AUTOMATED",
      severityDefault: "HIGH",
      frequency: "30m",
      createdBy: adminUser.id,
      tags: ["demo", "drift"],
      metadata: withDemoMetadata()
    }
  });

  await client.checkVersion.create({
    data: {
      checkId: check.id,
      version: 1,
      statusSnapshot: "ACTIVE",
      definition: { script: "evaluate drift" }
    }
  });

  const checkResult = await client.checkResult.create({
    data: {
      checkId: check.id,
      controlId: control.id,
      status: "FAIL",
      severity: "HIGH",
      triggerSource: "probe",
      publicationState: "VALIDATED",
      metadata: withDemoMetadata({ drift: "0.22" }),
      rawOutput: { driftScore: 0.22 },
      createdBy: analystUser.id,
      validatedAt: new Date(now.getTime() - 1000 * 60 * 15),
      publishedAt: new Date(now.getTime() - 1000 * 60 * 10)
    }
  });

  await client.reviewQueueItem.create({
    data: {
      checkId: check.id,
      resultId: checkResult.id,
      assignedTo: analystUser.id,
      dueAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      priority: "HIGH",
      state: "IN_PROGRESS",
      slaMinutes: 120
    }
  });

  await client.checkNotification.create({
    data: {
      checkId: check.id,
      resultId: checkResult.id,
      template: "default-check-alert",
      channel: "email",
      recipient: "ops@demo.project-x.local",
      status: "SENT",
      correlationId: DEMO.notificationCorrelationId,
      sentAt: new Date(now.getTime() - 300000),
      metadata: withDemoMetadata()
    }
  });

  await client.checkControlLink.create({
    data: {
      checkId: check.id,
      controlId: control.id,
      enforcementLevel: "MANDATORY",
      metadata: withDemoMetadata()
    }
  });

  const retentionPolicy = await client.evidenceRetentionPolicy.create({
    data: {
      name: DEMO.retentionPolicyName,
      retentionMonths: 36,
      archiveAfterMonths: 24,
      description: "Default retention for demo evidence."
    }
  });

  const evidence = await client.evidence.create({
    data: {
      displayName: "Demo – Drift snapshot",
      description: "Auto-collected drift metric bundle.",
      storageKey: DEMO.evidence.storageKey,
      objectName: DEMO.evidence.objectName,
      bucket: DEMO.evidence.bucket,
      mimeType: "application/json",
      size: 524288,
      checksum: "demo-checksum",
      version: 1,
      source: "PROBE",
      tags: ["demo", "drift", "model"],
      retentionPolicyId: retentionPolicy.id,
      uploaderId: analystUser.id,
      metadata: withDemoMetadata({ probe: DEMO.probeSlug })
    }
  });

  await client.evidenceEvent.create({
    data: {
      evidenceId: evidence.id,
      action: "UPLOAD_CONFIRMED",
      actorId: analystUser.id,
      ipAddress: "192.168.0.10",
      metadata: withDemoMetadata()
    }
  });

  await client.evidenceVersion.create({
    data: {
      evidenceId: evidence.id,
      version: 1,
      checksum: evidence.checksum,
      storageKey: evidence.storageKey,
      size: evidence.size,
      metadata: withDemoMetadata()
    }
  });

  await client.evidenceLink.create({
    data: {
      evidenceId: evidence.id,
      controlId: control.id,
      checkId: check.id,
      taskReference: "demo-auto-task-1",
      role: "supporting",
      justification: "Captured drift metric snapshot",
      linkedBy: analystUser.id,
      metadata: withDemoMetadata()
    }
  });

  logger.info("Creating demo tasks and attachments...");
  const task = await client.task.create({
    data: {
      title: DEMO.task.title,
      description: "Confirm drift is caused by model updates.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      source: "CHECK_FAILURE",
      controlId: control.id,
      checkId: check.id,
      frameworkId: aiFramework.id,
      createdById: adminUser.id,
      assigneeId: analystUser.id,
      teamId: "governance-ops",
      slaDueAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      delegationExpiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      escalationLevel: 1,
      externalIssueKey: DEMO.task.externalIssueKey,
      externalProvider: "demo-issue-tracker",
      verificationRequired: true
    }
  });

  await client.taskEvent.create({
    data: {
      taskId: task.id,
      eventType: "status_change",
      payload: withDemoMetadata({ from: "OPEN", to: "IN_PROGRESS" }),
      actorId: adminUser.id,
      actorType: "user",
      origin: "seed-script"
    }
  });

  await client.taskAssignment.create({
    data: {
      taskId: task.id,
      assigneeId: reviewerUser.id,
      delegatedById: adminUser.id,
      justification: DEMO.task.justification
    }
  });

  await client.taskEvidenceLink.create({
    data: {
      taskId: task.id,
      evidenceId: evidence.id,
      linkType: "DEMO_CONTROL_EVIDENCE",
      reviewerId: reviewerUser.id,
      verificationStatus: "PENDING"
    }
  });

  await client.taskSlaMetric.create({
    data: {
      taskId: task.id,
      timeToAcknowledge: 30,
      timeInStatus: { IN_PROGRESS: 3600 },
      timeToClose: 720,
      breachCount: 0
    }
  });

  logger.info("Creating demo reporting metrics...");
  await client.reportScore.create({
    data: {
      framework: { connect: { id: aiFramework.id } },
      control: { connect: { id: control.id } },
      granularity: "DAILY",
      windowStart: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      windowEnd: now,
      averageScore: 92,
      failingCount: 1,
      metadata: withDemoMetadata()
    }
  });

  await client.reportMetric.create({
    data: {
      metricType: "CONTROL_HEALTH",
      scope: control.slug,
      filtersHash: DEMO.report.metricHash,
      windowStart: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      windowEnd: now,
      payload: { passRate: 92 }
    }
  });

  const reportExport = await client.reportExport.create({
    data: {
      exportType: "CONTROL_BREAKDOWN",
      format: "JSON",
      status: "COMPLETED",
      artifactBucket: "demo-reports",
      artifactObjectName: DEMO.report.artifactObjectName,
      requestedById: adminUser.id,
      scheduledFor: new Date(now.getTime() - 1800000),
      completedAt: now,
      filters: { seed: DEMO.seedId, controls: [control.slug] },
      schedule: { cadence: "daily" }
    }
  });

  await client.reportAuditLog.create({
    data: {
      exportId: reportExport.id,
      eventType: "export.completed",
      actorId: adminUser.id,
      payload: withDemoMetadata({ status: "COMPLETED" })
    }
  });

  await client.reportWidget.create({
    data: {
      tenantId: "demo",
      slug: DEMO.report.widgetSlug,
      config: { demoSeedId: DEMO.seedId, controlSlug: control.slug, type: "radial" }
    }
  });

  logger.info("Creating demo probe stack...");
  const probe = await client.probe.create({
    data: {
      slug: DEMO.probeSlug,
      name: "Demo Model Drift Probe",
      description: "Tracks latency and performance drift.",
      ownerEmail: "ops@demo.project-x.local",
      ownerTeam: "Observability",
      status: "ACTIVE",
      frameworkBindings: [aiFramework.slug],
      alertChannels: ["slack#ops"],
      metadata: withDemoMetadata()
    }
  });

  await client.probeDeployment.create({
    data: {
      probeId: probe.id,
      version: "1.2.1",
      environment: "production",
      status: "COMPLETED",
      startedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      metadata: withDemoMetadata()
    }
  });

  await client.probeSchedule.create({
    data: {
      probeId: probe.id,
      type: "CRON",
      expression: DEMO.scheduleExpression,
      priority: "NORMAL",
      triggerMetadata: { pipeline: "drift-check" },
      nextRunAt: new Date(now.getTime() + 30 * 60 * 1000),
      metadata: withDemoMetadata()
    }
  });

  await client.probeMetric.create({
    data: {
      probeId: probe.id,
      heartbeatStatus: "OPERATIONAL",
      heartbeatIntervalSeconds: 60,
      failureCount24h: 0,
      latencyP95Ms: 210,
      metadata: withDemoMetadata({ region: "us-west" })
    }
  });

  await client.probeCredential.create({
    data: {
      probeId: probe.id,
      type: "API_KEY",
      credentialHash: bcrypt.hashSync(randomUUID(), 8),
      metadata: withDemoMetadata({ rotatedBy: adminUser.id })
    }
  });

  await client.probeEvent.create({
    data: {
      probeId: probe.id,
      type: "HEARTBEAT",
      payload: withDemoMetadata({ movement: "steady" })
    }
  });

  logger.info("Demo data seeding complete.");
}

const runDemoSeed = async () => {
  logger.info("Demo flag enabled — seeding demo dataset.");
  await seedDemoData(prisma);
};

const clearDemoSeed = async () => {
  logger.info("Clearing demo dataset.");
  await ensureTablesExist(prisma);
  await removeDemoData(prisma);
  logger.info("Demo data removed.");
};

module.exports = {
  runDemoSeed,
  clearDemoSeed
};
