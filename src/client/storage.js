
/* eslint-disable no-console */

// For consistency, use same storage as Meteor

export class LocalStorage {

  localStorage = global.localStorage

  read(path) {
    const value = this.localStorage.getItem(path)
    try {
      return JSON.parse(value)
    } catch (e) {
      console.warn(`Failed to JSON parse from localStorage path ${path}`, e)
      return null
    }
  }

  write(path, data) {
    try {
      if (data) {
        this.localStorage.setItem(path, JSON.stringify(data))
      } else {
        this.localStorage.removeItem(path)
      }
      return true
    } catch (e) {
      console.warn(`Failed to write to localStorage path ${path}`, e)
      return false
    }
  }
}
