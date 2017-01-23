import React from 'react'
import shallowEqual from 'shallowequal'

// REVISIT: should we be reactive to observable changes used in constructor?

export const withDomain = ({
  domainClass,
  propName,
  mapPropsToArgs = props => undefined,                             // eslint-disable-line no-unused-vars
  createDomain = props => new domainClass(mapPropsToArgs(props)),  // eslint-disable-line new-cap
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
