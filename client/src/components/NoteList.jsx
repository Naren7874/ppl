// components/NoteList.js
import React, { useState } from 'react';
import { Pin, Trash2, FileText, Clock, Search, Plus, Filter } from 'lucide-react';

const NoteList = ({ notes, selectedNote, onSelectNote, onDeleteNote, onTogglePin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPinned, setFilterPinned] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const truncateContent = (content, length = 60) => {
    if (!content) return 'No content';
    // Create a temporary element to parse HTML and extract text
    const div = document.createElement('div');
    div.innerHTML = content;
    const text = div.textContent || div.innerText || '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  // Filter notes based on search term and pinned filter
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPinned = filterPinned ? note.isPinned : true;
    return matchesSearch && matchesPinned;
  });

  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const otherNotes = filteredNotes.filter(note => !note.isPinned);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with search and filters */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
          </span>
          
          <button
            onClick={() => setFilterPinned(!filterPinned)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              filterPinned 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter size={14} />
            <span>{filterPinned ? 'Pinned only' : 'All notes'}</span>
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {/* Pinned Notes Section */}
        {pinnedNotes.length > 0 && (
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200">
            <div className="flex items-center gap-2 text-amber-800">
              <Pin size={14} className="fill-amber-500" />
              <span className="text-xs font-semibold">PINNED NOTES</span>
              <span className="text-xs bg-amber-200 px-2 py-0.5 rounded-full">
                {pinnedNotes.length}
              </span>
            </div>
          </div>
        )}
        
        {pinnedNotes.map(note => (
          <NoteItem 
            key={note._id} 
            note={note} 
            selectedNote={selectedNote} 
            onSelectNote={onSelectNote} 
            onDeleteNote={onDeleteNote} 
            onTogglePin={onTogglePin} 
            formatDate={formatDate} 
            truncateContent={truncateContent} 
          />
        ))}
        
        {/* Other Notes Section */}
        {otherNotes.length > 0 && pinnedNotes.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2 text-gray-600">
              <FileText size={14} />
              <span className="text-xs font-semibold">OTHER NOTES</span>
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                {otherNotes.length}
              </span>
            </div>
          </div>
        )}
        
        {otherNotes.map(note => (
          <NoteItem 
            key={note._id} 
            note={note} 
            selectedNote={selectedNote} 
            onSelectNote={onSelectNote} 
            onDeleteNote={onDeleteNote} 
            onTogglePin={onTogglePin} 
            formatDate={formatDate} 
            truncateContent={truncateContent} 
          />
        ))}
        
        {/* Empty state */}
        {filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl mb-5">
              <Search size={40} className="text-blue-400 mx-auto" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="text-gray-500 text-sm max-w-xs">
              {searchTerm 
                ? `No notes match "${searchTerm}". Try a different search term.`
                : 'Create your first note to get started'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const NoteItem = ({ note, selectedNote, onSelectNote, onDeleteNote, onTogglePin, formatDate, truncateContent }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Generate a subtle gradient based on note content (for visual appeal)
  const getNoteColor = (id) => {
    const colors = [
      'from-blue-50 to-indigo-50',
      'from-green-50 to-teal-50',
      'from-amber-50 to-orange-50',
      'from-purple-50 to-pink-50',
      'from-cyan-50 to-blue-50'
    ];
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <div
      className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-300 group ${
        selectedNote && selectedNote._id === note._id
          ? `bg-gradient-to-r ${getNoteColor(note._id)} border-l-4 border-blue-400 shadow-sm`
          : 'hover:bg-gray-50'
      }`}
      onClick={() => onSelectNote(note)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-800 truncate flex-1 pr-2">
          {note.title || 'Untitled Note'}
        </h3>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note._id);
            }}
            className={`p-1.5 rounded-lg transition-all transform ${
              note.isPinned 
                ? 'text-amber-600 bg-amber-100 shadow-sm' 
                : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
            } ${isHovered || note.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <Pin size={14} className={note.isPinned ? 'fill-amber-500' : ''} />
          </button>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
        {truncateContent(note.content)}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {note.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs rounded-full font-medium mb-1"
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mb-1">
              +{note.tags.length - 2}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center text-xs text-gray-400">
            <Clock size={12} className="mr-1" />
            {formatDate(note.updatedAt)}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNote(note._id);
            }}
            className={`p-1.5 hover:bg-red-100 rounded-lg text-red-400 hover:text-red-600 transition-all transform ${
              isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteList;