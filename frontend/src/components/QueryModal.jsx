import React, { useState } from 'react';
import { X, Search, FileText, Link as LinkIcon, Clock, Sparkles, Loader2, Brain } from 'lucide-react';
import { queryKnowledge } from '../api';
// import './QueryModal.css'; // Removed CSS

const QueryModal = ({ item, onClose }) => {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

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
            const data = await queryKnowledge(question, item.id);
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                            <Sparkles size={16} />
                        </div>
                        <h2 className="text-lg font-semibold text-text-primary">Ask AI</h2>
                    </div>
                    <button
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    {/* Item Context */}
                    <div className="bg-bg-secondary/30 p-4 border-b border-gray-100">
                        <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Context Source</div>
                        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase ${item.source_type === 'note' ? 'bg-accent-note text-indigo-600' : 'bg-accent-url text-amber-700'
                                    }`}>
                                    {item.source_type === 'note' ? <FileText size={10} /> : <LinkIcon size={10} />}
                                    {item.source_type}
                                </span>
                                {item.url && (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-text-secondary hover:text-accent-blue truncate flex items-center gap-1">
                                        <LinkIcon size={10} />
                                        {new URL(item.url).hostname}
                                    </a>
                                )}
                            </div>
                            <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                                {item.content}
                            </p>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="p-4 space-y-6">
                        {/* Result Display */}
                        {result && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                                    <div className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                                        <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                                            <Brain size={14} className="text-accent-blue" />
                                            AI Answer
                                        </h3>
                                        <div className="prose prose-sm max-w-none text-text-primary leading-relaxed">
                                            {result.answer}
                                        </div>
                                    </div>

                                    {/* Sources */}
                                    {result.sources && result.sources.length > 0 && (
                                        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                                            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Cited Sources</h4>
                                            <div className="grid gap-2">
                                                {result.sources.map((source, index) => (
                                                    <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 text-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-text-secondary">
                                                                    {index + 1}
                                                                </span>
                                                                <span className="text-xs font-medium text-text-secondary capitalize">{source.source_type}</span>
                                                            </div>
                                                            {source.url && (
                                                                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-blue hover:underline truncate max-w-[150px]">
                                                                    {new URL(source.url).hostname}
                                                                </a>
                                                            )}
                                                        </div>
                                                        <p className="text-text-secondary text-xs leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
                                                            "{source.content && source.content.substring(0, 150)}..."
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="flex flex-col items-center justify-center p-8 text-text-tertiary animate-pulse">
                                <div className="w-10 h-10 bg-accent-blue/10 rounded-full flex items-center justify-center mb-3">
                                    <Sparkles size={20} className="text-accent-blue animate-spin-slow" />
                                </div>
                                <p className="text-sm font-medium">Analyzing content...</p>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Form */}
                <div className="p-4 bg-white border-t border-gray-100 rounded-b-2xl">
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            type="text"
                            className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-accent-blue/30 focus:ring-4 focus:ring-accent-blue/10 rounded-xl py-3 pl-4 pr-12 text-sm text-text-primary placeholder:text-text-tertiary transition-all outline-none shadow-sm"
                            placeholder="Ask a question about this content..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${question.trim() && !loading
                                ? 'bg-accent-blue text-white shadow-md hover:bg-blue-600'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            disabled={loading || !question.trim()}
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default QueryModal;
