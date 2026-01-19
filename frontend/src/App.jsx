import React, { useState, useEffect } from 'react';
import { Brain, Plus, Search, Database, Filter, X, ChevronRight, Settings, MessageSquare, Sparkles } from 'lucide-react';
import IngestForm from './components/IngestForm';
import ItemsList from './components/ItemsList';
import QueryModal from './components/QueryModal';
import { getItems, healthCheck, deleteItem } from './api';

function App() {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiStatus, setApiStatus] = useState('checking');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const fetchItems = async () => {
        try {
            const data = await getItems();
            setItems(data);
            setFilteredItems(data);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkApiHealth = async () => {
        try {
            await healthCheck();
            setApiStatus('healthy');
        } catch (error) {
            setApiStatus('error');
        }
    };

    useEffect(() => {
        checkApiHealth();
        fetchItems();
        const healthInterval = setInterval(checkApiHealth, 30000);
        return () => clearInterval(healthInterval);
    }, []);


    useEffect(() => {
        let filtered = items;

        if (filterType === 'note') {
            filtered = filtered.filter(item => item.source_type === 'note');
        } else if (filterType === 'url') {
            filtered = filtered.filter(item => item.source_type === 'url');
        } else if (filterType === 'both') {
            filtered = filtered.filter(item =>
                item.source_type === 'note' && item.url && item.url.trim().length > 0
            );
        }

        if (searchQuery.trim()) {
            filtered = filtered.filter(item =>
                item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.url && item.url.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredItems(filtered);
    }, [items, filterType, searchQuery]);

    const handleIngestSuccess = () => {
        fetchItems();
        setShowAddForm(false);
    };

    const handleDelete = async (itemId) => {
        try {
            await deleteItem(itemId);
            fetchItems();
        } catch (error) {
            alert('Failed to delete item: ' + error.message);
        }
    };

    const clearFilters = () => {
        setFilterType('all');
        setSearchQuery('');
    };

    return (
        <div className="flex h-screen bg-bg-primary font-sans text-text-primary overflow-hidden selection:bg-accent-note selection:text-text-primary">
            <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-bg-secondary border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
                <div className="p-5 border-b border-gray-200/50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-text-primary border border-gray-100">
                        <Brain size={18} />
                    </div>
                    <div>
                        <h1 className="font-serif font-bold text-sm tracking-tight text-text-primary">Knowledge Inbox</h1>
                        <p className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">AI-Powered</p>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md bg-white shadow-sm text-sm font-medium text-text-primary">
                        <Database size={16} className="text-text-secondary" />
                        <span>Inbox</span>
                        <span className="ml-auto text-[10px] font-medium text-text-tertiary bg-gray-100 px-1.5 py-0.5 rounded-full">{items.length}</span>
                    </button>
                    <div className="mt-6 mb-2 px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                        Collections
                    </div>
                    <div className="px-3 space-y-1">
                        {['Brainstorming', 'Project Turium', 'Research', 'Personal'].map((tag, i) => (
                            <button key={i} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-text-secondary hover:bg-gray-100/80 hover:text-text-primary text-xs transition-colors group">
                                <div className={`w-1.5 h-1.5 rounded-full ${['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'][i]}`}></div>
                                <span>{tag}</span>
                            </button>
                        ))}
                    </div>
                    <div className="mt-8 mx-3 p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl -mr-8 -mt-8"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 bg-black/10 rounded-full blur-lg -ml-6 -mb-6"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-yellow-300" />
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Daily Insight</span>
                            </div>
                            <p className="text-xs font-medium leading-relaxed opacity-95">
                                "Knowledge is not just power, it's potential."
                            </p>
                            <button className="mt-3 w-full py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors">
                                Inspire Me
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-200/50">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-100/50">
                        <div className={`w-2 h-2 rounded-full ${apiStatus === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-[11px] font-medium text-text-secondary">
                            {apiStatus === 'healthy' ? 'System Online' : 'Connecting...'}
                        </span>
                    </div>
                </div>
            </aside>

           
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                
                <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <Filter size={18} className={!sidebarOpen ? 'rotate-180' : ''} />
                        </button>
                        <div>
                            <h2 className="text-lg font-semibold text-text-primary">My Board</h2>
                            <p className="text-xs text-text-tertiary">{filteredItems.length} items</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-blue transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-1.5 bg-gray-50 border border-transparent focus:bg-white focus:border-accent-blue/30 focus:ring-4 focus:ring-accent-blue/10 rounded-md text-sm outline-none transition-all w-64"
                            />
                        </div>
                        <button
                            className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                            onClick={() => setShowAddForm(!showAddForm)}
                        >
                            <Plus size={16} />
                            <span>New</span>
                        </button>
                    </div>
                </header>

               
                <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                    <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mr-2">Filter By</span>
                    {[
                        { id: 'all', label: 'All Items' },
                        { id: 'note', label: 'Notes' },
                        { id: 'url', label: 'Web Pages' },
                        { id: 'both', label: 'Notes + URL' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilterType(f.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filterType === f.id
                                ? 'bg-text-primary text-white shadow-md'
                                : 'bg-gray-50 text-text-secondary hover:bg-gray-100'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                    {(filterType !== 'all' || searchQuery) && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto text-xs text-text-tertiary hover:text-red-500 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto bg-bg-primary relative">
                    <div className="relative z-10 p-6 md:p-8">
                        {!searchQuery && filterType === 'all' && (
                            <div className="max-w-6xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-note/30 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                                    <div className="relative z-10">
                                        <h2 className="text-2xl font-serif font-bold text-text-primary mb-1">
                                            Knowledge Dashboard
                                        </h2>
                                        <p className="text-text-secondary mb-6 max-w-lg">
                                            Your personal knowledge base is growing. You have {items.length} items saved.
                                            Ask AI to connect the dots.
                                        </p>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-bg-primary rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                                                <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">Total Notes</div>
                                                <div className="text-2xl font-bold text-accent-blue font-serif">
                                                    {items.filter(i => i.source_type === 'note').length}
                                                </div>
                                            </div>
                                            <div className="bg-bg-primary rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                                                <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">Web Pages</div>
                                                <div className="text-2xl font-bold text-amber-500 font-serif">
                                                    {items.filter(i => i.source_type === 'url').length}
                                                </div>
                                            </div>
                                            <div className="bg-bg-primary rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow md:col-span-2 flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">Quick Action</div>
                                                    <div className="text-sm font-medium text-text-primary">Ready to capture?</div>
                                                </div>
                                                <button
                                                    onClick={() => setShowAddForm(true)}
                                                    className="bg-accent-blue text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-600 transition-colors"
                                                >
                                                    Add Item +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showAddForm && (
                            <div className="max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <h3 className="text-sm font-semibold text-text-secondary">Quick Add</h3>
                                    <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                                </div>
                                <IngestForm onSuccess={handleIngestSuccess} />
                            </div>
                        )}

                        <div className="max-w-6xl mx-auto pb-20">
                            <ItemsList
                                items={filteredItems}
                                loading={loading}
                                onItemClick={setSelectedItem}
                                onDelete={handleDelete}
                            />
                        </div>
                    </div>
                </div>
            </main>

            
            {selectedItem && (
                <QueryModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
        </div>
    );
}

export default App;
