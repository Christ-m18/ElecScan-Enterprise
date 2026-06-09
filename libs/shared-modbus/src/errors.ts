/**
 * Modbus protocol exception codes per spec.
 * Documented for MI-550 in manual section 6.2.3.
 */
export enum ModbusErrorCode {
  IllegalFunction = 0x01,
  IllegalDataAddress = 0x02,
  IllegalDataValue = 0x03,
  AnalyzerError = 0x04,
}

export class ModbusError extends Error {
  public readonly code: ModbusErrorCode;
  public readonly fc: number;

  constructor(fc: number, code: ModbusErrorCode) {
    super(`Modbus exception: fc=0x${fc.toString(16)} code=0x${code.toString(16)}`);
    this.name = 'ModbusError';
    this.fc = fc;
    this.code = code;
  }
}

export class ModbusTimeoutError extends Error {
  constructor(message = 'Modbus request timed out') {
    super(message);
    this.name = 'ModbusTimeoutError';
  }
}

export class ModbusFramingError extends Error {
  constructor(message: string) {
    super(`Modbus framing error: ${message}`);
    this.name = 'ModbusFramingError';
  }
}

export class ModbusConnectionError extends Error {
  constructor(message: string) {
    super(`Modbus connection error: ${message}`);
    this.name = 'ModbusConnectionError';
  }
}

/**
 * Instruction execution outcomes documented in manual register 425.
 */
export enum InstructionResultCode {
  Ok = 0,
  InvalidInstructionCode = 80,
  InvalidInstructionParameter = 81,
  InvalidParameterCount = 82,
  OperationNotExecuted = 83,
}

export class InstructionRejectedError extends Error {
  public readonly instructionCode: number;
  public readonly result: InstructionResultCode;

  constructor(instructionCode: number, result: InstructionResultCode) {
    super(`Instruction ${instructionCode} rejected with code ${result}`);
    this.name = 'InstructionRejectedError';
    this.instructionCode = instructionCode;
    this.result = result;
  }
}
