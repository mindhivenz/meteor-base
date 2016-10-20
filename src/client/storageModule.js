

export const localStorage = {
  read(path) {
    return Promise.resolve(global.localStorage.getItem(path))
  },

  write(path, data) {
    try {
      if (data) {
        global.localStorage.setItem(path, data)
      } else {
        global.localStorage.removeItem(path)
      }
      return Promise.resolve(data)
    } catch (e) {
      return Promise.reject(e)
    }
  },
}

export default () => ({
  storage: localStorage,
})
