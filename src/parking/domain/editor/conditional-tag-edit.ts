import { type ConditionalValue, parseConditionalTag } from '../../../utils/conditional-tag'

export function formatConditionalValue(value: string, condition: string | null): string {
    return condition == null || condition === '' ? value : `${value} @ (${condition})`
}

export function buildConditionalTagValue(
    parsedParts: ConditionalValue[],
    updatedPart: ConditionalValue,
    index: number,
): string {
    return parsedParts
        .map((cv, i) => index === i ? updatedPart : cv)
        .filter(cv => cv.value && cv.condition)
        .map(cv => formatConditionalValue(cv.value, cv.condition))
        .join('; ')
}

export function parseConditionalTagForEdit(tagValue: string | undefined): ConditionalValue[] {
    const parsed = tagValue ? parseConditionalTag(tagValue) : []
    parsed.push({ value: '', condition: null })
    return parsed
}
