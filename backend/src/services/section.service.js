const SectionModel = require('../models/section.model');
const RoomModel = require('../models/room.model');
const logger = require('../utils/logger');

/**
 * Section Service: Business logic for section management
 */
const SectionService = {
    /**
     * Create a new section
     */
    async createSection(sectionData, tenantId, campusId) {
        try {
            // Validate required fields - curriculum_id is now optional
            if (!sectionData.academic_year_id || !sectionData.class_id || 
                !sectionData.section_name) {
                throw new Error('Academic year, class, and section name are required');
            }

            // Prepare section data with campus ID
            const sectionPayload = {
                ...sectionData,
                campus_id: campusId
            };

            // Validate foreign key references
            await SectionModel.validateReferences(sectionPayload);

            // Check if section already exists for the same academic year, class, and campus
            const sectionExists = await SectionModel.checkSectionExists(sectionPayload);
            if (sectionExists) {
                throw new Error(`Section '${sectionData.section_name}' already exists for this academic year and class`);
            }

            if (sectionPayload.room_id) {
                const roomRes = await RoomModel.getRoomById(sectionPayload.room_id, campusId);
                const status = roomRes?.data?.status;
                if (status === 'booked') {
                    throw new Error('Selected room is already booked');
                }
            }

            const newSection = await SectionModel.create(sectionPayload);

            if (newSection.room_id) {
                try {
                    const roomRes = await RoomModel.getRoomById(newSection.room_id, campusId);
                    const roomCap = roomRes?.data?.capacity ?? null;
                    const secCap = newSection.capacity ?? 0;
                    const availableCapacity = roomCap == null ? null : Math.max(0, parseInt(roomCap) - parseInt(secCap || 0));
                    await RoomModel.setRoomBookingStatus(newSection.room_id, campusId, 'booked', availableCapacity);
                } catch (e) {
                    logger.error('Failed to update room booking after section creation', e);
                }
            }
            
            logger.info('Section created successfully', {
                sectionId: newSection.section_id,
                sectionName: newSection.section_name,
                tenantId,
                campusId
            });

            return newSection;
        } catch (error) {
            logger.error('Error in createSection service:', error);
            throw error;
        }
    },

    /**
     * Get all sections with pagination and filtering
     */
    async getAllSections(tenantId, campusId, filters = {}) {
        try {
            const result = await SectionModel.getAllSections(campusId, tenantId, filters);
            
            logger.info('Sections retrieved successfully', {
                count: result.sections.length,
                totalCount: result.pagination.total_count,
                tenantId,
                campusId
            });

            return result;
        } catch (error) {
            logger.error('Error in getAllSections service:', error);
            throw error;
        }
    },

    /**
     * Get section by ID
     */
    async getSectionById(sectionId, tenantId, campusId) {
        try {
            if (!sectionId || isNaN(parseInt(sectionId))) {
                throw new Error('Valid section ID is required');
            }

            const section = await SectionModel.getById(parseInt(sectionId), campusId);
            
            if (!section) {
                throw new Error('Section not found');
            }

            logger.info('Section retrieved by ID', {
                sectionId,
                sectionName: section.section_name,
                tenantId,
                campusId
            });

            return section;
        } catch (error) {
            logger.error('Error in getSectionById service:', error);
            throw error;
        }
    },

    /**
     * Get subjects for a section
     */
    async getSectionSubjects(sectionId, tenantId, campusId) {
        try {
            if (!sectionId || isNaN(parseInt(sectionId))) {
                throw new Error('Valid section ID is required');
            }

            // Verify section exists and belongs to campus
            const section = await SectionModel.getById(parseInt(sectionId), campusId);
            if (!section) {
                throw new Error('Section not found');
            }

            const subjects = await SectionModel.getSubjects(parseInt(sectionId), campusId);
            
            // Format the response
            return subjects.map(s => ({
                section_subject_id: s.section_subject_id,
                subject_id: s.subject_id,
                subject_name: s.subject_name,
                subject_code: s.subject_code,
                teacher_user_id: s.teacher_user_id,
                teacher_name: s.teacher_user_id ? `${s.teacher_first_name} ${s.teacher_last_name}`.trim() : null
            }));
        } catch (error) {
            logger.error('Error in getSectionSubjects service:', error);
            throw error;
        }
    },

    /**
     * Update section
     */
    async updateSection(sectionId, sectionData, tenantId, campusId) {
        try {
            if (!sectionId || isNaN(parseInt(sectionId))) {
                throw new Error('Valid section ID is required');
            }

            // Check if section exists
            const existingSection = await SectionModel.getById(parseInt(sectionId), campusId);
            if (!existingSection) {
                throw new Error('Section not found');
            }

            // Prepare update data (excluding undefined/null values)
            const updateData = {};
            const allowedFields = [
                'academic_year_id', 'class_id', 'section_name',
                'room_id', 'primary_teacher_user_id', 'student_monitor_user_id', 'capacity'
            ];

            for (const field of allowedFields) {
                if (sectionData.hasOwnProperty(field)) {
                    updateData[field] = sectionData[field];
                }
            }

            if (Object.keys(updateData).length === 0) {
                throw new Error('No valid fields to update');
            }

            // Validate foreign key references if they are being updated
            if (updateData.academic_year_id || updateData.class_id || updateData.curriculum_id ||
                updateData.room_id || updateData.primary_teacher_user_id || updateData.student_monitor_user_id) {
                
                const validationData = {
                    academic_year_id: updateData.academic_year_id || existingSection.academic_year_id,
                    class_id: updateData.class_id || existingSection.class_id,
                    curriculum_id: updateData.curriculum_id || existingSection.curriculum_id,
                    campus_id: campusId,
                    room_id: updateData.room_id,
                    primary_teacher_user_id: updateData.primary_teacher_user_id,
                    student_monitor_user_id: updateData.student_monitor_user_id
                };

                await SectionModel.validateReferences(validationData);
            }

            // Check for duplicate section name if section_name, academic_year_id, or class_id is being updated
            if (updateData.section_name || updateData.academic_year_id || updateData.class_id) {
                const duplicateCheckData = {
                    academic_year_id: updateData.academic_year_id || existingSection.academic_year_id,
                    class_id: updateData.class_id || existingSection.class_id,
                    campus_id: campusId,
                    section_name: updateData.section_name || existingSection.section_name
                };

                const sectionExists = await SectionModel.checkSectionExists(duplicateCheckData, parseInt(sectionId));
                if (sectionExists) {
                    throw new Error(`Section '${duplicateCheckData.section_name}' already exists for this academic year and class`);
                }
            }

            if (updateData.room_id && updateData.room_id !== existingSection.room_id) {
                const roomRes = await RoomModel.getRoomById(updateData.room_id, campusId);
                const status = roomRes?.data?.status;
                if (status === 'booked') {
                    throw new Error('Selected room is already booked');
                }
            }

            // Update the section
            const updatedSection = await SectionModel.update(parseInt(sectionId), updateData, campusId);
            
            if (!updatedSection) {
                throw new Error('Section not found or could not be updated');
            }

            try {
                const cap = updateData.capacity != null ? parseInt(updateData.capacity) : (existingSection.capacity != null ? parseInt(existingSection.capacity) : null);
                const rid = updateData.room_id || existingSection.room_id;
                if (rid && cap != null) {
                    const roomRes = await RoomModel.getRoomById(rid, campusId);
                    const roomCap = roomRes?.data?.capacity != null ? parseInt(roomRes.data.capacity) : null;
                    if (roomCap != null && cap > roomCap) {
                        throw new Error(`Section capacity (${cap}) cannot exceed room capacity (${roomCap})`);
                    }
                }
            } catch (validationError) {
                logger.error('Capacity validation failed in updateSection:', validationError);
                throw validationError;
            }

            logger.info('Section updated successfully', {
                sectionId: updatedSection.section_id,
                sectionName: updatedSection.section_name,
                updatedFields: Object.keys(updateData),
                tenantId,
                campusId
            });

            return updatedSection;
        } catch (error) {
            logger.error('Error in updateSection service:', error);
            throw error;
        }
    },

    /**
     * Delete section
     */
    async deleteSection(sectionId, tenantId, campusId) {
        try {
            if (!sectionId || isNaN(parseInt(sectionId))) {
                throw new Error('Valid section ID is required');
            }

            // Check if section exists
            const existingSection = await SectionModel.getById(parseInt(sectionId), campusId);
            if (!existingSection) {
                throw new Error('Section not found');
            }

            // Delete the section (will check for enrolled students)
            const deletedSection = await SectionModel.delete(parseInt(sectionId), campusId);
            
            if (!deletedSection) {
                throw new Error('Section could not be deleted');
            }

            logger.info('Section deleted successfully', {
                sectionId: deletedSection.section_id,
                sectionName: existingSection.section_name,
                tenantId,
                campusId
            });
            try {
                if (existingSection.room_id) {
                    const roomRes = await RoomModel.getRoomById(existingSection.room_id, campusId);
                    const roomCap = roomRes?.data?.capacity ?? null;
                    const availableCapacity = roomCap == null ? null : parseInt(roomCap);
                    await RoomModel.setRoomBookingStatus(existingSection.room_id, campusId, 'available', availableCapacity);
                }
            } catch (e) {
                logger.error('Failed to reset room booking after section deletion', e);
            }

            return { section_id: deletedSection.section_id };
        } catch (error) {
            logger.error('Error in deleteSection service:', error);
            throw error;
        }
    },

    /**
     * Get section statistics
     */
    async getSectionStatistics(tenantId, campusId) {
        try {
            const statistics = await SectionModel.getStatistics(campusId);
            
            logger.info('Section statistics retrieved', {
                statistics,
                tenantId,
                campusId
            });

            return statistics;
        } catch (error) {
            logger.error('Error in getSectionStatistics service:', error);
            throw error;
        }
    }
};

module.exports = SectionService;