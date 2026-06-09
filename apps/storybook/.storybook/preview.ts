import type { Preview } from '@storybook/react';
import './preview.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'mi550',
      values: [
        { name: 'mi550', value: '#060d1a' },
        { name: 'industrial-light', value: '#f4f7fc' },
        { name: 'oscuro-industrial', value: '#08120f' },
        { name: 'control-room', value: '#000000' },
      ],
    },
    controls: { expanded: true },
  },
};

export default preview;
