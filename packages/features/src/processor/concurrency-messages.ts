/**
 * Shared concurrency-related constants and messages
 * Used across Batch Processor and Image Splicing
 */

export const CONCURRENCY_TOOLTIP = `Controls how many images are processed simultaneously (1-90).\n- Higher values process faster but increase CPU and RAM pressure.`

export function getConcurrencyTooltip(currentFormat: string): string {
	return `${CONCURRENCY_TOOLTIP}\n- Current format: ${currentFormat.toUpperCase()}.\n- Use Smart Concurrency Advisor below for hardware-aware recommendations.`
}
