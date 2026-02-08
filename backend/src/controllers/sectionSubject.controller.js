const SectionSubjectService = require('../services/sectionSubject.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Bulk assign subjects to sections
 */
const bulkAssign = async (req, res) => {
  try {
    const { role } = req.user;
    const { assignments } = req.body;

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return errorResponse(res, 'Assignments array is required', 400);
    }

    // Only admins/zonal/superadmin can assign
    if (!['Admin', 'Superadmin', 'Zonaladmin'].includes(role)) {
      return errorResponse(res, 'Only admins can assign subjects to sections', 403);
    }

    const result = await SectionSubjectService.bulkAssign(assignments);
    return successResponse(res, 'Subjects assigned to sections (insert only)', { result });
  } catch (error) {
    logger.error('CONTROLLER: bulkAssign section_subjects error', error);
    return errorResponse(res, error.message || 'Failed to assign subjects to sections', 500);
  }
};

const listBySections = async (req, res) => {
  try {
    const { section_ids } = req.query;
    const list = await SectionSubjectService.listBySectionIds(
      (section_ids || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(n => parseInt(n))
        .filter(n => !isNaN(n))
    );
    return successResponse(res, 'Section-subject mappings fetched', { assignments: list });
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch mappings', 500);
  }
};

module.exports = { bulkAssign, listBySections };

/**
 * Unassign subjects from a section
 */
const unassign = async (req, res) => {
  try {
    const { role } = req.user;
    const { section_id, subject_ids } = req.body;

    if (!['Admin', 'Superadmin', 'Zonaladmin'].includes(role)) {
      return errorResponse(res, 'Only admins can unassign subjects from sections', 403);
    }

    if (!section_id || !Array.isArray(subject_ids)) {
      return errorResponse(res, 'section_id and subject_ids array are required', 400);
    }

    const result = await SectionSubjectService.unassign(section_id, subject_ids);
    return successResponse(res, 'Subjects unassigned from section', { result });
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to unassign subjects', 500);
  }
};

module.exports.unassign = unassign;
