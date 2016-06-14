

export const MiniMongo = {
  Collection: class MiniMongoCollection extends global.Mongo.Collection {
    constructor(name) {
      super(null)   // null causes this to be a MiniMongo
      this.name = name
    }

    _ensureIndex() {
      // Don't do anything but don't throw as MiniMongo normally would
      // REVISIT: if this was ever used on the client it should throw still
    }
  },
}
