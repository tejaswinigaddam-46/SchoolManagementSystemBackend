const campusService = require('../services/campus.service');

const getAllCampuses = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        const campuses = await campusService.getAllCampuses(tenantId);
        
        res.status(200).json({
            success: true,
            message: 'Campuses retrieved successfully',
            data: campuses
        });
    } catch (error) {
        console.error('Error in getAllCampuses controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching campuses'
        });
    }
};

const registerCampus = async (req, res) => {
    try {
        const { 
            campus_name,
            address,
            phone_number,
            email,
            is_main_campus,
            year_established,
            no_of_floors
        } = req.body;
        
        // Use tenant ID from authenticated user only
        const tenantId = req.user.tenantId;

        const result = await campusService.createCampus({
            campus_name,
            address,
            phone_number,
            email,
            is_main_campus,
            year_established,
            no_of_floors,
            tenant_id: tenantId
        });
        
        res.status(201).json({
            success: true,
            message: 'Campus registered successfully',
            data: {
                campus: result.campusData,
                message: result.message
            }
        });
    } catch (error) {
        console.error('Error in registerCampus controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while registering campus'
        });
    }
};

const updateCampus = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const { 
            campus_name,
            address,
            phone_number,
            email,
            is_main_campus,
            year_established,
            no_of_floors
        } = req.body;

        const result = await campusService.updateCampus(id, {
            campus_name,
            address,
            phone_number,
            email,
            is_main_campus,
            year_established,
            no_of_floors
        }, tenantId);
        
        res.status(200).json({
            success: true,
            message: 'Campus updated successfully',
            data: {
                campus: result.campusData,
                message: result.message
            }
        });
    } catch (error) {
        console.error('Error in updateCampus controller:', error);
        
        // Handle specific validation errors
        if (error.message === 'Campus not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while updating campus' + error.message 
        });
    }
};

const deleteCampus = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const result = await campusService.deleteCampus(id, tenantId);
        
        res.status(200).json({
            success: true,
            message: 'Campus deleted successfully',
            data: {
                campus: result.campusData,
                message: result.message
            }
        });
    } catch (error) {
        console.error('Error in deleteCampus controller:', error);
        
        if (error.message === 'Campus not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting campus'
        });
    }
};

const getCampusById = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenantId;

        const campus = await campusService.getCampusById(id, tenantId);
        
        if (!campus) {
            return res.status(404).json({
                success: false,
                message: 'Campus not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Campus retrieved successfully',
            data: campus
        });
    } catch (error) {
        console.error('Error in getCampusById controller:', error);
        
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching campus'
        });
    }
};

module.exports = {
    getAllCampuses,
    registerCampus,
    updateCampus,
    deleteCampus,
    getCampusById
};
