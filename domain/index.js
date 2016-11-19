var lookup = require('./../dist/domain/lookup')
var withDomain = require('./../dist/domain/withDomain')

module.exports = {
  Lookup: lookup.Lookup,
  LookupDomain: lookup.LookupDomain,

  withDomain: withDomain.withDomain,
}
