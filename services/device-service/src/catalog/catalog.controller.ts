import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import {
  findInstruction,
  findRegister,
  INSTRUCTIONS,
  POLLING_BLOCKS,
  REGISTERS,
} from '@elecscan/shared-modbus';

/**
 * Read-only endpoints exposing the canonical MI-550 catalog.
 * Used by the frontend Configuration editor and by the simulator.
 */
@Controller('/catalog')
export class CatalogController {
  @Get('/registers')
  registers() {
    return REGISTERS;
  }

  @Get('/registers/:alias')
  register(@Param('alias') alias: string) {
    const r = findRegister(alias);
    if (!r) throw new NotFoundException(`unknown register alias: ${alias}`);
    return r;
  }

  @Get('/instructions')
  instructions() {
    return INSTRUCTIONS;
  }

  @Get('/instructions/:code')
  instruction(@Param('code') code: string) {
    const n = Number.parseInt(code, 10);
    const i = findInstruction(n);
    if (!i) throw new NotFoundException(`unknown instruction code: ${code}`);
    return i;
  }

  @Get('/polling-blocks')
  pollingBlocks() {
    return POLLING_BLOCKS;
  }
}
