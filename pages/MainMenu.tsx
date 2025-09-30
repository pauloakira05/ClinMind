import { useNavigate } from 'react-router-dom';
import { Camera, Calendar } from 'lucide-react';

export default function MainMenu() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Menu Principal</h1>
            <p className="text-gray-500">Selecione uma opção</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Camera className="w-6 h-6" />
              <span className="text-lg">Registrar Amostra</span>
            </button>

            <button
              onClick={() => navigate('/history')}
              className="w-full flex items-center gap-4 px-6 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all border-2 border-gray-200 hover:border-gray-300 transform hover:-translate-y-0.5"
            >
              <Calendar className="w-6 h-6" />
              <span className="text-lg">Consultar Histórico</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}