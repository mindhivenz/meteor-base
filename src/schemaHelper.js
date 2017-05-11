import uniq from 'lodash/uniq'


export const topLevelFieldsFromSchema = schemaOrMongoFieldsDef =>
  schemaOrMongoFieldsDef &&
    uniq(
      Object.keys(schemaOrMongoFieldsDef)
        .map(f => f.split('.')[0])
    )

export const collectionAttachedSchema = collection =>
  collection._c2 && collection._c2._simpleSchema && collection._c2._simpleSchema.mergedSchema()
