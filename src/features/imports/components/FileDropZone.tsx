import { useRef, useState, type DragEvent } from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/components/Button';
import { Spinner } from '@/shared/ui/components/Spinner';
import { ACCEPTED_EXTENSIONS } from '../lib/spreadsheet';

export interface FileDropZoneProps {
  isReading: boolean;
  onFile: (file: File) => void;
  /** What the file may be, under the title: "Excel (.xlsx) o CSV · hasta 5.000 filas". */
  hint: string;
}

/** Where a file is dropped or picked. The file is read in the browser; nothing is sent here. */
export function FileDropZone({ isReading, onFile, hint }: FileDropZoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition',
        dragging ? 'border-primary bg-primary/5' : 'border-line2',
      )}
    >
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="sr-only"
        aria-label="Archivo de Excel o CSV"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />
      {isReading ? (
        <Spinner className="size-8 text-primary" />
      ) : (
        <FiUploadCloud aria-hidden className="size-9 text-muted" />
      )}
      <p className="font-semibold text-fg">
        {isReading ? 'Leyendo tu archivo…' : 'Arrastra tu archivo aquí'}
      </p>
      <p className="text-sm text-muted">{hint}</p>
      <Button variant="outline" onClick={() => input.current?.click()} disabled={isReading}>
        Seleccionar archivo
      </Button>
    </div>
  );
}
