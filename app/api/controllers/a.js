/**
 * DoubanController
 *
 * @description :: Server-side logic for managing doubans
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
            url: 'https://movie.douban.com/tag/2016?start=0',
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

    lists: function(req, res){
        var cheerio = require("cheerio");
        var request = require("request");
        var tagLinks = sails.config.custom.tagLinks;
        var category = req.param('category', '');

        if (!category || typeof(tagLinks[category]) == 'undefined') {
            return res.send("非法请求，参数category不正确");
        }

        Tag.find({tagType:'年代'},{tagType:1}).exec(function(err, tags){
            if (err) {
                return err;
            }
            tags.forEach(function(item,index) {
                setTimeout(function(tagItem) {
                    var options = {
                        // proxy: {
                        //   hostname: '106.81.113.190',
                        //   port: '8998'
                        // },
                        url: tagLinks[category].from_url + tagLinks[category].links + tagItem.tagName,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
                        }
                    };
                    request(options, function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                        var $_ = cheerio.load(result.body);
                        var pages = $_(".paginator").find(".next").prev().text();
                        if (!pages) {
                            pages = 1;
                        }
                        Count.create({count: pages}).exec(function(err, created){
                            if(err) { //returns if an error has occured, ie invoice_id doesn't exist.
                                console.log(err);
                            } else {
                                console.log('Pages '+created.count);
                            }
                        });
                        for (var i = 0; i < pages; i++) {
                            setTimeout(function(i){
                                request(tagLinks[category].from_url + tagLinks[category].links + item.tagName + "?start=" + (i * 20), function (e, re) {
                                    if (e) {
                                        console.log(e);
                                    }
                                    var $ = cheerio.load(re.body);
                                    var items = [];
                                    var items_tag = $(".item");
                                    items_tag.each(function (index, element) {
                                        var link = $(this).find(".nbg").attr("href");
                                        var link_arr = link.split("/");
                                        var canPlay = $(this).find('.pl2').find("a").next();
                                        if (canPlay.is('span')) {
                                            canPlay = 1;
                                        } else {
                                            canPlay = 0;
                                        }
                                        // items.push({
                                        //   "link": link,
                                        //   "name": $(this).find(".nbg").attr("title"),
                                        //   "poster": $(this).find(".nbg").find('img').attr('src'),
                                        //   "canPlay": canPlay,
                                        //   "doubanId": link_arr[link_arr.length - 2],
                                        //   "score": Number($(this).find('.pl2').find('.star').find('.rating_nums').text()),
                                        //   "rateNum": Number($(this).find('.pl2').find('.star').find('.pl').text().replace(/\(|\)/g, "").replace(/[\u4e00-\u9fa5]/gi, "")),
                                        //   "year": item.tagName
                                        // });
                                        var item_db = {
                                            "link": link,
                                            "name": $(this).find(".nbg").attr("title"),
                                            "poster": $(this).find(".nbg").find('img').attr('src'),
                                            "canPlay": canPlay,
                                            "doubanId": link_arr[link_arr.length - 2],
                                            "score": Number($(this).find('.pl2').find('.star').find('.rating_nums').text()),
                                            "rateNum": Number($(this).find('.pl2').find('.star').find('.pl').text().replace(/\(|\)/g, "").replace(/[\u4e00-\u9fa5]/gi, "")),
                                            "year": item.tagName
                                        };
                                        Resource.find({doubanId: item_db.doubanId}).exec(function(err, found){
                                            if (found.length) {
                                                // console.log('Found record'+found[0].name);
                                                // Resource.update({doubanId: item_db.doubanId}, item_db).exec(function(err, updated){
                                                //   if(err) { //returns if an error has occured, ie id doesn't exist.
                                                //     console.log(err);
                                                //   } else {
                                                //     console.log('Updated MyModel record '+updated[0].name);
                                                //   }
                                                // });
                                            } else {
                                                Resource.create(item_db).exec(function(err, created){
                                                    if(err) { //returns if an error has occured, ie invoice_id doesn't exist.
                                                        console.log(err);
                                                    } else {
                                                        console.log('Created client record '+created.name);
                                                    }
                                                });
                                            }
                                        });
                                    });
                                });
                            }, (i+1)*5000, i);

                        }
                    });
                }, (index+1)*5000, item);
            });
        });

        return res.send('success');
    },

    detail: function(req, res) {
        var cheerio = require("cheerio");
        var request = require("request");

        Resource.find().exec(function(err, list){
            var directors = [];
            var scenarist_arr = [];
            var actors = [];
            var types = [];
            var resource = list[0];
            request(resource.link, function(err, result){
                if (err) {
                    console.log(err);
                }
                var $ = cheerio.load(result.body);

                $('.attrs a').not("[rel]").each(function(i, e){
                    var link = $(this).attr('href');
                    var link_arr = link.split("/");
                    scenarist_arr.push({name: $(this).text(), link: link, directorId: link_arr[link_arr.length-2]});
                });

                $('.attrs a[rel="v:directedBy"]').each(function(i, e){
                    var link = $(this).attr('href');
                    var link_arr = link.split("/");
                    directors.push({name: $(this).text(), link: link, directorId: link_arr[link_arr.length-2]});
                });

                $('span[property="v:genre"]').each(function(){
                    types.push($(this).text());
                });

                var releases = [];
                $('span[property="v:initialReleaseDate"]').each(function(){
                    var str = $(this).text().replace(/\(|\)/g, "");
                    releases.push({date: str.replace(/[\u4e00-\u9fa5]/gi, ""), place: str.replace(/[^\u4e00-\u9fa5]/gi, "")});
                });

                var time = '';
                $('span[property="v:runtime"]').each(function(){
                    var time_str = $(this).text();
                    time = parseInt(time_str.replace(/\(|\)/g, "").replace(/[\u4e00-\u9fa5]/gi, ""));
                });

                var area = '';
                var lang = '';
                var other_name = '';
                var imdb_id = '';
                var infos = $('#info').text().split("\n");
                infos.forEach(function(item, index){
                    if(item.indexOf('地区') >= 0){
                        area = item.split(":")[1].replace(/\s+/g,"").split("/");
                    }
                    if(item.indexOf('语言') >= 0){
                        lang = item.split(":")[1].replace(/\s+/g,"").split("/");
                    }
                    if(item.indexOf('又名') >= 0){
                        other_name = item.split(":")[1].replace(/\s+/g,"").split("/");
                    }
                    if(item.indexOf('链接') >= 0){
                        imdb_id = item.split(":")[1].replace(/\s+/g,"");
                    }
                });

                var betterThan = [];
                $('.rating_betterthan a').each(function(){
                    var t = $(this).text();
                    betterThan.push({scale: t.replace(/[\u4e00-\u9fa5]/gi, ""), type: t.replace(/[^\u4e00-\u9fa5]/gi, "")});
                });

                var trailer = '';
                var photos = [];
                $(".related-pic-bd li").each(function(){
                    if ($(this).find("a").hasClass("related-pic-video")) {
                        trailer = {img_src: $(this).find("a").find("img").attr("src"), video_src: $(this).find("a").attr("href")};
                    } else {
                        photos.push($(this).find("a").find("img").attr("src"));
                    }
                });

                var award = [];
                $(".award").each(function () {
                    var aw = {};
                    $(this).find("li").each(function (index, element) {
                        if (index == 0) {
                            aw.filmfest = $(this).find("a").text();
                        } else if (index == 1) {
                            aw.award_name = $(this).text().split(" ");
                        } else {
                            aw.award_person = $(this).find("a").text().replace(/\s+/g,"").split("/");
                        }
                    });
                    award.push(aw);
                });

                var likes = [];
                $(".recommendations-bd dl").each(function () {
                    var link_arr = $(this).find("dt").find("a").attr("href").split("/");
                    likes.push({
                        name: $(this).find("dd").find("a").text(),
                        thumb_img_src: $(this).find("dt").find("a").find("img").attr("src"),
                        link: $(this).find("dt").find("a").attr("href"),
                        doubanId: link_arr[link_arr.length - 2]
                    });
                });

                var hot_comments = [];
                $("#hot-comments .comment-item").each(function () {
                    var info = $(this).find(".comment").find("h3").find(".comment-info");
                    hot_comments.push({
                        comment_person: info.find("a").text(),
                        rating: info.find(".rating").attr("title"),
                        comment_time: info.find(".comment-time").text().replace(/\s+/g,""),
                        comment_content: $(this).find(".comment").find("p").text().replace(/\s+/g,"")
                    });
                });

                var new_comments = [];
                $("#new-comments #normal .dummy-fold .comment-item").each(function () {
                    var info = $(this).find(".comment").find("h3").find(".comment-info");
                    new_comments.push({
                        comment_person: info.find("a").text(),
                        rating: info.find(".rating").attr("title"),
                        comment_time: info.find(".rating").next().text().replace(/\s+/g,""),
                        comment_content: info.find("p").text().replace(/\s+/g,"")
                    });
                });

                var questions = [];
                $("#askmatrix .mod-bd ul li").each(function () {
                    questions.push($(this).find(".tit").find("a").text().replace(/\s+/g,""));
                });

                var reviews = [];
                $("div[typeof='v:Review']").each(function () {
                    var short_content = $(this).find(".review-item").find(".main-bd").find(".review-short").find(".short-content").text().replace(/\s+/g,"");
                    if (short_content.indexOf("(") >= 0) {
                        short_content.substr(0, short_content.indexOf("("));
                    }
                    if (short_content.indexOf('这篇影评可能有剧透') >= 0) {
                        short_content = '';
                    }
                    reviews.push({
                        title: $(this).find(".review-item").find("header").find(".title").find("a").text().replace(/\s+/g,""),
                        author: $(this).find(".review-item").find("header").find(".header-more").find(".author").find("span").text(),
                        rating: $(this).find(".review-item").find("header").find(".header-more").find("span[property='v:rating']").attr("title"),
                        publish_time: $(this).find(".review-item").find("header").find(".header-more").find("span[property='v:dtreviewed']").text(),
                        short_content: short_content
                    });
                });

                var play_src = [];
                $(".bs li").each(function () {
                    play_src.push({
                        from: $(this).find("a").text().replace(/\s+/g,""),
                        src: $(this).find("a").attr("href"),
                        view_type: $(this).find(".buylink-price").text().replace(/\s+/g,"")
                    });
                });

                var tags = [];
                $(".tags-body a").each(function () {
                    tags.push($(this).text());
                });

                var douList = [];
                $("#subject-doulist ul li").each(function () {
                    douList.push({
                        list_name: $(this).find("a").text(),
                        list_owner: $(this).find("span").text().replace(/\(|\)/g, ""),
                        list_link: $(this).find("a").attr("href")
                    });
                });

                var viewed = '';
                var wanted = '';
                $(".subject-others-interests-ft a").each(function (index) {
                    if (index == 0) {
                        viewed = parseInt($(this).text().replace(/[\u4e00-\u9fa5]/gi, ""));
                    } else {
                        wanted = parseInt($(this).text().replace(/[\u4e00-\u9fa5]/gi, ""));
                    }
                });

                var item = {
                    name: $('.year').prev().text(),                                     //名称
                    year: $('.year').text().replace(/\(|\)/g, ""),                     //年份
                    director: directors,                                                //导演
                    scenarist: scenarist_arr,                                           //编剧
                    actors: actors,                                                     //演员
                    type: types,                                                        //类型
                    area: area,                                                         //地区
                    lang: lang,                                                         //语言
                    release_date: releases,                                             //上映日期
                    total_time: time,                                                   //片长
                    other_names: other_name,                                            //又名
                    imdb_id: imdb_id,                                                   //imdb_id
                    imdb_url: 'http://www.imdb.com/title/'+imdb_id,                     //imdb链接
                    avg_score: parseFloat($("strong[property='v:average']").text()),                //平均分
                    best_score: parseFloat($("span[property='v:best']").attr("content")),           //最高分
                    rateNum: $('span[property="v:votes"]').text(),                      //评价人数
                    rateScaleOne: $('.stars1').next().next().text(),                    //一星评价比例
                    rateScaleTwo: $('.stars2').next().next().text(),                    //二星评价比例
                    rateScaleThree: $('.stars3').next().next().text(),                  //三星评价比例
                    rateScaleFour: $('.stars4').next().next().text(),                   //四星评价比例
                    rateScaleFive: $('.stars5').next().next().text(),                   //五星评价比例
                    goodness: betterThan,                                               //优于同类型
                    summary: $('span[property="v:summary"]').text().replace(/\s+/g,""),             //剧情简介
                    trailer: trailer,                                                   //预告片
                    photos: photos,                                                     //海报缩略图
                    award: award,                                                       //奖项
                    likes: likes,                                                       //相同喜好
                    hotComment: hot_comments,                                           //热门评价
                    newComment: new_comments,                                           //最新评价
                    questions: questions,                                               //相关问题
                    reviews: reviews,                                                   //热门影评
                    playSrc: play_src,                                                  //播放源
                    commonTag: tags,                                                    //热门标签
                    douList: douList,                                                   //热门豆列
                    viewed: viewed,                                                     //多少人看过
                    wanted: wanted                                                      //多少人想看
                };
                Resource.update({doubanId: resource.doubanId}, item).exec(function(err, updated){
                    if(err) { //returns if an error has occured, ie id doesn't exist.
                        console.log(err);
                    } else {
                        console.log('Updated MyModel record '+updated[0].name);
                    }
                });
            });
        });
    }


};



var requestList = function(){

};

var analysisPages = function(err, result){
    if (err) {
        console.log(err);
    }
    var $ = cheerio.load(result.body);
    var pages = $(".paginator").find(".next").prev().text();
    if (!pages) {
        pages = 1;
    }
    Count.create({count: pages}).exec(function(err, created){
        if(err) { //returns if an error has occured, ie invoice_id doesn't exist.
            console.log(err);
        } else {
            console.log('Pages '+created.count);
        }
    });
    requestList();
};

var requestTag = function(tags){
    if (tags.length > 0) {
        var tag = tags.shift();
        var options = {
            // proxy: {
            //   hostname: '106.81.113.190',
            //   port: '8998'
            // },
            url: tagLinks[category].from_url + tagLinks[category].links + tag.tagName,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1'
            }
        };
        request(options, analysisPages);
        if (tags.length > 0) {
            setTimeout(function(tags){
                requestTag(tags);
            },5000,tags);
        }
    }
};



