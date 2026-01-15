import { executeQueryJSON } from '@arcgis/core/rest/query'
import Query from '@arcgis/core/rest/support/Query'

export interface Feeder {
    label: string
    value: string
}

export async function getFeeders(feederUrl: string): Promise<Feeder[]> {
    const query = new Query()
    query.where = '1=1'
    query.outFields = ['FFNAME', 'FFCODE']
    query.returnDistinctValues = true
    query.returnGeometry = false

    try {
        const results = await executeQueryJSON(feederUrl, query)

        if (!results || !results.features) {
            return []
        }

        const feeders = results.features.map(feature => ({
            label: feature.attributes.FFNAME,
            value: feature.attributes.FFCODE
        }))

        // Sort alphabetically
        feeders.sort((a, b) => a.label.localeCompare(b.label))

        return feeders
    } catch (error) {
        console.error('Error fetching feeders:', error)
        throw error
    }
}
