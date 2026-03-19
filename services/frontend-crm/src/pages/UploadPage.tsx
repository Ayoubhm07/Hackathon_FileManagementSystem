import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, PageHeader } from '../components/ui';
import api from '../api';

interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

const PIPELINE_STEPS = ['UPLOAD', 'OCR', 'CLASSIFY', 'EXTRACT', 'VALIDATE'];

export function UploadPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [completedStep, setCompletedStep] = useState(-1);

  const onDrop = useCallback((files: File[]) => {
    const newItems = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending' as const,
      progress: 0,
    }));
    setQueue(prev => [...prev, ...newItems]);
    newItems.forEach(item => { uploadFile(item.id, item.file); });
  }, []);

  async function uploadFile(id: string, file: File) {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'uploading', progress: 0 } : q));
    setCompletedStep(0);

    // Animate progress bar while upload is in flight
    let fakeProgress = 0;
    const progressInterval = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + Math.random() * 15, 90);
      setQueue(prev => prev.map(q => q.id === id ? { ...q, progress: fakeProgress } : q));
    }, 300);

    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearInterval(progressInterval);
      setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'done', progress: 100 } : q));
      // Animate pipeline steps (Airflow runs async — this is visual feedback)
      let step = 0;
      const pipeInterval = setInterval(() => {
        step++;
        setCompletedStep(step);
        if (step >= PIPELINE_STEPS.length - 1) clearInterval(pipeInterval);
      }, 800);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
      setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'error', progress: 0, error: message } : q));
    }
  }

  function removeItem(id: string) {
    setQueue(prev => prev.filter(q => q.id !== id));
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxSize: 10 * 1024 * 1024,
  });

  const hasCompleted = queue.some(q => q.status === 'done');

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Déposer un document" subtitle="PDF, PNG ou JPG — max 10 Mo par fichier" />

      {/* Drop zone */}
      <motion.div
        {...(({ onAnimationStart, ...rest }) => rest)(getRootProps())}
        animate={isDragActive ? { scale: 1.01 } : { scale: 1 }}
        className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
          isDragActive
            ? 'border-primary bg-primary/10 glow-blue'
            : 'border-border hover:border-primary/50 bg-card'
        }`}
      >
        <input {...getInputProps()} />

        {/* Animated bg rings when dragging */}
        <AnimatePresence>
          {isDragActive && (
            <>
              {[0,1,2].map(i => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.5, opacity: 0.5 }}
                  animate={{ scale: 2 + i * 0.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                  className="absolute inset-0 m-auto w-32 h-32 rounded-full border border-primary/40"
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <motion.div
          animate={isDragActive ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
          className="relative flex flex-col items-center gap-4"
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDragActive ? 'bg-primary/20' : 'bg-slate-600/30'}`}>
            <Upload size={28} className={isDragActive ? 'text-primary' : 'text-textsecondary'} />
          </div>
          {isDragActive ? (
            <p className="text-primary font-semibold text-lg">Déposez ici !</p>
          ) : (
            <div>
              <p className="text-textprimary font-medium">Glissez-déposez vos fichiers</p>
              <p className="text-textsecondary text-sm mt-1">ou <span className="text-primary underline cursor-pointer">parcourez</span> votre ordinateur</p>
              <p className="text-textsecondary text-xs mt-3">PDF • PNG • JPG — max 10 Mo</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Queue */}
      <AnimatePresence>
        {queue.length > 0 && (
          <Card className="divide-y divide-border">
            {queue.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.file.type === 'application/pdf' ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'
                  }`}>
                    {item.file.type === 'application/pdf' ? <FileText size={14} /> : <Image size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-textprimary truncate">{item.file.name}</p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {item.status === 'uploading' && <Loader2 size={14} className="text-primary animate-spin" />}
                        {item.status === 'done' && <CheckCircle size={14} className="text-success" />}
                        {item.status === 'error' && <AlertCircle size={14} className="text-danger" />}
                        <button onClick={() => removeItem(item.id)} className="text-textsecondary hover:text-danger transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    {item.status === 'error' && item.error && (
                      <p className="text-xs text-danger mt-1">{item.error}</p>
                    )}
                    {(item.status === 'uploading' || item.status === 'done') && (
                      <div className="h-1 bg-slate-600/30 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${item.progress}%` }}
                          transition={{ duration: 0.3 }}
                          className={`h-full rounded-full ${item.status === 'done' ? 'bg-success' : 'bg-primary'}`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </Card>
        )}
      </AnimatePresence>

      {/* Pipeline visualization */}
      <AnimatePresence>
        {hasCompleted && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-textprimary mb-5 text-center">Pipeline de traitement</h3>
              <div className="flex items-center justify-center gap-0">
                {PIPELINE_STEPS.map((step, i) => (
                  <React.Fragment key={step}>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        i <= completedStep
                          ? 'bg-success/20 border-success text-success'
                          : 'bg-slate-600/20 border-border text-textsecondary'
                      }`}>
                        {i <= completedStep ? <CheckCircle size={16} /> : <span className="text-xs">{i+1}</span>}
                      </div>
                      <span className="text-xs text-textsecondary font-medium">{step}</span>
                    </motion.div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <motion.div
                        animate={{ backgroundColor: i < completedStep ? '#10B981' : '#374151' }}
                        transition={{ duration: 0.5, delay: i * 0.15 }}
                        className="w-12 h-0.5 mb-4 transition-colors"
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-xs text-textsecondary text-center mt-4">
                Document soumis au pipeline — traitement en cours via Airflow
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
