/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': {
    view: 'homepage'
  },


  //第一版抓腾讯
  //抓取页面链接
  'get /saveHref': 'HrefController.saveHref',

  //抓取分类链接
  'get /saveFilterTags/:_boss': 'HrefController.saveFilterTags',

  //抓取类型
  'get /saveTags/:_boss': 'HrefController.saveTags',

  //抓取影视列表
  'get /getSourceList/:type': 'HrefController.getSourceList',

  //抓影视详情
  'get /saveVideoDetails/:videoId': 'HrefController.saveVideoDetails',


  //第二版抓腾讯
  //抓取页面链接
  'get /saveHref2': 'HrefsController.saveHref',

  //抓取分类链接
  'get /saveFilterTags2/:_boss': 'HrefsController.saveFilterTags',

  //抓取类型
  'get /saveTags2/:_boss': 'HrefsController.saveTags',

  //拼接影视列表Links
  'get /getSourceLink2/:type/:step': 'HrefsController.getSourceLink',

  //抓取影视列表
  'get /getSource/:type': 'HrefsController.getSource',


  //抓影视详情
  'get /saveVideoDetails2/:videoId': 'HrefsController.saveVideoDetails',

  //抓取演员详情
  'get /getStarInfo2/:actorId' : 'HrefsController.getStarInfo',

  //拼接抓电视剧链接
  'get /getTvLink2/:type/:step': 'TvController.getSourceLink',

  //抓取电视剧列表
  'get /getTvSource/:type': 'TvController.getSource',

  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the custom routes above, it   *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

};
