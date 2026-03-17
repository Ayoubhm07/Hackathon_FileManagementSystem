import React from 'react';
import type { DocumentStatus } from '../types';

const COLORS: Record<DocumentStatus, string> = {
  UPLOADED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  PROCESSED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

interface Props {
  status: DocumentStatus;
}

export function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[status]}`}>
      {status}
    </span>
  );
}
