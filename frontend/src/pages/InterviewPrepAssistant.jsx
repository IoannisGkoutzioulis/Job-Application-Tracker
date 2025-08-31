import React, { useEffect, useState } from 'react';
import api from '../services/api';

const InterviewPrepAssistant = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answerText, setAnswerText] = useState('');
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerError, setAnswerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/interview-questions/?page_size=100');
        setQuestions(response.data.results);
      } catch (err) {
        setError('Failed to load interview questions.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (!selectedQuestion) {
      setAnswers([]);
      return;
    }
    const fetchAnswers = async () => {
      try {
        setAnswerLoading(true);
        setAnswerError(null);
        const response = await api.get(`/practice-answers/?question=${selectedQuestion.id}`);
        setAnswers(response.data.results);
      } catch (err) {
        setAnswerError('Failed to load previous answers.');
      } finally {
        setAnswerLoading(false);
      }
    };
    fetchAnswers();
  }, [selectedQuestion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    try {
      setSubmitting(true);
      await api.post('/practice-answers/', {
        question: selectedQuestion.id,
        answer_text: answerText,
      });
      setAnswerText('');
      // Refresh answers
      const response = await api.get(`/practice-answers/?question=${selectedQuestion.id}`);
      setAnswers(response.data.results);
    } catch (err) {
      setAnswerError('Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="interview-prep-assistant">
      <h2>Interview Preparation Assistant</h2>
      {loading && <p>Loading questions...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ minWidth: '250px' }}>
          <h3>Questions</h3>
          <ul>
            {questions.map((q) => (
              <li key={q.id}>
                <button onClick={() => setSelectedQuestion(q)} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textAlign: 'left' }}>
                  {q.question_text}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          {selectedQuestion ? (
            <div>
              <h3>Question Detail</h3>
              <p><strong>Question:</strong> {selectedQuestion.question_text}</p>
              <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                <textarea
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  rows={4}
                  style={{ width: '100%' }}
                  placeholder="Type your answer here..."
                  disabled={submitting}
                />
                <br />
                <button type="submit" disabled={submitting || !answerText.trim()}>
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              </form>
              {answerError && <p style={{ color: 'red' }}>{answerError}</p>}
              <h4>Previous Answers</h4>
              {answerLoading ? (
                <p>Loading answers...</p>
              ) : answers.length === 0 ? (
                <p>No previous answers yet.</p>
              ) : (
                <ul>
                  {answers.map(ans => (
                    <li key={ans.id}>
                      <div style={{ background: 'var(--card-bg)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                        <div><strong>Answer:</strong> {ans.answer_text}</div>
                        {ans.score !== null && <div><strong>Score:</strong> {ans.score}</div>}
                        <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>{new Date(ans.created_at).toLocaleString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p>Select a question to view details and practice your answer.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewPrepAssistant; 