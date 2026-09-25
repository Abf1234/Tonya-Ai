import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PasteButton from './PasteButton';

describe('PasteButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes clipboard text to the active field when the Clipboard API is available', async () => {
    const onPaste = vi.fn();
    const readText = vi.fn().mockResolvedValue('pasted message');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { readText },
    });

    render(<PasteButton onPaste={onPaste} />);
    fireEvent.click(screen.getByRole('button', { name: 'Paste' }));

    await waitFor(() => expect(onPaste).toHaveBeenCalledWith('pasted message'));
    expect(readText).toHaveBeenCalledTimes(1);
  });

  it('uses the safe unavailable callback when Clipboard API access is missing', async () => {
    const onPaste = vi.fn();
    const onUnavailable = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    render(<PasteButton onPaste={onPaste} onUnavailable={onUnavailable} />);
    fireEvent.click(screen.getByRole('button', { name: 'Paste' }));

    await waitFor(() => expect(onUnavailable).toHaveBeenCalledTimes(1));
    expect(onPaste).not.toHaveBeenCalled();
  });
});
