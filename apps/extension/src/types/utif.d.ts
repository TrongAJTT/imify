declare module "utif" {
  export interface Ifd {
    width?: number
    height?: number
    t256?: number | number[]
    t257?: number | number[]
    [key: string]: unknown
  }

  export function encodeImage(
    rgba: Uint8Array,
    width: number,
    height: number,
    metadata?: Record<string, unknown>
  ): ArrayBuffer

  export function encode(ifds: unknown[]): ArrayBuffer
  export function decode(buffer: ArrayBuffer): Ifd[]
  export function decodeImage(buffer: ArrayBuffer, ifd: Ifd): void
  export function toRGBA8(ifd: Ifd): Uint8Array
}
