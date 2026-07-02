import prisma from '../config/db';
import * as bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { BadRequestError } from '../utils/errors';
import { ROLE_DEFINITIONS } from '../rbac/permissions';

export class OnboardingService {
  /**
   * Complete atomic onboarding transaction:
   * 1. Create Organization
   * 2. Seed all default roles
   * 3. Seed all default permissions + map to roles
   * 4. Create Owner user
   * 5. Return JWT
   */
  static async createOrganizationWithOwner(data: {
    organizationName: string;
    ownerName:        string;
    ownerEmail:       string;
    ownerPassword:    string;
    country?:         string;
    currency?:        string;
  }) {
    const existingUser = await prisma.user.findFirst({
      where: { email: data.ownerEmail.toLowerCase() },
    });
    if (existingUser) {
      throw new BadRequestError('An account with this email already exists');
    }

    const slug = data.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50) + '-' + Date.now().toString(36);

    const hashedPassword = await bcrypt.hash(data.ownerPassword, 12);

    // Everything in a single transaction — atomic onboarding
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create organization
      const org = await tx.organization.create({
        data: {
          name:     data.organizationName,
          slug,
          country:  data.country  ?? 'US',
          currency: data.currency ?? 'USD',
        },
      });

      // 2. Collect all unique permission names across all roles
      const allPermissionNames = [
        ...new Set(ROLE_DEFINITIONS.flatMap((r) => [...r.permissions])),
      ];

      // 3. Seed permissions for this organization
      const permissionRecords = await Promise.all(
        allPermissionNames.map((name) => {
          const [resource, action] = name.split('.');
          return tx.permission.create({
            data: {
              organizationId: org.id,
              resource,
              action,
              name,
            },
          });
        })
      );
      const permissionMap = new Map(permissionRecords.map((p) => [p.name, p.id]));

      // 4. Seed roles + role_permissions
      const createdRoles: Record<string, string> = {};
      for (const roleDef of ROLE_DEFINITIONS) {
        const role = await tx.role.create({
          data: {
            organizationId: org.id,
            name:           roleDef.name,
            displayName:    roleDef.displayName,
            description:    roleDef.description,
            isSystem:       roleDef.isSystem,
          },
        });
        createdRoles[roleDef.name] = role.id;

        // Map permissions to this role
        await tx.rolePermission.createMany({
          data: [...roleDef.permissions]
            .filter((perm) => permissionMap.has(perm))
            .map((perm) => ({
              roleId:       role.id,
              permissionId: permissionMap.get(perm)!,
            })),
        });
      }

      // 5. Create owner user
      const owner = await tx.user.create({
        data: {
          organizationId: org.id,
          roleId:         createdRoles['owner'],
          name:           data.ownerName,
          email:          data.ownerEmail.toLowerCase(),
          password:       hashedPassword,
          isOwner:        true,
          avatar:         data.ownerName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
        },
      });

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          userId:         owner.id,
          action:         'create',
          resource:       'organization',
          resourceId:     org.id,
          metadata:       { name: org.name },
        },
      });

      const { password: _pw, ...ownerSafe } = owner;
      return { org, owner: ownerSafe, ownerRoleId: createdRoles['owner'] };
    });

    const token = generateToken({
      userId:         result.owner.id,
      organizationId: result.org.id,
      roleId:         result.ownerRoleId,
      roleName:       'owner',
    });

    return {
      user:         result.owner,
      organization: result.org,
      token,
    };
  }
}
