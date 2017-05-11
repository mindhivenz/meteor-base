var containers = require('../dist/client/containers')
var compose = require('../dist/client/compose')
var localContext = require('../dist/client/localContext')
var latchedProps = require('../dist/client/latchedProps')
var selectedState = require('../dist/client/selectedState')


module.exports = {
  loadingProps: containers.loadingProps,
  errorProps: containers.errorProps,
  errorContainer: containers.errorContainer,
  asyncContainer: containers.asyncContainer,

  withAsync: compose.withAsync,
  withMeteorReactive: compose.withMeteorReactive,
  withApiCallResult: compose.withApiCallResult,
  connectSubscription: compose.connectSubscription,

  LocalContext: localContext.default,

  withLatchedProps: latchedProps.withLatchedProps,

  selectedState: selectedState.default,
  SELECT_NEW_ID: selectedState.SELECT_NEW_ID,
}
