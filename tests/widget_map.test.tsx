/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import Widget from '../WidgetTemplate/src/runtime/widget'
import { findStationOnRoute } from '../WidgetTemplate/src/runtime/services/routeService'
import { getFeeders } from '../WidgetTemplate/src/runtime/services/feederService'
import { projectPoint } from '../WidgetTemplate/src/runtime/services/geometryUtils'

// Mock Services
vi.mock('../WidgetTemplate/src/runtime/services/routeService')
vi.mock('../WidgetTemplate/src/runtime/services/feederService')
vi.mock('../WidgetTemplate/src/runtime/services/geometryUtils')
vi.mock('jimu-arcgis', () => {
    return {
        __esModule: true,
        JimuMapViewComponent: (props: any) => {
            React.useEffect(() => {
                if (props.onActiveViewChange) {
                    props.onActiveViewChange({
                        view: {
                            map: {
                                layers: {
                                    find: () => undefined,
                                    add: () => { },
                                    removeAll: () => { }
                                },
                                add: () => { }
                            },
                            goTo: () => Promise.resolve()
                        }
                    })
                }
            }, [])
            return <div data-testid="jimu-map-view-component">{props.children}</div>
        }
    }
})

// Mock ArcGIS Classes
const mockGraphicsLayerAddMany = vi.fn()
const mockGraphicsLayerRemoveAll = vi.fn()
vi.mock('@arcgis/core/layers/GraphicsLayer', () => {
    return {
        default: class {
            title: string
            listMode: string
            constructor(props: any) {
                this.title = props.title || 'GoToStation Results'
                this.listMode = props.listMode
            }
            addMany = mockGraphicsLayerAddMany
            removeAll = mockGraphicsLayerRemoveAll
        }
    }
})

vi.mock('@arcgis/core/Graphic', () => {
    return {
        default: class {
            geometry: any
            symbol: any
            constructor(props: any) {
                this.geometry = props.geometry
                this.symbol = props.symbol
            }
        }
    }
})

vi.mock('@arcgis/core/symbols/SimpleMarkerSymbol', () => {
    return {
        default: class { }
    }
})

// Note: JimuMapViewComponent is mocked via vitest.config.ts alias to 'tests/mocks/jimu-arcgis.tsx'
// But we need to intercept the view object passed to the widget to spy on methods like goTo.
// Since the alias is hardcoded, we can't easily spy on view methods unless we spy on `GraphicsLayer` which we did above.
// For verification of `view.goTo`, we assume if graphics are added, logic flow reached that point.

describe('Widget Map Integration', () => {
    const mockConfig = {
        feederUrl: 'http://feeder-url',
        feederLayerUrl: 'http://feeder-layer-url',
        routeLayerUrl: 'http://route-layer-url',
        set: vi.fn(),
        asMutable: vi.fn()
    } as any

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getFeeders).mockResolvedValue([
            { label: 'Feeder A', value: 'FeederA' }
        ])
    })

    it('adds graphics to map when Go is clicked and results found', async () => {
        // Setup mock return
        const mockPoint = { x: 100, y: 200, spatialReference: { wkid: 1234 }, type: 'point' }
        vi.mocked(findStationOnRoute).mockResolvedValue([mockPoint] as any)
        vi.mocked(projectPoint).mockResolvedValue(mockPoint as any)

        const { container } = render(
            <Widget
                config={mockConfig}
                useMapWidgetIds={['map1']}
                id="widget1"
                dispatch={vi.fn()}
                label="GoToStation"
            />
        )

        // Wait for feeders to load (and JimuMapView to trigger activeViewChange in mock)
        await waitFor(() => {
            expect(screen.getByText('Feeder A')).toBeDefined()
        })

        // Select Feeder
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'FeederA' } })

        // Enter Station
        const stationInput = container.querySelector('input[placeholder="e.g. 100+00"]') as HTMLInputElement
        fireEvent.change(stationInput, { target: { value: '100' } })

        // Click Go
        fireEvent.click(screen.getByText('Go'))

        // Verify
        await waitFor(() => {
            expect(mockGraphicsLayerRemoveAll).toHaveBeenCalled()
            expect(mockGraphicsLayerAddMany).toHaveBeenCalled()
            // Verify specific count of graphics
            expect(mockGraphicsLayerAddMany.mock.calls[0][0]).toHaveLength(1)
        })

        expect(screen.getByText(/Success! Found 1 location/i)).toBeDefined()
    })
})
