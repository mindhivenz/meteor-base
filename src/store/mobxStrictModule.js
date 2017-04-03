import { useStrict } from 'mobx'


export default ({ Meteor }) => {
  if (! Meteor.isProduction) {
    useStrict(true)
  }
}
