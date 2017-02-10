/**
 * HrefsController
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
            url: 'http://v.qq.com/x/list/movie?cate=-1&offset=0&sort=4',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
            }
        };
        request(options, function(err, result){
            if (err) {
                console.log(err);
            }
            var $ = cheerio.load(result.body);
            $('.mod_filter .filter_list a').each(function(index, element){
                var item = [];
                var href = $(element).attr('href');
                //获取链接类型
                var _boss = getHrefType(href);
                var show = $(element).text();
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
                                var _stat = $(element).attr('_stat');
                                var href = $(element).attr('href');
                                var show = $(element).text();
                                var item = {
                                    '_stat': _stat,
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
            //抓取指定网页的标签(filter:channel_电影)
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
                            $('.mod_filter_wrap .filter_box_inner .filter_content a').each(function(index, element){
                                //电影类型a标签
                                //获取_boss
                                var href = $(element).attr('href');
                                var arr = getTypeArr(href);
                                var _boss = arr['_boss'];
                                var data_index = arr['data_index'];
                                if(arr['data_index'] == '-1'){
                                    href = href + '-1';
                                }
                                var data_type = arr['data_type'];
                                var show = $(element).text();
                                if(_boss != 'q') {
                                    var item = {
                                        _boss: _boss,
                                        href: href,
                                        data_index: data_index,
                                        data_type: data_type,
                                        show: show,
                                        _parentBoss: aItem.type
                                    };
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
                                        } else if (tags.length == 0) {
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
                                }
                            });
                        }
                    });
                    // }
                }, ( index + 1) * 5000, a);
            });
        });
    },

    getSource:function(req, res){
        var cheerio = require("cheerio");
        var request = require("request");
        //引入model
        var hrefModel = require("../models/Href");
        var filterModel = require("../models/FilterTags");
        var tags = require("../models/Tags");
        var video = require("../models/Video");
        //var u = 'http://v.qq.com/x/list/movie?offset=0&sort=6';
        var u = req.param('u', '');
        var type = req.param('type', '');
        var where = {};
        if(type != ''){
            //where = {where : {type : type}, skip : 20, limit : 10 };
            where = {where : {type : type}};
        }
        if(u == '' || u == null || u == 'all'){
            //如果抓取的链接为空,则抓全部分类下的数据
            Links.find(where).exec(function(err, hrefs){

                hrefs.forEach(function(url, index){
                    var u = url['link'];
                    if(url['type'] == 'movie' || url['type'] == 'tv'){
                        var options = {
                            // proxy: {
                            //   hostname: '106.81.113.190',
                            //   port: '8998'
                            // },
                            url: u,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
                            }
                        };

                        request(options, function(err, result){
                            if(err){
                                console.log(err);
                                console.log('请求出错');
                            }else{
                                var $ = cheerio.load(result.body);
                                //获取数据总条数
                                var max = 0;
                                $('.filter_option .option_txt .hl').each(function(i, ui){
                                    if(i == 0){
                                        max = $(ui).text();
                                    }
                                });
                                if(max == ''){
                                    max = 0;
                                }
                                for(var offsetKey = 0; offsetKey <= max; offsetKey = offsetKey + 30){

                                    setTimeout(function(offset){

                                        u = checkParam(u, 'offset', offset);
                                        var options = {
                                            // proxy: {
                                            //   hostname: '106.81.113.190',
                                            //   port: '8998'
                                            // },
                                            url: u,
                                            headers: {
                                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
                                            }
                                        };

                                        request(options, function(err, result){
                                            if(err){
                                                console.log('抓数据页面出错' + err);
                                                return err;
                                            }else{
                                                var $ = cheerio.load(result.body);
                                                var videoInfo = getVideoInfo($);

                                                for(var index = 0; index < videoInfo.length; index ++){

                                                    setTimeout(function(video){
                                                        video.type = url.type;
                                                        Video.find({ "video_id" : video.video_id, "video_name" : video.video_name }).exec(function(err, resVideo){
                                                            if(err == null) {
                                                                if (resVideo.length == 0) {
                                                                    Video.create(video).exec(function (er, re) {
                                                                        if (er) {
                                                                            console.log('插入失败' + err);
                                                                        } else {
                                                                            console.log('添加影视成功' + video.video_id);
                                                                        }
                                                                    });
                                                                } else {
                                                                    resVideo[0].type = 'movie';
                                                                    resVideo[0].save(
                                                                        function (er) {
                                                                            if (err != null) {
                                                                                console.log('更新影视列表失败:' + er);
                                                                            } else {
                                                                                console.log('更新影视列表成功:' + video.video_id + '影视名:' + video.video_name);
                                                                            }
                                                                        }
                                                                    );
                                                                }
                                                            }else{
                                                                console.log(err);
                                                                return false;
                                                            }
                                                        });


                                                    }, 100, videoInfo[index]);

                                                }

                                            }
                                        });

                                    }, 100, offsetKey);

                                }

                            }
                        });
                    }

                });

            });
        }else{
            var options = {
                // proxy: {
                //   hostname: '106.81.113.190',
                //   port: '8998'
                // },
                url: u,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
                }
            };

            request(options, function(err, result){
                if(err){
                    console.log(err);
                    console.log('请求出错');
                }else{
                    var $ = cheerio.load(result.body);
                    //获取数据总条数
                    var max = 0;
                    $('.filter_option .option_txt .hl').each(function(i, ui){
                        if(i == 0){
                            max = $(ui).text();
                        }
                    });
                    if(max == ''){
                        max = 0;
                    }
                    for(var offsetKey = 0; offsetKey <= max; offsetKey = offsetKey + 30){

                        setTimeout(function(offset){

                            u = checkParam(u, 'offset', offset);
                            console.log(u);
                            var options = {
                                // proxy: {
                                //   hostname: '106.81.113.190',
                                //   port: '8998'
                                // },
                                url: u,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
                                }
                            };

                            request(options, function(err, result){
                                if(err){
                                    console.log('抓数据页面出错' + err);
                                    return err;
                                }else{
                                    var $ = cheerio.load(result.body);

                                    var videoInfo = getVideoInfo($);

                                    for(var index = 0; index < videoInfo.length; index ++){

                                        setTimeout(function(video){
                                            //http://v.qq.com/x/list/movie?edition=&plot_aspect=&area=&sort=6&year=&offset=0&cate=&pay=
                                            var pre = /http:\/\/v.qq.com\/x\/list\/([\S]+)\?/gim;
                                            var t = pre.exec(u);
                                            var type = t[1];
                                            video.type = type;
                                            Video.findOne({ "video_id" : video.video_id, "video_name" : video.video_name }).exec(function(err, resVideo){
                                                resVideo.type = type;
                                                if(resVideo.length == 0){
                                                    Video.create(video).exec(function(er, re){
                                                        if(er){
                                                            console.log('插入失败' + err);
                                                        }else{
                                                            console.log('添加影视成功' + video.video_id);
                                                        }
                                                    });
                                                }else{
                                                    resVideo.save(
                                                        function(er){
                                                            if(err != null){
                                                                console.log('更新影视列表失败:' + er);
                                                            }else{
                                                                console.log('更新影视列表成功:' + video.video_id + '影视名:' + video.video_name);
                                                            }
                                                        }
                                                    );
                                                }
                                            });

                                        }, 100, videoInfo[index]);

                                    }

                                }
                            });

                        }, 100, offsetKey);

                    }

                }
            });
        }

    },

    //拼接电影列表链接(通过参数抓取(all抓取全部))
    getSourceLink:function(req, res){
        var cheerio = require("cheerio");
        var request = require("request");
        //引入model
        var hrefModel = require("../models/Href");
        var filterModel = require("../models/FilterTags");
        var tags = require("../models/Tags");
        var video = require("../models/Video");
        var linksModel = require("../models/Links");
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
        var step = req.param('step', '1');
        if(step == '1') {
            Href.find(where).exec(function (err, links) {
                if (links.length == 0) {
                    return false;
                } else {
                    links.forEach(function (link, index) {
                        setTimeout(function (linkItem) {
                            //拼接链接主地址
                            var url = getServerName(linkItem.url);
                            //子条件查询语句
                            var subWhere = {"_parentBoss": linkItem.type};
                            //获取filter_tags
                            FilterTags.find(subWhere).exec(function (err, filterTags) {

                                //获取标签
                                Tags.find(subWhere).exec(function (err, tags) {

                                    //分组数组
                                    tags = sortArr(tags);
                                    for (var i = 0; i < filterTags.length; i++) {
                                        setTimeout(function (filterTag) {

                                            var u = url + filterTag['href'] + '&';
                                            //此处是链接拼接处，如有修改，基本只修改这里
                                            //{ subtype, area, year, plot_aspect, cate, pay, edition 为循环的数组}

                                            for (var subTypeKey = 0; subTypeKey < tags['subtype'].length; subTypeKey++) {
                                                setTimeout(function (subTypeItem) {
                                                    u = checkParam(u, subTypeItem['data_type'], subTypeItem['data_index']);

                                                    for (var areaKey = 0; areaKey < tags['area'].length; areaKey++) {
                                                        setTimeout(function (areaItem) {
                                                            u = checkParam(u, areaItem['data_type'], areaItem['data_index']);

                                                            for (var yearKey = 0; yearKey < tags['year'].length; yearKey++) {
                                                                setTimeout(function (yearItem) {
                                                                    u = checkParam(u, yearItem['data_type'], yearItem['data_index']);

                                                                    var condition = {link : u};
                                                                    Links.find(condition).exec(function (res, linksRes) {

                                                                        if (linksRes.length == 0 ) {
                                                                            Links.create({
                                                                                'type' : link.type,
                                                                                'link' : u,
                                                                                'step' : '1'
                                                                            }).exec(function (err, result) {
                                                                                if (err) {
                                                                                    console.log(err + '插入链接失败');
                                                                                } else {
                                                                                    console.log(err + '添加链接成功:' + u);
                                                                                }
                                                                            });
                                                                        } else {
                                                                            console.log('已经存在该链接');
                                                                        }
                                                                    });

                                                                }, 1000, tags['year'][yearKey]);
                                                            }

                                                        }, 1000, tags['area'][areaKey]);
                                                    }

                                                }, 1000, tags['subtype'][subTypeKey]);
                                            }

                                        }, 1000, filterTags[i]);
                                    }
                                    //首先循环标签数组

                                });
                            });

                        }, 1000, link);
                    });
                }
            });
        }else if(step == 2){
            var subWhere = {"_parentBoss": type};
            var condition = {'type' : type, 'step' : '1'};
            Links.find(condition).exec(function(err, links){
                //获取标签
                Tags.find(subWhere).exec(function (err, tags) {

                    //分组数组
                    tags = sortArr(tags);
                    for (var i = 0; i < links.length; i++) {
                        setTimeout(function (link) {

                            var u = link['link'];
                            for(var plot_aspectKey = 0; plot_aspectKey < tags['plot_aspect']. length; plot_aspectKey ++){
                                setTimeout(function(plot_aspectItem){
                                    u = checkParam(u, plot_aspectItem['data_type'], plot_aspectItem['data_index']);

                                    for(var cateKey = 0; cateKey < tags['cate']. length; cateKey ++){
                                        setTimeout(function(cateItem){
                                            u = checkParam(u, cateItem['data_type'], cateItem['data_index']);

                                            for(var payKey = 0; payKey < tags['pay']. length; payKey ++){
                                                setTimeout(function(payItem){
                                                    u = checkParam(u, payItem['data_type'], payItem['data_index']);

                                                    for(var editionKey = 0; editionKey < tags['edition']. length; editionKey ++){
                                                        setTimeout(function(editionItem){

                                                            u = checkParam(u, editionItem['data_type'], editionItem['data_index']);

                                                            where = { 'type': link['type'], 'link' : link['link'] };
                                                            Links.findOne(where).exec(function(res, linksRes){
                                                                if(typeof(linksRes)  == 'undefined'){
                                                                    console.log('不存在该链接');
                                                                }else{
                                                                    linksRes.step = 2;
                                                                    linksRes.save( function(er){
                                                                        if(err != null){
                                                                            console.log('更新链接失败:' + er);
                                                                        }else{
                                                                            console.log('更新链接成功:' + linksRes.id);
                                                                        }
                                                                    });
                                                                }
                                                            });

                                                        }, 0, tags['edition'][editionKey]);
                                                    }

                                                }, 0, tags['pay'][payKey]);
                                            }

                                        }, 0, tags['cate'][cateKey]);
                                    }

                                }, 0, tags['plot_aspect'][plot_aspectKey]);
                            }

                        }, 0, links[i]);
                    }
                    //首先循环标签数组

                });

            });

        }

    },

    //抓影视详情
    saveVideoDetails:function(req, res){

        var cheerio = require("cheerio");
        var request = require("request");
        //引入model

        var video = require("../models/Video");
        var videoDetails = require("../models/VideoDetails");
        var videoId = req.param('videoId', '');
        var where = {};
        if(videoId == 'all'){
            where = {'video_id' : {'!' : ''}};
        }else if(videoId != '' && videoId != 'all'){
            where = { 'video_id' : videoId};
        }

        Video.find(where).exec(function(err, videoList){
            if(videoList.length == 0){
                console.log('没有需要抓取的影视id');
            }else if(videoList.length > 0){
                //forEach抓取数据
                for(var i = 0; i < videoList.length; i ++){
                    setTimeout(function(videoInfo){
                        //拼接链接抓详情
                        var url = 'http://v.qq.com/detail/c/' + videoInfo.video_id + '.html';
                        var options = {
                            url: url,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
                            }
                        };
                        request(options, function(err, result){

                            if(err){
                                console.log(err);
                                return err;
                            }else{
                                var $ = cheerio.load(result.body);
                                var details = getVideoDetails($, videoInfo.video_id);
                                if(details['video_img'] != ''){
                                    //判断是否存在
                                    var where = { "video_id" : videoInfo.video_id, "video_cname" : details['video_cname']};
                                    VideoDetails.find(where).exec(function(err, res){
                                        if(res.length == 0){
                                            VideoDetails.create(details).exec(function(err, result){
                                                if(err){
                                                    console.log(err + '插入失败');
                                                }else{
                                                    console.log('添加详情成功' + details['video_cname']);
                                                }
                                            });
                                        }else{
                                            console.log('已存在该影视');
                                        }
                                    });

                                }
                            }

                        });

                    }, 1000, videoList[i]);
                }
            }
        });

    },
    //抓取演员信息
    getStarInfo:function(req, res){
        var cheerio = require("cheerio");
        var request = require("request");

        //引入model
        var actorModel = require("../models/Actors");
        var actorId = req.param('actorId', '');

        var where = { 'actor_id': { '!' : ''} };
        if(actorId != 'all'){
             where = { 'actor_id': actorId };
        }
        Actors.find(where).exec(function(err, actors){
            if(err == null){
                actors.forEach(function(actor, index){
                    var url = 'http://v.qq.com/x/star/' + actor['actor_id'];
                    var options = {
                        // proxy: {
                        //   hostname: '106.81.113.190',
                        //   port: '8998'
                        // },
                        url: url,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
                        }
                    };

                    request(options, function(err, result){
                        if(err){
                            console.log('抓取演员出错' + err);
                            return err;
                        }else{
                            var $ = cheerio.load(result.body);

                            var actorInfo = getActorInfo($, actor);
                            if(actorInfo.actor_id != null){
                                Actors.findOne({
                                    'actor_id' : actorInfo.actor_id,
                                    'actor_name' : actorInfo.actor_name
                                }).exec(function(err, res){
                                    if(err == null){
                                        actorInfo.save(
                                            function(er){
                                                if(err != null){
                                                    console.log('更新演员信息失败:' + er);
                                                }else{
                                                    console.log('更新演员信息成功:' + actor.id + '演员名为:' + actor.actor_id);
                                                }
                                            });
                                    }else{
                                        Actors.create(actorInfo).exec(function(err, re){
                                            if(err == null){
                                                console.log('创建演员信息成功:' + actorInfo.actor_id);
                                            }else{
                                                console.log('创建演员信息失败:' + err);
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                });
            }else{
                console.log('没有找到演员信息');
            }
        });

    },

};

function getActorInfo($, actor)
{
    //血型
    var spanElements = $('.star_current .star_info .starIntro .star_briefIntro').find('span');
    var blood_type = '';
    var constellation = '';
    var height = '';
    var sex = '';
    var birthday = '';
    var actor_ename = '';
    var nation = '';
    var hobby = '';
    var area = '';
    var job = '';
    var actor_oname = '';
    var actor_head_pic = $('.star_current .head_portrait img').attr('src');
    var actor_name = $('.star_current .star_info .starIntro .starIntro_top .name').text();

    spanElements.each(function(index, span){
        var blood = $(span).text().match(/型/);
        if(blood != null) {
            blood_type = $(span).text();
        }
        var constellationMatch = $(span).text().match(/座/);
        if(constellationMatch != null){
            constellation = $(span).text();
        }
        var heightMatch = $(span).text().match(/cm/);
        if(heightMatch != null){
            height = $(span).text();
        }
    });
    //介绍
    var description = $('.star_current .star_info .starIntro .star_des_marginB').text();
    var lis = $('.star_current .star_info .starIntro .starInfo_list li');
    lis.each(function(index, li){
        var left = $(li).find('.listLeft').text();

        var jobMatch = $(li).find('.listLeft').text().match(/职业/);
        if(jobMatch != null){
            var jobs = $(li).find('.listRight i');
            jobs.each(function(index, i){
                job += $(i).text() + ',';
            });
        }

        var actorOname = $(li).find('.listLeft').text().match(/别名/);
        if(actorOname != null){
            var actorOnames = $(li).find('.listRight i');
            actorOnames.each(function(index, i){
                actor_oname += $(i).text() + ',';
            });
        }

        if(left)
        switch(left){
            case '性别':
                sex = $(li).find('.listRight').text();
                break;
            case '出生日期':
                birthday = $(li).find('.listRight').text();
                break;
            case '民族':
                nation = $(li).find('.listRight').text();
                break;
            case '爱好':
                hobby = $(li).find('.listRight').text();
                break;
            case '英文名':
                actor_ename = $(li).find('.listRight').text();
                break;
            case '地区':
                area = $(li).find('.listRight').text();
                break;

        }
    });
    actor.blood_type = blood_type;
    actor.constellation = constellation;
    actor.height = height;
    actor.sex = sex;
    actor.birthday = birthday;
    actor.actor_ename = actor_ename;
    actor.nation = nation;
    actor.hobby = hobby;
    actor.actor_head_pic = actor_head_pic;
    actor.actor_name = actor_name;
    actor.description = description;
    actor.area = area;
    actor.job = job;
    actor.actor_oname = actor_oname;

    return actor;
}

//获取影视类型
function getVideoDetails($, video_id)
{

    //影视海报
    var video_img = $('.container_inner .mod_figure_detail .detail_pic img').attr('src');

    //腾讯评分
    var video_score = $('.detail_video .video_score .score_v .score').text();

    //豆瓣评分
    var db_score = $('.detail_video .video_score .score_db .score').text();

    //影视名称
    var video_cname = $('.detail_video .video_title_collect .video_title_cn a').text();

    //影视英文名
    var video_ename = $('.detail_video .video_title_collect .video_title_cn .title_en').text();

    //影视类型
    var video_type = $('.detail_video .video_title_collect .video_title_cn .type').text();

    //影视别名
    var video_other_name = '无';

    //影视地区
    var area = '';

    //影视语言
    var language = '';

    //上映时间
    var date = '';

    $('.detail_video .video_type div').each(function(index, div){
        //0别名 1地区 2语言 3上映时间
        $(div).find('.type_item .type_tit').text();
        switch (index){
            case '别名:':
                video_other_name = $(div).find('.type_item .type_txt').text();
                break;
            case '地区:':
                area = $(div).find('.type_item .type_txt').text();
                break;
            case '语言:':
                language = $(div).find('.type_item .type_txt').text();
                break;
            case '上映时间:':
                date = $(div).find('.type_item .type_txt').text();
                break;
        }
    });
    var actorModel = require("../models/Actors");
    //影视标签
    var tags = '';
    $('.detail_video .video_tag .tag_list a').each(function(index, a){
        tags += $(a).text() + ',';
    });

    //影视简介
    var video_description = $('.detail_video .video_desc .desc_txt .txt').text();

    //演员
    var actor = '';

    $('.detail_video .video_actor .actor_list li').each(function(index, li){
        //获取演员信息链接
        var actorHref = $(li).find('.img').attr('href');
        var actor_name = $(li).find('.name').text();
        //获取演员id
        //http://v.qq.com/x/star/75317
        var pre = /http:\/\/v.qq.com\/x\/star\/([\S]+)/gim;

        var actor_id = pre.exec(actorHref);
        if(actor_id != null) {
            actor_id = actor_id[1];
            actor += actor_id + ',';
            //保存演员信息(这里只存储id和头像, 简介)
            var actorHeadPic = $(li).find('.img img').attr('src');
            var actorDescription = $(li).find('.actor_pop .quick_pop_inner .pop_info_content .actor_info .actor_desc .txt').text();
            var actionInfo = {actor_id: actor_id, description: actorDescription, actor_name: actor_name};
            Actors.find(actionInfo).exec(function (err, actorValue) {
                if (actorValue.length == 0) {
                    Actors.create(actionInfo).exec(function (err, res) {
                        if (err) {
                            console.log('添加演员信息失败' + err);
                        } else {
                            console.log('添加演员信息成功:' + actor_id + ':' + actor_name);
                        }
                    });
                } else {
                    console.log('已经存在该演员信息');
                }
            });
        }
    });

    var details = {

        "video_id" : video_id,
        "video_img" : video_img,
        "video_score" : video_score,
        "db_score" : db_score,
        "video_cname" : video_cname,
        "video_description" : video_description,
        "video_ename" : video_ename,
        "video_type" : video_type,
        "video_other_name" : video_other_name,
        "area" : area,
        "language" : language,
        "date" : date,
        "tags" : tags,
        "actor" : actor

    };
    return details;
}



//通过正则获取当前访问链接的前缀
function getServerName(u)
{
    var host = u.match(/(\S+)\?/);
    if(host != null) {
        return host[1];
    }
    return u;
}

//检查参数
function checkParam(param, paramName, paramValue)
{
    var re =new RegExp(""+paramName+"","gim"); // re为/^\d+bl$/gim
    var flag = param.match(re);
    if(flag != null){
        //如果已经有了这个参数，则直接替换
        //匹配到需要替换的字符
        var res =new RegExp("" + paramName + "=(-)?[0-9]+","gim"); // re为/^\d+bl$/gim
        var flags = param.match(res);
        if(flags){
            //替换参数
            var newParamItem = '' + paramName + '=' + paramValue;
            if(newParamItem != flags) {
                param = param.replace(flags, newParamItem);
            }
        }
    }else{
        param = param + paramName + '=' + paramValue + '&';
    }
    return param;
}


//将电影的地区、年份、类型数组分组
function sortArr(arr)
{
    //console.log(arr);
    var re = {};
    for(var i=0; i<arr.length; i++){
        var key = arr[i]['_boss'];
        if(re[key] == null){
            re[key] = [];
            re[key].push(arr[i]);
        }else{
            re[key].push(arr[i]);
        }
    }
    return re;
}

//获取列表信息
function getVideoInfo($)
{
    var arr = [];
    $('.mod_figures .figures_list li').each(function(index, li){
        var imgUrl = $(li).find('img').attr("src");
        var video_name = $(li).find('.figure_title a').text();
        var href = $(li).find('.figure_title a').attr('href');
        //https://v.qq.com/x/cover/o259zfwvhkvl3oi.html
        var pre = /https:\/\/v.qq.com\/x\/cover\/([\S]+).html/gim;
        var h = pre.exec(href);
        var video_id = h[1];
        var item =  { 'video_id' : video_id, 'imgUrl' : imgUrl, 'video_name' : video_name };
        arr.push(item);
    });
    return arr;
}

//获取链接类型
function getHrefType(href)
{
    var p1 = /http:\/\/v.qq.com\/x\/list\/([\S]+)/gim;
    var result = p1.exec(href)[1];
    return result;
}

function getTypeArr(href)
{
    var p1 = /\?\S+&(\S+)/gim;
    var result = p1.exec(href);
    //匹配值和参数名
    var val = result[1];
    var p2 = /(\S+)=(\S+)/gim;
    var re = p2.exec(val);
    if(re == null){
        //重新匹配全部
        var p3 = /(\S+)=/gim;
        var r = p3.exec(val);
        return { '_boss' : r[1], 'data_index' : '-1', 'data_type' : r[1] };
    }else{
        return { '_boss' : re[1], 'data_index' : re[2], 'data_type' : re[1] };
    }
}


