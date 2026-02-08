const campusService = require('../services/campus.service');

const getAllCampuses = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        
        // Enhanced tenant ID validation
        if (!tenantId || tenantId.trim() === '' || tenantId === 'undefined' || tenantId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid tenant ID is required'
            });
        }

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
        
        if (!tenantId || tenantId.trim() === '' || tenantId === 'undefined' || tenantId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid tenant ID is required'
            });
        }
        
        // Validate required fields
        if (!campus_name || !address || !phone_number || !email || is_main_campus === undefined || !year_established || !no_of_floors) {
            console.log('Missing required fields:', req.body);
            return res.status(400).json({
                success: false,
                message: `All fields are required: campus_name, address, phone_number, email, is_main_campus, year_established, no_of_floors`
            });
        }

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
        
        // Handle specific validation errors
        if (error.message === 'Missing required fields' || error.message === 'Invalid email format' || error.message === 'Invalid school phone number format. Must be a valid Indian phone number (e.g., +91 9876543210 or 011-12345678)' || error.message === 'Number of floors must be a positive integer and less than 200' || error.message.startsWith('Year founded must be a valid year')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        console.error('Unexpected error in registerCampus controller:', error);
        
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
        
        // Enhanced tenant ID validation
        if (!tenantId || tenantId.trim() === '' || tenantId === 'undefined' || tenantId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid tenant ID is required'
            });
        }

        // Enhanced campus ID validation
        if (!id || id.trim() === '' || id === 'undefined' || id === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

        const { 
            campus_name,
            address,
            phone_number,
            email,
            is_main_campus,
            year_established,
            no_of_floors
        } = req.body;
        
        // Validate required fields
        if (!campus_name || !address || !phone_number || !email || is_main_campus === undefined || !year_established || !no_of_floors) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: campus_name, address, phone_number, email, is_main_campus, year_established, no_of_floors'
            });
        }

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
        
        if (error.message === 'Missing required fields' || error.message === 'Invalid email format' || error.message === 'Invalid school phone number format. Must be a valid Indian phone number (e.g., +91 9876543210 or 011-12345678)' || error.message === 'Number of floors must be a positive integer and less than 200' || error.message.startsWith('Year founded must be a valid year')) {
            return res.status(400).json({
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
        
        // Enhanced tenant ID validation
        if (!tenantId || tenantId.trim() === '' || tenantId === 'undefined' || tenantId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid tenant ID is required'
            });
        }

        // Enhanced campus ID validation
        if (!id || id.trim() === '' || id === 'undefined' || id === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

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
        
        // Enhanced tenant ID validation
        if (!tenantId || tenantId.trim() === '' || tenantId === 'undefined' || tenantId === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid tenant ID is required'
            });
        }

        // Enhanced campus ID validation
        if (!id || id.trim() === '' || id === 'undefined' || id === null) {
            return res.status(400).json({
                success: false,
                message: 'Valid campus ID is required'
            });
        }

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