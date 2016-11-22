import { Ground } from 'meteor/ground:db'


export default ({ Mongo }) => {
  Ground.Collection.prototype.attachSchema = Mongo.Collection.prototype.attachSchema
  if (! Ground.Collection.prototype.deny) {
    // Otherwise attachSchema doesn't work, but what functionality are we losing with attachSchema using deby?
    // https://github.com/aldeed/meteor-collection2-core/blob/1f4acc68a50a4b62793a327ed34832bd9254998a/lib/collection2.js#L547
    Ground.Collection.prototype.deny = () => {}
  }
  return {
    offlineEnabled: true,
    Ground,
  }
}
