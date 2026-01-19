import React, { useState } from 'react';
import { FileText, Link as LinkIcon, Plus } from 'lucide-react';
import { ingestContent } from '../api';

const IngestForm = ({ onSuccess }) => {
    const [content, setContent] = useState('');
    const [noteUrl, setNoteUrl] = useState('');
    const [sourceType, setSourceType] = useState('note');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            setError('Content cannot be empty');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await ingestContent(content, sourceType, sourceType === 'note' ? noteUrl : null);
            setContent('');
            setNoteUrl('');
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-notion p-1 mb-6 border border-gray-100">
            <div className="flex border-b border-gray-100 bg-bg-secondary/30 rounded-t-lg">
                <button
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors duration-200 relative ${sourceType === 'note'
                            ? 'text-accent-blue bg-white shadow-sm rounded-t-lg z-10'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                    onClick={() => setSourceType('note')}
                >
                    <FileText size={16} />
                    <span>Note</span>
                    {sourceType === 'note' && <div className="absolute top-0 left-0 w-full h-0.5 bg-accent-blue rounded-t-lg"></div>}
                </button>
                <button
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors duration-200 relative ${sourceType === 'url'
                            ? 'text-accent-blue bg-white shadow-sm rounded-t-lg z-10'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                    onClick={() => setSourceType('url')}
                >
                    <LinkIcon size={16} />
                    <span>URL</span>
                    {sourceType === 'url' && <div className="absolute top-0 left-0 w-full h-0.5 bg-accent-blue rounded-t-lg"></div>}
                </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 bg-white rounded-b-xl">
                <div className="mb-3">
                    <textarea
                        className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-accent-blue/30 focus:ring-4 focus:ring-accent-blue/10 rounded-lg p-3 text-sm text-text-primary placeholder:text-text-tertiary transition-all resize-y min-h-[100px] outline-none"
                        placeholder={
                            sourceType === 'note'
                                ? 'Write your note here...'
                                : 'Enter website URL (e.g. https://example.com)...'
                        }
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {sourceType === 'note' && (
                    <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <input
                            type="text"
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-accent-blue/30 focus:ring-4 focus:ring-accent-blue/10 rounded-lg p-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all outline-none"
                            placeholder="Add a reference URL (optional)"
                            value={noteUrl}
                            onChange={(e) => setNoteUrl(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        {error}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className={`btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-md shadow-blue-500/20 transition-all ${loading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-accent-blue hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5'
                            }`}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                <span>Save to Inbox</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default IngestForm;
