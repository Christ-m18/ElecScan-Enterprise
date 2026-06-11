import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { AnomalyEngine } from './anomaly/anomaly.engine.js';
import { ForecastEngine } from './forecast/forecast.engine.js';

const CONNECTOR_URL = process.env.CONNECTOR_SERVICE_URL ?? 'http://127.0.0.1:4003';

interface HistoryPoint {
  ts: string;
  value: number;
}

async function fetchHistory(
  deviceId: string,
  aliases: string[],
  minutes: number,
): Promise<Record<string, HistoryPoint[]>> {
  const url = `${CONNECTOR_URL}/devices/${deviceId}/history?aliases=${aliases.join(',')}&minutes=${minutes}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`connector ${r.status}`);
  return r.json() as Promise<Record<string, HistoryPoint[]>>;
}

@Controller()
export class MlController {
  private readonly anomaly = new AnomalyEngine(3.0);
  private readonly forecast = new ForecastEngine();

  @Get('anomaly/:deviceId')
  async detectAnomalies(
    @Param('deviceId') deviceId: string,
    @Query('aliases') aliases?: string,
    @Query('minutes') minutes?: string,
  ) {
    const aliasList = aliases?.split(',').filter(Boolean);
    if (!aliasList?.length) throw new BadRequestException('aliases query param required');
    const mins = minutes ? Number.parseInt(minutes, 10) : 30;

    const history = await fetchHistory(deviceId, aliasList, mins);
    return aliasList.map((alias) => {
      const pts = history[alias] ?? [];
      const values = pts.map((p) => p.value);
      const latest = values.at(-1);
      if (latest === undefined || values.length < 2) {
        return { alias, isAnomaly: false, message: 'insufficient data' };
      }
      return this.anomaly.detectZScore(alias, latest, values.slice(0, -1));
    });
  }

  @Get('forecast/:deviceId')
  async forecastDemand(
    @Param('deviceId') deviceId: string,
    @Query('alias') alias?: string,
    @Query('minutes') minutes?: string,
    @Query('horizon') horizon?: string,
  ) {
    if (!alias) throw new BadRequestException('alias query param required');
    const mins = minutes ? Number.parseInt(minutes, 10) : 60;
    const horizonPts = horizon ? Number.parseInt(horizon, 10) : 12;

    const history = await fetchHistory(deviceId, [alias], mins);
    const pts = history[alias] ?? [];
    return this.forecast.forecast(alias, pts, horizonPts);
  }

  @Get('drift/:deviceId')
  async detectDrift(
    @Param('deviceId') deviceId: string,
    @Query('aliases') aliases?: string,
    @Query('baselineMinutes') baselineMins?: string,
    @Query('currentMinutes') currentMins?: string,
  ) {
    const aliasList = aliases?.split(',').filter(Boolean);
    if (!aliasList?.length) throw new BadRequestException('aliases query param required');
    const baseline = baselineMins ? Number.parseInt(baselineMins, 10) : 60;
    const current = currentMins ? Number.parseInt(currentMins, 10) : 10;

    const [baselineData, currentData] = await Promise.all([
      fetchHistory(deviceId, aliasList, baseline),
      fetchHistory(deviceId, aliasList, current),
    ]);

    return aliasList.map((alias) => {
      const bPts = (baselineData[alias] ?? []).map((p) => p.value);
      const cPts = (currentData[alias] ?? []).map((p) => p.value);
      if (bPts.length < 5 || cPts.length < 2) {
        return { alias, isDrift: false, message: 'insufficient data' };
      }
      return this.anomaly.detectDrift(alias, bPts, cPts);
    });
  }
}
