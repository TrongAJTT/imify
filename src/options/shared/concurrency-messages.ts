/**
 * Shared concurrency-related constants and messages
 * Used across Batch Processor and Image Splicing
 */

export const CONCURRENCY_TOOLTIP = `Controls how many images are processed simultaneously.\n\nHigher values = faster processing but more RAM usage.\n\nHeavy formats (AVIF, JXL) are limited to maximum 5.`

export function getConcurrencyTooltip(
	maxStandardFormatConcurrency: number,
	maxHeavyFormatConcurrency: number
): string {
	return `Controls how many images are processed simultaneously.\n\nHigher values = faster processing but more RAM usage.\n\nStandard formats (JPG, PNG, WebP, BMP, TIFF, ICO): max ${maxStandardFormatConcurrency}.\nHeavy formats (AVIF, JXL): max ${maxHeavyFormatConcurrency}.`
}
