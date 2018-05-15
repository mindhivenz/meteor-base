import uniq from 'lodash/uniq'


export const topLevelFieldsFromSchema = (schemaOrMongoFieldsDef) => {
  if (! schemaOrMongoFieldsDef) {
    return null
  }
  const deepFields = schemaOrMongoFieldsDef._schemaKeys || Object.keys(schemaOrMongoFieldsDef)
  return uniq(deepFields.map(f => f.split('.')[0]))
}

export const collectionAttachedSchema = collection =>
  collection._c2 && collection._c2._simpleSchema && collection._c2._simpleSchema.mergedSchema()
