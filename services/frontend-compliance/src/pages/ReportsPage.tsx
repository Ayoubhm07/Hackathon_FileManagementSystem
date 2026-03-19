import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileBarChart, Download, Calendar, Building2, FileText,
  CheckCircle2, XCircle, TrendingUp, RefreshCw, Shield,
  Database, Zap,
} from 'lucide-react';
import {
  Card, PageHeader, ComplianceScore, AnimatedCounter, StatusBadge, DocTypeIcon,
} from '../components/ui';
import { mockDocuments, mockValidations } from '../data/mock-data';
import type { Document, PaginatedDocuments } from '../types';
import api from '../api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReportRow {
  id: string;
  name: string;
  type: string;
  status: string;
  score: number;
  isValid: boolean | null;
  validatedAt: string | null;
  fileSize: number;
  source: 'live' | 'demo';
}

interface LiveValidation {
  isValid: boolean;
  errors: { message: string }[];
  validatedAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'monthly',  label: 'Rapport mensuel',          icon: Calendar,   desc: 'Synthèse de conformité — Mars 2026' },
  { id: 'supplier', label: 'Par fournisseur',           icon: Building2,  desc: 'Conformité groupée par fournisseur' },
  { id: 'doctype',  label: 'Par type de document',      icon: FileText,   desc: 'Analyse par catégorie documentaire' },
] as const;

const TYPE_COLORS: Record<string, string> = {
  FACTURE:           '#6366F1',
  DEVIS:             '#8B5CF6',
  KBIS:              '#10B981',
  URSSAF:            '#F59E0B',
  RIB:               '#34D399',
  SIRET_ATTESTATION: '#06B6D4',
  UNKNOWN:           '#6B7280',
};

function computeScore(isValid: boolean, errorsCount: number): number {
  if (isValid) return Math.max(70, 100 - errorsCount * 5);
  return Math.max(10, 55 - errorsCount * 15);
}

function typeLabel(type: string) {
  return type.replace('_ATTESTATION', '').replace('_', ' ');
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-textsecondary mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [activeTemplate, setActiveTemplate] = useState<string>('monthly');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportRow[] | null>(null);
  const [search, setSearch] = useState('');

  // ── Fetch live documents ──────────────────────────────────────────────────
  const { data: liveDocuments = [], isLoading: docsLoading } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => (await api.get<PaginatedDocuments>('/documents')).data.data,
  });

  // ── Mock rows (baseline always visible) ──────────────────────────────────
  const mockRows = useMemo<ReportRow[]>(() => {
    const result: ReportRow[] = [];
    mockValidations.forEach(v => {
      const doc = mockDocuments.find(d => d._id === v.documentId);
      if (!doc) return;
      result.push({
        id:          doc._id,
        name:        doc.originalName,
        type:        doc.documentType,
        status:      doc.status,
        score:       v.score,
        isValid:     v.isValid,
        validatedAt: v.validatedAt,
        fileSize:    doc.fileSize,
        source:      'demo',
      });
    });
    return result;
  }, []);

  // ── Generate report ───────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setReportData(null);
    try {
      const processedDocs = liveDocuments.filter(d =>
        ['PROCESSED', 'APPROVED', 'REJECTED'].includes(d.status)
      );

      const liveRows: ReportRow[] = await Promise.all(
        processedDocs.map(async (doc): Promise<ReportRow> => {
          try {
            const res = await api.get<LiveValidation>(`/results/${doc._id}`);
            const v = res.data;
            return {
              id:          doc._id,
              name:        doc.originalName,
              type:        doc.documentType,
              status:      doc.status,
              score:       computeScore(v.isValid, v.errors?.length ?? 0),
              isValid:     v.isValid,
              validatedAt: v.validatedAt,
              fileSize:    doc.fileSize,
              source:      'live',
            };
          } catch {
            return {
              id:          doc._id,
              name:        doc.originalName,
              type:        doc.documentType,
              status:      doc.status,
              score:       doc.status === 'APPROVED' ? 88 : 38,
              isValid:     doc.status === 'APPROVED',
              validatedAt: null,
              fileSize:    doc.fileSize,
              source:      'live',
            };
          }
        })
      );

      // Deduplicate: live takes precedence
      const liveIds = new Set(liveRows.map(r => r.id));
      const uniqueMockRows = mockRows.filter(r => !liveIds.has(r.id));
      const merged = [...liveRows, ...uniqueMockRows];
      merged.sort((a, b) => (b.validatedAt ?? '').localeCompare(a.validatedAt ?? ''));
      setReportData(merged);
    } finally {
      setGenerating(false);
    }
  }, [liveDocuments, mockRows]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const rows = reportData ?? mockRows;
  const filteredRows = useMemo(() =>
    rows.filter(r =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase())
    ),
  [rows, search]);

  const total        = rows.length;
  const conformes    = rows.filter(r => r.isValid === true || r.status === 'APPROVED').length;
  const nonConformes = rows.filter(r => r.isValid === false || r.status === 'REJECTED' || r.status === 'FAILED').length;
  const avgScore     = total > 0 ? Math.round(rows.reduce((s, r) => s + r.score, 0) / total) : 0;
  const liveCount    = rows.filter(r => r.source === 'live').length;

  // ── Chart data ────────────────────────────────────────────────────────────
  const typeChartData = useMemo(() =>
    Object.entries(
      rows.reduce<Record<string, number>>((acc, r) => {
        acc[r.type] = (acc[r.type] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([type, count]) => ({ type, label: typeLabel(type), count, fill: TYPE_COLORS[type] ?? '#6B7280' })),
  [rows]);

  const statusPieData = useMemo(() => [
    { name: 'Conformes',    value: conformes,                           color: '#10B981' },
    { name: 'Non conformes',value: nonConformes,                        color: '#EF4444' },
    { name: 'En attente',   value: total - conformes - nonConformes,    color: '#F59E0B' },
  ].filter(d => d.value > 0), [conformes, nonConformes, total]);

  // ── PDF export ────────────────────────────────────────────────────────────
  const handleExportPDF = useCallback(() => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W   = pdf.internal.pageSize.getWidth();
    const H   = pdf.internal.pageSize.getHeight();
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    // ── Cover header ─────────────────────────────────────────────────────────
    pdf.setFillColor(10, 15, 30);
    pdf.rect(0, 0, W, 58, 'F');

    // Accent gradient bar
    pdf.setFillColor(99, 102, 241);
    pdf.rect(0, 53, W, 6, 'F');
    pdf.setFillColor(6, 182, 212);
    pdf.rect(W * 0.65, 53, W * 0.35, 6, 'F');

    // Logo
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    pdf.text('DocFlow', 14, 24);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    pdf.text('Plateforme de conformité documentaire', 14, 31);

    // Small accent line under logo
    pdf.setDrawColor(99, 102, 241);
    pdf.setLineWidth(0.5);
    pdf.line(14, 34, 65, 34);

    // Report meta (right side)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(99, 102, 241);
    pdf.text('RAPPORT DE CONFORMITÉ', W - 14, 22, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Généré le ${dateStr}`, W - 14, 30, { align: 'right' });
    pdf.text('Période : Mars 2026', W - 14, 37, { align: 'right' });
    pdf.text(`Modèle : ${TEMPLATES.find(t => t.id === activeTemplate)?.label ?? 'Mensuel'}`, W - 14, 44, { align: 'right' });

    // ── KPI boxes ─────────────────────────────────────────────────────────────
    const kpis: { label: string; value: string; color: [number,number,number] }[] = [
      { label: 'Analysés',     value: String(total),        color: [99,  102, 241] },
      { label: 'Conformes',    value: String(conformes),    color: [16,  185, 129] },
      { label: 'Non conformes',value: String(nonConformes), color: [239, 68,  68]  },
      { label: 'Score moyen',  value: `${avgScore}%`,       color: [245, 158, 11]  },
    ];

    const kpiW  = (W - 28 - 9) / 4;
    const kpiY  = 66;

    kpis.forEach((kpi, i) => {
      const x = 14 + i * (kpiW + 3);
      pdf.setFillColor(17, 24, 39);
      pdf.roundedRect(x, kpiY, kpiW, 26, 2, 2, 'F');
      pdf.setFillColor(...kpi.color);
      pdf.roundedRect(x, kpiY, 3, 26, 1, 1, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(249, 250, 251);
      pdf.text(kpi.value, x + kpiW / 2 + 1.5, kpiY + 11, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text(kpi.label, x + kpiW / 2 + 1.5, kpiY + 19, { align: 'center' });
    });

    // ── Compliance bar ───────────────────────────────────────────────────────
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(249, 250, 251);
    pdf.text('Répartition de conformité', 14, 105);

    const barY = 109;
    const barW = W - 28;
    const barH = 8;

    pdf.setFillColor(30, 41, 59);
    pdf.roundedRect(14, barY, barW, barH, 2, 2, 'F');

    const confPct = total > 0 ? conformes    / total : 0;
    const failPct = total > 0 ? nonConformes / total : 0;
    const pendPct = 1 - confPct - failPct;

    if (confPct > 0) { pdf.setFillColor(16, 185, 129); pdf.roundedRect(14,              barY, barW * confPct, barH, 2, 2, 'F'); }
    if (failPct > 0) { pdf.setFillColor(239, 68, 68);  pdf.rect(14 + barW * confPct,   barY, barW * failPct, barH, 'F'); }
    if (pendPct > 0.01) { pdf.setFillColor(245, 158, 11); pdf.roundedRect(14 + barW * (confPct + failPct), barY, barW * pendPct, barH, 2, 2, 'F'); }

    // Legend
    const legendItems = [
      { label: `Conformes (${conformes})`,          color: [16,  185, 129] as [number,number,number] },
      { label: `Non conformes (${nonConformes})`,   color: [239, 68,  68]  as [number,number,number] },
      { label: `En attente (${total - conformes - nonConformes})`, color: [245, 158, 11] as [number,number,number] },
    ];
    let lx = 14;
    legendItems.forEach(l => {
      pdf.setFillColor(...l.color);
      pdf.roundedRect(lx, 121, 3, 3, 0.5, 0.5, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text(l.label, lx + 5, 124);
      lx += pdf.getTextWidth(l.label) + 14;
    });

    // ── Data source info ─────────────────────────────────────────────────────
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Sources : ${liveCount} documents live · ${rows.length - liveCount} données de référence`,
      14, 132
    );

    // ── Documents table ───────────────────────────────────────────────────────
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(249, 250, 251);
    pdf.text('Détail des documents analysés', 14, 140);

    const tableData = filteredRows.slice(0, 60).map(r => [
      r.name.length > 38 ? r.name.substring(0, 35) + '…' : r.name,
      typeLabel(r.type),
      `${r.score}/100`,
      r.isValid === true ? 'Valide' : r.isValid === false ? 'Non conforme' : '—',
      r.status,
      r.validatedAt ? new Date(r.validatedAt).toLocaleDateString('fr-FR') : '—',
      r.source === 'live' ? 'Live' : 'Démo',
    ]);

    autoTable(pdf, {
      startY: 144,
      head: [['Document', 'Type', 'Score', 'Conformité', 'Statut', 'Date', 'Source']],
      body: tableData,
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      },
      bodyStyles: {
        fillColor: [17, 24, 39],
        textColor: [209, 213, 219],
        fontSize: 7.5,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      },
      alternateRowStyles: { fillColor: [26, 32, 44] },
      columnStyles: {
        0: { cellWidth: 56 },
        1: { cellWidth: 24 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 26, halign: 'center' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 22, halign: 'center' },
        6: { cellWidth: 14, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section !== 'body') return;
        if (data.column.index === 3) {
          const v = String(data.cell.raw ?? '');
          if (v === 'Valide')        data.cell.styles.textColor = [16, 185, 129];
          else if (v === 'Non conforme') data.cell.styles.textColor = [239, 68, 68];
        }
        if (data.column.index === 2) {
          const score = parseInt(String(data.cell.raw ?? '0').split('/')[0] ?? '0');
          if      (score >= 80) data.cell.styles.textColor = [16, 185, 129];
          else if (score >= 60) data.cell.styles.textColor = [245, 158, 11];
          else                  data.cell.styles.textColor = [239, 68, 68];
        }
        if (data.column.index === 6) {
          const v = String(data.cell.raw ?? '');
          if (v === 'Live') data.cell.styles.textColor = [6, 182, 212];
          else              data.cell.styles.textColor = [100, 116, 139];
        }
      },
    });

    // ── Footer on each page ───────────────────────────────────────────────────
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFillColor(10, 15, 30);
      pdf.rect(0, H - 11, W, 11, 'F');
      pdf.setDrawColor(99, 102, 241);
      pdf.setLineWidth(0.3);
      pdf.line(0, H - 11, W, H - 11);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text('DocFlow — Rapport de conformité · Document confidentiel', 14, H - 4);
      pdf.text(`Page ${i} / ${pageCount}`, W - 14, H - 4, { align: 'right' });
    }

    pdf.save(`rapport-conformite-${now.toISOString().split('T')[0]}.pdf`);
  }, [filteredRows, total, conformes, nonConformes, avgScore, liveCount, rows, activeTemplate]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5" style={{
      background: 'radial-gradient(ellipse at 80% 0%, rgba(99,102,241,0.06) 0%, transparent 55%)',
    }}>
      <PageHeader
        title="Rapports"
        subtitle={`${total} documents · Score moyen ${avgScore}% · ${liveCount} données live`}
        actions={
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleGenerate}
              disabled={generating || docsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              {generating
                ? <RefreshCw size={14} className="animate-spin" />
                : <FileBarChart size={14} />}
              {generating ? 'Génération…' : 'Générer le rapport'}
            </motion.button>
            <AnimatePresence>
              {reportData && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-success/20 hover:bg-success/30 text-success border border-success/30 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download size={14} /> Exporter PDF
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        }
      />

      {/* Template selector */}
      <div className="grid grid-cols-3 gap-4">
        {TEMPLATES.map(t => (
          <motion.div
            key={t.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTemplate(t.id)}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeTemplate === t.id
                ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(99,102,241,0.12)]'
                : 'border-border bg-card hover:border-primary/40'
            }`}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                activeTemplate === t.id ? 'bg-primary/30' : 'bg-primary/15'
              }`}>
                <t.icon size={16} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-textprimary text-sm">{t.label}</p>
                <p className="text-xs text-textsecondary">{t.desc}</p>
              </div>
            </div>
            {activeTemplate === t.id && (
              <motion.div
                initial={{ width: 0 }} animate={{ width: '100%' }}
                className="h-0.5 mt-2 bg-gradient-to-r from-primary via-accent to-transparent rounded-full"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Documents analysés', value: total,        suffix: '',  icon: FileText,     color: 'text-primary', bg: 'bg-primary/10',  border: 'border-primary/20',  glow: '#6366F1' },
          { label: 'Conformes',          value: conformes,    suffix: '',  icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10',  border: 'border-success/20',  glow: '#10B981' },
          { label: 'Non conformes',      value: nonConformes, suffix: '',  icon: XCircle,      color: 'text-danger',  bg: 'bg-danger/10',   border: 'border-danger/20',   glow: '#EF4444' },
          { label: 'Score moyen',        value: avgScore,     suffix: '%', icon: TrendingUp,   color: 'text-warning', bg: 'bg-warning/10',  border: 'border-warning/20',  glow: '#F59E0B' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className={`p-4 border ${kpi.border}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-textsecondary font-medium">{kpi.label}</p>
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon size={15} className={kpi.color} />
                </div>
              </div>
              <p className={`text-3xl font-bold font-mono ${kpi.color}`}>
                <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
              </p>
              <div className="mt-2.5 h-0.5 bg-slate-600/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((kpi.value / Math.max(total, 1)) * 100, 100)}%` }}
                  transition={{ duration: 1.2, delay: i * 0.1 + 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: kpi.glow }}
                />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-5 gap-5">
        <Card className="col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-textprimary">Documents par type</h3>
            <span className="text-xs text-textsecondary">{typeChartData.length} catégories</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={typeChartData} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                axisLine={false} tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Documents" radius={[5, 5, 0, 0]}>
                {typeChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-textprimary">Statut de conformité</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%" cy="45%"
                innerRadius={55} outerRadius={78}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {statusPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 6px ${entry.color}60)` }} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#F9FAFB', fontSize: 11 }}
              />
              <Legend
                iconType="circle" iconSize={8}
                formatter={(value) => <span style={{ color: '#94A3B8', fontSize: 11 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Documents table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-textprimary flex items-center gap-2">
              {reportData ? (
                <>
                  <Zap size={14} className="text-accent" />
                  Rapport généré — {rows.length} documents
                  <span className="ml-1 text-xs px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-medium">
                    {liveCount} live
                  </span>
                </>
              ) : (
                <>
                  <Database size={14} className="text-textsecondary" />
                  Données de référence
                  <span className="ml-1 text-xs text-textsecondary font-normal">→ cliquez sur "Générer" pour charger les données live</span>
                </>
              )}
            </h3>
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="px-3 py-1.5 bg-navy/60 border border-border rounded-lg text-xs text-textprimary placeholder-textsecondary focus:outline-none focus:border-primary/50 w-48"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Document', 'Type', 'Score', 'Conformité', 'Statut', 'Date validation', 'Source'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-textsecondary uppercase tracking-wider first:pl-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence>
                {filteredRows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.5) }}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="px-3 py-3 first:pl-0">
                      <div className="flex items-center gap-2">
                        <DocTypeIcon type={row.type} size="sm" />
                        <span className="text-textprimary truncate max-w-[180px] text-xs">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-textsecondary">{typeLabel(row.type)}</td>
                    <td className="px-3 py-3"><ComplianceScore score={row.score} /></td>
                    <td className="px-3 py-3">
                      {row.isValid === true
                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><CheckCircle2 size={11} /> Valide</span>
                        : row.isValid === false
                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger"><XCircle size={11} /> Non conforme</span>
                        : <span className="text-xs text-textsecondary">—</span>}
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-3 py-3 text-xs text-textsecondary font-mono">
                      {row.validatedAt ? new Date(row.validatedAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        row.source === 'live'
                          ? 'bg-accent/10 text-accent border-accent/25'
                          : 'bg-slate-600/15 text-textsecondary border-border'
                      }`}>
                        {row.source === 'live' ? 'Live' : 'Démo'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredRows.length === 0 && (
            <div className="py-14 text-center">
              <Shield size={30} className="mx-auto text-textsecondary mb-3 opacity-40" />
              <p className="text-textsecondary text-sm">Aucun document trouvé</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
