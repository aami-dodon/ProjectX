const { z } = require('zod');

const SLUG_REGEX = /^[a-z0-9-]+$/;

const FRAMEWORK_MAPPING_SCHEMA = z.object({
  frameworkId: z.string().min(1).optional(),
  frameworkControlId: z.string().min(1).optional(),
  coverageLevel: z.enum(['FULL', 'PARTIAL', 'COMPENSATING']).default('PARTIAL'),
  status: z.enum(['ACTIVE', 'IN_REVIEW', 'RETIRED']).default('ACTIVE'),
  evidenceReferences: z.array(z.string().min(1).max(512)).max(25).optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional(),
  notes: z.string().max(4000).optional(),
  metadata: z.record(z.any()).optional(),
});

const CONTROL_BASE_SCHEMA = z.object({
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(SLUG_REGEX, 'Slug must be lowercase alphanumeric and may include hyphens'),
  title: z.string().min(3).max(255),
  description: z.string().max(4000).optional(),
  rationale: z.string().max(4000).optional(),
  implementationGuidance: z.string().max(8000).optional(),
  ownerTeam: z.string().max(255).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'DEPRECATED']).default('DRAFT'),
  riskTier: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  enforcementLevel: z.enum(['ADVISORY', 'MANDATORY']).default('ADVISORY'),
  domain: z.string().max(255).optional(),
  category: z.string().max(255).optional(),
  subCategory: z.string().max(255).optional(),
  tags: z.array(z.string().min(1).max(64)).max(20).optional(),
  metadata: z.record(z.any()).optional(),
  impactWeight: z.number().positive().max(100).optional(),
  remediationNotes: z.string().max(4000).optional(),
  frameworkMappings: z.array(FRAMEWORK_MAPPING_SCHEMA).optional(),
});

const CONTROL_UPDATE_SCHEMA = CONTROL_BASE_SCHEMA.partial().extend({
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(SLUG_REGEX, 'Slug must be lowercase alphanumeric and may include hyphens')
    .optional(),
  bumpVersion: z.boolean().optional(),
});

const CONTROL_ARCHIVE_SCHEMA = z.object({
  reason: z.string().min(3).max(4000),
});

const CONTROL_MAPPING_SET_SCHEMA = z.object({
  frameworkMappings: z.array(FRAMEWORK_MAPPING_SCHEMA).min(1),
});

const CONTROL_SCORE_QUERY_SCHEMA = z.object({
  granularity: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
  limit: z.coerce.number().int().min(3).max(90).default(30),
  forceRefresh: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => {
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return false;
    }),
});

module.exports = {
  CONTROL_ARCHIVE_SCHEMA,
  CONTROL_BASE_SCHEMA,
  CONTROL_MAPPING_SET_SCHEMA,
  CONTROL_SCORE_QUERY_SCHEMA,
  CONTROL_UPDATE_SCHEMA,
  FRAMEWORK_MAPPING_SCHEMA,
};
