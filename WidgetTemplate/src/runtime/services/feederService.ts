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

export interface FeederRange {
    min: number
    max: number
}

export async function getFeederRange(feederLayerUrl: string, selectedFeeder: string): Promise<FeederRange | null> {
    const query = new Query()
    query.where = `FFCODE = '${selectedFeeder}'`
    query.outStatistics = [
        {
            statisticType: 'min',
            onStatisticField: 'STATION1',
            outStatisticFieldName: 'MIN_STATION'
        },
        {
            statisticType: 'max',
            onStatisticField: 'STATION2',
            outStatisticFieldName: 'MAX_STATION'
        }
    ] as any // eslint-disable-line @typescript-eslint/no-explicit-any

    try {
        const results = await executeQueryJSON(feederLayerUrl, query)

        if (!results || !results.features || results.features.length === 0) {
            return null
        }

        const attributes = results.features[0].attributes
        const min = attributes.MIN_STATION
        const max = attributes.MAX_STATION

        // Check if we got valid numbers
        if (typeof min === 'number' && typeof max === 'number') {
            return { min, max }
        }

        return null

    } catch (error) {
        console.error('Error fetching feeder range:', error)
        throw error
    }
}

