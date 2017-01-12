/**
 * Video.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  connection: 'resourceMongodbServer',
  tableName: 'video',
  attributes: {
    video_id  : {
      type  : 'string',
      required  : true
    },
    imgUrl : {
      type  : 'string',
      required  : true
    },
    video_name : {
      type  : 'string',
      required  : false
    }
  },
  autoCreatedAt: true,

  autoUpdatedAt: true,

  populate: false,
};

