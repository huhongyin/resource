/**
 * HrefController
 *
 * @description :: Server-side logic for managing hrefs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    testConn: function(req, res){
        var request = require("request");

        var options = {
            // proxy: {
            //   hostname: '218.64.147.10',
            //   port: '9000'
            // },
            url: 'http://v.qq.com/x/movielist/?cate=-1&offset=0&sort=4',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
            }
        };
        request(options, function (err, result) {
            if (err) {
                console.log(err);
            }
            console.log(result);

        });

        return res.send('success');
    },

    //保存主页链接
    saveHref: function (req, res){
        var cheerio = require("cheerio");
        var request = require("request");
        //引入model
        var hrefModel = require("../models/Href");
        var options = {
            // proxy: {
            //   hostname: '106.81.113.190',
            //   port: '8998'
            // },
            url: 'http://v.qq.com/x/movielist/?cate=-1&offset=0&sort=4',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
            }
        };
        request(options, function(err, result){
            if (err) {
                console.log(err);
            }
            var $ = cheerio.load(result.body);
            $('.side_navi .item a').each(function(index, element){
                var item = [];
                var _boss = $(element).attr('_boss');
                //if(_boss == 'movie' || _boss == 'tv' || _boss =='cartoon' || _boss == 'doco') {
                var href = '';
                if (_boss == 'tv') {
                    href = 'http://v.qq.com/x/teleplaylist/?sort=4&offset=0';
                } else if (_boss == 'cartoon') {
                    href = 'http://v.qq.com/x/cartoonlist/';
                } else if (_boss == 'doco') {
                    href = 'http://v.qq.com/x/documentarylist/';
                } else {
                    href = $(element).attr('href');
                }
                var show = $(element).text();
                //}else{
                //    _boss = '';
                //}
                item.push({ 'type' : _boss, 'url' : href, 'description' : show });
                //判断是否存在该数据
                Href.find({ 'url' : href}).exec(function (err, data){
                    if (data.length != 0) {
                        console.log('已经存在主页链接:' + href);
                    }else if(data.length == 0){
                        if(item[0] != null && item[0] != ''){
                            res.send(Href.create(item).exec(function (err, created) {
                                if (err) {
                                    console.log(err);
                                    return err;
                                }
                                console.log('添加主页链接成功:' + created.length);
                                return created.length;
                            }));
                        }
                    }
                });

            });
        });
    },

    //保存(最新上架、院线上映、最近热播、最受好评链接)
    saveFilterTags: function(req, res){
        var cheerio = require("cheerio");
        var request = require("request");
        //引入model
        var hrefModel = require("../models/Href");
        var filterModel = require("../models/FilterTags");
        //抓取数据的类型(电影、电视剧、动漫等的_boss, href等)
        var _parentBoss = req.param('_boss', '');
        var where = {};
        if(_parentBoss == 'all'){
            //默认抓全部
            where = { 'url': { '!' : ''} };
        }else if(_parentBoss != '' && typeof(_parentBoss) != 'undefined' && _parentBoss != null){
            //抓取指定网页的标签
            where = { 'type' : _parentBoss};
        }

        Href.find(where).exec(function (err, link){
            if(err){
                console.log(err);
                return err;
            }
            link.forEach(function(a, index){
                setTimeout(function(aItem){
                    var options = {
                        // proxy: {
                        //   hostname: '106.81.113.190',
                        //   port: '8998'
                        // },
                        url: aItem.url,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
                        }
                    };
                    //if(a.type == "movie") {
                    console.log(aItem.type);
                    request(options, function (err, result) {
                        if (err) {
                            console.log(err);
                            return err;
                        } else {
                            //将页面数据转换为jquery对象
                            var $ = cheerio.load(result.body);
                            $('.filter_tabs .item a').each(function (key, element) {
                                //电影类型a标签
                                var _boss = $(element).attr('_boss');
                                var href = $(element).attr('href');
                                var show = $(element).text();
                                var item = {
                                    '_boss': _boss,
                                    'href': href,
                                    'description': show,
                                    '_parentBoss': aItem.type
                                };
                                //保存到filter_tabs Collection
                                var childWhere = { 'href': href, '_parentBoss': aItem.type };
                                FilterTags.find(childWhere).exec(function (err, filter_tags) {
                                    if (filter_tags.length != 0) {
                                        console.log('已经存在相同链接的分类url：' + href);
                                        return err;
                                    }else if(filter_tags.length == 0) {
                                        FilterTags.create(item).exec(function (err, created) {
                                            if (err) {
                                                console.log(err);
                                                return err;
                                            } else {
                                                console.log('添加标签成功：' + created);
                                                return created;
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    });
                    // }
                }, ( index + 1) * 5000, a);
            });
        });
    },

    //保存(年份、地区、类型)
    saveTags: function(req, res){
        var cheerio = require("cheerio");
        var request = require("request");
        //引入model
        var hrefModel = require("../models/Href");
        var filterModel = require("../models/FilterTags");
        var tags = require("../models/Tags");
        //抓取数据的类型(电影、电视剧、动漫等的_boss, href等)
        var _parentBoss = req.param('_boss', '');
        var where = {};
        if(_parentBoss == 'all'){
            //默认抓全部
            where = { 'url': { '!' : ''} };
        }else if(_parentBoss != '' && typeof(_parentBoss) != 'undefined' && _parentBoss != null){
            //抓取指定网页的标签
            where = { 'type' : _parentBoss};
        }
        Href.find(where).exec(function (err, link){
            link.forEach(function(a, index){
                setTimeout(function(aItem){
                    var options = {
                        // proxy: {
                        //   hostname: '106.81.113.190',
                        //   port: '8998'
                        // },
                        url: aItem.url,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
                        }
                    };
                    //if(a.type == "movie") {
                    request(options, function (err, result) {
                        if (err) {
                            console.log(err);
                            return err;
                        } else {
                            //将页面数据转换为jquery对象
                            var $ = cheerio.load(result.body);
                            $('.mod_filter_list .item .tags_list a').each(function(index, element){
                                //电影类型a标签
                                //获取_boss
                                var _boss = $(element).attr('_boss');
                                var href = $(element).attr('href');
                                var data_index = $(element).attr('data-index');
                                var data_type = $(element).attr('data-type');
                                var show = $(element).text();
                                var item = { _boss : _boss, href : href, data_index : data_index, data_type : data_type, show : show, _parentBoss : aItem.type };
                                //保存到tabs Collection
                                Tags.find({
                                    'href': href,
                                    '_parentBoss': aItem.type,
                                    'data_index': data_index,
                                    'data_type': data_type,
                                    '_boss': _boss
                                }).exec(function (err, tags) {
                                    if (tags.length != 0) {
                                        console.log('已经存在相同的分类：' + href);
                                        return err;
                                    }else if(tags.length == 0) {
                                        Tags.create(item).exec(function (err, created) {
                                            if (err) {
                                                console.log(err);
                                                return err;
                                            } else {
                                                console.log('添加分类成功：' + created);
                                                return created;
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    });
                    // }
                }, ( index + 1) * 5000, a);
            });
        });
    },

    //抓取影视列表(通过参数抓取(all抓取全部))
    getSourceList:function(req, res){
        var cheerio = require("cheerio");
        var request = require("request");
        //引入model
        var hrefModel = require("../models/Href");
        var filterModel = require("../models/FilterTags");
        var tags = require("../models/Tags");
        //抓取数据的类型(电影、电视剧、动漫等的列表叶数据(1.数据库取出href 拼接参数然后获取条数抓取))
        var type = req.param('type', '');
        var where = {};
        if(type == 'all'){
            //默认抓全部
            where = { 'url': { '!' : ''} };
        }else if(type != '' && typeof(type) != 'undefined' && type != null){
            //抓取指定网页的标签
            where = { 'type' : type};
        }

        Href.find(where).exec(function(err, links){
            if(links.length == 0){
                return false;
            }else{
                links.forEach(function(link, index){
                    setTimeout(function(linkItem){
                        
                    }, (index + 1) * 5000, link);
                });
            }
        });

    },

};

