import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../api';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/tiff': ['.tiff', '.tif'],
};

interface Props {
  onSuccess: () => void;
}

export function UploadZone({ onSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0]!;
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      try {
        await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setLastFile(file.name);
        onSuccess();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
      } finally {
        setUploading(false);
      }
    },
    [onSuccess],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-500'}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p className="text-gray-500">Envoi en cours…</p>
        ) : isDragActive ? (
          <p className="text-brand-600 font-medium">Déposez le fichier ici</p>
        ) : (
          <p className="text-gray-500">
            Glissez-déposez un fichier PDF/PNG/JPG/TIFF (max 10 Mo) ou{' '}
            <span className="text-brand-600 underline">parcourez</span>
          </p>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {lastFile && !uploading && (
        <p className="mt-2 text-sm text-green-600">✓ {lastFile} envoyé avec succès</p>
      )}
    </div>
  );
}
