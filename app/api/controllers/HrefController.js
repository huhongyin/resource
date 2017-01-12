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
        var video = require("../models/Video");
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
                        //拼接链接主地址
                        var url = getServerName(linkItem.url);
                        //子条件查询语句
                        var subWhere = { "_parentBoss" : linkItem.type };
                        //获取filter_tags
                        FilterTags.find(subWhere).exec(function(err, filterTags){

                            //获取标签
                            Tags.find(subWhere).exec(function(err, tags){

                                //分组数组
                                tags = sortArr(tags);
                                for(var i = 0; i < filterTags.length; i ++){
                                    setTimeout(function(filterTag){

                                        var u = url + filterTag['href'] + '&';
                                        //此处是链接拼接处，如有修改，基本只修改这里
                                        //{ subtype, area, year, plot_aspect, cate, pay, edition 为循环的数组}

                                        for(var subTypeKey = 0; subTypeKey < tags['subtype']. length; subTypeKey ++){
                                            setTimeout(function(subTypeItem){
                                                u = checkParam(u, subTypeItem['data_type'], subTypeItem['data_index']);
                                                for(var areaKey = 0; areaKey < tags['area']. length; areaKey ++){
                                                    setTimeout(function(areaItem){
                                                        u = checkParam(u, areaItem['data_type'], areaItem['data_index']);
                                                        for(var yearKey = 0; yearKey < tags['year']. length; yearKey ++){
                                                            setTimeout(function(yearItem){
                                                                u = checkParam(u, yearItem['data_type'], yearItem['data_index']);
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
                                                                                                        return false;
                                                                                                    }else{
                                                                                                        var $ = cheerio.load(result.body);
                                                                                                        //获取数据总条数

                                                                                                        var max = $('.filter_option .txt_01 .strong').text();
                                                                                                        if(max == ''){
                                                                                                            max = 0;
                                                                                                        }

                                                                                                        for(var offsetKey = 0; offsetKey < max; offsetKey = offsetKey + 30){

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

                                                                                                                                    Video.find({ "video_id" : video.video_id, "video_name" : video.video_name }).exec(function(err, resVideo){
                                                                                                                                        if(resVideo.length == 0){
                                                                                                                                            Video.create(video).exec(function(er, re){
                                                                                                                                                if(er){
                                                                                                                                                    console.log('插入失败' + err);
                                                                                                                                                }else{
                                                                                                                                                    console.log('添加影视成功' + video.video_id);
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }else{
                                                                                                                                            console.log('已经存在相同的影视了:' + video.video_name);
                                                                                                                                        }
                                                                                                                                    });

                                                                                                                                }, 1000, videoInfo[index]);

                                                                                                                            }

                                                                                                                        }
                                                                                                                });

                                                                                                            }, 1000, offsetKey);

                                                                                                        }

                                                                                                    }
                                                                                                });

                                                                                            }, 1000, tags['edition'][editionKey]);
                                                                                        }

                                                                                    }, 1000, tags['pay'][payKey]);
                                                                                }

                                                                            }, 1000, tags['cate'][cateKey]);
                                                                        }

                                                                    }, 1000, tags['plot_aspect'][plot_aspectKey]);
                                                                }

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
                                                    console.log(err + '添加详情成功');
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

    }

};



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

        switch (index){
            case 0:
                video_other_name = $(div).find('.type_item .type_txt').text();
                break;
            case 1:
                area = $(div).find('.type_item .type_txt').text();
                break;
            case 2:
                language = $(div).find('.type_item .type_txt').text();
                break;
            case 3:
                date = $(div).find('.type_item .type_txt').text();
                break;
        }
    });

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
        actor += $(li).find('.name').text() + ',';
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
        var res =new RegExp("" + paramName + "=[0-9]+","gim"); // re为/^\d+bl$/gim
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
    $('.figures_list li').each(function(index, li){
        var video_id = $(this).find('.figure_option').attr('data-followid');
        var imgUrl = $(this).find('img').attr("r-lazyload");
        var video_name = $(this).find('.figure_title a').text();
        var item =  { 'video_id' : video_id, 'imgUrl' : imgUrl, 'video_name' : video_name };
        arr.push(item);
        //if(video_id != undefined && video_id != null && video_id != '') {
        //    getVideoDetail('http://v.qq.com/detail/c/' + video_id + '.html');
        //}
    });
    return arr;
}



