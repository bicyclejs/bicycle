module.exports = process.env.NODE_ENV === 'production' ? v => v : require('deep-freeze');
