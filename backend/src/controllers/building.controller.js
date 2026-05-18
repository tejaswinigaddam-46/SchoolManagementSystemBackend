const buildingService = require('../services/building.service');

// ==================== BUILDING CONTROLLER METHODS ====================

/**
 * Get all buildings for the current campus
 * Access: Everyone can view buildings
 */
const getAllBuildings = async (req, res) => {
    try {
        const campusId = req.user.campusId;

        const buildings = await buildingService.getAllBuildings(campusId);
        
        res.status(200).json({
            success: true,
            message: 'Buildings retrieved successfully',
            data: buildings
        });
    } catch (error) {
        console.error('Error in getAllBuildings controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching buildings'
        });
    }
};

/**
 * Create a new building
 * Access: Requires building create permission
 */
const createBuilding = async (req, res) => {
    try {
        const { building_name, number_of_floors } = req.body;
        
        // Use campus ID from authenticated user context
        const campusId = req.user.campusId;

        const result = await buildingService.createBuilding({
            building_name,
            number_of_floors,
            campus_id: campusId
        });
        
        res.status(201).json({
            success: true,
            message: 'Building created successfully',
            data: {
                building: result.buildingData,
                message: result.message
            }
        });
    } catch (error) {
        console.error('Error in createBuilding controller:', error);

        if (error.message === 'A building with this name already exists in the campus') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating building'
        });
    }
};

/**
 * Update an existing building
 * Access: Requires building edit permission
 */
const updateBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const campusId = req.user.campusId;

        const { building_name, number_of_floors } = req.body;

        const result = await buildingService.updateBuilding(id, {
            building_name,
            number_of_floors
        }, campusId);
        
        res.status(200).json({
            success: true,
            message: 'Building updated successfully',
            data: {
                building: result.buildingData,
                message: result.message
            }
        });
    } catch (error) {
        console.error('Error in updateBuilding controller:', error);
        
        if (error.message === 'Building not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'A building with this name already exists in the campus') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while updating building'
        });
    }
};

/**
 * Delete a building
 * Access: Requires building delete permission
 */
const deleteBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const campusId = req.user.campusId;

        const result = await buildingService.deleteBuilding(id, campusId);
        
        res.status(200).json({
            success: true,
            message: 'Building deleted successfully',
            data: {
                building: result.buildingData,
                message: result.message
            }
        });
    } catch (error) {
        console.error('Error in deleteBuilding controller:', error);
        
        if (error.message === 'Building not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === '23503' && error.constraint === 'campus_rooms_building_id_fkey') {
            return res.status(400).json({
                success: false,
                message: 'Delete rooms associated with the building and then delete the building'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting building'
        });
    }
};

/**
 * Get a building by ID
 * Access: Everyone can view building details
 */
const getBuildingById = async (req, res) => {
    try {
        const { id } = req.params;
        const campusId = req.user.campusId;

        const building = await buildingService.getBuildingById(id, campusId);
        
        if (!building) {
            return res.status(404).json({
                success: false,
                message: 'Building not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Building retrieved successfully',
            data: building
        });
    } catch (error) {
        console.error('Error in getBuildingById controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching building'
        });
    }
};

module.exports = {
    getAllBuildings,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    getBuildingById
};
