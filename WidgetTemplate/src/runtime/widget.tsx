/**
  Licensing

  Copyright 2022 Esri

  Licensed under the Apache License, Version 2.0 (the "License"); You
  may not use this file except in compliance with the License. You may
  obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied. See the License for the specific language governing
  permissions and limitations under the License.

  A copy of the license is available in the repository's
  LICENSE file.
*/
import { React, type AllWidgetProps } from 'jimu-core'
import type { IMConfig } from '../config'
import { Select, Option, TextInput, Button, Label } from 'jimu-ui'
import { getFeeders } from './services/feederService'
import { findStationOnRoute } from './services/routeService'

interface State {
  feeders: Array<{ label: string, value: string }>
  selectedFeeder: string
  reach: string
  station: string
  message: string
}

export default class Widget extends React.PureComponent<AllWidgetProps<IMConfig>, State> {
  constructor(props: AllWidgetProps<IMConfig>) {
    super(props)
    this.state = {
      feeders: [],
      selectedFeeder: '',
      reach: '',
      station: '',
      message: ''
    }
  }

  async componentDidMount() {
    if (this.props.config.feederUrl) {
      try {
        const feeders = await getFeeders(this.props.config.feederUrl)
        this.setState({ feeders })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.setState({ message: 'Error loading feeders: ' + errorMessage })
      }
    }
  }

  onFeederChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ selectedFeeder: evt.target.value })
  }

  onReachChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ reach: evt.target.value })
  }

  onStationChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ station: evt.target.value })
  }

  onGoClick = async () => {
    const { selectedFeeder, reach, station } = this.state

    if (!selectedFeeder || !station) {
      this.setState({ message: 'Please select a feeder and enter a station.' })
      return
    }

    const cleanStation = parseFloat(station.replace('+', ''))
    if (isNaN(cleanStation)) {
      this.setState({ message: 'Invalid station value.' })
      return
    }

    this.setState({ message: 'Searching...' })

    try {
      const results = await findStationOnRoute(
        this.props.config.routeLayerUrl,
        selectedFeeder,
        cleanStation,
        reach
      )

      if (results.length === 0) {
        this.setState({ message: 'Could not find reach or station out of range.' })
      } else {
        // Log results for Phase 4 verification
        console.log('Found locations:', results)
        this.setState({ message: `Success! Found ${results.length} location(s). See console for details.` })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.setState({ message: 'Error querying route: ' + errorMessage })
    }
  }

  render() {
    return (
      <div className="widget-go-to-station jimu-widget" style={{ padding: '1rem', overflow: 'auto' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Label>
            Feeder
            <Select
              onChange={this.onFeederChange}
              value={this.state.selectedFeeder}
              placeholder="Select a Feeder"
              style={{ width: '100%', marginTop: '0.25rem' }}
            >
              {this.state.feeders.map((feeder: { label: string, value: string }) => (
                <Option key={feeder.value} value={feeder.value}>
                  {feeder.label}
                </Option>
              ))}
              {/* Temporary mock option for UI testing until Phase 4 */}
            </Select>
          </Label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <Label>
            Reach (Optional)
            <TextInput
              onChange={this.onReachChange}
              value={this.state.reach}
              placeholder="e.g. 1"
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </Label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <Label>
            Station
            <TextInput
              onChange={this.onStationChange}
              value={this.state.station}
              placeholder="e.g. 100+00"
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </Label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <Button type="primary" onClick={this.onGoClick} style={{ width: '100%' }}>
            Go
          </Button>
        </div>

        {this.state.message && (
          <div className="message-area" style={{ marginTop: '1rem', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
            {this.state.message}
          </div>
        )}
      </div>
    )
  }
}
