import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import '../../styles/CreateAssessment.css'
// Old hardcoded URL
// const API_BASE_URL = "https://localhost:7278/api";

// Hardcoded API URL with /api path
const API_BASE_URL = "https://edusyncbackendapi-e9hrg2a8exgvgwda.centralindia-01.azurewebsites.net/api";

const defaultOption = { a: "", b: "", c: "", d: "" };

export default function CreateAssessment() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Fetch instructor's courses
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        courseId: "",
        title: "",
        questions: [
            {
                question: "",
                options: { ...defaultOption },
                answer: "a",
                marks: 1, // Add marks field with default value 1
            },
        ],
    });

    // Error/success state
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        // Fetch courses for dropdown
        axios
            .get(`${API_BASE_URL}/CourseModels`)
            .then((res) => {
                // Filter to only instructor's courses
                const uid = currentUser?.id || currentUser?.userId;
                setCourses(res.data.filter((c) =>
                    String(c.instructorId || c.InstructorId) === String(uid)
                ));
            })
            .catch((err) => setError("Error fetching courses"))
            .finally(() => setLoading(false));
    }, [currentUser]);

    // Question Handling
    const handleQuestionChange = (idx, field, value) => {
        const qArr = [...form.questions];
        if (field === "options") {
            qArr[idx].options = value;
        } else {
            qArr[idx][field] = value;
        }
        setForm({ ...form, questions: qArr });
    };

    const addQuestion = () => {
        setForm({
            ...form,
            questions: [
                ...form.questions,
                {
                    question: "",
                    options: { ...defaultOption },
                    answer: "a",
                    marks: 1 // Default marks for new question
                },
            ],
        });
    };

    const removeQuestion = (idx) => {
        if (form.questions.length <= 1) return;
        setForm({
            ...form,
            questions: form.questions.filter((_, i) => i !== idx),
        });
    };

    // Calculate total max score based on question marks
    const calculateMaxScore = () => {
        return form.questions.reduce((total, question) => total + (question.marks || 1), 0);
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (form.questions.some((q) => !q.question.trim())) {
            setError("Please fill in all questions.");
            return;
        }
        if (!form.title || !form.courseId) {
            setError("Please select a course and give a title.");
            return;
        }

        // Generate question array for backend
        const questionArr = form.questions.map((q, i) => ({
            id: i + 1,
            question: q.question,
            options: q.options,
            answer: q.answer,
            marks: q.marks || 1 // Include marks in the question object
        }));

        const instance = axios.create();
        if (currentUser?.token) {
            instance.defaults.headers.common['Authorization'] = `Bearer ${currentUser.token}`;
        }

        try {
            await instance.post(`${API_BASE_URL}/AssessmentModels`, {
                CourseId: form.courseId,
                Title: form.title,
                Questions: JSON.stringify(questionArr),
                MaxScore: calculateMaxScore(), // Use calculated max score
            });

            setSuccess("Assessment uploaded!");
            setTimeout(() => navigate("/instructor"), 1500);
        } catch (err) {
            setError("Error posting assessment.");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="assessment-form-container">
            <h2 className="assessment-form-title">Create New Assessment</h2>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {success && <div style={{ color: 'green' }}>{success}</div>}
            <form className="assessment-form" onSubmit={handleSubmit}>
                <label>Course</label>
                <select value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })} required>
                    <option value="">Select course</option>
                    {courses.map((c) => (
                        <option key={c.courseId || c.CourseId} value={c.courseId || c.CourseId}>{c.title || c.Title}</option>
                    ))}
                </select>
                <label>Assessment Title</label>
                <input
                    type="text"
                    placeholder="Assessment title"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    required
                />

                <div className="questions-section">
                    <h3 style={{ marginBottom: 24, color: '#243047', fontWeight: 700 }}>Questions</h3>
                    {form.questions.map((q, idx) => (
                        <div className="question-card" key={idx}>
                            <label>{`Question ${idx + 1}`}</label>
                            <input
                                type="text"
                                value={q.question}
                                placeholder="Type your question"
                                onChange={e => handleQuestionChange(idx, "question", e.target.value)}
                                required
                            />
                            <label>Options:</label>
                            {["a", "b", "c", "d"].map((key) => (
                                <div key={key} style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: 6, width: 14, display: 'inline-block', fontWeight: 600 }}>{key.toUpperCase()}:</span>
                                    <input
                                        type="text"
                                        value={q.options[key]}
                                        placeholder={`Option ${key.toUpperCase()}`}
                                        onChange={e =>
                                            handleQuestionChange(idx, "options", {
                                                ...q.options,
                                                [key]: e.target.value,
                                            })
                                        }
                                        style={{ flex: 1 }}
                                        required
                                    />
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label>Correct Answer</label>
                                    <select
                                        value={q.answer}
                                        onChange={e => handleQuestionChange(idx, "answer", e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="a">A</option>
                                        <option value="b">B</option>
                                        <option value="c">C</option>
                                        <option value="d">D</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>Marks</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={q.marks || 1}
                                        onChange={e => handleQuestionChange(idx, "marks", parseInt(e.target.value) || 1)}
                                        style={{ width: '100%' }}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="question-card-actions">
                                {form.questions.length > 1 && (
                                    <button type="button" className="remove-btn" onClick={() => removeQuestion(idx)}>
                                        Remove Question
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div style={{ marginBottom: '16px', fontWeight: 'bold' }}>
                        Total Max Score: {calculateMaxScore()}
                    </div>
                    <button
                        type="button"
                        className="add-btn"
                        onClick={addQuestion}
                        style={{ marginBottom: 18 }}>
                        + Add Question
                    </button>
                </div>
                <button className="submit-btn" type="submit" style={{ marginTop: 20 }}>
                    Create Assessment
                </button>
            </form>
        </div>
    );
}