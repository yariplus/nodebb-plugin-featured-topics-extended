// settings.js

const Settings = require.main.require('./src/settings')

exports.defaultSettings = {
  newsPageTitle: '',
  newsPostCharLimit: 800,
  newsTemplate: 'porta',
  newsHideAnon: 0,
  customTemplate: '',
}

exports.setup = () => {
  exports.settings = new Settings('featured-topics-extended', '1.0.0', exports.defaultSettings)
}

exports.sync = () => {
  exports.settings.sync()
}

exports.get = (data) => {
  exports.settings.get(data)
}

