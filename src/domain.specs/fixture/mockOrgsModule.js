

export default ({ Mongo }) => ({
  Orgs: new Mongo.Collection('orgs'),
})
