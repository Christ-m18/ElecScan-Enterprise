/**
 * Modbus data type identifiers documented in MI-550 manual section 8.
 * Each maps to a known register-width (in 16-bit words).
 */
export type ModbusDataType =
  | 'UInt16'
  | 'Int16'
  | 'UInt32'
  | 'Int32'
  | 'UInt64'
  | 'Int64'
  | 'Float32'
  | 'Float64'
  | 'UTF8'
  | 'DateTime'
  | 'IPaddr';

/**
 * Operation a register supports.
 *  - 'R'  : read only
 *  - 'W'  : write directly via FC 0x10 (only allowed in instruction block 300..423)
 *  - 'WC' : write configured indirectly via the instruction register (see manual 6.2.2)
 */
export type ModbusOp = 'R' | 'W' | 'WC' | 'R/W' | 'R/WC';

/**
 * High-level register descriptor used by the catalog.
 */
export interface RegisterDescriptor {
  readonly alias: string;
  readonly address: number;
  readonly size: number;
  readonly type: ModbusDataType;
  readonly op: ModbusOp;
  readonly unit?: string;
  readonly category: string;
  readonly description: string;
  /** scale factor that brings raw integer to engineering units (raw * factor). */
  readonly scale?: number;
}

/**
 * Quality flag inspired by OPC-UA semantics; used by ingest layer.
 */
export enum Quality {
  GOOD = 0,
  UNCERTAIN = 1,
  BAD = 2,
  STALE = 3,
}

export interface MbapHeader {
  readonly transactionId: number;
  readonly protocolId: number;
  readonly length: number;
  readonly unitId: number;
}

export interface ModbusReadRequest {
  readonly fc: 0x03;
  readonly startAddress: number;
  readonly count: number;
}

export interface ModbusWriteRequest {
  readonly fc: 0x10;
  readonly startAddress: number;
  readonly values: ReadonlyArray<number>;
}

export type ModbusRequest = ModbusReadRequest | ModbusWriteRequest;

export interface ModbusReadResponse {
  readonly fc: 0x03;
  readonly registers: ReadonlyArray<number>;
}

export interface ModbusWriteResponse {
  readonly fc: 0x10;
  readonly startAddress: number;
  readonly count: number;
}

export interface InstructionWriteResult {
  readonly instructionCode: number;
  readonly result: 0 | 80 | 81 | 82 | 83;
  readonly ok: boolean;
}

export interface ModbusClientOptions {
  readonly host: string;
  readonly port?: number;
  readonly unitId?: number;
  readonly requestTimeoutMs?: number;
  readonly connectTimeoutMs?: number;
  readonly maxConcurrentTransactions?: number;
}
