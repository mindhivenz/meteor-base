import {
  observable,
  computed,
  runInAction,
} from 'mobx'
import { app } from '@mindhive/di'

/* eslint-disable no-console */

const device = global.device
const getAppVersion = global.cordova.getAppVersion
const WebAppLocalServer = global.WebAppLocalServer

class AppStoreDomain {

  @observable packageName
  @observable needsUpdate = false

  constructor() {
    if (app().Meteor.isCordova) {
      if (! device) {
        throw new Error('You need to install the cordova:cordova-plugin-device')
      }
      if (! getAppVersion) {
        throw new Error('You need to install the cordova:cordova-plugin-app-version')
      }
      getAppVersion.getPackageName()
        .then((packageName) => {
          runInAction('set packageName', () => { this.packageName = packageName })
        })
      WebAppLocalServer.onError((e) => {
        if (String(e).includes('Cordova platform or versions changed')) {
          runInAction('set needsUpdate', () => { this.needsUpdate = true })
        }
      })
    }
  }

  @computed get storeName() {
    switch (device.platform) {
      case 'Android': return 'GooglePlay'
      case 'iOS': return 'AppStore'
      default: {
        console.warn('Returning null storeName un unsupported platform')
        return null
      }
    }
  }

  @computed get storeUrl() {
    switch (device.platform) {
      case 'Android': {
        if (! this.packageName) {
          console.warn('Returning null storeUrl as packageName not retrieved yet')
          return null
        }
        return `https://play.google.com/store/apps/details?id=${this.packageName}`
      }
      default: {
        console.warn('Returning null storeUrl un unsupported platform')
        return null
      }
    }
  }
}

export default () => ({
  appStoreDomain: new AppStoreDomain(),
})
