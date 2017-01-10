import React from 'react'

import { withDisplayName } from './containers'


// If values of mapPropsToProps null/undefined, then previous values are used
export const withLatchedProps = mapPropsToProps =>
  withDisplayName('withLatchedProps',
    Component =>
      class Latched extends React.Component {

        componentWillMount() {
          this.setStateFromProps(this.props)
        }

        componentWillReceiveProps(nextProps) {
          this.setStateFromProps(nextProps)
        }

        setStateFromProps(props) {
          const applyState = {}
          const mappedProps = mapPropsToProps(props)
          if (mappedProps != null) {
            Object.entries(mappedProps).forEach(([k, v]) => {
              // So old state that was applied with a non-null value will be left intact
              if (v != null) {
                applyState[k] = v
              }
            })
            this.setState(applyState)
          }
        }

        render() {
          return React.createElement(Component, { ...this.props, ...this.state })
        }
      }
  )
