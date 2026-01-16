/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { getFeeders, getFeederRange } from '../WidgetTemplate/src/runtime/services/feederService'
import * as query from '@arcgis/core/rest/query'

// Mock executeQueryJSON
vi.mock('@arcgis/core/rest/query', () => ({
    executeQueryJSON: vi.fn()
}))

// Mock Query class
vi.mock('@arcgis/core/rest/support/Query', () => {
    return {
        default: class {
            where = ''
            outFields = []
            outStatistics = []
            returnDistinctValues = false
            returnGeometry = false
        }
    }
})

describe('feederService', () => {
    it('fetches and transforms feeders correctly', async () => {
        const mockResults = {
            features: [
                { attributes: { FFNAME: 'Feeder B', FFCODE: 'B' } },
                { attributes: { FFNAME: 'Feeder A', FFCODE: 'A' } }
            ]
        }

        vi.mocked(query.executeQueryJSON).mockResolvedValue(mockResults as any)

        const feeders = await getFeeders('http://mock-url')

        expect(query.executeQueryJSON).toHaveBeenCalled()

        // Verify sorting (A before B) and mapping
        expect(feeders).toHaveLength(2)
        expect(feeders[0].label).toBe('Feeder A')
        expect(feeders[0].value).toBe('A')
        expect(feeders[1].label).toBe('Feeder B')
        expect(feeders[1].value).toBe('B')
    })

    it('handles empty results', async () => {
        vi.mocked(query.executeQueryJSON).mockResolvedValue({ features: [] } as any)
        const feeders = await getFeeders('http://mock-url')
        expect(feeders).toEqual([])
    })

    it('handles API errors', async () => {
        vi.mocked(query.executeQueryJSON).mockRejectedValue(new Error('Network error'))
        await expect(getFeeders('http://mock-url')).rejects.toThrow('Network error')
    })

    describe('getFeederRange', () => {
        it('fetches and returns min/max station range', async () => {
            const mockResults = {
                features: [
                    { attributes: { MIN_STATION: 100, MAX_STATION: 2000 } }
                ]
            }

            vi.mocked(query.executeQueryJSON).mockResolvedValue(mockResults as any)

            const range = await getFeederRange('http://mock-layer', 'FeederA')

            expect(query.executeQueryJSON).toHaveBeenCalled()
            expect(range).toEqual({ min: 100, max: 2000 })
        })

        it('returns null if no features found', async () => {
            vi.mocked(query.executeQueryJSON).mockResolvedValue({ features: [] } as any)
            const range = await getFeederRange('http://mock-layer', 'FeederA')
            expect(range).toBeNull()
        })

        it('returns null if attributes are missing/invalid', async () => {
            vi.mocked(query.executeQueryJSON).mockResolvedValue({
                features: [{ attributes: { MIN_STATION: null, MAX_STATION: null } }]
            } as any)
            const range = await getFeederRange('http://mock-layer', 'FeederA')
            expect(range).toBeNull()
        })
    })
})

