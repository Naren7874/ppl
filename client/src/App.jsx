// App.js
import React, { useState, useEffect, useCallback } from 'react';
import NoteList from './components/NoteList';
import RichTextEditor from './components/RichTextEditor';
import SearchBar from './components/SearchBar';
import AIFeaturesPanel from './components/AIFeaturesPanel';
import { getNotes, createNote, updateNote, deleteNote, searchNotes } from './services/noteService';
import { 
  BookOpen, 
  Plus, 
  Menu,
  X,
  Save,
  RotateCcw,
  Pin,
  PinOff
} from 'lucide-react';

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [localNote, setLocalNote] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'

  // Auto-save configuration
  const AUTO_SAVE_DELAY = 2000; // 2 seconds delay after last change
  const FORCE_SAVE_INTERVAL = 30000; // 30 seconds maximum between saves

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile when a note is selected
      if (mobile && selectedNote) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedNote]);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
    fetchNotes();
  }, []);

  // Save recent searches to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && localNote) {
      // Clear any existing timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      // Set new timeout for auto-save
      const timeout = setTimeout(() => {
        handleAutoSave();
      }, AUTO_SAVE_DELAY);

      setAutoSaveTimeout(timeout);

      // Cleanup on unmount or when dependencies change
      return () => clearTimeout(timeout);
    }
  }, [localNote, hasUnsavedChanges]);

  // Force save interval for important changes
  useEffect(() => {
    const forceSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && localNote) {
        handleAutoSave();
      }
    }, FORCE_SAVE_INTERVAL);

    return () => clearInterval(forceSaveInterval);
  }, [hasUnsavedChanges, localNote]);

  // Auto-save on window/tab close or refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        
        // Attempt to save before leaving
        handleAutoSave(true); // Force immediate save
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, localNote]);

  const fetchNotes = async () => {
    try {
      const notesData = await getNotes();
      setNotes(notesData);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleAutoSave = async (immediate = false) => {
    if (!localNote || !hasUnsavedChanges || isSaving) return;
    
    // If not immediate and there's an ongoing save, skip
    if (!immediate && isSaving) return;

    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      let savedNote;
      
      if (localNote.isNew) {
        // This is a new note that needs to be created on the backend
        const { isNew, _id, ...noteData } = localNote;
        savedNote = await createNote(noteData);
        
        // Replace the temporary note with the real one from backend
        setNotes(notes.map(note => 
          note._id === localNote._id ? savedNote : note
        ));
      } else {
        // This is an existing note that needs to be updated
        savedNote = await updateNote(localNote._id, localNote);
        setNotes(notes.map(note => 
          note._id === localNote._id ? savedNote : note
        ));
      }
      
      setSelectedNote(savedNote);
      setLocalNote({...savedNote});
      setHasUnsavedChanges(false);
      setLastSavedTime(new Date());
      setSaveStatus('saved');
      
    } catch (error) {
      console.error('Error auto-saving note:', error);
      setSaveStatus('unsaved');
      // Don't alert user for auto-save errors to avoid interruption
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    // Add to recent searches if query is not empty
    if (query.trim()) {
      setRecentSearches(prev => {
        const filtered = prev.filter(search => search.query !== query);
        const updated = [{ query, timestamp: Date.now(), isPinned: false }, ...filtered];
        return updated.slice(0, 5); // Keep only 5 most recent
      });
    }
    
    if (query.trim() === '') {
      fetchNotes();
    } else {
      try {
        const results = await searchNotes(query);
        setNotes(results);
      } catch (error) {
        console.error('Error searching notes:', error);
      }
    }
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
  };
  
  const handleCreateNote = async () => {
    try {
      // Create a temporary local note first for immediate UI response
      const tempNote = {
        _id: `temp-${Date.now()}`,
        title: 'Untitled Note',
        content: '',
        tags: [],
        isPinned: false,
        isEncrypted: false,
        encryptedContent: '',
        summary: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        isNew: true // Flag to indicate it's a new note
      };
      
      setNotes([tempNote, ...notes]);
      setSelectedNote(tempNote);
      setLocalNote({...tempNote});
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
      
      // Auto-close sidebar on mobile when creating a new note
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleSelectNote = (note) => {
    // If there are unsaved changes, confirm before switching
    if (hasUnsavedChanges && selectedNote) {
      if (window.confirm('You have unsaved changes. Do you want to discard them?')) {
        setSelectedNote(note);
        setLocalNote({...note});
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        
        // Auto-close sidebar on mobile when selecting a note
        if (isMobile) {
          setIsSidebarOpen(false);
        }
      }
    } else {
      setSelectedNote(note);
      setLocalNote({...note});
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      
      // Auto-close sidebar on mobile when selecting a note
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    }
  };

  const handleLocalUpdate = (updatedFields) => {
    if (!localNote) return;
    
    const updatedNote = { ...localNote, ...updatedFields, updatedAt: new Date() };
    setLocalNote(updatedNote);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
    
    // Update the notes list if title changed
    if (updatedFields.title !== undefined) {
      setNotes(notes.map(note => 
        note._id === localNote._id ? { ...note, title: updatedFields.title } : note
      ));
    }
  };

  const handleSaveNote = async () => {
    await handleAutoSave(true); // Force immediate save
  };

  const handleUpdateNote = async (updatedNote) => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const result = await updateNote(updatedNote._id, updatedNote);
      setNotes(notes.map(note => 
        note._id === updatedNote._id ? result : note
      ));
      setSelectedNote(result);
      setLocalNote({...result});
      setHasUnsavedChanges(false);
      setLastSavedTime(new Date());
      setSaveStatus('saved');
      return result;
    } catch (error) {
      console.error('Error updating note:', error);
      setSaveStatus('unsaved');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    // Check if it's a temporary note (not yet saved to backend)
    const isTempNote = noteId.startsWith('temp-');
    
    if (!isTempNote) {
      try {
        await deleteNote(noteId);
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note. Please try again.');
        return;
      }
    }
    
    setNotes(notes.filter(note => note._id !== noteId));
    if (selectedNote && selectedNote._id === noteId) {
      setSelectedNote(null);
      setLocalNote(null);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
    }
  };

  const handleTogglePin = async (noteId) => {
    const note = notes.find(n => n._id === noteId);
    if (note) {
      const updatedNote = { ...note, isPinned: !note.isPinned, updatedAt: new Date() };
      
      // If it's a temporary note, update locally only
      if (noteId.startsWith('temp-')) {
        setNotes(notes.map(n => n._id === noteId ? updatedNote : n));
        if (selectedNote && selectedNote._id === noteId) {
          setSelectedNote(updatedNote);
          setLocalNote(updatedNote);
          setHasUnsavedChanges(true);
          setSaveStatus('unsaved');
        }
      } else {
        // If it's a saved note, update on the backend too
        await handleUpdateNote(updatedNote);
      }
    }
  };

  const handleDiscardChanges = () => {
    if (selectedNote) {
      setLocalNote({...selectedNote});
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
    }
  };

  // Format last saved time for display
  const formatLastSavedTime = () => {
    if (!lastSavedTime) return '';
    
    const now = new Date();
    const diff = now - lastSavedTime;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    
    return lastSavedTime.toLocaleTimeString();
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-2xl bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:relative z-50 md:z-auto
        w-80 md:w-80 flex-shrink-0 h-full transition-transform duration-300 
        bg-white border-r border-gray-200 flex flex-col overflow-hidden
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen size={24} className="text-blue-600" />
              Notes
              {hasUnsavedChanges && (
                <span className="text-xs text-orange-500 bg-orange-100 px-2 py-1 rounded-full">
                  Unsaved
                </span>
              )}
            </h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleCreateNote}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 justify-center"
            >
              <Plus size={16} />
              <span>New Note</span>
            </button>
            
            <button
              onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
              disabled={!selectedNote}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                selectedNote 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <BookOpen size={16} />
              <span className="hidden sm:inline">AI Tools</span>
            </button>
          </div>
          
          {/* <SearchBar 
            onSearch={handleSearch}
            recentSearches={recentSearches}
            onClearRecent={handleClearRecentSearches}
          /> */}
        </div>
        
        <NoteList
          notes={notes}
          selectedNote={selectedNote}
          onSelectNote={handleSelectNote}
          onDeleteNote={handleDeleteNote}
          onTogglePin={handleTogglePin}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
            )}
            
            {localNote && (
              <input
                type="text"
                value={localNote.title}
                onChange={(e) => handleLocalUpdate({ title: e.target.value })}
                className="text-xl font-semibold text-gray-800 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 min-w-0"
                placeholder="Note title"
              />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Save status indicator */}
            {localNote && (
              <div className="text-sm text-gray-500 mr-2 hidden sm:block">
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                    Saving...
                  </span>
                )}
                {saveStatus === 'saved' && lastSavedTime && `Saved ${formatLastSavedTime()}`}
                {saveStatus === 'unsaved' && (
                  <span className="text-orange-500">Unsaved changes</span>
                )}
              </div>
            )}
            
            {hasUnsavedChanges && (
              <button
                onClick={handleDiscardChanges}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                title="Discard changes"
              >
                <RotateCcw size={16} />
                <span className="hidden sm:inline text-sm">Discard</span>
              </button>
            )}
            
            {localNote && (
              <button
                onClick={() => handleTogglePin(localNote._id)}
                className={`p-2 rounded-lg flex items-center gap-1 ${
                  localNote.isPinned 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label={localNote.isPinned ? 'Unpin note' : 'Pin note'}
                title={localNote.isPinned ? 'Unpin note' : 'Pin note'}
              >
                {localNote.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                <span className="hidden sm:inline text-sm">
                  {localNote.isPinned ? 'Unpin' : 'Pin'}
                </span>
              </button>
            )}
            
            {/* Manual save button */}
            {localNote && (
              <button
                onClick={handleSaveNote}
                disabled={!hasUnsavedChanges || isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  hasUnsavedChanges && !isSaving
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save size={16} />
                )}
                <span className="hidden sm:inline">Save</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {localNote ? (
            <RichTextEditor
              note={localNote}
              onChange={handleLocalUpdate}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 p-4">
              <div className="text-center max-w-md">
                <BookOpen size={64} className="mx-auto mb-4 opacity-30 text-blue-500" />
                <h2 className="text-xl font-semibold mb-2">Welcome to Notes</h2>
                <p className="mb-6">Select a note from the sidebar or create a new one to get started</p>
                <button
                  onClick={handleCreateNote}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto shadow-md"
                >
                  <Plus size={18} />
                  Create New Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Features Panel */}
      {isAIPanelOpen && selectedNote && (
        <AIFeaturesPanel
          note={selectedNote}
          onClose={() => setIsAIPanelOpen(false)}
          onUpdateNote={handleUpdateNote}
        />
      )}
    </div>
  );
}

export default App;