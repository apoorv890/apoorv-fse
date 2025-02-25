interface TranscriptionWindowProps {
  transcription: string;
  insights?: {
    insights: string[];
    questions: string[];
  };
}

const TranscriptionWindow: React.FC<TranscriptionWindowProps> = ({ transcription, insights }) => {
  return (
    <div className="transcription-window bg-gray-800 text-white p-4 rounded-lg shadow-lg">
      <div className="transcription-content mb-4">
        <h3 className="text-lg font-semibold mb-2">Transcription</h3>
        <div className="bg-gray-700 p-3 rounded">
          {transcription || 'Waiting for transcription...'}
        </div>
      </div>
      
      {insights && (insights.insights.length > 0 || insights.questions.length > 0) && (
        <div className="insights-section">
          {insights.insights.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
              <ul className="bg-gray-700 p-3 rounded">
                {insights.insights.map((insight, idx) => (
                  <li key={idx} className="mb-2">{insight}</li>
                ))}
              </ul>
            </div>
          )}
          
          {insights.questions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Follow-up Questions</h3>
              <ul className="bg-gray-700 p-3 rounded">
                {insights.questions.map((question, idx) => (
                  <li key={idx} className="mb-2">{question}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranscriptionWindow;
