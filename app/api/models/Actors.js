/**
 * Actors.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  connection: 'resourceMongodbServer',
  tableName: 'actors',
  attributes: {
    actor_id  : {
      type  : 'string',
      required  : true
    },
    actor_head_pic : {
      type  : 'string',
      required  : false
    },
    //姓名
    actor_name : {
      type  : 'string',
      required  : false
    },
    actor_ename : {
      type  : 'string',
      required  : false
    },
    sex : {
      type  : 'string',
      required  : false
    },
    birthday : {
      type  : 'string',
      required  : false
    },
    nation : {
      type  : 'string',
      required  : false
    },
    hobby : {
      type  : 'string',
      required  : false
    },
    blood_type : {
      type  : 'string',
      required  : false
    },
    //星座
    constellation : {
      type  : 'string',
      required  : false
    },
    height : {
      type  : 'string',
      required  : false
    },
    description : {
      type  : 'string',
      required  : false
    },
    area : {
      type  : 'string',
      required  : false
    },
    job : {
      type  : 'string',
      required  : false
    },
    actor_oname : {
      type  : 'string',
      required  : false
}
  },
  autoCreatedAt: true,

  autoUpdatedAt: true,

  populate: false,
};

