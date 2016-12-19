var lookup = require('./../dist/domain/lookup')
var withDomain = require('./../dist/domain/withDomain')

module.exports = {
  LookupDoc: lookup.LookupDoc,
  LookupDomain: lookup.LookupDomain,

  withDomain: withDomain.withDomain,
}
