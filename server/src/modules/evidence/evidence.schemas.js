const { EvidenceRetentionState, EvidenceSource } = require('@prisma/client');
const { z } = require('zod');

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB upper bound for browser uploads
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/zip',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const stringArray = z.array(z.string().min(1).max(128)).max(25)
  .transform((values) => values.map((value) => value.trim()).filter(Boolean));

const uploadLinkSchema = z.object({
  controlId: z.string().uuid().optional(),
  checkId: z.string().uuid().optional(),
  taskReference: z.string().min(1).max(255).optional(),
  role: z.string().min(1).max(128).optional(),
  justification: z.string().max(2000).optional(),
});

const UPLOAD_REQUEST_SCHEMA = z.object({
  filename: z.string().min(3).max(255),
  description: z.string().max(4000).optional(),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: 'Unsupported file type' }),
  }),
  size: z.coerce.number().int().positive().max(MAX_UPLOAD_BYTES),
  checksum: z.string().min(16).max(128),
  tags: stringArray.optional(),
  source: z.nativeEnum(EvidenceSource).default(EvidenceSource.MANUAL),
  retentionPolicyId: z.string().uuid().optional(),
  retentionState: z.nativeEnum(EvidenceRetentionState).default(EvidenceRetentionState.ACTIVE),
  controlIds: z.array(z.string().uuid()).max(25).optional(),
  checkIds: z.array(z.string().uuid()).max(25).optional(),
  taskReferences: z.array(z.string().min(1).max(255)).max(25).optional(),
  links: z.array(uploadLinkSchema).max(25).optional(),
  metadata: z.record(z.any()).optional(),
});

const LIST_QUERY_SCHEMA = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  retentionState: z.nativeEnum(EvidenceRetentionState).optional(),
  source: z.nativeEnum(EvidenceSource).optional(),
  controlId: z.string().uuid().optional(),
  checkId: z.string().uuid().optional(),
  uploaderId: z.string().uuid().optional(),
  tag: z.string().min(1).max(128).optional(),
  search: z.string().max(255).optional(),
  sort: z.string().regex(/^(updatedAt|createdAt|displayName):(asc|desc)$/i).optional(),
});

const METADATA_UPDATE_SCHEMA = z.object({
  description: z.string().max(4000).optional(),
  tags: stringArray.optional(),
  metadata: z.record(z.any()).optional(),
  retentionPolicyId: z.string().uuid().optional().nullable(),
  retentionState: z.nativeEnum(EvidenceRetentionState).optional(),
  purgeScheduledFor: z.coerce.date().optional().nullable(),
  archivedAt: z.coerce.date().optional().nullable(),
  bumpVersion: z.boolean().optional(),
});

const LINK_COLLECTION_SCHEMA = z.object({
  links: z.array(uploadLinkSchema).min(1).max(25),
});

module.exports = {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  LINK_COLLECTION_SCHEMA,
  LIST_QUERY_SCHEMA,
  METADATA_UPDATE_SCHEMA,
  UPLOAD_REQUEST_SCHEMA,
};
