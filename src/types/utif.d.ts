declare module "utif" {
  export function encodeImage(
    rgba: Uint8Array,
    width: number,
    height: number,
    metadata?: Record<string, unknown>
  ): ArrayBuffer

  export function encode(ifds: unknown[]): ArrayBuffer
}
