import SimpleSchema from 'simpl-schema'


export default new SimpleSchema({
  emails: { type: Array, optional: true },
  'emails.$': { type: Object, optional: true, blackbox: true },
  createdAt: Date,
  profile: { type: Object, optional: true },
  services: { type: Object, optional: true },
  'services.password': { type: Object, optional: true, blackbox: true },
  'services.resume': { type: Object, optional: true, blackbox: true },
  roles: { type: Array, optional: true },
  'roles.$': String,
  heartbeat: { type: Date, optional: true },  // In order to avoid an 'Exception in setInterval callback' from Meteor
})
