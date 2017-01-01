import React from 'react'
import shallowEqual from 'shallowequal'


const classNameAsVarName = (className) =>
  className && className.substr(0, 1).toLowerCase() + className.substr(1)

const withDomainOptions = ({
  domainClass,
  mapPropsToArgs = props => undefined,                             // eslint-disable-line no-unused-vars
  createDomain = props => new domainClass(mapPropsToArgs(props)),  // eslint-disable-line new-cap
  propName = classNameAsVarName(domainClass.name) || 'domain',
  shouldRecreateDomain = (currentProps, nextProps) =>
    ! shallowEqual(mapPropsToArgs(currentProps), mapPropsToArgs(nextProps)),
  updateDomain = (domain, props) => { if (typeof domain.update === 'function') domain.update(props) },
  stopDomain = (domain) => { if (typeof domain.stop === 'function') domain.stop() },
}) =>
  Component =>
    class extends React.Component {

      static displayName = domainClass.name

      domain = null

      componentWillMount() {
        this.domain = createDomain(this.props)
        updateDomain(this.domain, this.props)
      }

      componentWillReceiveProps(nextProps) {
        if (shouldRecreateDomain(this.props, nextProps)) {
          stopDomain(this.domain)
          this.domain = createDomain(nextProps)
        }
        updateDomain(this.domain, nextProps)
      }

      componentWillUnmount() {
        if (this.domain) {
          stopDomain(this.domain)
          this.domain = null
        }
      }

      render() {
        return React.createElement(Component, { ...this.props, [propName]: this.domain })
      }
    }

export const withDomain = classOrOptions =>
  typeof classOrOptions === 'function' ?
    withDomainOptions({ domainClass: classOrOptions })
    : withDomainOptions(classOrOptions)
