import * as mobx from 'mobx'


export default ({ Meteor }) => {
  if (! Meteor.isProduction) {
    mobx.useStrict(true)
  }
}
