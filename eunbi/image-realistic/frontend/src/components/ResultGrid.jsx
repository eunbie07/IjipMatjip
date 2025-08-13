const ResultGrid = ({ results, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="space-y-4 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-text-secondary">AI가 실사 인테리어를 생성하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-text-primary">생성된 인테리어</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, index) => (
          <ResultCard key={index} result={result} index={index} />
        ))}
      </div>
    </div>
  );
};

const ResultCard = ({ result, index }) => {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={result.url}
        alt={`Generated interior ${index + 1}`}
        className="w-full h-64 object-cover"
        onError={(e) => {
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
        }}
      />
      <div className="p-4 space-y-3">
        <p className="text-sm font-medium text-text-primary">{result.title}</p>
        <a
          href={result.url}
          download={`realistic_result_${index}.png`}
          className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-secondary transition-colors"
        >
          다운로드
        </a>
      </div>
    </div>
  );
};

export default ResultGrid;