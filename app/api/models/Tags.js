/**
 * Tags.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  connection: 'resourceMongodbServer',
  tableName: 'tags',
  attributes: {
    _boss  : {
      type  : 'string',
      required  : true
    },
    href : {
      type  : 'string',
      required  : true
    },
    data_index : {
      type  : 'int',
      required  : true
    },
    data_type : {
      type  : 'string',
      required  : true
    },
    show : {
      type  : 'string',
      required  : true
    },
    _parentBoss :{
      type  : 'string',
      required  : true
    }
  },
  autoCreatedAt: true,

  autoUpdatedAt: true,

  populate: false,
};

