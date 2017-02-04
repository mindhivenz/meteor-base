var lookup = require('./../dist/domain/lookup')
var withStore = require('@mindhive/mobx/withStore')

module.exports = {
  LookupDoc: lookup.LookupDoc,
  LookupDomain: lookup.LookupDomain,

  withDomain: withStore,
}
