const buildingModel = require('../models/building.model');

// ==================== BUILDING SERVICE METHODS ====================

/**
 * Get all buildings for a specific campus
 */
const getAllBuildings = async (campusId) => {
    try {
        // Enhanced campus ID validation
        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        const buildings = await buildingModel.getAllBuildings(campusId);
        return buildings;
    } catch (error) {
        console.error('Error in getAllBuildings service:', error);
        throw error;
    }
};

/**
 * Create a new building with validation
 */
const createBuilding = async (buildingData) => {
    try {
        // Enhanced campus ID validation
        if (!buildingData.campus_id || buildingData.campus_id.toString().trim() === '' || buildingData.campus_id === 'undefined' || buildingData.campus_id === null) {
            throw new Error('Valid campus ID is required');
        }

        // Validate required fields
        if (!buildingData.building_name || !buildingData.number_of_floors) {
            throw new Error('Building name and number of floors are required');
        }

        // Validate building name
        if (typeof buildingData.building_name !== 'string' || buildingData.building_name.trim().length === 0) {
            throw new Error('Building name must be a non-empty string');
        }

        if (buildingData.building_name.trim().length > 100) {
            throw new Error('Building name must be 100 characters or less');
        }

        // Validate number of floors
        const floors = parseInt(buildingData.number_of_floors);
        if (isNaN(floors) || floors < 1 || floors > 200) {
            throw new Error('Number of floors must be between 1 and 200');
        }

        // Check if building name already exists in the campus
        const nameExists = await buildingModel.buildingNameExists(
            buildingData.building_name.trim(), 
            buildingData.campus_id
        );
        
        if (nameExists) {
            throw new Error('A building with this name already exists in the campus');
        }

        // Create building with validated data
        const validatedData = {
            campus_id: buildingData.campus_id,
            building_name: buildingData.building_name.trim(),
            number_of_floors: floors
        };

        const newBuilding = await buildingModel.createBuilding(validatedData);
        
        return {
            buildingData: newBuilding,
            message: 'Building created successfully'
        };
    } catch (error) {
        console.error('Error in createBuilding service:', error);
        throw error;
    }
};

/**
 * Update an existing building with validation
 */
const updateBuilding = async (buildingId, buildingData, campusId) => {
    try {
        // Enhanced validation
        if (!buildingId || buildingId.toString().trim() === '' || buildingId === 'undefined' || buildingId === null) {
            throw new Error('Valid building ID is required');
        }

        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        // Validate required fields
        if (!buildingData.building_name || !buildingData.number_of_floors) {
            throw new Error('Building name and number of floors are required');
        }

        // Validate building name
        if (typeof buildingData.building_name !== 'string' || buildingData.building_name.trim().length === 0) {
            throw new Error('Building name must be a non-empty string');
        }

        if (buildingData.building_name.trim().length > 100) {
            throw new Error('Building name must be 100 characters or less');
        }

        // Validate number of floors
        const floors = parseInt(buildingData.number_of_floors);
        if (isNaN(floors) || floors < 1 || floors > 200) {
            throw new Error('Number of floors must be between 1 and 200');
        }

        // Check if building exists
        const existingBuilding = await buildingModel.getBuildingById(buildingId, campusId);
        if (!existingBuilding) {
            throw new Error('Building not found');
        }

        // Check if new building name already exists (excluding current building)
        const nameExists = await buildingModel.buildingNameExists(
            buildingData.building_name.trim(), 
            campusId, 
            buildingId
        );
        
        if (nameExists) {
            throw new Error('A building with this name already exists in the campus');
        }

        // Update building with validated data
        const validatedData = {
            building_name: buildingData.building_name.trim(),
            number_of_floors: floors
        };

        const updatedBuilding = await buildingModel.updateBuilding(buildingId, validatedData, campusId);
        
        if (!updatedBuilding) {
            throw new Error('Building not found or update failed');
        }
        
        return {
            buildingData: updatedBuilding,
            message: 'Building updated successfully'
        };
    } catch (error) {
        console.error('Error in updateBuilding service:', error);
        throw error;
    }
};

/**
 * Delete a building
 */
const deleteBuilding = async (buildingId, campusId) => {
    try {
        // Enhanced validation
        if (!buildingId || buildingId.toString().trim() === '' || buildingId === 'undefined' || buildingId === null) {
            throw new Error('Valid building ID is required');
        }

        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        // Check if building exists before attempting to delete
        const existingBuilding = await buildingModel.getBuildingById(buildingId, campusId);
        if (!existingBuilding) {
            throw new Error('Building not found');
        }

        const deletedBuilding = await buildingModel.deleteBuilding(buildingId, campusId);
        
        if (!deletedBuilding) {
            throw new Error('Building not found or delete failed');
        }
        
        return {
            buildingData: deletedBuilding,
            message: 'Building deleted successfully'
        };
    } catch (error) {
        console.error('Error in deleteBuilding service:', error);
        throw error;
    }
};

/**
 * Get a building by ID
 */
const getBuildingById = async (buildingId, campusId) => {
    try {
        // Enhanced validation
        if (!buildingId || buildingId.toString().trim() === '' || buildingId === 'undefined' || buildingId === null) {
            throw new Error('Valid building ID is required');
        }

        if (!campusId || campusId.toString().trim() === '' || campusId === 'undefined' || campusId === null) {
            throw new Error('Valid campus ID is required');
        }

        const building = await buildingModel.getBuildingById(buildingId, campusId);
        return building;
    } catch (error) {
        console.error('Error in getBuildingById service:', error);
        throw error;
    }
};

module.exports = {
    getAllBuildings,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    getBuildingById
};