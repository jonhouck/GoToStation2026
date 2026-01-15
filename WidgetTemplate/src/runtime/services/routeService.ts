import { executeQueryJSON } from '@arcgis/core/rest/query'
import Query from '@arcgis/core/rest/support/Query'
import Point from '@arcgis/core/geometry/Point'
import { Polyline } from '@arcgis/core/geometry'

export async function findStationOnRoute(
    routeUrl: string,
    feeder: string,
    station: number,
    reach?: string
): Promise<Point[]> {
    const query = new Query()
    query.returnGeometry = true
    query.returnM = true
    query.outFields = ['ROUTEREACH', 'STATION1', 'STATION2']

    if (reach) {
        const routeReach = `${feeder}_${reach}`
        query.where = `ROUTEREACH = '${routeReach}'`
    } else {
        query.where = `ROUTEREACH LIKE '${feeder}%'`
    }

    try {
        const results = await executeQueryJSON(routeUrl, query)

        if (!results || !results.features || results.features.length === 0) {
            return []
        }

        const foundPoints: Point[] = []

        results.features.forEach(feature => {
            // If we are doing a broad search (no reach specified), filter by station range
            if (!reach) {
                const s1 = feature.attributes.STATION1
                const s2 = feature.attributes.STATION2
                if (station < s1 || station > s2) {
                    return
                }
            }

            const geometry = feature.geometry as Polyline
            const match = interpolatePointOnPolyline(geometry, station)
            if (match) {
                foundPoints.push(match)
            }
        })

        return foundPoints

    } catch (error) {
        console.error('Error querying route:', error)
        throw error
    }
}

function interpolatePointOnPolyline(polyline: Polyline, targetStation: number): Point | null {
    if (!polyline.paths) return null

    for (const path of polyline.paths) {
        for (let i = 1; i < path.length; i++) {
            const startVertex = path[i - 1] // [x, y, m]
            const endVertex = path[i]       // [x, y, m]

            // Check if m-values exist (index 2)
            if (startVertex.length < 3 || endVertex.length < 3) continue

            const startM = startVertex[2]
            const endM = endVertex[2]

            // Check if target station is within this segment
            // Note: Assuming increasing M values for now, but should handle directionality if needed. 
            // Legacy code checked: vertices[j][2] > stationNumber -> meaning it passed it.

            const minM = Math.min(startM, endM)
            const maxM = Math.max(startM, endM)

            if (targetStation >= minM && targetStation <= maxM) {
                const ratio = (targetStation - startM) / (endM - startM)
                const x = startVertex[0] + (endVertex[0] - startVertex[0]) * ratio
                const y = startVertex[1] + (endVertex[1] - startVertex[1]) * ratio

                return new Point({
                    x: x,
                    y: y,
                    spatialReference: polyline.spatialReference
                })
            }
        }
    }
    return null
}
