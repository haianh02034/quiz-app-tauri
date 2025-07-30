import React from 'react';

function ResultsAnalysis({ quiz, results, handleRetakeQuiz }) {
  return (
    <div className="results-analysis-container">
      <h1>Kết quả bài kiểm tra: {quiz.title}</h1>
      {results && (
        <div>
          <p>Điểm số của bạn: {results.score} / {results.totalQuestions}</p>
          <p>Tỷ lệ đúng: {results.percentageCorrect}%</p>
          <h2>Phân tích chi tiết:</h2>
          {quiz.questions.map(question => {
            const questionResult = results.results.find(r => r.questionId === question.id);
            const isCorrect = questionResult ? questionResult.isCorrect : false;
            const submittedOptions = questionResult ? questionResult.submittedAnswers : [];
            const correctOptions = question.correctOptionIds;

            return (
              <div key={question.id} className={`question-analysis ${isCorrect ? 'correct' : 'incorrect'}`}>
                <h3>{question.text.split('```')[0].trim()} {isCorrect ? '✅' : '❌'}</h3>
                {question.text.split('```').slice(1).map((part, index) => {
                  if (index % 2 === 0) {
                    const [lang, ...codeLines] = part.split('\n');
                    const code = codeLines.join('\n').trim();
                    return (
                      <pre key={index} className="code-block">
                        <code className={`language-${lang.trim()}`}>{code}</code>
                      </pre>
                    );
                  } else {
                    return <p key={index}>{part}</p>;
                  }
                })}
                <ul>
                  {question.options.map(option => (
                    <li key={option.id}>
                      <span className={
                        correctOptions.includes(option.id) && submittedOptions.includes(option.id)
                          ? 'correct-and-submitted'
                          : correctOptions.includes(option.id) && !submittedOptions.includes(option.id)
                            ? 'correct-but-not-submitted'
                            : !correctOptions.includes(option.id) && submittedOptions.includes(option.id)
                              ? 'wrong-and-submitted'
                              : ''
                      }>
                        {option.text}
                        {correctOptions.includes(option.id) && submittedOptions.includes(option.id) && ' (Đúng và bạn đã chọn)'}
                        {correctOptions.includes(option.id) && !submittedOptions.includes(option.id) && ' (Đáp án đúng, bạn chưa chọn)'}
                        {!correctOptions.includes(option.id) && submittedOptions.includes(option.id) && ' (Bạn đã chọn, nhưng sai)'}
                      </span>
                    </li>
                  ))}
                </ul>
                {!isCorrect && (
                  <p className="correct-answer">
                    Đáp án đúng là: {question.options
                      .filter(option => correctOptions.includes(option.id))
                      .map(option => option.text)
                      .join(', ')}
                  </p>
                )}
              </div>
            );
          })}
          <button onClick={handleRetakeQuiz} style={{ marginTop: '20px' }}>Làm lại bài</button>
        </div>
      )}
    </div>
  );
}

export default ResultsAnalysis;
