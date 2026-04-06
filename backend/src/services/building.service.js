const buildingModel = require('../models/building.model');

// ==================== BUILDING SERVICE METHODS ====================

/**
 * Get all buildings for a specific campus
 */
const getAllBuildings = async (campusId) => {
    try {
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
        const floors = parseInt(buildingData.number_of_floors);

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
        const floors = parseInt(buildingData.number_of_floors);

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
