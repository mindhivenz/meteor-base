

// For consistency, use same storage as Meteor

export class LocalStorage {

  read(path) {
    const value = global.localStorage.getItem(path)
    try {
      return JSON.parse(value)
    } catch (e) {
      return value
    }
  }

  write(path, data) {
    try {
      if (data) {
        global.localStorage.setItem(path, JSON.stringify(data))
      } else {
        global.localStorage.removeItem(path)
      }
      return true
    } catch (e) {
      console.warn(`Failed to write to localStorage path ${path}`, e)
      return false
    }
  }
}
