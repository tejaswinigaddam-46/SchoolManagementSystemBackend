const Joi = require('joi');

const userContext = Joi.object({
  campusId: Joi.string().trim().uuid().invalid('undefined').required()
}).unknown(true);

const params = {
  id: Joi.number().integer().min(1).required()
};

const buildingPayload = {
  building_name: Joi.string().trim().min(1).max(100).required(),
  number_of_floors: Joi.number().integer().min(1).max(200).required()
};

module.exports = {
  getAllBuildings: {
    user: userContext
  },
  getBuildingById: {
    user: userContext,
    params: Joi.object({
      id: params.id
    })
  },
  createBuilding: {
    user: userContext,
    body: Joi.object(buildingPayload)
  },
  updateBuilding: {
    user: userContext,
    params: Joi.object({
      id: params.id
    }),
    body: Joi.object(buildingPayload)
  },
  deleteBuilding: {
    user: userContext,
    params: Joi.object({
      id: params.id
    })
  }
};
