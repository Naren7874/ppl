// components/RichTextEditor.js
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Undo,
  Redo,
  Type,
  Lock,
  Unlock,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  Palette,
  Strikethrough,
  Superscript,
  Subscript,
  Indent,
  Outdent,
  Minus,
  Table,
  CornerDownLeft
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import Typo from 'typo-js';

const RichTextEditor = ({ note, onChange }) => {
  const editorRef = useRef(null);
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    fontSize: '3',
    alignment: 'left',
    list: null, // 'ul' or 'ol'
    format: 'p' // 'p', 'h1', 'h2', etc.
  });
  const [isEncrypted, setIsEncrypted] = useState(note.isEncrypted || false);
  const [password, setPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // Load Typo.js dictionary
  const [dictionary, setDictionary] = useState(null);

  // Initialize editor content when note changes
  useEffect(() => {
    if (editorRef.current) {
      if (note.isEncrypted && note.encryptedContent) {
        // Note is encrypted, don't show content
        setIsEncrypted(true);
        editorRef.current.innerHTML = '';
      } else if (note.content && !note.isEncrypted) {
        // Only update if content is different to avoid cursor jumping
        if (editorRef.current.innerHTML !== note.content) {
          editorRef.current.innerHTML = note.content;
        }
        setIsEncrypted(false);
      }
    }
  }, [note._id, note.content, note.isEncrypted, note.encryptedContent]);

  useEffect(() => {
    fetch('/dictionaries/en_US.aff')
      .then(res => res.text())
      .then(affData => {
        fetch('/dictionaries/en_US.dic')
          .then(res => res.text())
          .then(dicData => {
            const dict = new Typo('en_US', affData, dicData, { platform: 'browser' });
            setDictionary(dict);
          });
      });
  }, []);

  const handleExec = useCallback((command, value = null) => {
    if (!editorRef.current || isEncrypted) return;
    
    // Save current selection
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    
    // Execute command
    document.execCommand(command, false, value || undefined);
    
    // Restore focus and selection
    editorRef.current.focus();
    if (range && selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    updateContent();
    setTimeout(updateActiveStates, 10);
  }, [isEncrypted]);

  const updateContent = useCallback(() => {
    if (editorRef.current && onChange && !isEncrypted) {
      let content = editorRef.current.innerHTML;
      onChange({ ...note, content });
    }
  }, [note, onChange, isEncrypted]);

  const updateActiveStates = useCallback(() => {
    if (!editorRef.current || isEncrypted) return;
    
    // Check which formatting options are active
    const formatBlock = document.queryCommandValue('formatBlock') || 'p';
    
    setActiveStates(prev => ({
      ...prev,
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikethrough'),
      fontSize: document.queryCommandValue('fontSize') || '3',
      format: formatBlock.toLowerCase()
    }));
  }, [isEncrypted]);

  const handleInput = useCallback(() => {
    if (isEncrypted) return;
    updateContent();
    updateActiveStates();
  }, [updateContent, updateActiveStates, isEncrypted]);

  const handleKeyDown = useCallback((e) => {
    if (isEncrypted) {
      e.preventDefault();
      return;
    }
    
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleExec('bold');
          break;
        case 'i':
          e.preventDefault();
          handleExec('italic');
          break;
        case 'u':
          e.preventDefault();
          handleExec('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            handleExec('redo');
          } else {
            e.preventDefault();
            handleExec('undo');
          }
          break;
        case 'y':
          e.preventDefault();
          handleExec('redo');
          break;
        case 'k':
          e.preventDefault();
          setShowLinkDialog(true);
          break;
        default:
          // Allow other keyboard shortcuts to work normally
          return;
      }
    }
    
    // Handle Enter key to create proper paragraphs
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExec('formatBlock', '<p>');
    }
  }, [handleExec, isEncrypted]);

  const handlePaste = useCallback((e) => {
    if (isEncrypted) {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    
    // Get plain text from clipboard
    const text = e.clipboardData.getData('text/plain');
    
    // Insert text at current cursor position
    document.execCommand('insertText', false, text);
    
    updateContent();
  }, [updateContent, isEncrypted]);

  const handleAlignmentChange = useCallback((alignment) => {
    handleExec('justify' + alignment.charAt(0).toUpperCase() + alignment.slice(1));
    setActiveStates(prev => ({ ...prev, alignment }));
  }, [handleExec]);

  const handleFormatChange = useCallback((format) => {
    handleExec('formatBlock', format);
    setActiveStates(prev => ({ ...prev, format }));
  }, [handleExec]);

  const handleListChange = useCallback((listType) => {
    handleExec(listType === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
    setActiveStates(prev => ({ ...prev, list: listType }));
  }, [handleExec]);

  const handleFocus = useCallback(() => {
    if (isEncrypted) return;
    setIsFocused(true);
  }, [isEncrypted]);

  const handleBlur = useCallback(() => {
    if (isEncrypted) return;
    setIsFocused(false);
    updateContent();
  }, [updateContent, isEncrypted]);

  const encryptNote = useCallback(() => {
    if (!password) return;
    
    const encryptedContent = CryptoJS.AES.encrypt(note.content, password).toString();
    onChange({
      ...note,
      content: '',
      encryptedContent,
      isEncrypted: true
    });
    setIsEncrypted(true);
    setShowPasswordDialog(false);
    setPassword('');
  }, [note, password, onChange]);

  const decryptNote = useCallback(() => {
    if (!password) return;
    
    try {
      const decryptedBytes = CryptoJS.AES.decrypt(note.encryptedContent, password);
      const decryptedContent = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedContent) {
        alert('Incorrect password');
        return;
      }
      
      onChange({
        ...note,
        content: decryptedContent,
        encryptedContent: '',
        isEncrypted: false
      });
      setIsEncrypted(false);
      setShowPasswordDialog(false);
      setPassword('');
    } catch (error) {
      alert('Incorrect password');
    }
  }, [note, password, onChange]);

  const insertLink = useCallback(() => {
    if (linkUrl) {
      handleExec('createLink', linkUrl);
    }
    setShowLinkDialog(false);
    setLinkUrl('');
  }, [handleExec, linkUrl]);

  const removeLink = useCallback(() => {
    handleExec('unlink');
    setShowLinkDialog(false);
  }, [handleExec]);

  const changeColor = useCallback((type, color) => {
    handleExec(type, color);
    if (type === 'foreColor') setTextColor(color);
    if (type === 'backColor') setBackgroundColor(color);
  }, [handleExec]);

  const insertImage = useCallback(() => {
    if (imageUrl) {
      handleExec('insertImage', imageUrl);
    }
    setShowImageDialog(false);
    setImageUrl('');
  }, [handleExec, imageUrl]);

  const insertTable = useCallback(() => {
    const rows = prompt('Number of rows:', '2');
    const cols = prompt('Number of columns:', '2');
    
    if (rows && cols) {
      let tableHTML = '<table style="border-collapse: collapse; width: 100%;">';
      for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < cols; j++) {
          tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">&nbsp;</td>`;
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</table>';
      
      handleExec('insertHTML', tableHTML);
    }
  }, [handleExec]);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (isFocused && !isEncrypted) {
        updateActiveStates();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [updateActiveStates, isFocused, isEncrypted]);

  // Set default content if empty
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML.trim() && !isEncrypted) {
      editorRef.current.innerHTML = '<p><br></p>';
    }
  }, [isEncrypted]);

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 rounded-t-lg p-3">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting Group */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3">
            <button
              onClick={() => handleExec('bold')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
                activeStates.bold ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              } ${isEncrypted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Bold (Ctrl+B)"
              type="button"
            >
              <Bold size={16} />
            </button>
            
            <button
              onClick={() => handleExec('italic')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
                activeStates.italic ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              } ${isEncrypted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Italic (Ctrl+I)"
              type="button"
            >
              <Italic size={16} />
            </button>
            
            <button
              onClick={() => handleExec('underline')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
                activeStates.underline ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              } ${isEncrypted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Underline (Ctrl+U)"
              type="button"
            >
              <Underline size={16} />
            </button>
            
            <button
              onClick={() => handleExec('strikethrough')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
                activeStates.strikethrough ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              } ${isEncrypted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Strikethrough"
              type="button"
            >
              <Strikethrough size={16} />
            </button>
            
            <button
              onClick={() => handleExec('superscript')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Superscript"
              type="button"
            >
              <Superscript size={16} />
            </button>
            
            <button
              onClick={() => handleExec('subscript')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Subscript"
              type="button"
            >
              <Subscript size={16} />
            </button>
          </div>

          {/* Text Format */}
          <div className="flex items-center gap-2 border-r border-gray-300 pr-3">
            <select
              value={activeStates.format}
              onChange={(e) => handleFormatChange(e.target.value)}
              disabled={isEncrypted}
              className={`px-2 py-1 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="h5">Heading 5</option>
              <option value="h6">Heading 6</option>
              <option value="blockquote">Quote</option>
              <option value="pre">Code</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-2 border-r border-gray-300 pr-3">
            <Type size={16} className="text-gray-500" />
            <select
              value={activeStates.fontSize}
              onChange={(e) => handleExec('fontSize', e.target.value)}
              disabled={isEncrypted}
              className={`px-2 py-1 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <option value="1">Small</option>
              <option value="2">Medium</option>
              <option value="3">Normal</option>
              <option value="4">Large</option>
              <option value="5">X-Large</option>
              <option value="6">XX-Large</option>
              <option value="7">Huge</option>
            </select>
          </div>

          {/* Alignment Group */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3">
            <button
              onClick={() => handleAlignmentChange('left')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
                activeStates.alignment === 'left' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              } ${isEncrypted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Align Left"
              type="button"
            >
              <AlignLeft size={16} />
            </button>
            
            <button
              onClick={() => handleAlignmentChange('center')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
                activeStates.alignment === 'center' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              } ${isEncrypted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Align Center"
              type="button"
            >
              <AlignCenter size={16} />
            </button>
            
            <button
              onClick={() => handleAlignmentChange('right')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
                activeStates.alignment === 'right' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              } ${isEncrypted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Align Right"
              type="button"
            >
              <AlignRight size={16} />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3">
            <button
              onClick={() => handleListChange('ul')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
                activeStates.list === 'ul' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              } ${isEncrypted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Bullet List"
              type="button"
            >
              <List size={16} />
            </button>
            
            <button
              onClick={() => handleListChange('ol')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
                activeStates.list === 'ol' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              } ${isEncrypted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Numbered List"
              type="button"
            >
              <ListOrdered size={16} />
            </button>
            
            <button
              onClick={() => handleExec('outdent')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Outdent"
              type="button"
            >
              <Outdent size={16} />
            </button>
            
            <button
              onClick={() => handleExec('indent')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Indent"
              type="button"
            >
              <Indent size={16} />
            </button>
          </div>

          {/* Insert Group */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3">
            <button
              onClick={() => setShowLinkDialog(true)}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Insert Link (Ctrl+K)"
              type="button"
            >
              <Link size={16} />
            </button>
            
            <button
              onClick={() => setShowImageDialog(true)}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Insert Image"
              type="button"
            >
              <Image size={16} />
            </button>
            
            <button
              onClick={insertTable}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Insert Table"
              type="button"
            >
              <Table size={16} />
            </button>
            
            <button
              onClick={() => handleExec('insertHorizontalRule')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Insert Horizontal Line"
              type="button"
            >
              <Minus size={16} />
            </button>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3 relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Text Color"
              type="button"
            >
              <Palette size={16} />
            </button>
            
            {showColorPicker && !isEncrypted && (
              <div className="absolute top-full left-0 mt-1 p-3 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="mb-2">
                  <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => changeColor('foreColor', e.target.value)}
                    className="w-full h-8 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Background Color</label>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => changeColor('backColor', e.target.value)}
                    className="w-full h-8 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Undo/Redo Group */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-3">
            <button
              onClick={() => handleExec('undo')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Undo (Ctrl+Z)"
              type="button"
            >
              <Undo size={16} />
            </button>
            
            <button
              onClick={() => handleExec('redo')}
              disabled={isEncrypted}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 ${
                isEncrypted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
              type="button"
            >
              <Redo size={16} />
            </button>
          </div>

          {/* Encryption */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasswordDialog(true)}
              className={`p-2 rounded-lg transition-colors ${
                isEncrypted 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isEncrypted ? 'Note is encrypted' : 'Encrypt note'}
              type="button"
            >
              {isEncrypted ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        {isEncrypted ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200 max-w-md w-full">
              <Lock size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Note Encrypted</h3>
              <p className="text-gray-600 mb-4">This note is protected with encryption</p>
              <button
                onClick={() => setShowPasswordDialog(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Decrypt Note
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable={!isEncrypted}
            onInput={handleInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
            spellCheck={true}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="min-h-full p-6 focus:outline-none text-gray-800 leading-relaxed prose max-w-none"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '16px',
              lineHeight: '1.6'
            }}
            suppressContentEditableWarning={true}
          />
        )}
      </div>

      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xl bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {isEncrypted ? 'Decrypt Note' : 'Encrypt Note'}
            </h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoComplete="current-password"
            />
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPassword('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
              >
                Cancel
              </button>
              
              <button
                onClick={isEncrypted ? decryptNote : encryptNote}
                disabled={!password}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                {isEncrypted ? 'Decrypt' : 'Encrypt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xl bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Insert Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
              >
                Cancel
              </button>
              
              <button
                onClick={removeLink}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                type="button"
              >
                Remove Link
              </button>
              
              <button
                onClick={insertLink}
                disabled={!linkUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xl bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Insert Image</h3>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowImageDialog(false);
                  setImageUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
              >
                Cancel
              </button>
              
              <button
                onClick={insertImage}
                disabled={!imageUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;