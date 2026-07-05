import prisma from '../config/db';
import * as bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { BadRequestError } from '../utils/errors';
import { ROLE_DEFINITIONS } from '../rbac/permissions';
import { EmailService } from './email.service';

export class OnboardingService {
  /**
   * STEP 1 — Register owner account.
   * Creates the org shell + owner user + all roles/permissions atomically.
   * setupComplete = false until the org setup wizard is submitted.
   *
   * Why split from setup?
   * The owner needs a JWT to call the setup endpoint.
   * This mirrors how modern SaaS apps work (Notion, Linear, Vercel):
   * create account first, configure workspace second.
   */
  static async registerOwner(data: {
    ownerName:     string;
    ownerEmail:    string;
    ownerPassword: string;
  }) {
    const existingUser = await prisma.user.findFirst({
      where: { email: data.ownerEmail.toLowerCase() },
    });
    if (existingUser) {
      throw new BadRequestError('An account with this email already exists');
    }

    // Generate a temporary org slug from email domain until setup provides real name
    const emailDomain = data.ownerEmail.split('@')[1]?.split('.')[0] ?? 'org';
    const slug = `${emailDomain}-${Date.now().toString(36)}`;

    const hashedPassword = await bcrypt.hash(data.ownerPassword, 12);

    // Everything in one atomic transaction — if anything fails, nothing is created
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create org shell (setupComplete = false)
      const org = await tx.organization.create({
        data: {
          name:          'My Organization', // placeholder — overwritten in setup
          slug,
          setupComplete: false,
        },
      });

      // 2. Collect all unique permission names
      const allPermissionNames = [
        ...new Set(ROLE_DEFINITIONS.flatMap((r) => [...r.permissions])),
      ];

      // 3. Seed permissions for this org
      const permissionRecords = await Promise.all(
        allPermissionNames.map((name) => {
          const [resource, action] = name.split('.');
          return tx.permission.create({
            data: { organizationId: org.id, resource, action, name },
          });
        })
      );
      const permissionMap = new Map(permissionRecords.map((p) => [p.name, p.id]));

      // 4. Seed all 6 roles + map permissions to each
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

        await tx.rolePermission.createMany({
          data: [...roleDef.permissions]
            .filter((p) => permissionMap.has(p))
            .map((p) => ({ roleId: role.id, permissionId: permissionMap.get(p)! })),
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
        include: {
          role: true,
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
          metadata:       { step: 'owner_registered' },
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

    // Send welcome email (non-blocking, error-safe)
    EmailService.sendWelcomeEmail({
      to: data.ownerEmail,
      name: data.ownerName,
      organizationName: result.org.name,
    }).catch(() => {});

    return {
      user:              result.owner,
      organization:      result.org,
      token,
      requiresSetup:     true,
    };
  }

  /**
   * STEP 2 — Complete organization setup wizard.
   * Called by the owner after registering. Sets setupComplete = true.
   *
   * Why is setupComplete important?
   * We enforce a gate in the layout: if setupComplete === false,
   * the owner is always redirected to /onboarding/setup.
   * This prevents them from using an unconfigured org.
   */
  static async completeSetup(
    organizationId: string,
    ownerId:        string,
    data: {
      name:        string;
      industry:    string;
      companySize: string;
      country:     string;
      currency:    string;
      timezone:    string;
      website?:    string;
      phone?:      string;
      address?:    string;
      fiscalYear?: number;
      logo?:       string;
    }
  ) {
    // Regenerate slug from actual org name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50) + '-' + Date.now().toString(36);

    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...data,
        slug,
        setupComplete: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId:     ownerId,
        action:     'update',
        resource:   'organization',
        resourceId: organizationId,
        metadata:   { step: 'setup_complete', name: data.name },
      },
    });

    return org;
  }
}
