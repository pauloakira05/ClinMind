import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { computeStatus, saveMeasurement } from '../utils/measurements';

type ValidationStatus = 'ok' | 'warning' | 'error';

export default function ManualEntry() {
  const navigate = useNavigate();
  const [sampleId, setSampleId] = useState('');
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [validation, setValidation] = useState<ValidationStatus>('ok');

  const handleSave = () => {
    const toNumber = (v: string) => Number(String(v).replace(',', '.'));
    const heightMm = toNumber(height);
    const widthMm = toNumber(width);
    const lengthMm = toNumber(length);
    if (!Number.isFinite(heightMm) || !Number.isFinite(widthMm) || !Number.isFinite(lengthMm)) {
      // eslint-disable-next-line no-alert
      alert('Preencha valores numéricos válidos para altura, largura e comprimento.');
      return;
    }
    const statusText = computeStatus(heightMm, widthMm, lengthMm);
    setValidation(statusText === 'Padrão OK' ? 'ok' : statusText === 'Atenção' ? 'warning' : 'error');

    const statusOverride =
      validation === 'ok' ? 'Padrão OK' : validation === 'warning' ? 'Atenção' : 'Fora do Padrão';

    const saved = saveMeasurement({
      sampleId: sampleId,
      heightMm,
      widthMm,
      lengthMm,
      statusOverride,
    });
    try {
      // eslint-disable-next-line no-alert
      alert(`Medição salva (ID: ${saved.sampleId})`);
    } catch {}
    navigate('/history');
  };

  const handleDiscard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Registrar Medição Manual</h1>
              <p className="text-sm text-gray-500">Insira os dados manualmente</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                ID da Amostra
              </label>
              <input
                type="text"
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                placeholder="4827-A"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Altura (mm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Altura (mm)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Largura (mm)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="Largura (mm)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Comprimento (mm)
              </label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="Comprimento (mm)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">Validação:</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setValidation('ok')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  validation === 'ok'
                    ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Padrão OK
              </button>

              <button
                onClick={() => setValidation('warning')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  validation === 'warning'
                    ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                Atenção
              </button>

              <button
                onClick={() => setValidation('error')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  validation === 'error'
                    ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Fora do Padrão
              </button>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={handleDiscard}
              className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all border-2 border-gray-200 hover:border-gray-300"
            >
              Descartar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Salvar Medição
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}