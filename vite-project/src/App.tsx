import { useState } from 'react';
import DJDeck from './components/DJDeck.tsx';
import { audioEngine } from './hooks/useAudio.ts';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  const handleInitialize = async () => {
    await audioEngine.init();
    setIsInitialized(true);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <div className="vinyl spinning mb-8 mx-auto" />
          <h1 className="text-5xl font-bold text-white mb-4">
            DUMP REMIX <span className="text-deck-accent">STUDIO</span>
          </h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Bem-vindo ao seu estúdio de criação musical. Gere melodias, beats e efeitos com controles estilo DJ.
          </p>
          <button
            onClick={handleInitialize}
            className="btn-pad text-xl px-12 py-6"
          >
            INICIAR ESTÚDIO
          </button>
          <p className="text-gray-500 text-sm mt-4">
            Clique para ativar o motor de áudio
          </p>
        </div>
      </div>
    );
  }

  return (
    <DJDeck />
  );
}

export default App;
