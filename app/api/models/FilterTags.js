/**
 * FilterTags.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  connection: 'resourceMongodbServer',
  tableName: 'filter_tags',
  attributes: {
    _boss  : {
      type  : 'string',
      required  : false
    },
    _stat  : {
      type  : 'string',
      required  : false
    },
    href : {
      type  : 'string',
      required  : true
    },
    description : {
      type  : 'string',
      required  : false
    }
  },
  autoCreatedAt: true,

  autoUpdatedAt: true,

  populate: false,
};

