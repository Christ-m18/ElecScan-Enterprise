import type { Meta, StoryObj } from '@storybook/react';
import { KpiCard } from './KpiCard.js';

const meta: Meta<typeof KpiCard> = {
  title: 'Components / KpiCard',
  component: KpiCard,
  argTypes: {
    label: { control: 'text' },
    unit: { control: 'text' },
    accent: { control: 'color' },
  },
};
export default meta;

type Story = StoryObj<typeof KpiCard>;

export const Cyan: Story = {
  args: { label: 'P total', value: '8.21', unit: 'kW', accent: '#00e5ff' },
};

export const Phase: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <KpiCard label="UA" value="219.8" unit="V" accent="#ff2d5b" />
      <KpiCard label="UB" value="220.1" unit="V" accent="#00e5ff" />
      <KpiCard label="UC" value="220.0" unit="V" accent="#ffcc00" />
    </div>
  ),
};

export const Warning: Story = {
  args: { label: 'THD UA', value: '7.8', unit: '%', accent: '#ff9500' },
};

export const Critical: Story = {
  args: { label: 'Dip duration', value: '420', unit: 'ms', accent: '#ff2d5b' },
};
