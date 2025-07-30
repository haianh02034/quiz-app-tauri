import React from 'react';

function QuestionCard({ question, currentQuestionIndex, totalQuestions, currentAnswers, handleOptionChange }) {
  const isMultipleChoice = question.correctOptionIds.length > 1;

  return (
    <div className="question-card">
      <h3>Câu hỏi {currentQuestionIndex + 1} / {totalQuestions}: {question.text.split('```')[0].trim()}</h3>
      {question.text.split('```').slice(1).map((part, index) => {
        if (index % 2 === 0) { // This is a code block (after the first split)
          const [lang, ...codeLines] = part.split('\n');
          const code = codeLines.join('\n').trim();
          return (
            <pre key={index} className="code-block">
              <code className={`language-${lang.trim()}`}>{code}</code>
            </pre>
          );
        } else { // This is regular text after a code block
          return <p key={index}>{part}</p>;
        }
      })}
      {isMultipleChoice && (
        <p className="multiple-choice-hint">Chọn tất cả các tùy chọn đúng</p>
      )}
      <div className="options">
        {question.options.map(option => {
          const isChecked = isMultipleChoice
            ? (currentAnswers[question.id] || []).includes(option.id)
            : (currentAnswers[question.id] && currentAnswers[question.id][0] === option.id);

          return (
            <div
              key={option.id}
              className={`option-block ${isChecked ? 'selected' : ''}`}
              onClick={() => handleOptionChange(question.id, option.id, isMultipleChoice)}
            >
              <span className="option-number">{option.id.toUpperCase()}</span>
              {isChecked && <span className="checkmark">✔</span>}
              <span className="option-text">{option.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuestionCard;
