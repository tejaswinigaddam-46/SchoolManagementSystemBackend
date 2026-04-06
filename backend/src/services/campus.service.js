const campusModel = require('../models/campus.model');

const getAllCampuses = async (tenantId) => {
    try {
        const campuses = await campusModel.getAllCampuses(tenantId);
        return campuses;
    } catch (error) {
        throw error;
    }
};

const createCampus = async (campusData) => {
    console.log('Creating campus with data:', campusData);

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
