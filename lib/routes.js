// routes.js

const controllers = require('./controllers')

const routeHelpers = require.main.require('./src/routes/helpers')

exports.setup = async ({router}) => {
  routeHelpers.setupPageRoute(router, '/featured', controllers.renderAdminLists)
  routeHelpers.setupPageRoute(router, '/user/:userslug/featured', controllers.renderUserLists)

  routeHelpers.setupPageRoute(router, '/news', controllers.renderNewsPage)
  routeHelpers.setupPageRoute(router, '/news/:page', controllers.renderNewsPage)

  routeHelpers.setupPageRoute(router, '/user/:userslug/blog', controllers.renderBlogPage)
  routeHelpers.setupPageRoute(router, '/user/:userslug/blog/:page', controllers.renderBlogPage)
  routeHelpers.setupPageRoute(router, '/user/:userslug/featured/:listslug', controllers.renderBlogPage)
  routeHelpers.setupPageRoute(router, '/user/:userslug/featured/:listslug/:page', controllers.renderBlogPage)

  routeHelpers.setupAdminPageRoute(router, '/admin/plugins/featured-topics-extended', controllers.renderAdmin)
}
