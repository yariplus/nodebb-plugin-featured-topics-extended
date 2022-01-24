// routes.js

const controllers = require('./controllers')

const routeHelpers = require.main.require('./src/routes/helpers')

exports.setup = async ({router, middleware}) => {
  routeHelpers.setupPageRoute(router, '/featured', middleware, [], controllers.renderEditor)
  routeHelpers.setupPageRoute(router, '/user/:userslug/featured', middleware, [], controllers.renderUserFeatured)
}

