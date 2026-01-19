import React, { useState, useEffect } from 'react';
import { Search, FileText, Link as LinkIcon, Clock, X } from 'lucide-react';
import { queryKnowledge } from '../api';
import './QueryInterface.css';

const QueryInterface = ({ selectedItem }) => {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    
    useEffect(() => {
        if (selectedItem) {
            setQuestion('');
            setResult(null);
            setError('');
        }
    }, [selectedItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!question.trim()) {
            setError('Please enter a question');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await queryKnowledge(question);
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const clearSelection = () => {
        setQuestion('');
        setResult(null);
        setError('');
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="query-interface">
            {/* Selected Item Context */}
            {selectedItem && (
                <div className="selected-context card">
                    <div className="context-header">
                        <span className="context-label">Querying:</span>
                        <button className="clear-btn" onClick={clearSelection}>
                            <X size={16} />
                        </button>
                    </div>
                    <div className="context-item">
                        <span className={`badge badge-${selectedItem.source_type}`}>
                            {selectedItem.source_type === 'note' ? (
                                <FileText size={12} />
                            ) : (
                                <LinkIcon size={12} />
                            )}
                            {selectedItem.source_type}
                        </span>
                        <p className="context-preview">{selectedItem.content.substring(0, 150)}...</p>
                    </div>
                </div>
            )}

            {/* Query Form */}
            <div className="query-form card">
                <form onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                        <Search size={18} className="input-icon" />
                        <input
                            type="text"
                            className="input query-input"
                            placeholder={selectedItem ? "Ask about this item..." : "Ask anything from your knowledge base..."}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                <span>Searching...</span>
                            </>
                        ) : (
                            <>
                                <Search size={18} />
                                <span>Search</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Answer Display */}
            {result && (
                <div className="answer-section card fade-in">
                    <div className="answer-header">
                        <h3 className="answer-title">Answer</h3>
                    </div>

                    <div className="answer-content">
                        <p>{result.answer}</p>
                    </div>

                    {result.sources && result.sources.length > 0 && (
                        <div className="sources-section">
                            <h4 className="sources-title">Sources ({result.sources.length})</h4>
                            <div className="sources-list">
                                {result.sources.map((source, index) => (
                                    <div key={index} className="source-item">
                                        <div className="source-header">
                                            <span className={`badge badge-${source.source_type}`}>
                                                {source.source_type === 'note' ? (
                                                    <FileText size={12} />
                                                ) : (
                                                    <LinkIcon size={12} />
                                                )}
                                                Source {index + 1}
                                            </span>
                                            {source.timestamp && (
                                                <span className="source-time">
                                                    <Clock size={12} />
                                                    {formatDate(source.timestamp)}
                                                </span>
                                            )}
                                        </div>

                                        {source.url && (
                                            <div className="source-url">
                                                <LinkIcon size={14} />
                                                <a href={source.url} target="_blank" rel="noopener noreferrer">
                                                    {new URL(source.url).hostname}
                                                </a>
                                            </div>
                                        )}

                                        <p className="source-content">{source.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QueryInterface;
