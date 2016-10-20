
var containers = require('../dist/client/containers')
var compose = require('../dist/client/compose')

module.exports = {
  withDisplayName: containers.withDisplayName,
  loadingProps: containers.loadingProps,
  errorProps: containers.errorProps,
  errorContainer: containers.errorContainer,
  asyncContainer: containers.asyncContainer,

  withAsync: compose.withAsync,
  withMeteorReactive: compose.withMeteorReactive,
  withApiCallResult: compose.withApiCallResult,
  connectSubscription: compose.connectSubscription,
}
