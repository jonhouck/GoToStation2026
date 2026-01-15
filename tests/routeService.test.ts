/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { findStationOnRoute } from '../WidgetTemplate/src/runtime/services/routeService'
import * as query from '@arcgis/core/rest/query'

// Mock executeQueryJSON
vi.mock('@arcgis/core/rest/query', () => ({
    executeQueryJSON: vi.fn()
}))

// Mock API 4.x Classes
vi.mock('@arcgis/core/rest/support/Query', () => {
    return {
        default: class {
            where = ''
            outFields = []
            returnGeometry = false
            returnM = false
        }
    }
})

vi.mock('@arcgis/core/geometry/Point', () => {
    return {
        default: class {
            x: number
            y: number
            spatialReference: any
            constructor(props: any) {
                this.x = props.x
                this.y = props.y
                this.spatialReference = props.spatialReference
            }
        }
    }
})

describe('routeService', () => {
    it('interpolates point corectly on a straight line', async () => {
        // Mock a horizontal line from 0,0 to 100,0 with M from 0 to 100
        const mockFeature = {
            geometry: {
                paths: [[[0, 0, 0], [100, 0, 100]]],
                spatialReference: { wkid: 1234 }
            },
            attributes: {
                STATION1: 0,
                STATION2: 100
            }
        }

        vi.mocked(query.executeQueryJSON).mockResolvedValue({ features: [mockFeature] } as any)

        const results = await findStationOnRoute('url', 'FeederA', 50, '1')

        expect(results).toHaveLength(1)
        expect(results[0].x).toBe(50)
        expect(results[0].y).toBe(0)
    })

    it('interpolates point on second segment', async () => {
        // Segment 1: 0,0(m=0) -> 50,0(m=50)
        // Segment 2: 50,0(m=50) -> 50,50(m=100)
        const mockFeature = {
            geometry: {
                paths: [[[0, 0, 0], [50, 0, 50], [50, 50, 100]]],
                spatialReference: { wkid: 1234 }
            },
            attributes: {
                STATION1: 0,
                STATION2: 100
            }
        }

        vi.mocked(query.executeQueryJSON).mockResolvedValue({ features: [mockFeature] } as any)

        const results = await findStationOnRoute('url', 'FeederA', 75, '1')

        expect(results).toHaveLength(1)
        expect(results[0].x).toBe(50)
        expect(results[0].y).toBe(25) // Midpoint of 0->50 in Y
    })

    it('returns empty array if station is out of range (client-side filter)', async () => {
        const mockFeature = {
            geometry: { paths: [] },
            attributes: { STATION1: 0, STATION2: 100 }
        }
        vi.mocked(query.executeQueryJSON).mockResolvedValue({ features: [mockFeature] } as any)

        // No reach specified, so client side filtering applies
        const results = await findStationOnRoute('url', 'FeederA', 150)
        expect(results).toHaveLength(0)
    })
})
