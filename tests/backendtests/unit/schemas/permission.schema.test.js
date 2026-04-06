const permissionSchema = require('@/schemas/permission.schema');

describe('Permission Schema', () => {
  const campusId = '550e8400-e29b-41d4-a716-446655440000';
  const username = 'testuser';

  describe('Permissions', () => {
    test('getPermissionByCode params valid', () => {
      const { error } = permissionSchema.getPermissionByCode.params.validate({ code: 'STUDENT_VIEW' });
      expect(error).toBeUndefined();
    });

    test('createPermission body valid', () => {
      const body = { code: 'STUDENT_VIEW', name: 'View Student' };
      const { error } = permissionSchema.createPermission.body.validate(body);
      expect(error).toBeUndefined();
    });

    test('updatePermission body valid', () => {
      const body = { name: 'Updated Name' };
      const { error } = permissionSchema.updatePermission.body.validate(body);
      expect(error).toBeUndefined();
    });

    test('deletePermission params valid', () => {
      const { error } = permissionSchema.deletePermission.params.validate({ code: 'STUDENT_VIEW' });
      expect(error).toBeUndefined();
    });
  });

  describe('Role Permissions', () => {
    test('getRolePermissionsForCampus user valid', () => {
      const { error } = permissionSchema.getRolePermissionsForCampus.user.validate({ campusId });
      expect(error).toBeUndefined();
    });

    test('getRolePermissionsForCampus query valid', () => {
      const query = { role_name: 'Admin', permission_code: 'P1', category: 'C1' };
      const { error } = permissionSchema.getRolePermissionsForCampus.query.validate(query);
      expect(error).toBeUndefined();
    });

    test('createRolePermission user and body valid', () => {
      const user = { campusId, username };
      const body = { role_name: 'Admin', permission_code: 'P1' };
      const userRes = permissionSchema.createRolePermission.user.validate(user);
      const bodyRes = permissionSchema.createRolePermission.body.validate(body);
      expect(userRes.error).toBeUndefined();
      expect(bodyRes.error).toBeUndefined();
    });

    test('deleteRolePermission user and params valid', () => {
      const user = { campusId };
      const params = { role_name: 'Admin', permission_code: 'P1' };
      const userRes = permissionSchema.deleteRolePermission.user.validate(user);
      const paramsRes = permissionSchema.deleteRolePermission.params.validate(params);
      expect(userRes.error).toBeUndefined();
      expect(paramsRes.error).toBeUndefined();
    });
  });
});
