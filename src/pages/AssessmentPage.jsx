import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "../styles/AssessmentPage.css";
import { FaChalkboardTeacher } from "react-icons/fa";

const AssessmentPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [assessment, setAssessment] = useState(null);
    const [instructor, setInstructor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [answers, setAnswers] = useState([]);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchAssessment = async () => {
            setIsLoading(true);
            try {
                // First get the course to find the instructor
                const courseResponse = await axios.get(
                    `${window.API_CONFIG.BASE_URL}/api/CourseModels/${courseId}`
                );

                // If we have instructor ID, fetch instructor details
                const instructorId = courseResponse.data.instructorId || courseResponse.data.InstructorId;
                if (instructorId) {
                    try {
                        const instructorResponse = await axios.get(
                            `${window.API_CONFIG.BASE_URL}/api/UserModels/${instructorId}`
                        );
                        setInstructor(instructorResponse.data);
                    } catch (err) {
                        console.error("Error fetching instructor:", err);
                        // Don't set main error for instructor fetch failure
                    }
                }

                // Fetch assessment
                const response = await axios.get(
                    `${window.API_CONFIG.BASE_URL}/api/AssessmentModels`
                );

                const courseAssessment = response.data.find(
                    (a) => a.courseId === courseId || a.CourseId === courseId
                );

                if (courseAssessment) {
                    const parsedQuestions = JSON.parse(courseAssessment.Questions || courseAssessment.questions);
                    setAssessment({
                        ...courseAssessment,
                        Questions: parsedQuestions,
                        AssessmentId: courseAssessment.assessmentId || courseAssessment.AssessmentId,
                        Title: courseAssessment.title || courseAssessment.Title,
                        CourseId: courseAssessment.courseId || courseAssessment.CourseId,
                        MaxScore: courseAssessment.maxScore || courseAssessment.MaxScore
                    });
                    setAnswers(Array(parsedQuestions.length).fill(null));
                } else {
                    setError("No assessment found for this course");
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load assessment. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssessment();
    }, [courseId]);

    const handleOptionChange = (qIdx, optionKey) => {
        if (!submitted) {
            const updated = [...answers];
            updated[qIdx] = optionKey;
            setAnswers(updated);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);

        // Calculate score
        let score = 0;
        const results = assessment.Questions.map((q, i) => {
            const isCorrect = answers[i] === q.answer;
            // Use the marks value from each question if available, or default to 1
            const questionMarks = q.marks || 1;
            if (isCorrect) score += questionMarks;
            return {
                question: q.question,
                userAnswer: answers[i],
                correctAnswer: q.answer,
                isCorrect,
                options: q.options,
                marks: questionMarks
            };
        });

        try {
            // Submit to backend
            await axios.post(`${window.API_CONFIG.BASE_URL}/api/ResultModels`, {
                AssessmentId: assessment.AssessmentId,
                UserId: currentUser?.id || currentUser?.userId,
                Score: score,
                AttemptDate: new Date().toISOString()
            });

            // Calculate max possible score
            const maxPossibleScore = assessment.Questions.reduce((total, q) => total + (q.marks || 1), 0);

            // Navigate to results page with detailed data
            navigate(`/courses/${courseId}/results`, {
                state: {
                    score,
                    maxScore: maxPossibleScore, // Use calculated max score
                    assessmentTitle: assessment.Title,
                    courseId: assessment.CourseId,
                    questions: assessment.Questions,
                    userAnswers: answers,
                    detailedResults: results
                },
            });
        } catch (err) {
            console.error("Submission error:", err);
            setError("Failed to submit results. Please try again.");
            setSubmitted(false);
        }
    };

    if (isLoading) return <div className="loading-spinner">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!assessment) return <div>No assessment available</div>;

    // Calculate total possible marks for display
    const totalPossibleMarks = assessment.Questions.reduce(
        (total, q) => total + (q.marks || 1),
        0
    );

    return (
        <div className="assessment-container">
            <div className="assessment-header">
                <button
                    className="back-button"
                    onClick={() => navigate(`/courses/${courseId}`)}
                >
                    &larr; Back to Course
                </button>
                <h1>{assessment.Title}</h1>
                <div className="assessment-info">
                    <p>{assessment.Questions.length} questions | Max score: {totalPossibleMarks}</p>
                    {instructor && (
                        <p className="instructor-info">
                            <FaChalkboardTeacher /> Instructor: {instructor.name || instructor.Name}
                        </p>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="assessment-form">
                {assessment.Questions.map((question, qIdx) => (
                    <div key={`q-${qIdx}`} className="question-card">
                        <div className="question-text">
                            <span>Q{qIdx + 1}:</span> {question.question}
                            {question.marks && question.marks > 1 && (
                                <span className="marks-badge">{question.marks} marks</span>
                            )}
                        </div>

                        <div className="options-container">
                            {Object.entries(question.options).map(([key, value]) => (
                                <label key={`o-${key}`} className="option-label">
                                    <input
                                        type="radio"
                                        name={`q${qIdx}`}
                                        checked={answers[qIdx] === key}
                                        onChange={() => handleOptionChange(qIdx, key)}
                                        disabled={submitted}
                                        required
                                    />
                                    <span className="option-key">{key.toUpperCase()}:</span>
                                    <span className="option-text">{value}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="submit-container">
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={submitted || answers.includes(null)}
                    >
                        {submitted ? "Submitting..." : "Submit Assessment"}
                    </button>

                    {answers.includes(null) && !submitted && (
                        <p className="warning-message">
                            Please answer all questions before submitting
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AssessmentPage;
