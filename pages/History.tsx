import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, FileText, ChevronRight, ArrowLeft, Trash2 } from 'lucide-react';
import { formatDateTimePtBR, getMeasurements, StoredMeasurement, deleteMeasurementById, setMeasurements } from '../utils/measurements';

export default function History() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [measurements, setMeasurements] = useState<StoredMeasurement[]>([]);

  useEffect(() => {
    setMeasurements(getMeasurements());
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const hasTerm = term.length > 0;
    const hasDate = Boolean(dateFilter);
    return measurements.filter((m) => {
      const { date, time, full } = formatDateTimePtBR(m.createdAt);
      const matchTerm = !hasTerm || m.sampleId.toLowerCase().includes(term) || full.toLowerCase().includes(term);
      let matchDate = true;
      if (hasDate) {
        // dateFilter is yyyy-mm-dd from input type=date
        const onlyDate = new Date(m.createdAt);
        const y = onlyDate.getFullYear();
        const mon = String(onlyDate.getMonth() + 1).padStart(2, '0');
        const d = String(onlyDate.getDate()).padStart(2, '0');
        const isoDate = `${y}-${mon}-${d}`;
        matchDate = isoDate === dateFilter;
      }
      return matchTerm && matchDate;
    });
  }, [measurements, searchTerm, dateFilter]);

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let y = 14;
    doc.setFontSize(16);
    doc.text('ClinMind – Relatório de Mediões', 14, y);
    y += 8;
    doc.setFontSize(10);
    const filters: string[] = [];
    if (searchTerm) filters.push(`Pesquisa: "${searchTerm}"`);
    if (dateFilter) filters.push(`Data: ${dateFilter}`);
    doc.text(filters.length ? `Filtros: ${filters.join(' | ')}` : 'Filtros: nenhum', 14, y);
    y += 8;

    // Table header
    doc.setFontSize(11);
    doc.text('ID', 14, y);
    doc.text('Data/Hora', 40, y);
    doc.text('Altura (mm)', 90, y);
    doc.text('Largura (mm)', 120, y);
    doc.text('Comprimento (mm)', 150, y);
    doc.text('Status', 200, y, { align: 'right' });
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;

    filtered.forEach((m) => {
      const { full } = formatDateTimePtBR(m.createdAt);
      doc.text(m.sampleId, 14, y);
      doc.text(full, 40, y);
      doc.text(String(m.heightMm), 96, y, { align: 'right' });
      doc.text(String(m.widthMm), 128, y, { align: 'right' });
      doc.text(String(m.lengthMm), 172, y, { align: 'right' });
      doc.text(m.status, 200, y, { align: 'right' });
      y += 7;
      if (y > 280) {
        doc.addPage();
        y = 14;
      }
    });

    // Legend
    y += 4;
    doc.setFontSize(10);
    doc.text('Legenda:', 14, y);
    y += 6;
    doc.setTextColor(34, 197, 94); // green-500
    doc.text('• Padrão OK', 14, y);
    y += 6;
    doc.setTextColor(234, 179, 8); // yellow-500
    doc.text('• Atenção', 14, y);
    y += 6;
    doc.setTextColor(239, 68, 68); // red-500
    doc.text('• Fora do Padrão', 14, y);
    doc.setTextColor(0, 0, 0);

    doc.save('clinmind-relatorio.pdf');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Histórico de Medições</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar medição por ID ou data"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="space-y-3">
            {filtered.map((measurement, index) => (
              <div
                key={index}
                className="w-full flex items-center gap-4 p-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all group"
              >
                <div
                  className={`w-4 h-4 rounded-full flex-shrink-0 ${
                    measurement.status === 'Padrão OK'
                      ? 'bg-green-500'
                      : measurement.status === 'Atenção'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                ></div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-semibold text-gray-900 text-lg">ID: {measurement.sampleId}</span>
                  <span className="text-gray-500">{formatDateTimePtBR(measurement.createdAt).full}</span>
                </div>
                <button
                  onClick={() => {
                    const ok = confirm('Excluir esta medição?');
                    if (!ok) return;
                    deleteMeasurementById(measurement.sampleId, measurement.createdAt);
                    const next = getMeasurements();
                    setMeasurements(next);
                    // update state from storage
                    const after = getMeasurements();
                    // refresh base list; filtered derives from state
                    setMeasurements(after);
                  }}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            ))}
          </div>

          <div className="pt-4">
            <div className="relative flex gap-3">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all border-2 border-gray-200 hover:border-gray-300">
              <Printer className="w-5 h-5" />
              Imprimir
            </button>
            <button onClick={handleGeneratePdf} className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl">
              <FileText className="w-5 h-5" />
              Gerar Relatório
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}