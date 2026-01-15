import Point from '@arcgis/core/geometry/Point'
import SpatialReference from '@arcgis/core/geometry/SpatialReference'
import * as projection from '@arcgis/core/geometry/projection'
import * as geometryService from '@arcgis/core/rest/geometryService'
import ProjectParameters from '@arcgis/core/rest/support/ProjectParameters'

export async function projectPoint(
    point: Point,
    targetSpatialReference: SpatialReference,
    geometryServiceUrl?: string
): Promise<Point> {
    // 1. Check if projection is needed
    if (point.spatialReference.equals(targetSpatialReference)) {
        return point
    }

    try {
        // 2. Try Client-Side Projection
        await projection.load()
        const projectedPoint = projection.project(point, targetSpatialReference) as Point

        if (projectedPoint) {
            return projectedPoint
        }
    } catch (e) {
        console.warn('Client-side projection failed or not supported, falling back to GeometryService.', e)
    }

    // 3. Fallback to Server-Side GeometryService
    if (!geometryServiceUrl) {
        throw new Error('Projection failed: Client-side projection failed and no GeometryService URL provided.')
    }

    try {
        const params = new ProjectParameters({
            geometries: [point],
            outSpatialReference: targetSpatialReference
        })

        const results = await geometryService.project(geometryServiceUrl, params)

        if (results && results.length > 0) {
            return results[0] as Point
        } else {
            throw new Error('GeometryService returned no results.')
        }
    } catch (error) {
        console.error('GeometryService projection error:', error)
        throw error
    }
}
