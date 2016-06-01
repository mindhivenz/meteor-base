

export const MiniMongo = {
  Collection: class MiniMongoCollection extends global.Mongo.Collection {
    constructor(name) {
      super(null)   // null causes this to be a MiniMongo
      this.name = name
    }
  },
}
