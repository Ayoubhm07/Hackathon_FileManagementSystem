import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './router';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 0, refetchOnMount: true, refetchOnWindowFocus: true, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  );
}
