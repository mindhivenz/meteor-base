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
      this.location.state = {}
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

  // dirsToKeep of current URL and then relative from there
  pushDown(dirsToKeep, relativePathnameOrLocation) {
    const { pathname: relativePathname, ...locationRest } =
      this._pathnameOrLocationToBrowserLocation(relativePathnameOrLocation)
    this.push({
      pathname: this._joinPaths(this._keepDirs(dirsToKeep), relativePathname),
      ...locationRest,
    })
  }

  // Browser back if we managed navigation to here, otherwise replace based on dirs (optional)
  // So dirs should only used, for example, if a link was shared. Otherwise there will be browser history that we have
  // managed.
  // By default back goes to '/' (when dirs is 0)
  // If dirs is >= 0 then the number of directories in the URL to keep
  //    (recommended to avoid race conditions on quick double clicks)
  // If dirs is < 0 then the number of directories to remove
  pop(dirs = 0) {
    const { browserHistory } = app()
    if (this.backPathname) {
      browserHistory.goBack()
    } else {
      this.replace(this._keepDirs(dirs))
    }
  }

  // If browser back button would take us to the same place, then use that, otherwise replace
  popTo(pathname) {
    const { browserHistory } = app()
    if (this.backPathname === pathname) {
      browserHistory.goBack()
    } else {
      this.replace(pathname)
    }
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
