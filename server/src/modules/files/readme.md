# File storage module reuse guide

The files module wraps MinIO access patterns for secure upload and download workflows. It exposes an
Express router plus a focused service that other features can call when they need presigned URLs.

## Public surfaces

- **Router (`file.router.js`)** – defines `/api/files/uploads` for creating upload slots and
  `/api/files/access` for issuing presigned download links. Attach this router under an authenticated
  scope (it already requires the auth middleware in `server/src/app.js`).
- **Controller (`file.controller.js`)** – validates incoming payloads, delegates to the service, and
  returns JSON payloads describing URLs and storage metadata.
- **Service (`file.service.js`)** – centralises filename sanitisation, MIME classification, object-key
  construction, and presigned URL generation through the MinIO integration.

Import the module using the shared alias:

```js
const { router: fileRouter, fileService } = require('@/modules/files');
```

## Typical reuse scenarios

1. **Generating upload slots from another module** – call `fileService.createUploadSlot(userId,
   filename, mimeType)` to get a presigned PUT URL and the resulting object key.
2. **Issuing download links** – call `fileService.getFileAccessLink(objectName, userId)` to produce a
   time-bound GET URL after verifying the caller owns the object prefix.
3. **Classifying file types** – reuse `fileService.classifyFile(mimeType)` to validate MIME types and
   map them to storage buckets when you need the same rules outside the router.

## Integration requirements

- Ensure MinIO environment variables (`MINIO_BUCKET`, endpoint credentials) are defined in `.env` and
  validated in `server/src/config/env.js`.
- Persist only the returned `fileUrl` or `objectName` in application tables; never store presigned
  URLs since they expire.
- Keep `ALLOWED_TYPES` and `STORAGE_PATHS` aligned with compliance requirements. Extend them in the
  service file to add new categories instead of scattering lists across modules.

## Extending the module safely

- Add new file categories by updating both `ALLOWED_TYPES` and `STORAGE_PATHS` constants and covering
  the new logic with tests.
- Preserve the sanitisation helpers (`sanitizeUserSegment`, `normalizeFilename`, `normalizeObjectName`)
  when introducing additional validation so paths stay traversal-safe.
- Document any new API contracts through OpenAPI annotations inside `file.router.js`.

## Testing tips

- Mock the MinIO integration (`getPresignedUploadUrl`, `getPresignedDownloadUrl`) when unit-testing
  the service.
- Add request-level tests around the router to confirm the auth middleware and validation rules catch
  bad inputs (invalid MIME type, missing object key, etc.).
