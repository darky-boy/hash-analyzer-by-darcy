import { useState } from 'react';
import axios from 'axios';
import { HashInput } from './components/HashInput';
import { ResultCard } from './components/ResultCard';
import logo from './components/hashlab pro svg.png';

interface DetectionResult {
  id: string;
  name: string;
  score: number;
  color: 'green' | 'yellow' | 'red';
  reasons: string[];
}

interface AnalysisResult {
  input: string;
  results: DetectionResult[];
  stats: {
    total: number;
    unique: number;
    digits: number;
    letters: number;
    special: number;
    entropy: number;
  };
  decoding: {
    base64?: string;
    hex?: string;
  };
  freq: { [key: string]: number };
}

const API_URL = 'http://localhost:4000';

function App() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (inputs: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/analyze`, {
        inputs
      });
      
      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError(response.data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to connect to the analysis service. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(239,68,68,0.1)_25%,rgba(239,68,68,0.1)_50%,transparent_50%,transparent_75%,rgba(239,68,68,0.1)_75%)] bg-[length:20px_20px]"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-32 h-32 mb-6 shadow-2xl">
            <img
              src={logo}
              alt="Hash Analyzer Logo"
              className="w-32 h-32 object-contain border-2 border-white rounded-lg bg-black p-2"
            />
          </div>
          <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-red-500 via-red-400 to-white bg-clip-text text-transparent tracking-tight">
            HASH ANALYZER
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-red-500 to-red-300 mx-auto mb-4"></div>
          <div className="mb-6">
            <p className="text-lg text-white font-light tracking-wider opacity-80">
              Made by <span className="font-bold text-red-400">DarCy</span>
            </p>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto font-medium">
            Advanced hash analysis and detection tool with cutting-edge pattern recognition
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <HashInput onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-red-200 font-medium">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-white">
                  ANALYSIS RESULTS ({results.length})
                </h2>
              </div>
              <button
                onClick={clearResults}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 border-2 border-red-500/30 hover:border-red-400/50"
              >
                CLEAR
              </button>
            </div>
            
            <div className="space-y-6">
              {results.map((result, index) => (
                <ResultCard key={index} result={result} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="max-w-4xl mx-auto mt-16 pt-8 border-t-2 border-red-500/30">
          <div className="text-center text-gray-400">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-white">
                HASH ANALYZER - POWERED BY ADVANCED PATTERN RECOGNITION
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Supports MD5, SHA1, SHA256, SHA512, bcrypt, NTLM, and 700+ hash types
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
