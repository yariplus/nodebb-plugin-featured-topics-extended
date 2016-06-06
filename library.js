"use strict";

var NodeBB     = module.parent;

var categories = NodeBB.require("./categories");
var topics     = NodeBB.require("./topics");
var db         = NodeBB.require('./database.js');
var translator = NodeBB.require('../public/src/modules/translator');
var nconf      = NodeBB.require('nconf');

var Settings   = NodeBB.require("./settings");

var SocketTopics = NodeBB.require('./socket.io/topics');
var SocketAdmin  = NodeBB.require('./socket.io/admin');

var async   = require('async');
var winston = require('winston');
var tjs     = require('templates.js');

var Plugin = module.exports;

var defaultSettings = {
	newsTemplate     : "porta",
	newsHideAnon     : 0,
	customTemplate   : "",
	autoFeature      : "1"
};

var app, settings, autoFeature;

// Get featured topics, possibly adding a new one.
function getFeaturedTopics(uid, data, cb) {
	data = data || {};

	db.getSortedSetRangeByScore('featuredex:tids', 0, 100, 0, 100, function(err, tids) {
		if (data.tid) {
			if (tids.indexOf(data.tid) === -1) {
				db.sortedSetAdd('featuredex:tids', 0, data.tid, function(){});
			  tids.unshift(data.tid);
			}
    }

    topics.getTopicsByTids(tids, uid, function (err, topicsData) {
      if (err) return cb(err, topicsData);

      async.forEachOf(topicsData, function (topicData, i, next) {
        topics.getMainPost(topicData.tid, uid, function(err, mainPost) {
          topicsData[i].post = mainPost
          next()
        })
      }, function () {
        cb(err, topicsData)
      })
		});
	});
}

function setFeaturedTopics(data, cb) {
	db.delete('featuredex:tids', function (err) {
		var scores = [];
		var values = [];
		data.tids.forEach(function (tid, i) {
			scores.push(i);
			values.push(tid);
		});

		db.sortedSetAdd('featuredex:tids', scores, values, cb);
	});
}

// Setup routes.
Plugin.init = function (params, next) {
	app = params.app;
	settings = new Settings('featured-topics-extended', '1.0.0', defaultSettings, readSettings);

	var router     = params.router;
	var middleware = params.middleware;

	router.get('/news',           middleware.buildHeader, render);
	router.get('/news/:page',     middleware.buildHeader, render);
	router.get('/api/news',       render);
	router.get('/api/news/:page', render);

	router.get('/admin/plugins/featured-topics-extended', middleware.admin.buildHeader, renderAdmin);
	router.get('/api/admin/plugins/featured-topics-extended', renderAdmin);

	function renderAdmin(req, res, next) {
		res.render('admin/plugins/featured-topics-extended', {});
	}

	SocketAdmin.settings.syncFeaturedTopicsExtended = function () {
		settings.sync(readSettings);
	};

	SocketAdmin.getFeaturedTopics = function(socket, data, callback) {
		getFeaturedTopics(socket.uid, data, callback);
	};

	SocketAdmin.setFeaturedTopics = function(socket, data, next) {
		setFeaturedTopics(data, next);
	};

	function readSettings() {
		autoFeature = settings.get('autoFeature').split(',').map(function(cid){
			return parseInt(cid, 10) || 0;
		});
	}

	next();
};

// Add the news page as a selectable Homepage.
Plugin.homepageGet = function (data, next) {
	data.routes.push({
		route: 'news',
		name: 'News'
	});

	next(null, data);
};

// Add a widget area for the news page.
Plugin.getAreas = function (areas, cb) {
	areas = areas.concat([
		{
			name     : 'News Header',
			template : 'news.tpl',
			location : 'header'
		},
		{
			name     : 'News Sidebar',
			template : 'news.tpl',
			location : 'sidebar'
		},
		{
			name     : 'News Left Sidebar',
			template : 'news.tpl',
			location : 'leftsidebar'
		},
		{
			name     : 'News Footer',
			template : 'news.tpl',
			location : 'footer'
		},
		{
			name     : 'News Content Top',
			template : 'news.tpl',
			location : 'contenttop'
		},
		{
			name     : 'News Content Bottom',
			template : 'news.tpl',
			location : 'contentbottom'
		},
		{
			name     : 'News Content Between',
			template : 'news.tpl',
			location : 'contentbetween'
		}
	]);

	cb(null, areas);
};

// Pass hook data to the render function.
Plugin.newsRender = function (data) {
	render(data.req, data.res, data.next);
};

//
Plugin.addNavs = function (items, cb) {
	items.push({
		route     : "/news",
		title     : "News",
		enabled   : false,
		iconClass : "fa-newspaper-o",
		textClass : "visible-xs-inline",
		text      : "News"
	});
	cb(null, items);
};

//
Plugin.adminBuild = function (header, cb) {
	header.plugins.push({
		route : '/plugins/featured-topics-extended',
		icon  : 'fa-newspaper-o',
		name  : 'Featured Topics Extended'
	});
	cb(null, header);
};

Plugin.addThreadTools = function(data, callback) {
	data.tools.push({
		"title": "Feature this Topic",
		"class": "mark-featured",
		"icon": "fa-star"
	});

	callback(null, data);
};

Plugin.getWidgets = function(widgets, callback) {
	var _widgets = [
		{
			widget: "featuredTopicsExSidebar",
			name: "Featured Topics Sidebar",
			description: "Featured topics as a sidebar widget.",
			content: "<small>Use the Topic Tools on a topic page to feature that topic.</small>"
		},
		{
			widget: "featuredTopicsExBlocks",
			name: "Featured Topics Blocks",
			description: "Featured topics as Lavender-style blocks.",
			content: "<small>Use the Topic Tools on a topic page to feature that topic.</small>"
		},
		{
			widget: "featuredTopicsExCards",
			name: "Featured Topics Cards",
			description: "Featured topics as Persona-style topic cards.",
			content: "admin/widgets/featured-topics-ex-cards.tpl"
		},
		{
			widget: "featuredTopicsExList",
			name: "Featured Topics List",
			description: "Featured topics as a normal topic list.",
			content: "<small>Use the Topic Tools on a topic page to feature that topic.</small>"
		}
	];

	async.each(_widgets, function (widget, next) {
		if (!widget.content.match('tpl')) return next();
		app.render(widget.content, {}, function (err, content) {
			translator.translate(content, function (content) {
				widget.content = content;
				next();
			});
		});
	}, function (err) {
		widgets = widgets.concat(_widgets);
		callback(null, widgets);
	});
};

function getTemplateData(uid, data, done) {
  var templateData = { }

  getFeaturedTopics(uid, data, function(err, featuredTopics) {
    templateData.topics = featuredTopics
    done(null, templateData)
  })
}

Plugin.renderFeaturedTopicsSidebar = function(widget, callback) {
  getTemplateData(widget.uid, null, function (err, templateData) {
		app.render('widgets/featured-topics-ex-sidebar', templateData, callback);
	})
}

Plugin.renderFeaturedTopicsBlocks = function(widget, callback) {
	getTemplateData(widget.uid, null, function (err, templateData) {
    app.render('widgets/featured-topics-ex-blocks', templateData, callback);
	});
};

Plugin.renderFeaturedTopicsCards = function(widget, callback) {
	getFeaturedTopics(widget.uid, null, function(err, featuredTopics) {
		async.each(featuredTopics, function(topic, next) {
			topics.getTopicPosts(topic.tid, 'tid:' + topic.tid + ':posts', 0, 4, widget.uid, true, function(err, posts) {
				topic.posts = posts;
				next(err);
			});
		}, function(err) {
			widget.data.topics = featuredTopics;
			widget.data.backgroundSize = widget.data.backgroundSize || 'cover';
			widget.data.backgroundPosition = widget.data.backgroundPosition || 'center';
			widget.data.backgroundOpacity = widget.data.backgroundOpacity || '1.0';
			widget.data.textShadow = widget.data.textShadow || 'none';
			app.render('widgets/featured-topics-ex-cards', widget.data, callback);
		});

	});
};

Plugin.renderFeaturedTopicsList = function(widget, callback) {
	getFeaturedTopics(widget.uid, null, function(err, featuredTopics) {
		async.each(featuredTopics, function(topic, next) {
			topics.getTopicPosts(topic.tid, 'tid:' + topic.tid + ':posts', 0, 4, widget.uid, true, function(err, posts) {
				topic.posts = posts;
				next(err);
			});
		}, function(err) {
			app.render('widgets/featured-topics-ex-list', {topics:featuredTopics}, function(err, html) {
				translator.translate(html, function(translatedHTML) {
					callback(err, translatedHTML);
				});
			});
		});

	});
};

Plugin.renderFeaturedTopicsNews = function(widget, callback) {
	getFeaturedTopics(widget.uid, null, function(err, featuredTopics) {
		app.render('news', {}, function(err, html) {
			translator.translate(html, function(translatedHTML) {
				callback(err, translatedHTML);
			});
		});
	});
};

Plugin.topicPost = function (topicData) {
	if (autoFeature.indexOf(parseInt(topicData.cid, 10)) !== -1) {
		getFeaturedTopics(-1, {tid: topicData.tid}, function (err, topicsData) {
			if (err) return;
			var tids = topicsData.map(function(topic){return topic.tid});
			setFeaturedTopics({tids: tids}, function(){});
		});
	}
};

// Date parsing helper.
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var days   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function getDate(timestamp){
	var date = new Date(parseInt(timestamp, 10)),
		hours = date.getHours();
	date = {
		full  : months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear(),
		year  : date.getFullYear(),
		month : months[date.getMonth()],
		date  : date.getDate(),
		day   : days[date.getDay()],
		mer   : hours >= 12 ? 'PM' : 'AM',
		hour  : hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours),
		min   : date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes(),
		sec   : date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()
	};
	date.start = (Date.now() - parseInt(timestamp, 10))/1000 < 604800 ? date.day + " at " + date.hour + ":" + date.min + " " + date.mer : date.full;
	return date;
}

// Render the news.
function render(req, res, next) {
	var payload       = {config: {relative_path: nconf.get('relative_path')}, newsTemplate: ''};
	var topicsPerPage = 5;
	var topicIndex    = 0;

	if (!req.uid && settings.get('newsHideAnon')) return res.render('news', payload);

	async.waterfall([
		async.apply(getFeaturedTopics, req.uid, {}),
		function (topicsData, next) {
			topicsData = topicsData.filter(function (topic) {
				return !topic.deleted;
			});

			var topicCount  = topicsData.length;
			var pageCount   = Math.max(1, Math.ceil(topicCount / topicsPerPage));
			var currentPage = parseInt(req.params.page, 10) || 1;

			if (currentPage < 1 || currentPage > pageCount) {
				currentPage = 1;
			}

			payload.nextpage = currentPage === pageCount ? false : currentPage + 1;
			payload.prevpage = currentPage === 1 ? false : currentPage - 1;

			payload.pages = [];
			for (var number = 1; number <= pageCount; number++) {
				var _page = {number: number};
				if (number === currentPage) _page.currentPage = true;
				payload.pages.push(_page);
			}

			payload.topics = [];

			var tids = [];
			for (var i = 0; i < topicsPerPage; i++) {
				var x = (currentPage - 1)*5+i;
				if (topicsData[x]) {
					payload.topics.push(topicsData[x]);
					tids.push(topicsData[x].tid);
				}
			}

			if (currentPage === 1 && topicsData[0]) {
				topics.increaseViewCount(topicsData[0].tid);
			}

			next(null, tids, req.uid);
		},
		async.apply(topics.getMainPosts),
		function (posts, next) {

			for (var i = 0; i < payload.topics.length; i++) {
				payload.topics[i].post = posts[i];
				payload.topics[i].date = getDate(payload.topics[i].timestamp);
				payload.topics[i].postcount = payload.topics[i].postcount - 1;
			}

			payload.topics.sort(function compare(a, b) {
				if (a.timestamp > b.timestamp) {
					return -1;
				}
				if (a.timestamp < b.timestamp) {
					return 1;
				}
				return 0;
			});
			next();

		}
	], function (err) {
		if (err) winston.error("Error parsing news page:", err ? (err.message || err) : 'null');

		var template = settings.get('newsTemplate') || defaultSettings['newsTemplate'];

		if (template !== 'custom') {
			app.render('news-' + template, payload, function(err, html) {
				translator.translate(html, function(translatedHTML) {
					res.render('news', {newsTemplate: translatedHTML});
				});
			});
		}else{
			var parsed = tjs.parse(settings.get('customTemplate'), payload);
			translator.translate(parsed, function(translatedHTML) {
				translatedHTML = translatedHTML.replace('&#123;', '{').replace('&#125;', '}');
				res.render('news', {newsTemplate: translatedHTML});
			});
		}
	});
}
