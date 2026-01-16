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
import { getFeeders, getFeederRange } from './services/feederService'
import { findStationOnRoute } from './services/routeService'
import { projectPoint } from './services/geometryUtils'
import SpatialReference from '@arcgis/core/geometry/SpatialReference'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Layer from '@arcgis/core/layers/Layer'
import Graphic from '@arcgis/core/Graphic'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'

interface State {
  feeders: Array<{ label: string, value: string }>
  selectedFeeder: string
  reach: string
  station: string
  message: string
  minValidStation: number | null
  maxValidStation: number | null
  jimuMapView: JimuMapView
}

export default class Widget extends React.PureComponent<AllWidgetProps<IMConfig>, State> {
  constructor(props: AllWidgetProps<IMConfig>) {
    super(props)
    this.state = {
      feeders: [],
      selectedFeeder: '',
      reach: '',
      station: '',
      message: '',
      minValidStation: null,
      maxValidStation: null,
      jimuMapView: null
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

  onActiveViewChange = (jmv: JimuMapView) => {
    this.setState({ jimuMapView: jmv })
  }

  onFeederChange = async (evt: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFeeder = evt.target.value
    this.setState({ selectedFeeder, minValidStation: null, maxValidStation: null, message: '' })

    if (selectedFeeder && this.props.config.feederLayerUrl) {
      try {
        const range = await getFeederRange(this.props.config.feederLayerUrl, selectedFeeder)
        if (range) {
          this.setState({
            minValidStation: range.min,
            maxValidStation: range.max
          })
        }
      } catch (error) {
        console.error('Error fetching range:', error)
      }
    }
  }

  onReachChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ reach: evt.target.value })
  }

  onStationChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ station: evt.target.value })
  }

  onGoClick = async () => {
    const { selectedFeeder, reach, station, minValidStation, maxValidStation } = this.state

    if (!selectedFeeder || !station) {
      this.setState({ message: 'Please select a feeder and enter a station.' })
      return
    }

    const cleanStation = parseFloat(station.replace('+', ''))
    if (isNaN(cleanStation)) {
      this.setState({ message: 'Invalid station value.' })
      return
    }

    // Range Validation
    if (minValidStation !== null && maxValidStation !== null) {
      if (cleanStation < minValidStation || cleanStation > maxValidStation) {
        this.setState({
          message: `Invalid station. Must be between ${minValidStation} and ${maxValidStation}.`
        })
        return
      }
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
        // Project points for Phase 4.3 verification
        // Note: In Phase 5 we will get the actual View SR. For now default to Web Mercator (102100).
        const targetSR = new SpatialReference({ wkid: 102100 })
        const geometryServiceUrl = this.props.config.geometryServiceUrl || 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer'

        const projectedPoints = await Promise.all(results.map(async (point) => {
          try {
            return await projectPoint(point, targetSR, geometryServiceUrl)
          } catch (e) {
            console.error('Failed to project point:', e)
            return point // Return original if projection fails (fallback)
          }
        }))

        console.log('Found locations (Original):', results)
        console.log('Found locations (Projected):', projectedPoints)
        this.setState({ message: `Success! Found ${results.length} location(s).` })

        // Map Visualization
        if (this.state.jimuMapView && this.state.jimuMapView.view) {
          const view = this.state.jimuMapView.view

          let graphicsLayer = view.map.layers.find((l: Layer) => l.title === 'GoToStation Results') as GraphicsLayer
          if (!graphicsLayer) {
            graphicsLayer = new GraphicsLayer({ title: 'GoToStation Results', listMode: 'hide' })
            view.map.add(graphicsLayer)
          }
          graphicsLayer.removeAll()

          const graphics = projectedPoints.map(point => new Graphic({
            geometry: point,
            symbol: new SimpleMarkerSymbol({
              style: 'circle',
              color: [0, 255, 255, 0.8],
              size: '12px',
              outline: {
                color: [0, 0, 0, 0.5],
                width: 1
              }
            })
          }))

          graphicsLayer.addMany(graphics)

          view.goTo({
            target: graphics,
            zoom: 16
          })
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.setState({ message: 'Error querying route: ' + errorMessage })
    }
  }

  render() {
    return (
      <div className="widget-go-to-station jimu-widget" style={{ padding: '1rem', overflow: 'auto' }}>
        {Object.prototype.hasOwnProperty.call(this.props, 'useMapWidgetIds') && this.props.useMapWidgetIds && this.props.useMapWidgetIds.length === 1 && (
          <JimuMapViewComponent
            useMapWidgetId={this.props.useMapWidgetIds?.[0]}
            onActiveViewChange={this.onActiveViewChange}
          />
        )}
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
          {this.state.minValidStation !== null && this.state.maxValidStation !== null && (
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
              Valid values: {this.state.minValidStation} - {this.state.maxValidStation}
            </div>
          )}
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
