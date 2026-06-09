import type { Meta, StoryObj } from '@storybook/react';
import { PhaseValue } from './PhaseValue.js';

const meta: Meta<typeof PhaseValue> = {
  title: 'Components / PhaseValue',
  component: PhaseValue,
};
export default meta;

type Story = StoryObj<typeof PhaseValue>;

export const ThreePhase: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <PhaseValue phase="A" value="219.8" unit="V" />
      <PhaseValue phase="B" value="220.1" unit="V" />
      <PhaseValue phase="C" value="220.0" unit="V" />
      <PhaseValue phase="N" value="0.05" unit="A" />
    </div>
  ),
};
