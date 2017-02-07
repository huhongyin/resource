/**
 * Links.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  connection: 'resourceMongodbServer',
  tableName: 'links',
  attributes: {
    type  : {
      type  : 'string',
      required  : true
    },
    link : {
      type  : 'string',
      required  : true
    },
    step : {
      type : 'string',
      required : false
    }
  },
  autoCreatedAt: true,

  autoUpdatedAt: true,

  populate: false,
};

