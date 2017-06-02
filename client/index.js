const containers = require('../dist/client/containers')
const compose = require('../dist/client/compose')
const localContext = require('../dist/client/localContext')
const latchedProps = require('../dist/client/latchedProps')
const selectedState = require('../dist/client/selectedState')


module.exports.loadingProps = containers.loadingProps
module.exports.errorProps = containers.errorProps
module.exports.errorContainer = containers.errorContainer
module.exports.asyncContainer = containers.asyncContainer

module.exports.withAsync = compose.withAsync
module.exports.withMeteorReactive = compose.withMeteorReactive
module.exports.withApiCallResult = compose.withApiCallResult
module.exports.connectSubscription = compose.connectSubscription

module.exports.LocalContext = localContext.default

module.exports.withLatchedProps = latchedProps.withLatchedProps

module.exports.selectedState = selectedState.default
module.exports.SELECT_NEW_ID = selectedState.SELECT_NEW_ID
