import prisma from '../config/db';
import { PERMISSIONS, ROLE_DEFINITIONS } from '../rbac/permissions';

const READ_PERMS = new Set([
  PERMISSIONS.CONTACT_READ,
  PERMISSIONS.DEAL_READ,
  PERMISSIONS.ACTIVITY_READ,
  PERMISSIONS.USER_READ,
  PERMISSIONS.REPORTS_VIEW,
]);

async function backfillPermissions() {
  console.log('Backfilling read permissions for all roles in existing organizations...');

  const orgs = await prisma.organization.findMany({ select: { id: true } });
  console.log(`Found ${orgs.length} organizations`);

  for (const org of orgs) {
    const definitionMap = new Map(ROLE_DEFINITIONS.map((d) => [d.name, d]));

    const roles = await prisma.role.findMany({
      where: { organizationId: org.id },
    });

    for (const role of roles) {
      const def = definitionMap.get(role.name as typeof ROLE_DEFINITIONS[number]['name']);
      if (!def) continue;

      const expectedReadPerms = def.permissions.filter((p): p is typeof p => READ_PERMS.has(p as any));
      if (expectedReadPerms.length === 0) continue;

      const existingPerms = await prisma.rolePermission.findMany({
        where: { roleId: role.id },
        include: { permission: { select: { name: true } } },
      });
      const existingNames = new Set(existingPerms.map((rp) => rp.permission.name));

      for (const permName of expectedReadPerms) {
        if (existingNames.has(permName)) continue;

        let perm = await prisma.permission.findFirst({
          where: { organizationId: org.id, name: permName },
        });

        if (!perm) {
          const [resource, action] = permName.split('.');
          perm = await prisma.permission.create({
            data: { organizationId: org.id, resource, action, name: permName },
          });
        }

        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: perm.id },
        });

        console.log(`  Added ${permName} to ${role.name} (org ${org.id})`);
      }
    }
  }

  console.log('Done.');
}

backfillPermissions()
  .catch((e) => {
    console.error('Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
