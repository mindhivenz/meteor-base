

export default ({
  subscription,
  name,
  cursor,
}) => {
  const handle = cursor.observeChanges({
    added(id, fields) {
      subscription.added(name, id, fields)
    },
    changed(id, fields) {
      subscription.changed(name, id, fields)
    },
    removed(id) {
      subscription.removed(name, id)
    },
  })
  subscription.onStop(() => handle.stop())
  subscription.ready()
}
