const campusModel = require('../models/campus.model');

const getAllCampuses = async (tenantId) => {
    try {
        // Enhanced tenant ID validation
        if (!tenantId || tenantId.trim() === '' || tenantId === 'undefined' || tenantId === null) {
            throw new Error('Valid tenant ID is required');
        }

        const campuses = await campusModel.getAllCampuses(tenantId);
        return campuses;
    } catch (error) {
        throw error;
    }
};

const createCampus = async (campusData) => {
    console.log('Creating campus with data:', campusData);
    
    // Enhanced tenant ID validation
    if (!campusData.tenant_id || campusData.tenant_id.trim() === '' || campusData.tenant_id === 'undefined' || campusData.tenant_id === null) {
        throw new Error('Valid tenant ID is required');
    }
    
    // validate all required fields
    if (!campusData.campus_name || !campusData.address || !campusData.phone_number || !campusData.email
        || campusData.is_main_campus === undefined || 
        !campusData.year_established || !campusData.no_of_floors || !campusData.tenant_id
    ) {
        throw new Error('Missing required fields');
    }

    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(campusData.year_established);
    if (isNaN(yearNum) || yearNum < 1500 || yearNum > currentYear) {
        throw new Error(`Year founded must be a valid year between 1500 and ${currentYear}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(campusData.email)) {
        throw new Error('Invalid email format');
    }

    // Validate tenant phone number format (Indian format, can be landline or mobile)
    const tenantPhoneRegex = /^(\+91|91)?[0-9]{10,11}$/;
    if (!tenantPhoneRegex.test(campusData.phone_number.replace(/[\s-]/g, ''))) {
        throw new Error('Invalid school phone number format. Must be a valid Indian phone number (e.g., +91 9876543210 or 011-12345678)');
    }

    if (!Number.isInteger(campusData.no_of_floors) || campusData.no_of_floors <= 0 || campusData.no_of_floors >= 200) {
        throw new Error('Number of floors must be a positive integer and less than 200');
    }

    try {
        // Pass the campusData object directly instead of creating a values array
        const newCampus = await campusModel.createCampus(campusData);
        if (!newCampus) {
            throw new Error('Failed to create campus');
        }

        return {
            campusData: newCampus, // Return the complete campus data from database including ID
            message: 'Campus created successfully'
        };
    } catch (error) {
        console.error('Error creating campus in service:', error);
        throw error;
    }
}

const updateCampus = async (campusId, campusData, tenantId) => {
    console.log('Updating campus with data:', campusData);
    
    // Enhanced tenant ID validation
    if (!tenantId || tenantId.trim() === '' || tenantId === 'undefined' || tenantId === null) {
        throw new Error('Valid tenant ID is required');
    }

    // Enhanced campus ID validation
    if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
        throw new Error('Valid campus ID is required');
    }
    
    // validate all required fields
    if (!campusData.campus_name || !campusData.address || !campusData.phone_number || !campusData.email
        || campusData.is_main_campus === undefined || 
        !campusData.year_established || !campusData.no_of_floors
    ) {
        throw new Error('Missing required fields');
    }

    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(campusData.year_established);
    if (isNaN(yearNum) || yearNum < 1500 || yearNum > currentYear) {
        throw new Error(`Year founded must be a valid year between 1500 and ${currentYear}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(campusData.email)) {
        throw new Error('Invalid email format');
    }

    // Validate tenant phone number format (Indian format, can be landline or mobile)
    const tenantPhoneRegex = /^(\+91|91)?[0-9]{10,11}$/;
    if (!tenantPhoneRegex.test(campusData.phone_number.replace(/[\s-]/g, ''))) {
        throw new Error('Invalid school phone number format. Must be a valid Indian phone number (e.g., +91 9876543210 or 011-12345678)');
    }

    if (!Number.isInteger(campusData.no_of_floors) || campusData.no_of_floors <= 0 || campusData.no_of_floors >= 200) {
        throw new Error('Number of floors must be a positive integer and less than 200');
    }

    try {
        // Check if campus exists
        const existingCampus = await campusModel.getCampusById(campusId, tenantId);
        if (!existingCampus) {
            throw new Error('Campus not found');
        }

        const updatedCampus = await campusModel.updateCampus(campusId, campusData, tenantId);
        if (!updatedCampus) {
            throw new Error('Failed to update campus');
        }

        return {
            campusData: updatedCampus,
            message: 'Campus updated successfully'
        };
    } catch (error) {
        console.error('Error updating campus in service:', error);
        throw error;
    }
};

const deleteCampus = async (campusId, tenantId) => {
    try {
        // Enhanced tenant ID validation
        if (!tenantId || tenantId.trim() === '' || tenantId === 'undefined' || tenantId === null) {
            throw new Error('Valid tenant ID is required');
        }

        // Enhanced campus ID validation
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        // Check if campus exists
        const existingCampus = await campusModel.getCampusById(campusId, tenantId);
        if (!existingCampus) {
            throw new Error('Campus not found');
        }

        const deletedCampus = await campusModel.deleteCampus(campusId, tenantId);
        if (!deletedCampus) {
            throw new Error('Failed to delete campus');
        }

        return {
            campusData: deletedCampus,
            message: 'Campus deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting campus in service:', error);
        throw error;
    }
};

const getCampusById = async (campusId, tenantId) => {
    try {
        // Enhanced tenant ID validation
        if (!tenantId || tenantId.trim() === '' || tenantId === 'undefined' || tenantId === null) {
            throw new Error('Valid tenant ID is required');
        }

        // Enhanced campus ID validation
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        const campus = await campusModel.getCampusById(campusId, tenantId);
        return campus;
    } catch (error) {
        console.error('Error getting campus by ID in service:', error);
        throw error;
    }
};

module.exports = {
    getAllCampuses,
    createCampus,
    updateCampus,
    deleteCampus,
    getCampusById
};