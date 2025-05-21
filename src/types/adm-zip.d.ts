declare module 'adm-zip' {
  /** Represents a single entry in the zip archive */
  export interface IZipEntry {
    entryName: string;
  }

  /** Minimal AdmZip class interface for zipping tests */
  export default class AdmZip {
    constructor(path?: string | Buffer);
    getEntries(): IZipEntry[];
  }
} 