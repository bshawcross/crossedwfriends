import React from 'react';
import { render, screen } from '@testing-library/react';
import Grid from './Grid';

test('renders Grid component', () => {
	render(<Grid />);
	const gridElement = screen.getByTestId('grid');
	expect(gridElement).toBeInTheDocument();
});