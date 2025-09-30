import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveMeasurement } from '../utils/measurements';
import { analyzeImageFromDataUrl } from '../utils/ai';

export default function Dashboard() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [heightMm, setHeightMm] = useState<number | null>(null);
  const [widthMm, setWidthMm] = useState<number | null>(null);
  const [lengthMm, setLengthMm] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
      } catch {
        // ignore permission errors for now
      }
    })();
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedDataUrl(dataUrl);
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await analyzeImageFromDataUrl(dataUrl);
      setHeightMm(result.heightMm);
      setWidthMm(result.widthMm);
      setLengthMm(result.lengthMm);
      setStatusText(result.status);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao analisar imagem.';
      setErrorMsg(msg);
      setHeightMm(null);
      setWidthMm(null);
      setLengthMm(null);
      setStatusText(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/manual')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all text-sm"
            >
              Registrar manualmente
            </button>
          </div>

          <div className="bg-gradient-to-br from-slate-200 to-slate-100 rounded-2xl p-4 aspect-[4/3] relative overflow-hidden">
            {capturedDataUrl ? (
              <img src={capturedDataUrl} alt="Captura" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <video ref={videoRef} className="w-full h-full object-cover rounded-xl" playsInline muted />
            )}
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-32 h-1 bg-gradient-to-r from-gray-300 via-gray-600 to-gray-300 rounded-full"></div>
                <span className="font-mono">0-6cm</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">Chave do Gemini (armazenada localmente)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Cole sua API key aqui"
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem('clinmind.geminiKey', apiKeyInput.trim());
                      setErrorMsg(null);
                      // eslint-disable-next-line no-alert
                      alert('Chave salva localmente. Agora você pode Capturar.');
                    } catch {}
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl"
                >
                  Salvar chave
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Resultados:</h2>
              {statusText && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  statusText === 'Padrão OK'
                    ? 'bg-green-100 text-green-700'
                    : statusText === 'Atenção'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    statusText === 'Padrão OK'
                      ? 'bg-green-500'
                      : statusText === 'Atenção'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}></div>
                  <span className="font-semibold text-sm">{statusText}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-gray-700">
              {isLoading ? (
                <p className="text-sm text-gray-500">Analisando imagem com IA...</p>
              ) : (
                <>
                  <p className="text-base"><span className="font-semibold">Altura:</span> {heightMm ?? '--'}mm</p>
                  <p className="text-base"><span className="font-semibold">Largura:</span> {widthMm ?? '--'}mm</p>
                  <p className="text-base"><span className="font-semibold">Comprimento:</span> {lengthMm ?? '--'}mm</p>
                </>
              )}
              {errorMsg && (
                <p className="text-sm text-red-600">{errorMsg}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={handleCapture}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 font-semibold rounded-xl transition-all border-2 border-gray-200 hover:border-gray-300"
            >
              Capturar
            </button>
            <button
              disabled={heightMm == null || widthMm == null || lengthMm == null}
              onClick={() => {
                if (heightMm == null || widthMm == null || lengthMm == null) return;
                const saved = saveMeasurement({
                  heightMm,
                  widthMm,
                  lengthMm,
                });
                try {
                  // Toast simples
                  // eslint-disable-next-line no-alert
                  alert(`Medição salva (ID: ${saved.sampleId})`);
                } catch {}
                navigate('/history');
              }}
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