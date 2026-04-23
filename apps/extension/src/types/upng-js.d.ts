declare module "upng-js" {
  interface UPNGStatic {
    encode(
      bufs: ArrayBuffer[],
      width: number,
      height: number,
      cnum?: number,
      dels?: number[]
    ): ArrayBuffer
  }

  const UPNG: UPNGStatic
  export default UPNG
}
