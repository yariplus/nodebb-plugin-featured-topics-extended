// routes.js

const controllers = require('./controllers')

const routeHelpers = require.main.require('./src/routes/helpers')

exports.setup = async ({router, middleware}) => {
  routeHelpers.setupPageRoute(router, '/featured', middleware, [], controllers.renderEditor)
  routeHelpers.setupPageRoute(router, '/user/:userslug/featured', middleware, [], controllers.renderUserFeatured)

  routeHelpers.setupPageRoute(router, '/news', middleware, [], controllers.renderNewsPage)
  routeHelpers.setupPageRoute(router, '/news/:page', middleware, [], controllers.renderNewsPage)

  routeHelpers.setupPageRoute(router, '/user/:userslug/blog', middleware, [], controllers.renderBlogPage)
  routeHelpers.setupPageRoute(router, '/user/:userslug/blog/:page', middleware, [], controllers.renderBlogPage)
  routeHelpers.setupPageRoute(router, '/user/:userslug/featured/:listslug', middleware, [], controllers.renderBlogPage)
  routeHelpers.setupPageRoute(router, '/user/:userslug/featured/:listslug/:page', middleware, [], controllers.renderBlogPage)

  routeHelpers.setupAdminPageRoute(router, '/admin/plugins/featured-topics-extended', middleware, [], controllers.renderAdmin)
}
