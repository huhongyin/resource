/**
 * VideoDetails.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  connection: 'resourceMongodbServer',
  tableName: 'video_details',
  attributes: {
    video_id  : {
      type  : 'string',
      required  : true
    },
    video_img : {
      type  : 'string',
      required  : true
    },
    video_score : {
      type  : 'string',
      required  : false
    },
    db_score : {
      type  : 'string',
      required  : false
    },
    video_cname : {
      type  : 'string',
      required  : false
    },
    video_ename : {
      type  : 'string',
      required  : false
    },
    video_type : {
      type  : 'string',
      required  : false
    },
    video_other_name : {
      type  : 'string',
      required  : false
    },
    area : {
      type  : 'string',
      required  : false
    },
    language : {
      type  : 'string',
      required  : false
    },
    date : {
      type  : 'string',
      required  : false
    },
    tags : {
      type  : 'string',
      required  : false
    },
    actor : {
      type  : 'string',
      required  : false
    }
  },
  autoCreatedAt: true,

  autoUpdatedAt: true,

  populate: false,
};

