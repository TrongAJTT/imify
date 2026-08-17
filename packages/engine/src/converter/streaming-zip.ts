import { AsyncZipDeflate, Zip } from "fflate";

export interface StreamingZipOptions {
  level?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

export class StreamingZip {
  private zip: Zip;
  private chunks: Uint8Array[] = [];
  private isFinalized = false;
  private isAborted = false;
  private finalizePromise: Promise<Blob> | null = null;
  private finalizeResolve!: (blob: Blob) => void;
  private finalizeReject!: (error: Error) => void;

  constructor(options: StreamingZipOptions = {}) {
    const level = options.level ?? 6;
    this.zip = new Zip((err, chunk, isLast) => {
      if (err) {
        if (this.finalizeReject) this.finalizeReject(err);
        return;
      }
      if (chunk) {
        this.chunks.push(chunk);
      }
      if (isLast) {
        this.isFinalized = true;
        const finalBlob = new Blob(this.chunks as unknown as BlobPart[], {
          type: "application/zip",
        });
        if (this.finalizeResolve) {
          this.finalizeResolve(finalBlob);
        }
      }
    });

    this.finalizePromise = new Promise<Blob>((resolve, reject) => {
      this.finalizeResolve = resolve;
      this.finalizeReject = reject;
    });
  }

  async addFile(filename: string, data: Uint8Array | Blob): Promise<void> {
    if (this.isAborted) {
      throw new Error("StreamingZip has been aborted");
    }
    if (this.isFinalized) {
      throw new Error("Cannot add file to finalized StreamingZip");
    }

    let u8Data: Uint8Array;
    if (data instanceof Uint8Array) {
      u8Data = data;
    } else if (data instanceof Blob) {
      u8Data = new Uint8Array(await data.arrayBuffer());
    } else {
      throw new Error("Invalid file data type");
    }

    return new Promise<void>((resolve, reject) => {
      const deflateFile = new AsyncZipDeflate(filename, { level: 6 });
      this.zip.add(deflateFile);

      deflateFile.push(u8Data, true);
      resolve();
    });
  }

  async finalize(): Promise<Blob> {
    if (this.isAborted) {
      throw new Error("StreamingZip was aborted");
    }
    this.zip.end();
    return this.finalizePromise!;
  }

  abort(): void {
    this.isAborted = true;
    this.chunks = [];
    if (this.finalizeReject) {
      this.finalizeReject(new Error("ZIP stream aborted"));
    }
  }
}
