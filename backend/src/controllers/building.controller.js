const buildingService = require('../services/building.service');

// ==================== BUILDING CONTROLLER METHODS ====================

/**
 * Get all buildings for the current campus
 * Access: Everyone can view buildings
 */
const getAllBuildings = async (req, res) => {
    try {
        const campusId = req.user.campusId;
        
        // Enhanced campus ID validation
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

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
 * Access: Admin only
 */
const createBuilding = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only admins can create buildings.'
            });
        }

        const { building_name, number_of_floors } = req.body;
        
        // Use campus ID from authenticated user context
        const campusId = req.user.campusId;
        
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }
        
        // Validate required fields
        if (!building_name || number_of_floors === undefined || number_of_floors === null) {
            return res.status(400).json({
                success: false,
                message: 'Building name and number of floors are required'
            });
        }

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
        
        // Handle specific validation errors
        if (error.message === 'Building name and number of floors are required' || 
            error.message === 'Building name must be a non-empty string' || 
            error.message === 'Building name must be 100 characters or less' ||
            error.message === 'Number of floors must be between 1 and 200' ||
            error.message === 'A building with this name already exists in the campus') {
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
 * Access: Admin only
 */
const updateBuilding = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only admins can update buildings.'
            });
        }

        const { id } = req.params;
        const campusId = req.user.campusId;
        
        // Enhanced campus ID validation
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        // Enhanced building ID validation
        if (!id || id.trim() === '' || id === 'undefined' || id === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid building ID is required'
            });
        }

        const { building_name, number_of_floors } = req.body;
        
        // Validate required fields
        if (!building_name || number_of_floors === undefined || number_of_floors === null) {
            return res.status(400).json({
                success: false,
                message: 'Building name and number of floors are required'
            });
        }

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
        
        // Handle specific validation errors
        if (error.message === 'Building not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'Building name and number of floors are required' || 
            error.message === 'Building name must be a non-empty string' || 
            error.message === 'Building name must be 100 characters or less' ||
            error.message === 'Number of floors must be between 1 and 200' ||
            error.message === 'A building with this name already exists in the campus') {
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
 * Access: Admin only
 */
const deleteBuilding = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only admins can delete buildings.'
            });
        }

        const { id } = req.params;
        const campusId = req.user.campusId;
        
        // Enhanced campus ID validation
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        // Enhanced building ID validation
        if (!id || id.trim() === '' || id === 'undefined' || id === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid building ID is required'
            });
        }

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
        
        // Enhanced campus ID validation
        if (!campusId || campusId.trim() === '' || campusId === 'undefined' || campusId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        // Enhanced building ID validation
        if (!id || id.trim() === '' || id === 'undefined' || id === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid building ID is required'
            });
        }

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