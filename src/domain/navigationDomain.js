import { observable, action, when } from 'mobx'
import { app } from '@mindhive/di'


class NavigationDomain {

  @observable.shallow location = {
    pathname: null,
    state: {},
  }
  @observable backPathname = null

  constructor() {
    const { browserHistory } = app()
    this._locationChanged(browserHistory.getCurrentLocation())  // TODO: change to browserHistory.location in reactRouter v4
    browserHistory.listen((location) => {
      this._locationChanged(location)
    })
  }

  @action _locationChanged(browserLocation) {
    this.location.pathname = browserLocation.pathname
    if (browserLocation.state != null) {
      const { _backPathname, ...userState } = browserLocation.state
      this.location.state = userState
      this.backPathname = _backPathname
    } else {
      this.location.state = browserLocation.state
      this.backPathname = null
    }
  }

  _pathnameOrLocationToBrowserLocation(pathnameOrLocation) {
    const location = typeof pathnameOrLocation === 'object' ? pathnameOrLocation
      : { pathname: String(pathnameOrLocation) }
    if (location.state == null) {
      // ensure there is always state
      location.state = {}
    }
    return location
  }

  _withInternalState(location, backPathname) {
    const result = { ...location }
    if (backPathname != null) {
      result.state._backPathname = backPathname
    }
    return result
  }

  push(pathnameOrLocation) {
    app().browserHistory.push(
      this._withInternalState(
        this._pathnameOrLocationToBrowserLocation(pathnameOrLocation),
        this.location.pathname
      )
    )
  }

  replace(pathnameOrLocation) {
    app().browserHistory.replace(
      this._withInternalState(
        this._pathnameOrLocationToBrowserLocation(pathnameOrLocation),
        this.backPathname,
      )
    )
  }

  _joinPaths(path1, path2) {
    let path2Addition = path2
    if (path1.endsWith('/')) {
      if (path2.startsWith('/')) {
        path2Addition = path2.substring(1)
      }
    } else if (! path2.startsWith('/')) {
      path2Addition = `/${path2}`
    }
    return path1 + path2Addition
  }

  _keepDirs(dirCount) {
    if (dirCount === 0) {
      return '/'
    }
    return this.location.pathname.split('/').slice(0, dirCount > 0 ? dirCount + 1 : dirCount).join('/')
  }

  pushDown(dirsToKeep, relativePathnameOrLocation) {
    const { pathname: relativePathname, ...locationRest } =
      this._pathnameOrLocationToBrowserLocation(relativePathnameOrLocation)
    this.push({
      pathname: this._joinPaths(this._keepDirs(dirsToKeep), relativePathname),
      ...locationRest,
    })
  }

  popTo(pathname) {
    const { browserHistory } = app()
    if (this.backPathname === pathname) {
      browserHistory.goBack()
    } else {
      this.replace(pathname)
    }
  }

  // If dirCount is >= 0 then the number of directories in the URL to keep
  // If dirCount is < 0 then the number of directories to remove
  // Prefer specific positive numbers to avoid issues with quick double taps using the wrong state
  popUp(dirs = -1) {
    this.popTo(this._keepDirs(dirs))
  }

  whenNavigateAway(callback) {
    const originalPathname = this.location.pathname
    return when(
      () => this.location.pathname !== originalPathname,
      callback,
    )
  }
}

export default () => ({
  navigationDomain: new NavigationDomain(),
})
