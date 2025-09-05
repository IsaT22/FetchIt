import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  // Just check if the app renders without throwing
  expect(document.body).toBeInTheDocument();
});
