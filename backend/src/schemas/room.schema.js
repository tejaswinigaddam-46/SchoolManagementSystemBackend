const Joi = require('joi');

const userContext = Joi.object({
  campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const params = {
  id: Joi.number().integer().min(1).required(),
  buildingId: Joi.number().integer().min(1).required()
};

const createRoomBody = Joi.object({
  building_id: Joi.number().integer().min(1).required(),
  room_number: Joi.string().trim().min(1).max(20).required(),
  floor_number: Joi.number().integer().min(0).max(200).required(),
  room_type: Joi.string().trim().min(1).required(),
  capacity: Joi.number().integer().min(1).max(1000).allow(null).optional()
}).unknown(true);

const updateRoomBody = Joi.object({
  room_number: Joi.string().trim().min(1).max(20).optional(),
  floor_number: Joi.number().integer().min(0).max(200).optional(),
  room_type: Joi.string().trim().min(1).optional(),
  capacity: Joi.number().integer().min(1).max(1000).allow(null).optional()
}).min(1).unknown(true);

module.exports = {
  getAllRooms: {
    user: userContext
  },
  getRoomById: {
    user: userContext,
    params: Joi.object({ id: params.id })
  },
  getRoomsByBuilding: {
    user: userContext,
    params: Joi.object({ buildingId: params.buildingId })
  },
  getRoomTypes: {
    user: userContext
  },
  createRoom: {
    user: userContext,
    body: createRoomBody
  },
  updateRoom: {
    user: userContext,
    params: Joi.object({ id: params.id }),
    body: updateRoomBody
  },
  deleteRoom: {
    user: userContext,
    params: Joi.object({ id: params.id })
  },
  getRoomStats: {
    user: userContext
  }
};
