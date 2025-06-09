// import { useLocation, Link } from 'react-router-dom';
// import '../styles/ResultsPage.css'; 

// const ResultsPage = () => {
//     const { state } = useLocation();

//     if (!state) {
//         return (
//             <div className="results-error">
//                 <h2>No Results Found</h2>
//                 <p>Please complete an assessment first</p>
//                 <Link to="/courses" className="btn">Browse Courses</Link>
//             </div>
//         );
//     }

//     const { score, maxScore, assessmentTitle, questions, userAnswers, courseId } = state;
//     const percentage = Math.round((score / maxScore) * 100);

//     return (
//         <div className="results-container">
//             <h1>{assessmentTitle} - Results</h1>

//             <div className={`score-summary ${percentage >= 70 ? 'pass' : 'fail'}`}>
//                 <div className="score-percent">{percentage}%</div>
//                 <div className="score-text">
//                     You scored {score} out of {maxScore}
//                 </div>
//             </div>

//             <div className="questions-review">
//                 <h2>Question Review</h2>
//                 {questions.map((q, index) => {
//                     const isCorrect = userAnswers[index] === q.answer;
//                     return (
//                         <div key={index} className={`question-card ${isCorrect ? 'correct' : 'incorrect'}`}>
//                             <h3>Question {index + 1}: {q.question}</h3>
//                             <p>Your answer: {q.options[userAnswers[index]]}</p>
//                             {!isCorrect && (
//                                 <p>Correct answer: {q.options[q.answer]}</p>
//                             )}
//                         </div>
//                     );
//                 })}
//             </div>

//             <Link to={`/courses/${courseId}`} className="btn">
//                 Back to Course
//             </Link>
//         </div>
//     );
// };

// export default ResultsPage;

import { useLocation, Link } from 'react-router-dom';
import '../styles/ResultsPage.css';
import { FaArrowLeft, FaCheck, FaTimes, FaMedal, FaClipboardCheck } from 'react-icons/fa';

const ResultsPage = () => {
    const { state } = useLocation();

    if (!state) {
        return (
            <div className="no-results-container">
                <div className="no-results-card">
                    <div className="no-results-icon">
                        <FaClipboardCheck />
                    </div>
                    <h2>No Results Found</h2>
                    <p>Please complete an assessment first to view your results</p>
                    <Link to="/courses" className="primary-btn">
                        <FaArrowLeft className="btn-icon" /> Browse Courses
                    </Link>
                </div>
            </div>
        );
    }

    const { score, maxScore, assessmentTitle, questions, userAnswers, courseId, detailedResults } = state;
    const percentage = Math.round((score / maxScore) * 100);
    const isPassed = percentage >= 70;

    // Calculate stats
    const totalQuestions = questions.length;
    const correctAnswers = detailedResults?.filter(r => r.isCorrect).length ||
        questions.filter((q, i) => userAnswers[i] === q.answer).length;

    return (
        <div className="results-page">
            <div className="results-header">
                <div className="container">
                    <Link to={`/courses/${courseId}`} className="back-link">
                        <FaArrowLeft /> Back to Course
                    </Link>
                    <h1>{assessmentTitle} - Results</h1>
                </div>
            </div>

            <div className="container">
                <div className="results-main">
                    <div className="score-card">
                        <div className={`score-display ${isPassed ? 'pass' : 'fail'}`}>
                            <div className="score-circle">
                                <div className="score-number">{percentage}<span>%</span></div>
                                <svg viewBox="0 0 36 36" className="score-chart">
                                    <path className="score-circle-bg"
                                        d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path className="score-circle-fill"
                                        strokeDasharray={`${percentage}, 100`}
                                        d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                            </div>
                            <div className="score-result">
                                {isPassed ? (
                                    <>
                                        <FaMedal className="result-icon pass" />
                                        <span>Assessment Passed</span>
                                    </>
                                ) : (
                                    <>
                                        <FaTimes className="result-icon fail" />
                                        <span>Assessment Failed</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="score-details">
                            <div className="score-detail-item">
                                <span className="detail-label">Total Score:</span>
                                <span className="detail-value">{score} of {maxScore} points</span>
                            </div>
                            <div className="score-detail-item">
                                <span className="detail-label">Correct Answers:</span>
                                <span className="detail-value">{correctAnswers} of {totalQuestions} questions</span>
                            </div>
                            <div className="score-detail-item">
                                <span className="detail-label">Passing Score:</span>
                                <span className="detail-value">70%</span>
                            </div>
                        </div>
                    </div>

                    <div className="review-section">
                        <h2>Question Review</h2>
                        <p className="review-instructions">
                            Review your answers to understand what you got right and where you need improvement.
                        </p>

                        {questions.map((q, index) => {
                            const userAnswer = userAnswers[index];
                            const isCorrect = userAnswer === q.answer;
                            const questionMarks = q.marks || 1;

                            return (
                                <div key={index} className="question-review-card">
                                    <div className="question-header">
                                        <div className="question-number">Question {index + 1}</div>
                                        <div className="question-status">
                                            {isCorrect ? (
                                                <span className="status-badge correct">
                                                    <FaCheck /> Correct
                                                </span>
                                            ) : (
                                                <span className="status-badge incorrect">
                                                    <FaTimes /> Incorrect
                                                </span>
                                            )}
                                            <span className="marks-badge">
                                                {isCorrect ? questionMarks : 0}/{questionMarks} marks
                                            </span>
                                        </div>
                                    </div>

                                    <div className="question-content">
                                        <p className="question-text">{q.question}</p>

                                        <div className="options-list">
                                            {Object.entries(q.options).map(([key, text]) => (
                                                <div
                                                    key={key}
                                                    className={`option-item ${key === userAnswer
                                                            ? isCorrect
                                                                ? 'user-correct'
                                                                : 'user-incorrect'
                                                            : key === q.answer
                                                                ? 'correct-answer'
                                                                : ''
                                                        }`}
                                                >
                                                    <span className="option-marker">{key.toUpperCase()}</span>
                                                    <span className="option-text">{text}</span>
                                                    {key === userAnswer && (
                                                        <span className="option-icon user">
                                                            {isCorrect ? <FaCheck /> : <FaTimes />}
                                                        </span>
                                                    )}
                                                    {!isCorrect && key === q.answer && (
                                                        <span className="option-icon correct">
                                                            <FaCheck />
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="results-actions">
                        <Link to={`/courses/${courseId}`} className="primary-btn">
                            <FaArrowLeft className="btn-icon" /> Back to Course
                        </Link>
                        {!isPassed && (
                            <Link to={`/courses/${courseId}/assessment`} className="secondary-btn">
                                <FaClipboardCheck className="btn-icon" /> Retake Assessment
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;