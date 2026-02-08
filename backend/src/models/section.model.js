const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Section Model: Handles database interactions for the `class_sections` table.
 */
const SectionModel = {
    /**
     * Create a new section
     */
    async create(sectionData, client = pool) {
        try {
            const query = `
                INSERT INTO class_sections (
                    academic_year_id, class_id, campus_id, 
                    section_name, room_id, primary_teacher_user_id, 
                    student_monitor_user_id, capacity
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8 )
                RETURNING *;
            `;
            
            const values = [
                sectionData.academic_year_id,
                sectionData.class_id,
                sectionData.campus_id,
                sectionData.section_name,
                sectionData.room_id,
                sectionData.primary_teacher_user_id,
                sectionData.student_monitor_user_id,
                sectionData.capacity
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Error creating section:', error);
            throw new Error('Failed to create section.');
        }
    },

    /**
     * Get all sections with pagination and filtering
     */
    async getAllSections(campusId, tenantId, filters = {}, client = pool) {
        try {
            let query = `
                SELECT 
                    cs.section_id,
                    cs.academic_year_id,
                    cs.class_id,
                    cs.campus_id,
                    cs.section_name,
                    cs.room_id,
                    cs.primary_teacher_user_id,
                    cs.student_monitor_user_id,
                    cs.capacity,
                    ay.year_name,
                    ay.medium,
                    c.class_name,
                    cr.room_number,
                    pt.first_name as primary_teacher_first_name,
                    pt.last_name as primary_teacher_last_name,
                    sm.first_name as student_monitor_first_name,
                    sm.last_name as student_monitor_last_name,
                    curr.curriculum_name,
                    curr.curriculum_code
                FROM class_sections cs
                LEFT JOIN academic_years ay ON cs.academic_year_id = ay.academic_year_id
                LEFT JOIN curricula curr ON ay.curriculum_id = curr.curriculum_id
                LEFT JOIN classes c ON cs.class_id = c.class_id
                LEFT JOIN campus_rooms cr ON cs.room_id = cr.room_id
                LEFT JOIN users pt ON cs.primary_teacher_user_id = pt.user_id
                LEFT JOIN users sm ON cs.student_monitor_user_id = sm.user_id
                WHERE cs.campus_id = $1
            `;
            
            const values = [campusId];
            let paramIndex = 2;

            // Add academic year filter
            if (filters.academic_year_id) {
                query += ` AND cs.academic_year_id = $${paramIndex}`;
                values.push(filters.academic_year_id);
                paramIndex++;
            }

            // Add class filter
            if (filters.class_id) {
                query += ` AND cs.class_id = $${paramIndex}`;
                values.push(filters.class_id);
                paramIndex++;
            }

            // Add search filter
            if (filters.search) {
                query += ` AND (cs.section_name ILIKE $${paramIndex} OR c.class_name ILIKE $${paramIndex} OR ay.year_name ILIKE $${paramIndex} OR curr.curriculum_name ILIKE $${paramIndex})`;
                values.push(`%${filters.search}%`);
                paramIndex++;
            }

            // Get total count
            const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM');
            const countResult = await client.query(countQuery, values);
            const totalCount = parseInt(countResult.rows[0].count);

            // Add pagination
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const offset = (page - 1) * limit;

            // Add ordering and pagination
            query += ` ORDER BY ay.year_name DESC, c.class_name, cs.section_name`;
            query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            values.push(limit, offset);

            const result = await client.query(query, values);

            return {
                sections: result.rows,
                pagination: {
                    current_page: page,
                    total_pages: Math.ceil(totalCount / limit),
                    total_count: totalCount,
                    per_page: limit
                }
            };
        } catch (error) {
            logger.error('Error getting all sections:', error);
            throw new Error('Failed to get sections.');
        }
    },

    /**
     * Get section by ID
     */
    async getById(sectionId, campusId, client = pool) {
        try {
            const query = `
                SELECT 
                    cs.section_id,
                    cs.academic_year_id,
                    cs.class_id,
                    cs.campus_id,
                    cs.section_name,
                    cs.room_id,
                    cs.primary_teacher_user_id,
                    cs.student_monitor_user_id,
                    cs.capacity,
                    ay.year_name,
                    ay.medium,
                    c.class_name,
                    cr.room_number,
                    pt.first_name as primary_teacher_first_name,
                    pt.last_name as primary_teacher_last_name,
                    sm.first_name as student_monitor_first_name,
                    sm.last_name as student_monitor_last_name,
                    curr.curriculum_name,
                    curr.curriculum_code
                FROM class_sections cs
                LEFT JOIN academic_years ay ON cs.academic_year_id = ay.academic_year_id
                LEFT JOIN curricula curr ON ay.curriculum_id = curr.curriculum_id
                LEFT JOIN classes c ON cs.class_id = c.class_id
                LEFT JOIN campus_rooms cr ON cs.room_id = cr.room_id
                LEFT JOIN users pt ON cs.primary_teacher_user_id = pt.user_id
                LEFT JOIN users sm ON cs.student_monitor_user_id = sm.user_id
                WHERE cs.section_id = $1 AND cs.campus_id = $2
            `;

            const result = await client.query(query, [sectionId, campusId]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Error getting section by ID:', error);
            throw new Error('Failed to get section.');
        }
    },

    /**
     * Update section
     */
    async update(sectionId, sectionData, campusId, client = pool) {
        try {
            const fields = [];
            const values = [];
            let index = 1;

            for (const [key, value] of Object.entries(sectionData)) {
                if (value !== undefined && value !== null && value !== '') {
                    fields.push(`${key} = $${index}`);
                    values.push(value);
                    index++;
                } else if (value === null || value === '') {
                    // Handle nullable fields
                    if (['room_id', 'primary_teacher_user_id', 'student_monitor_user_id', 'capacity'].includes(key)) {
                        fields.push(`${key} = NULL`);
                    }
                }
            }

            if (fields.length === 0) {
                throw new Error('No valid fields to update');
            }

            const query = `
                UPDATE class_sections
                SET ${fields.join(', ')}
                WHERE section_id = $${index} AND campus_id = $${index + 1}
                RETURNING *;
            `;
            values.push(sectionId, campusId);

            const result = await client.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Error updating section:', error);
            throw new Error('Failed to update section.');
        }
    },

    /**
     * Delete section
     */
    async delete(sectionId, campusId, client = pool) {
        try {
            // First check if section has enrolled students
            const studentCheckQuery = `
                SELECT COUNT(*) as student_count
                FROM student_enrollment
                WHERE section_id = $1
            `;
            const studentResult = await client.query(studentCheckQuery, [sectionId]);
            
            if (parseInt(studentResult.rows[0].student_count) > 0) {
                throw new Error('Cannot delete section with enrolled students');
            }

            // Check if section has teachers assigned (primary teacher or subject-level teachers)
            const teacherCheckQuery = `
                SELECT (
                  SELECT COUNT(*) FROM class_sections WHERE section_id = $1 AND primary_teacher_user_id IS NOT NULL
                ) AS primary_count,
                (
                  SELECT COUNT(*) FROM section_subjects WHERE section_id = $1 AND teacher_user_id IS NOT NULL
                ) AS subject_teacher_count
            `;
            const teacherResult = await client.query(teacherCheckQuery, [sectionId]);
            const primaryCount = parseInt(teacherResult.rows[0].primary_count || 0);
            const subjectTeacherCount = parseInt(teacherResult.rows[0].subject_teacher_count || 0);
            if (primaryCount > 0 || subjectTeacherCount > 0) {
                throw new Error('Cannot delete section with assigned teachers');
            }

            // Remove section-subject assignments for this section (safe cleanup)
            const deleteAssignmentsQuery = `DELETE FROM section_subjects WHERE section_id = $1`;
            await client.query(deleteAssignmentsQuery, [sectionId]);

            const query = `
                DELETE FROM class_sections
                WHERE section_id = $1 AND campus_id = $2
                RETURNING section_id;
            `;

            const result = await client.query(query, [sectionId, campusId]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Error deleting section:', error);
            if (error.message.includes('Cannot delete section')) {
                throw error;
            }
            throw new Error('Failed to delete section.');
        }
    },

    /**
     * Check if section name exists for the same academic year, class, and campus
     */
    async checkSectionExists(sectionData, excludeSectionId = null, client = pool) {
        try {
            let query = `
                SELECT section_id
                FROM class_sections
                WHERE academic_year_id = $1 
                AND class_id = $2 
                AND campus_id = $3 
                AND section_name = $4
            `;
            const values = [
                sectionData.academic_year_id,
                sectionData.class_id,
                sectionData.campus_id,
                sectionData.section_name
            ];

            if (excludeSectionId) {
                query += ` AND section_id != $5`;
                values.push(excludeSectionId);
            }

            const result = await client.query(query, values);
            return result.rows.length > 0;
        } catch (error) {
            logger.error('Error checking section existence:', error);
            throw new Error('Failed to check section existence.');
        }
    },

    async isRoomBooked(roomId, academicYearId, campusId, client = pool) {
        try {
            const query = `
                SELECT section_id
                FROM class_sections
                WHERE room_id = $1
                AND academic_year_id = $2
                AND campus_id = $3
                LIMIT 1
            `;
            const result = await client.query(query, [roomId, academicYearId, campusId]);
            return result.rows.length > 0;
        } catch (error) {
            logger.error('Error checking room booking status:', error);
            throw new Error('Failed to check room booking status.');
        }
    },

    /**
     * Validate foreign key references
     */
    async validateReferences(sectionData, client = pool) {
        try {
            const validations = [];

            // Validate academic year 
            const academicYearQuery = `
                SELECT academic_year_id FROM academic_years 
                WHERE academic_year_id = $1 AND campus_id = $2
            `;
            validations.push(
                client.query(academicYearQuery, [
                    sectionData.academic_year_id,
                    sectionData.campus_id
                ]).then(result => ({
                    type: 'academic_year',
                    valid: result.rows.length > 0
                }))
            );

            // Validate class
            const classQuery = `
                SELECT class_id FROM classes 
                WHERE class_id = $1 AND campus_id = $2
            `;
            validations.push(
                client.query(classQuery, [sectionData.class_id, sectionData.campus_id])
                    .then(result => ({
                        type: 'class',
                        valid: result.rows.length > 0
                    }))
            );

            // Validate room (if provided)
            if (sectionData.room_id) {
                const roomQuery = `
                    SELECT room_id FROM campus_rooms 
                    WHERE room_id = $1 AND campus_id = $2
                `;
                validations.push(
                    client.query(roomQuery, [sectionData.room_id, sectionData.campus_id])
                        .then(result => ({
                            type: 'room',
                            valid: result.rows.length > 0
                        }))
                );
            }

            // Validate primary teacher (if provided)
            if (sectionData.primary_teacher_user_id) {
                const teacherQuery = `
                    SELECT u.user_id FROM users u
                    INNER JOIN user_statuses us ON u.username = us.username
                    WHERE u.user_id = $1 AND u.role = 'Teacher' 
                    AND us.campus_id = $2 AND us.status = 'active'
                `;
                validations.push(
                    client.query(teacherQuery, [sectionData.primary_teacher_user_id, sectionData.campus_id])
                        .then(result => ({
                            type: 'primary_teacher',
                            valid: result.rows.length > 0
                        }))
                );
            }

            // Validate student monitor (if provided)
            if (sectionData.student_monitor_user_id) {
                const studentQuery = `
                    SELECT u.user_id FROM users u
                    INNER JOIN user_statuses us ON u.username = us.username
                    WHERE u.user_id = $1 AND u.role = 'Student' 
                    AND us.campus_id = $2 AND us.status = 'active'
                `;
                validations.push(
                    client.query(studentQuery, [sectionData.student_monitor_user_id, sectionData.campus_id])
                        .then(result => ({
                            type: 'student_monitor',
                            valid: result.rows.length > 0
                        }))
                );
            }

            const results = await Promise.all(validations);
            const invalidReferences = results.filter(r => !r.valid);

            if (invalidReferences.length > 0) {
                const invalidTypes = invalidReferences.map(r => r.type).join(', ');
                throw new Error(`Invalid reference(s): ${invalidTypes}`);
            }

            return true;
        } catch (error) {
            logger.error('Error validating references:', error);
            throw error;
        }
    },

    /**
     * Get subjects and assigned teachers for a section
     */
    async getSubjects(sectionId, campusId, client = pool) {
        try {
            const query = `
                SELECT 
                    ss.section_subject_id,
                    ss.section_id,
                    ss.subject_id,
                    ss.teacher_user_id,
                    s.subject_name,
                    s.subject_code,
                    s.category,
                    u.first_name as teacher_first_name,
                    u.last_name as teacher_last_name,
                    u.username as teacher_username
                FROM section_subjects ss
                JOIN subjects s ON ss.subject_id = s.subject_id
                LEFT JOIN users u ON ss.teacher_user_id = u.user_id
                WHERE ss.section_id = $1
                ORDER BY s.subject_name
            `;
            // Note: section_subjects doesn't have campus_id directly, but subjects/sections do.
            // We trust the section_id belongs to the campus (verified by caller usually).
            // However, to be safe, we could join class_sections to verify campus.
            
            const result = await client.query(query, [sectionId]);
            return result.rows;
        } catch (error) {
            logger.error('Error getting section subjects:', error);
            throw new Error('Failed to get section subjects.');
        }
    },

    /**
     * Get section statistics
     */
    async getStatistics(campusId, client = pool) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_sections,
                    COUNT(DISTINCT cs.academic_year_id) as academic_years_count,
                    COUNT(DISTINCT cs.class_id) as classes_count,
                    COUNT(cs.primary_teacher_user_id) as sections_with_teachers,
                    COUNT(cs.room_id) as sections_with_rooms,
                    AVG(cs.capacity) as avg_capacity
                FROM class_sections cs
                WHERE cs.campus_id = $1
            `;

            const result = await client.query(query, [campusId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Error getting section statistics:', error);
            throw new Error('Failed to get section statistics.');
        }
    }
};

module.exports = SectionModel;