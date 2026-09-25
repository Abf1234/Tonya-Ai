import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import FileDropzone from './FileDropzone';

function DropzoneHarness({ onChange, ...props }) {
  const [value, setValue] = useState(null);
  return (
    <FileDropzone
      {...props}
      value={value}
      onChange={(file) => {
        setValue(file);
        onChange?.(file);
      }}
    />
  );
}

describe('FileDropzone', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  afterEach(() => {
    if (originalCreateObjectURL) URL.createObjectURL = originalCreateObjectURL;
    else delete URL.createObjectURL;
    if (originalRevokeObjectURL) URL.revokeObjectURL = originalRevokeObjectURL;
    else delete URL.revokeObjectURL;
    vi.restoreAllMocks();
  });

  it('accepts a supported file from drag and drop and reports the selected file', async () => {
    const onChange = vi.fn();
    render(<DropzoneHarness onChange={onChange} />);
    const input = screen.getByLabelText('Choose evidence file');
    const file = new File(['png-bytes'], 'screenshot.png', { type: 'image/png' });

    fireEvent.drop(input, { dataTransfer: { files: [file] } });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(file));
    expect(screen.getByText('screenshot.png')).toBeInTheDocument();
  });

  it('rejects empty, unsupported, and oversized files without replacing the current selection', () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    render(<FileDropzone onChange={onChange} onError={onError} maxBytes={4} />);
    const input = screen.getByLabelText('Choose evidence file');

    fireEvent.change(input, {
      target: { files: [new File([], 'empty.png', { type: 'image/png' })] },
    });
    expect(onError).toHaveBeenLastCalledWith(expect.stringContaining('empty'));
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, {
      target: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] },
    });
    expect(onError).toHaveBeenLastCalledWith(expect.stringContaining('PNG'));
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, {
      target: { files: [new File(['12345'], 'large.png', { type: 'image/png' })] },
    });
    expect(onError).toHaveBeenLastCalledWith(expect.stringContaining('larger'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders a local PDF preview and supports removing it', async () => {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:evidence-pdf');
    URL.revokeObjectURL = vi.fn();
    render(<DropzoneHarness />);
    const input = screen.getByLabelText('Choose evidence file');
    const file = new File(['%PDF-1.4'], 'notice.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByTitle('PDF evidence preview')).toHaveAttribute('src', 'blob:evidence-pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Remove selected file' }));
    await waitFor(() => expect(screen.queryByTitle('PDF evidence preview')).not.toBeInTheDocument());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:evidence-pdf');
  });
});
