const { prisma } = require('@/integrations/prisma');

const BRANDING_ID = 'default';

async function findBrandingSettings() {
  return prisma.customerBrandingSetting.findUnique({
    where: { id: BRANDING_ID },
  });
}

async function upsertBrandingSettings(data) {
  return prisma.customerBrandingSetting.upsert({
    where: { id: BRANDING_ID },
    update: data,
    create: { id: BRANDING_ID, ...data },
  });
}

module.exports = {
  findBrandingSettings,
  upsertBrandingSettings,
};
