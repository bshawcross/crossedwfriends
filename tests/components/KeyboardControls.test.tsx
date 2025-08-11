import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import KeyboardControls from '../../components/KeyboardControls'

expect.extend(matchers)

test('shows check button and tip when keyboard closed', async () => {
  const onCheck = vi.fn()
  render(<KeyboardControls onCheck={onCheck} kbOpen={false} />)
  const button = screen.getByRole('button', { name: /check/i })
  await userEvent.click(button)
  expect(onCheck).toHaveBeenCalled()
  expect(screen.getByText(/tap a cell/i)).toBeInTheDocument()
})

test('hides controls when keyboard open', () => {
  const onCheck = vi.fn()
  render(<KeyboardControls onCheck={onCheck} kbOpen={true} />)
  expect(screen.queryByRole('button')).toBeNull()
})
