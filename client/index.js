
var containers = require('../dist/client/containers')
var compose = require('../dist/client/compose')
var localContext = require('../dist/client/localContext')
var latchedProps = require('../dist/client/latchedProps')

module.exports = {
  loadingProps: containers.loadingProps,
  errorProps: containers.errorProps,
  errorContainer: containers.errorContainer,
  asyncContainer: containers.asyncContainer,

  withAsync: compose.withAsync,
  withMeteorReactive: compose.withMeteorReactive,
  withApiCallResult: compose.withApiCallResult,
  connectSubscription: compose.connectSubscription,

  LocalContext: localContext.LocalContext,

  withLatchedProps: latchedProps.withLatchedProps,
}
