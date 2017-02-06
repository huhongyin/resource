/**
 * TvController
 *
 * @description :: Server-side logic for managing Tvs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
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

                                        for(var subTypeKey = 0; subTypeKey < tags['iarea']. length; subTypeKey ++){
                                            setTimeout(function(subTypeItem){
                                                u = checkParam(u, subTypeItem['data_type'], subTypeItem['data_index']);

                                                for(var areaKey = 0; areaKey < tags['itype']. length; areaKey ++){
                                                    setTimeout(function(areaItem){
                                                        u = checkParam(u, areaItem['data_type'], areaItem['data_index']);

                                                        for(var yearKey = 0; yearKey < tags['iplot']. length; yearKey ++){
                                                            setTimeout(function(yearItem){
                                                                u = checkParam(u, yearItem['data_type'], yearItem['data_index']);
console.log(u);
                                                                //for(var plot_aspectKey = 0; plot_aspectKey < tags['iyear']. length; plot_aspectKey ++){
                                                                //    setTimeout(function(plot_aspectItem){
                                                                //        u = checkParam(u, plot_aspectItem['data_type'], plot_aspectItem['data_index']);
                                                                //
                                                                //        for(var cateKey = 0; cateKey < tags['ipay']. length; cateKey ++){
                                                                //            setTimeout(function(cateItem){
                                                                //                u = checkParam(u, cateItem['data_type'], cateItem['data_index']);


                                                                                where = { 'type': link['type'], 'link' : u };
                                                                                Links.findOne(where).exec(function(res, linksRes){
                                                                                    if(linksRes.length == 0){
                                                                                        Links.create(where).exec(function(err, result){
                                                                                            if(err){
                                                                                                console.log(err + '插入链接失败');
                                                                                            }else{
                                                                                                console.log(err + '添加链接成功:' + u);
                                                                                            }
                                                                                        });
                                                                                    }else{
                                                                                        console.log('已经存在该链接');
                                                                                    }
                                                                                });

                                                                //            }, 0, tags['ipay'][cateKey]);
                                                                //        }
                                                                //
                                                                //    }, 0, tags['iyear'][plot_aspectKey]);
                                                                //}

                                                            }, 0, tags['iplot'][yearKey]);
                                                        }

                                                    }, 0, tags['itype'][areaKey]);
                                                }

                                            }, 0, tags['iarea'][subTypeKey]);
                                        }

                                    }, 0, filterTags[i]);
                                }
                                //首先循环标签数组

                            });
                        });

                    }, 0, link);
                });
            }
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
        var linksModel = require("../models/Links");
        var where = {type : 'tv', link : {'!' : ''}};

        Links.find(where).exec(function(err, links){
            links.forEach(function(u, index){
                //var u = 'http://v.qq.com/x/list/movie?edition=&plot_aspect=&area=&sort=6&year=&offset=0&cate=&pay=';
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

                                            }, 0, videoInfo[index]);

                                        }

                                    }
                                });

                            }, 0, offsetKey);

                        }

                    }
                });
            });
        });

    },
};

//将电视剧的地区、年份、类型数组分组
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

