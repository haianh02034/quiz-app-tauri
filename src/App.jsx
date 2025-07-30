import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import QuestionCard from './components/QuestionCard.jsx';
import ResultsAnalysis from './components/ResultsAnalysis.jsx';
import { invoke } from '@tauri-apps/api/core';

function App() {
  const [quiz, setQuiz] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false); // New state for start screen

  useEffect(() => {
    if (quizStarted) {
      console.log('App component mounted. Fetching quiz...');
      fetchQuiz();
    }
  }, [quizStarted]);

  const handleSubmit = useCallback(async () => {
    setTimerActive(false); // Stop timer on submit
    try {
      const data = await invoke('submit_answers', { answers: currentAnswers, totalQuestions: quiz?.questions?.length || 0 });
      setResults(data);
      setQuizSubmitted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  }, [currentAnswers, setQuizSubmitted, setResults, setTimerActive, quiz]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    // fetchQuiz is called by useEffect when quizStarted becomes true
  };

  const handleRetakeQuiz = () => {
    setCurrentAnswers({});
    setQuizSubmitted(false);
    setResults(null);
    setTimeLeft(600); // Reset timer to 10 minutes
    setCurrentQuestionIndex(0);
    setQuizStarted(false); // Go back to start screen
    setTimerActive(false); // Stop timer
  };

  useEffect(() => {
    let timer;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [timeLeft, timerActive, handleSubmit]);

  const fetchQuiz = async () => {
    try {
      const data = await invoke('get_random_quiz_data', { count: 20 });
      console.log('Quiz data fetched:', data);
      setQuiz(data);
      setTimerActive(true); // Start timer when quiz data is fetched
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setQuiz(null); // Ensure quiz is null on error to show loading state
    }
  };

  const handleOptionChange = useCallback((questionId, optionId, isMultipleChoice) => {
    setCurrentAnswers(prevAnswers => {
      let updatedAnswers;
      if (isMultipleChoice) {
        const currentSelected = prevAnswers[questionId] || [];
        if (currentSelected.includes(optionId)) {
          updatedAnswers = {
            ...prevAnswers,
            [questionId]: currentSelected.filter(id => id !== optionId),
          };
        } else {
          updatedAnswers = {
            ...prevAnswers,
            [questionId]: [...currentSelected, optionId],
          };
        }
      } else {
        updatedAnswers = {
          ...prevAnswers,
          [questionId]: [optionId],
        };
      }
      return updatedAnswers;
    });
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!quizStarted) {
    return (
      <div className="App start-screen">
        <h1>Chào mừng đến với Quiz App!</h1>
        <p>Bạn có 10p để làm hoàn thành 20 câu hỏi. Hãy bắt đầu ngay bây giờ!</p>
        <p>Chúc bạn may mắn!</p>
        <button className="start-button" onClick={handleStartQuiz}>Bắt đầu</button>
      </div>
    );
  }

  if (!quiz || quiz.questions?.length === 0) {
    console.log('Displaying Loading quiz...');
    return <div>Loading quiz...</div>;
  }

  if (quizSubmitted) {
    return (
      <div className="App">
        <ResultsAnalysis quiz={quiz} results={results} handleRetakeQuiz={handleRetakeQuiz} />
      </div>
    );
  }

  return (
    <div className="App">
      <h1>{quiz.title}</h1>
      <div className="timer">Thời gian còn lại: {formatTime(timeLeft)}</div>
      {quiz.questions && quiz.questions.length > 0 && (
        <QuestionCard
          question={quiz.questions[currentQuestionIndex]}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={quiz.questions.length}
          currentAnswers={currentAnswers}
          handleOptionChange={handleOptionChange}
        />
      )}
      <div className="navigation-buttons">
        {currentQuestionIndex > 0 && (
          <button onClick={() => setCurrentQuestionIndex(prevIndex => prevIndex - 1)}>Câu trước</button>
        )}
        {currentQuestionIndex < quiz.questions.length - 1 && (
          <button onClick={() => setCurrentQuestionIndex(prevIndex => prevIndex + 1)}>Câu tiếp theo</button>
        )}
        {currentQuestionIndex === quiz.questions.length - 1 && (
          <button onClick={handleSubmit}>Nộp bài</button>
        )}
      </div>
    </div>
  );
}

export default App;
