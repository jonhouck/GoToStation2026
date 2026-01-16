/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { projectPoint } from '../WidgetTemplate/src/runtime/services/geometryUtils'
import * as projection from '@arcgis/core/geometry/projection'
import * as geometryService from '@arcgis/core/rest/geometryService'

// Mock 4.x modules
vi.mock('@arcgis/core/geometry/projection', () => ({
    load: vi.fn(),
    project: vi.fn(),
    isSupported: vi.fn().mockReturnValue(true)
}))

vi.mock('@arcgis/core/rest/geometryService', () => ({
    project: vi.fn()
}))

vi.mock('@arcgis/core/rest/support/ProjectParameters', () => {
    return {
        default: class { }
    }
})

describe('geometryUtils', () => {
    it('returns point as-is if spatial references match', async () => {
        const sr = { wkid: 4326, equals: (other: any) => other.wkid === 4326 }
        const point: any = { spatialReference: sr, x: 0, y: 0 }

        const result = await projectPoint(point, sr as any)
        expect(result).toBe(point)
        expect(projection.project).not.toHaveBeenCalled()
    })

    it('uses client-side projection if available', async () => {
        const sr1 = { wkid: 4326, equals: () => false }
        const sr2 = { wkid: 102100 }
        const point: any = { spatialReference: sr1, x: 0, y: 0 }

        vi.mocked(projection.load).mockResolvedValue()
        vi.mocked(projection.project).mockReturnValue({ x: 100, y: 100, spatialReference: sr2 } as any)

        const result = await projectPoint(point, sr2 as any)

        expect(projection.load).toHaveBeenCalled()
        expect(projection.project).toHaveBeenCalled()
        expect(result.x).toBe(100)
    })

    it('falls back to geometry service if client-side fails', async () => {
        const sr1 = { wkid: 4326, equals: () => false }
        const sr2 = { wkid: 102100 }
        const point: any = { spatialReference: sr1, x: 0, y: 0 }

        // Simulate client-side failure
        vi.mocked(projection.load).mockRejectedValue(new Error('WASM error'))

        // Mock server response
        vi.mocked(geometryService.project).mockResolvedValue([{ x: 200, y: 200, spatialReference: sr2 }] as any)

        const result = await projectPoint(point, sr2 as any, 'http://mock-service')

        expect(geometryService.project).toHaveBeenCalled()
        expect(result.x).toBe(200)
    })

    it('throws error if fallback service not provided', async () => {
        const sr1 = { wkid: 4326, equals: () => false }
        const sr2 = { wkid: 102100 }
        const point: any = { spatialReference: sr1, x: 0, y: 0 }

        vi.mocked(projection.load).mockRejectedValue(new Error('WASM error'))

        await expect(projectPoint(point, sr2 as any)).rejects.toThrow('no GeometryService URL provided')
    })
})
