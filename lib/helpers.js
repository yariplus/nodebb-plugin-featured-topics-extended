// helpers.js

// Date parsing helper.
exports.getDate = (timestamp) => {
  let date = new Date(parseInt(timestamp, 10))

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const hours = date.getHours()

  date = {
    full  : `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
    year  : date.getFullYear(),
    month : months[date.getMonth()],
    date  : date.getDate(),
    day   : days[date.getDay()],
    mer   : hours >= 12 ? 'PM' : 'AM',
    hour  : hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours),
    min   : date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes(),
    sec   : date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()
  }

  date.start = (Date.now() - parseInt(timestamp, 10))/1000 < 604800 ? `${date.day} at ${date.hour}:${date.min} ${date.mer}` : date.full

  return date
}

// Text cutting helper
exports.clip = require('../modules/text-clipper').default
