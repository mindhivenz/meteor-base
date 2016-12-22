import React from 'react'
import { autorun } from 'mobx'
import { observer } from 'mobx-react'


const classNameAsVarName = (className) =>
  className && className.substr(0, 1).toLowerCase() + className.substr(1)

const withDomainOptions = ({
  domainClass,
  mapPropsToArgs = props => props,                                 // eslint-disable-line no-unused-vars
  createDomain = props => new domainClass(mapPropsToArgs(props)),  // eslint-disable-line new-cap
  propName = classNameAsVarName(domainClass.name) || 'domain',
  updateDomain = (domain, props) => { if (typeof domain.update === 'function') domain.update(props) },
  stopDomain = (domain) => { if (typeof domain.stop === 'function') domain.stop() },
}) =>
  Component =>
    observer(class extends React.Component {

      static displayName = domainClass.name

      constructor(props) {
        super(props)
        let inConstructor = true
        this.autorunCreateDisposer = autorun(`withDomain creating ${domainClass.name}`, () => {
          const newState = { domain: createDomain(this.props) }
          if (inConstructor) {
            this.state = newState
          } else {
            this.setState(newState)
          }
        })
        inConstructor = false
      }

      componentWillUnmount() {
        if (this.autorunCreateDisposer) {
          this.autorunCreateDisposer()
          this.autorunCreateDisposer = null
        }
        if (this.state.domain) {
          stopDomain(this.state.domain)
        }
      }

      render() {
        updateDomain(this.state.domain, this.props)  // REVISIT: Could get tricky and do this in it's own autorun like creation, but usually render() will match prop changes anyway
        return React.createElement(Component, { ...this.props, [propName]: this.state.domain })
      }
    })

export const withDomain = classOrOptions =>
  typeof classOrOptions === 'function' ?
    withDomainOptions({ domainClass: classOrOptions })
    : withDomainOptions(classOrOptions)
