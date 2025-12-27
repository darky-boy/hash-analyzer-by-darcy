import React, { useState } from 'react';

interface HashInputProps {
  onAnalyze: (inputs: string[]) => void;
  isLoading: boolean;
}

export const HashInput: React.FC<HashInputProps> = ({ onAnalyze, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const inputs = input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    onAnalyze(inputs);
  };

  const handleExample = (example: string) => {
    setInput(example);
  };

  const examples = [
    '5d41402abc4b2a76b9719d911017c592',
    'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
    'SGVsbG8gV29ybGQ=',
    '48656c6c6f20576f726c64',
    '$2b$12$KIX6H7...'
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border-2 border-red-500/30 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center border-2 border-red-500/50">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-black text-white">HASH ANALYSIS</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-red-300 mt-2"></div>
          <p className="text-gray-300 font-medium mt-2">Enter your hash values for comprehensive analysis</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="hash-input" className="block text-lg font-bold text-white mb-3">
            ENTER HASH(ES) TO ANALYZE (ONE PER LINE):
          </label>
          <textarea
            id="hash-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your hash here...&#10;5d41402abc4b2a76b9719d911017c592&#10;SGVsbG8gV29ybGQ="
            className="w-full h-40 bg-black/50 border-2 border-red-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 resize-none font-mono text-sm"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-black px-8 py-4 rounded-lg transition-all duration-300 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2 border-red-500/30 hover:border-red-400/50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Analyze
              </>
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-bold text-white">TRY THESE EXAMPLES:</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExample(example)}
              className="bg-black/50 hover:bg-red-900/30 border-2 border-red-500/30 hover:border-red-400/50 text-white hover:text-red-100 px-4 py-3 rounded-lg transition-all duration-300 text-sm font-mono backdrop-blur-sm font-bold"
              disabled={isLoading}
            >
              {example.length > 25 ? `${example.substring(0, 25)}...` : example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
