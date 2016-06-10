var test = require('@mindhive/di/test')

var modules = require('../dist/test/modules')
var backDoor = require('../dist/test/backDoor')
var minimongo = require('../dist/test/mocks/minimongo')

module.exports = {
  appContext: test.appContext,
  mockAppContext: test.mockAppContext,
  mockInitModules: modules.mockInitModules,
  openBackDoor: backDoor.open,
  loginBackDoor: backDoor.login,
  MiniMongo: minimongo.MiniMongo,
}
