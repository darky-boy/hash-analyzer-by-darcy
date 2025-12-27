import React, { useState } from 'react';

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
    rot13?: string;
    url?: string;
    binary?: string;
    octal?: string;
    unicode?: string;
    html?: string;
  };
  freq: { [key: string]: number };
}

interface ResultCardProps {
  result: AnalysisResult;
  index: number;
}

// Circular Progress Component
const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}> = ({ percentage, size = 40, strokeWidth = 4, color = "blue" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-500';
      case 'yellow': return 'text-yellow-500';
      case 'red': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-600"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-300 ${getColorClass(color)}`}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-xs font-bold ${getColorClass(color)}`}>
        {percentage}%
      </span>
    </div>
  );
};

export const ResultCard: React.FC<ResultCardProps> = ({ result, index }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getConfidenceColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'yellow': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'red': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-slate-400 bg-slate-400/20 border-slate-400/30';
    }
  };


  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border-2 border-red-500/30 rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:border-red-400/50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center text-white font-black text-lg border-2 border-red-500/50">
            #{index + 1}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">INPUT:</span>
            <div className="flex items-center gap-2 bg-black/50 border-2 border-red-500/30 rounded-lg px-4 py-3">
              <code className="text-white text-sm font-mono">
                {result.input.length > 50 ? `${result.input.substring(0, 50)}...` : result.input}
              </code>
              <button
                onClick={() => copyToClipboard(result.input)}
                className="text-red-400 hover:text-red-200 transition-colors p-1 hover:bg-red-900/30 rounded"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-red-600/20 hover:bg-red-700/30 border-2 border-red-500/30 hover:border-red-400/50 text-red-300 hover:text-red-100 p-3 rounded-lg transition-all duration-300"
        >
          {isExpanded ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Detection Results */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center border-2 border-red-500/50">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white">DETECTION RESULTS</h3>
            </div>
            {result.results.length > 0 ? (
              <div className="space-y-3">
                {result.results.map((result, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-black/50 to-gray-900/50 border-2 border-red-500/30 rounded-xl p-6 hover:border-red-400/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center border-2 border-red-500/50">
                          <span className="text-white font-black text-xl">{result.name.charAt(0)}</span>
                        </div>
                        <div>
                          <span className="font-black text-xl text-white">{result.name}</span>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-4 py-2 rounded-lg text-sm font-bold border-2 ${getConfidenceColor(result.color)}`}>
                              {result.color.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <CircularProgress 
                        percentage={Math.round(result.score * 100)} 
                        color={result.color}
                        size={56}
                      />
                    </div>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                      <p className="text-sm text-red-200 font-medium">
                        <span className="font-bold text-red-300">EVIDENCE:</span> {result.reasons.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No hash types detected</p>
            )}
          </div>

          {/* Character Statistics */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📊</span>
              <h3 className="text-lg font-semibold text-slate-100">Character Statistics</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-400">{result.stats.total}</div>
                <div className="text-sm text-slate-400">Total Characters</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">{result.stats.unique}</div>
                <div className="text-sm text-slate-400">Unique Characters</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-400">{result.stats.letters}</div>
                <div className="text-sm text-slate-400">Letters</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-400">{result.stats.digits}</div>
                <div className="text-sm text-slate-400">Digits</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-400">{result.stats.special}</div>
                <div className="text-sm text-slate-400">Special</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">{result.stats.entropy.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">Entropy</div>
                  </div>
                  <CircularProgress 
                    percentage={Math.min(100, (result.stats.entropy / 5) * 100)} 
                    color={result.stats.entropy > 4.0 ? 'green' : result.stats.entropy > 3.0 ? 'yellow' : 'red'}
                    size={32}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Decoding Attempts */}
          {Object.keys(result.decoding).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔐</span>
                <h3 className="text-lg font-semibold text-slate-100">Decoding Attempts</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(result.decoding).map(([type, decoded]) => (
                  <div key={type} className="bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700/70 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300 capitalize flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          type === 'base64' ? 'bg-blue-500' :
                          type === 'hex' ? 'bg-green-500' :
                          type === 'rot13' ? 'bg-purple-500' :
                          type === 'url' ? 'bg-orange-500' :
                          type === 'binary' ? 'bg-red-500' :
                          type === 'octal' ? 'bg-yellow-500' :
                          type === 'unicode' ? 'bg-indigo-500' :
                          type === 'html' ? 'bg-pink-500' :
                          'bg-gray-500'
                        }`}></div>
                        {type}
                      </span>
                      <button
                        onClick={() => copyToClipboard(decoded)}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <code className="text-slate-200 text-sm break-all bg-slate-800 p-2 rounded border">
                      {decoded}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Character Frequency Analysis */}
          {result.freq && Object.keys(result.freq).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📊</span>
                <h3 className="text-lg font-semibold text-slate-100">Character Frequency Analysis</h3>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-sm text-slate-300 mb-3">
                  <strong>Most frequent characters:</strong>
                </div>
                <div className="space-y-2">
                  {Object.entries(result.freq)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([char, count]) => {
                      const percentage = Math.round((count as number / result.stats.total) * 100);
                      return (
                        <div key={char} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-mono text-slate-200">{char}</span>
                            <span className="text-sm text-slate-400">{count} times</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CircularProgress 
                              percentage={percentage} 
                              color="green"
                              size={24}
                            />
                            <span className="text-xs text-slate-500">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Additional Analysis */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🧩</span>
              <h3 className="text-lg font-semibold text-slate-100">Additional Analysis</h3>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-sm text-slate-300">
                <div className="mb-2">
                  <strong>Entropy Level:</strong> {
                    result.stats.entropy < 1.0 ? 'Low (structured)' :
                    result.stats.entropy < 3.0 ? 'Medium (mixed)' :
                    'High (random/encrypted)'
                  }
                </div>
                <div>
                  <strong>Character Distribution:</strong> {
                    result.stats.letters > result.stats.digits ? 'Text-heavy' :
                    result.stats.digits > result.stats.letters ? 'Number-heavy' :
                    'Balanced'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
