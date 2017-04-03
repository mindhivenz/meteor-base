

export default ({
  subscription,
  collectionName,
  cursor,
}) => {
  const handle = cursor.observeChanges({
    added(id, fields) {
      subscription.added(collectionName, id, fields)
    },
    changed(id, fields) {
      subscription.changed(collectionName, id, fields)
    },
    removed(id) {
      subscription.removed(collectionName, id)
    },
  })
  subscription.onStop(() => handle.stop())
  subscription.ready()
}
