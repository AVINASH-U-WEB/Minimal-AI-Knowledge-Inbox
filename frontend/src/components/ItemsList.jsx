import React from 'react';
import { FileText, Link as LinkIcon, Clock, Trash2 } from 'lucide-react';

const ItemsList = ({ items, loading, onItemClick, onDelete }) => {
    const [, setTick] = React.useState(0);
    React.useEffect(() => {
        const timer = setInterval(() => {
            setTick(t => t + 1);
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Invalid date';

        const now = new Date();
        const diffMs = now - date;
        if (diffMs < 0) return 'Just now';

        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const handleDelete = (e, itemId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this item?')) {
            onDelete(itemId);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-text-tertiary">
                <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-text-secondary font-medium">No items yet</p>
                <p className="text-text-tertiary text-sm mt-1">Add your first note or URL to get started</p>
            </div>
        );
    }

    return (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4 pb-20">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="break-inside-avoid bg-white rounded-xl shadow-notion hover:shadow-lg transition-all duration-200 p-4 border border-transparent hover:border-accent-blue/20 group relative cursor-pointer mb-4"
                    onClick={() => onItemClick(item)}
                >
                    <div className="flex justify-between items-start mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase ${item.source_type === 'note'
                            ? 'bg-accent-note text-indigo-600'
                            : 'bg-accent-url text-amber-700'
                            }`}>
                            {item.source_type === 'note' ? <FileText size={10} /> : <LinkIcon size={10} />}
                            {item.source_type === 'url' ? 'Web Page' : 'Note'}
                        </span>

                        <button
                            className="bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                            onClick={(e) => handleDelete(e, item.id)}
                            title="Delete item"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                    <div className="mb-4">
                        {item.source_type === 'url' ? (
                            <div className="py-3 flex items-center">
                                <span className="bg-gray-50 text-text-tertiary text-[10px] px-2 py-1 rounded font-medium border border-gray-100">
                                    CONTENT INDEXED FOR AI
                                </span>
                            </div>
                        ) : (
                            <p className="text-text-primary text-sm leading-relaxed line-clamp-4 font-normal">
                                {item.content}
                            </p>
                        )}
                    </div>
                    {item.url && (
                        <div className="mb-3 pt-3 border-t border-gray-50">
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 text-xs text-accent-blue hover:underline truncate"
                            >
                                <LinkIcon size={10} />
                                <span className="truncate font-medium">
                                    {item.source_type === 'note' ? 'Reference Link' : new URL(item.url).hostname}
                                </span>
                                {item.source_type === 'note' && (
                                    <span className="text-text-tertiary font-normal truncate ml-1">
                                        ({new URL(item.url).hostname})
                                    </span>
                                )}
                            </a>
                        </div>
                    )}
                    <div className="flex justify-between items-center mt-auto pt-2">
                        <span className="flex items-center gap-1 text-[10px] text-text-tertiary font-medium">
                            <Clock size={10} />
                            {formatDate(item.timestamp)}
                        </span>
                        <span className="text-[10px] font-medium text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to query →
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ItemsList;
