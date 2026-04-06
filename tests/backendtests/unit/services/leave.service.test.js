const leaveService = require('@/services/leave.service');
const leaveModel = require('@/models/leave.model');

jest.mock('@/models/leave.model');

describe('Leave Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLeaveRequest', () => {
    test('student leave goes to primary teacher if available', async () => {
      leaveModel.resolveUserRoleForCampus.mockResolvedValue('Student');
      leaveModel.findPrimaryTeacherForStudent.mockResolvedValue('teacher1');
      leaveModel.findPrincipalForCampus.mockResolvedValue('principal1');
      leaveModel.findAdminsForCampus.mockResolvedValue(['admin1']);
      leaveModel.findTenantAdmins.mockResolvedValue(['zonal1', 'super1']);
      leaveModel.getUserRoleByUsername.mockImplementation(async (u) => {
        if (u === 'super1') return 'Superadmin';
        if (u === 'zonal1') return 'Zonaladmin';
        return null;
      });
      
      const createdReq = { id: 10 };
      leaveModel.createLeaveRequest.mockResolvedValue(createdReq);

      const payload = {
        leave_date: '2024-05-01',
        leave_reason: 'Sick',
        duration_days: 1,
        duration_category: 'full-day'
      };

      const result = await leaveService.createLeaveRequest('t1', 'c1', 'student1', payload);

      expect(result).toEqual(createdReq);
      expect(leaveModel.createApprovalStepsBulk).toHaveBeenCalledWith(10, [
        { approver_role: 'Teacher', approver_username: 'teacher1', step_order: 1 }
      ]);
    });

    test('employee leave goes to campus admins, otherwise zonal, otherwise super', async () => {
      leaveModel.resolveUserRoleForCampus.mockResolvedValue('Employee');
      leaveModel.findAdminsForCampus.mockResolvedValue([]);
      leaveModel.findTenantAdmins.mockResolvedValue(['zonal1', 'super1']);
      leaveModel.getUserRoleByUsername.mockImplementation(async (u) => {
        if (u === 'super1') return 'Superadmin';
        if (u === 'zonal1') return 'Zonaladmin';
        return null;
      });
      
      const createdReq = { id: 11 };
      leaveModel.createLeaveRequest.mockResolvedValue(createdReq);

      const payload = {
        leave_date: '2024-05-01',
        leave_reason: 'Personal',
        duration_days: 1,
        duration_category: 'full-day'
      };

      await leaveService.createLeaveRequest('t1', 'c1', 'emp1', payload);

      expect(leaveModel.createApprovalStepsBulk).toHaveBeenCalledWith(11, [
        { approver_role: 'Zonaladmin', approver_username: 'zonal1', step_order: 1 }
      ]);
    });

    test('superadmin leave is self-approved', async () => {
      leaveModel.resolveUserRoleForCampus.mockResolvedValue('Superadmin');
      leaveModel.findAdminsForCampus.mockResolvedValue(['admin1']);
      leaveModel.findTenantAdmins.mockResolvedValue(['super1']);
      leaveModel.getUserRoleByUsername.mockResolvedValue('Superadmin');

      const createdReq = { id: 12 };
      leaveModel.createLeaveRequest.mockResolvedValue(createdReq);
      leaveModel.updateApproverStepStatus.mockResolvedValue({ id: 1, status: 'approved' });
      leaveModel.recomputeOverallStatus.mockResolvedValue({ id: 12, status: 'approved' });

      const payload = {
        leave_date: '2024-05-01',
        leave_reason: 'Sick',
        duration_days: 1,
        duration_category: 'full-day'
      };

      const result = await leaveService.createLeaveRequest('t1', 'c1', 'super1', payload);

      expect(leaveModel.createApprovalStepsBulk).toHaveBeenCalledWith(12, [
        { approver_role: 'Superadmin', approver_username: 'super1', step_order: 1 }
      ]);
      expect(leaveModel.updateApproverStepStatus).toHaveBeenCalledWith('t1', 'c1', 12, 'super1', 'approved', 'Auto-approved');
      expect(leaveModel.recomputeOverallStatus).toHaveBeenCalledWith(12);
      expect(result.status).toBe('approved');
    });

    test('throws if no approver exists in hierarchy', async () => {
      leaveModel.resolveUserRoleForCampus.mockResolvedValue('Employee');
      leaveModel.findAdminsForCampus.mockResolvedValue([]);
      leaveModel.findTenantAdmins.mockResolvedValue([]);

      const createdReq = { id: 13 };
      leaveModel.createLeaveRequest.mockResolvedValue(createdReq);

      const payload = {
        leave_date: '2024-05-01',
        leave_reason: 'Sick',
        duration_days: 1,
        duration_category: 'full-day'
      };

      await expect(leaveService.createLeaveRequest('t1', 'c1', 'emp1', payload))
        .rejects.toThrow('No approvers found in hierarchy');
    });
  });

  describe('getMyLeaveRequests', () => {
    test('returns own requests for non-parent', async () => {
      leaveModel.resolveUserRoleForCampus.mockResolvedValue('Student');
      leaveModel.getMyLeaveRequests.mockResolvedValue([{ id: 1 }]);

      const result = await leaveService.getMyLeaveRequests('t1', 'c1', 'student1');
      expect(result).toEqual([{ id: 1 }]);
    });

    test('returns combined requests for parent', async () => {
      leaveModel.resolveUserRoleForCampus.mockResolvedValue('Parent');
      leaveModel.findStudentsForParent.mockResolvedValue(['child1']);
      leaveModel.getMyLeaveRequests.mockImplementation((t, c, user) => {
        if (user === 'parent1') return [{ id: 1, request_date: '2024-01-02' }];
        if (user === 'child1') return [{ id: 2, request_date: '2024-01-01' }];
        return [];
      });

      const result = await leaveService.getMyLeaveRequests('t1', 'c1', 'parent1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1); // sorted by date desc
      expect(result[1].id).toBe(2);
    });
  });

  describe('getPendingApprovals', () => {
    test('returns pending approvals', async () => {
      leaveModel.getPendingApprovalsForUser.mockResolvedValue([{ id: 1 }]);
      const result = await leaveService.getPendingApprovals('t1', 'c1', 'approver1');
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('getCompletedApprovals', () => {
    test('returns completed approvals', async () => {
      leaveModel.getCompletedApprovalsForUser.mockResolvedValue([{ id: 1 }]);
      const result = await leaveService.getCompletedApprovals('t1', 'c1', 'approver1');
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('updateLeaveStatus', () => {
    test('updates status and recomputes if approved/rejected', async () => {
      leaveModel.getLeaveRequestById.mockResolvedValue({ id: 1 });
      leaveModel.isUserAssignedApproverForRequest.mockResolvedValue(true);
      leaveModel.updateApproverStepStatus.mockResolvedValue({ id: 1, status: 'approved' });

      const result = await leaveService.updateLeaveStatus('t1', 'c1', 1, 'approved', '', 'approver1');

      expect(leaveModel.updateApproverStepStatus).toHaveBeenCalledWith('t1', 'c1', 1, 'approver1', 'approved', '');
      expect(leaveModel.recomputeOverallStatus).toHaveBeenCalledWith(1);
      expect(result).toBeDefined();
    });

    test('throws 404 if not found', async () => {
      leaveModel.getLeaveRequestById.mockResolvedValue(null);
      await expect(leaveService.updateLeaveStatus('t1', 'c1', 1, 'approved', '', 'approver1'))
        .rejects.toThrow('Leave request not found');
    });

    test('throws 403 if not assigned', async () => {
      leaveModel.getLeaveRequestById.mockResolvedValue({ id: 1 });
      leaveModel.isUserAssignedApproverForRequest.mockResolvedValue(false);
      await expect(leaveService.updateLeaveStatus('t1', 'c1', 1, 'approved', '', 'approver1'))
        .rejects.toThrow('Access denied');
    });
  });

  describe('deleteLeaveRequest', () => {
    test('deletes request', async () => {
      leaveModel.deleteLeaveRequest.mockResolvedValue(true);
      const result = await leaveService.deleteLeaveRequest('t1', 'c1', 1);
      expect(result).toBe(true);
    });
  });

  describe('cancelLeaveByRequester', () => {
    test('cancels request if owned by requester', async () => {
      leaveModel.getLeaveRequestById.mockResolvedValue({ id: 1, username: 'student1' });
      leaveModel.cancelRequestAndStepsById.mockResolvedValue([{ id: 1 }]);

      const result = await leaveService.cancelLeaveByRequester('t1', 'c1', 1, 'student1', 'No longer needed');

      expect(leaveModel.cancelRequestAndStepsById).toHaveBeenCalledWith(1, 'No longer needed');
      expect(result).toHaveLength(1);
    });

    test('throws error if not owned by requester', async () => {
      leaveModel.getLeaveRequestById.mockResolvedValue({ id: 1, username: 'student2' });
      await expect(leaveService.cancelLeaveByRequester('t1', 'c1', 1, 'student1'))
        .rejects.toThrow('Student can only cancel the request');
    });
  });
});
