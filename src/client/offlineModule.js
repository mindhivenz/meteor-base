import { Ground } from 'meteor/ground:db'  // eslint-disable-line import/no-unresolved


export default ({ Meteor, Tracker }) => {
  if (! Meteor.isProduction) {
    if (! Tracker.pumpMongoToMobx) {
      console.warn('space:tracker-mobx-autorun package does not appear to be installed yet you want offline')  // eslint-disable-line no-console
    }
  }
  return {
    offlineEnabled: true,
    Ground,
  }
}