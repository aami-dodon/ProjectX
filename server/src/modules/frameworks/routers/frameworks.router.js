const express = require('express');

const { authenticateRequest } = require('@/modules/auth/auth.middleware');
const { attachAuditContext } = require('@/middleware/audit-context');
const { requirePermission } = require('@/middleware/authorization');
const {
  listFrameworkCatalog,
  createFramework,
  getFramework,
  updateFramework,
  archiveFramework,
  restoreFramework,
} = require('../controllers/frameworks.controller');
const {
  listFrameworkControlsHandler,
  createFrameworkControlHandler,
} = require('../controllers/controls.controller');
const {
  listFrameworkMappingsHandler,
  createFrameworkMappingHandler,
} = require('../controllers/mappings.controller');
const {
  listFrameworkVersionsHandler,
  createFrameworkVersionHandler,
} = require('../controllers/versions.controller');

const router = express.Router();
const allowFrameworkRoles = ['admin', 'compliance officer'];

const guard = (resource, action) =>
  requirePermission({
    resource,
    action,
    allowRoles: allowFrameworkRoles,
  });

router.use(authenticateRequest, attachAuditContext);

router.get('/', guard('frameworks:catalog', 'read'), listFrameworkCatalog);
router.post('/', guard('frameworks:catalog', 'create'), createFramework);

router.get(
  '/:frameworkId/controls',
  guard('frameworks:controls', 'read'),
  listFrameworkControlsHandler,
);
router.post(
  '/:frameworkId/controls',
  guard('frameworks:controls', 'create'),
  createFrameworkControlHandler,
);

router.get(
  '/:frameworkId/mappings',
  guard('frameworks:mappings', 'read'),
  listFrameworkMappingsHandler,
);
router.post(
  '/:frameworkId/mappings',
  guard('frameworks:mappings', 'create'),
  createFrameworkMappingHandler,
);

router.get(
  '/:frameworkId/versions',
  guard('frameworks:versions', 'read'),
  listFrameworkVersionsHandler,
);
router.post(
  '/:frameworkId/versions',
  guard('frameworks:versions', 'create'),
  createFrameworkVersionHandler,
);

router.get('/:frameworkId', guard('frameworks:catalog', 'read'), getFramework);
router.patch(
  '/:frameworkId',
  guard('frameworks:catalog', 'update'),
  updateFramework,
);
router.delete(
  '/:frameworkId',
  guard('frameworks:catalog', 'delete'),
  archiveFramework,
);
router.post(
  '/:frameworkId/restore',
  guard('frameworks:catalog', 'update'),
  restoreFramework,
);

module.exports = router;
