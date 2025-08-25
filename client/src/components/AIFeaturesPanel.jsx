// components/AIFeaturesPanel.js
import React, { useState } from 'react';
import { X, Sparkles, CheckCircle, Languages, BookOpen, FileText, Tag, CheckSquare, Zap } from 'lucide-react';
import { 
  generateGlossary, 
  generateSummary, 
  generateTags, 
  checkGrammar, 
  translateText 
} from '../services/aiService';

const AIFeaturesPanel = ({ note, onClose, onUpdateNote }) => {
  const [activeTab, setActiveTab] = useState('glossary');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState({});
  const [targetLanguage, setTargetLanguage] = useState('Spanish');

  const tabConfig = {
    glossary: { icon: BookOpen, color: 'purple' },
    summary: { icon: FileText, color: 'blue' },
    tags: { icon: Tag, color: 'green' },
    grammar: { icon: CheckSquare, color: 'red' },
    translate: { icon: Languages, color: 'indigo' },
  };

  const handleAIAction = async (action) => {
    setIsProcessing(true);
    try {
      let result;
      
      switch (action) {
        case 'glossary':
          result = await generateGlossary(note.content);
          setResults(prev => ({ ...prev, glossary: result }));
          break;
          
        case 'summary':
          result = await generateSummary(note.content);
          setResults(prev => ({ ...prev, summary: result.summary }));
          onUpdateNote({ ...note, summary: result.summary });
          break;
          
        case 'tags':
          result = await generateTags(note.content);
          setResults(prev => ({ ...prev, tags: result }));
          onUpdateNote({ ...note, tags: result });
          break;
          
        case 'grammar':
          result = await checkGrammar(note.content);
          setResults(prev => ({ ...prev, grammar: result }));
          break;
          
        case 'translate':
          result = await translateText(note.content, targetLanguage);
          setResults(prev => ({ ...prev, translation: result.translatedText }));
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to perform ${action} action`);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyGlossary = () => {
    if (!results.glossary) return;
    
    let content = note.content;
    results.glossary.forEach(({ term }) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      content = content.replace(regex, 
        `<span class="glossary-term" data-term="${term.toLowerCase()}" 
         style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; cursor: help; border: 1px solid #e5e7eb; font-weight: 500;">$&</span>`
      );
    });
    
    onUpdateNote({ ...note, content });
  };

  const TabIcon = tabConfig[activeTab]?.icon || Sparkles;
  const tabColor = tabConfig[activeTab]?.color || 'blue';

  return (
    <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white border-l border-gray-200 shadow-xl z-40 animate-slide-in-right overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${tabColor}-100`}>
                <TabIcon className={`h-5 w-5 text-${tabColor}-600`} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">AI Assistant</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {Object.entries(tabConfig).map(([key, { icon: Icon, color }]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  activeTab === key
                    ? `bg-${color}-100 text-${color}-700 shadow-sm`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={16} />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto bg-gray-50">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <Zap className="absolute inset-0 m-auto h-6 w-6 text-blue-600 animate-pulse" />
              </div>
              <span className="mt-4 text-gray-600 font-medium">Processing your content...</span>
              <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
            </div>
          ) : (
            <>
              {activeTab === 'glossary' && (
                <div>
                  <button
                    onClick={() => handleAIAction('glossary')}
                    className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 font-medium"
                  >
                    <Sparkles size={18} />
                    Generate Glossary Terms
                  </button>
                  
                  {results.glossary && (
                    <>
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 mb-3 text-lg flex items-center gap-2">
                          <BookOpen size={18} />
                          Key Terms Identified
                        </h3>
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                          {results.glossary.map((item, index) => (
                            <div key={index} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              <div className="font-medium text-purple-700 mb-1">{item.term}</div>
                              <div className="text-sm text-gray-600">{item.definition}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={applyGlossary}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-medium"
                      >
                        Highlight Terms in Note
                      </button>
                    </>
                  )}
                </div>
              )}
              
              {activeTab === 'summary' && (
                <div>
                  <button
                    onClick={() => handleAIAction('summary')}
                    className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 font-medium"
                  >
                    <Sparkles size={18} />
                    Generate Summary
                  </button>
                  
                  {results.summary && (
                    <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-semibold text-gray-800 mb-3 text-lg flex items-center gap-2">
                        <FileText size={18} />
                        Document Summary
                      </h3>
                      <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg">{results.summary}</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'tags' && (
                <div>
                  <button
                    onClick={() => handleAIAction('tags')}
                    className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 font-medium"
                  >
                    <Sparkles size={18} />
                    Suggest Tags
                  </button>
                  
                  {results.tags && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 text-lg flex items-center gap-2">
                        <Tag size={18} />
                        Suggested Tags
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-white rounded-xl border border-gray-200">
                        {results.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium shadow-sm"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => onUpdateNote({ ...note, tags: results.tags })}
                        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
                      >
                        <CheckCircle size={18} />
                        Apply Tags to Note
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'grammar' && (
                <div>
                  <button
                    onClick={() => handleAIAction('grammar')}
                    className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 font-medium"
                  >
                    <Sparkles size={18} />
                    Check Grammar & Style
                  </button>
                  
                  {results.grammar && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 text-lg flex items-center gap-2">
                        <CheckSquare size={18} />
                        Suggestions
                      </h3>
                      <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                        {results.grammar.map((error, index) => (
                          <div key={index} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="text-red-600 line-through mb-1 font-medium">{error.text}</div>
                            <div className="text-green-600 font-medium">→ {error.suggestion}</div>
                            {error.explanation && (
                              <div className="text-sm text-gray-500 mt-2">{error.explanation}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'translate' && (
                <div>
                  <div className="mb-5 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Translate to:
                    </label>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                    >
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Italian</option>
                      <option>Portuguese</option>
                      <option>Chinese</option>
                      <option>Japanese</option>
                      <option>Korean</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => handleAIAction('translate')}
                    className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 font-medium"
                  >
                    <Languages size={18} />
                    Translate Content
                  </button>
                  
                  {results.translation && (
                    <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-semibold text-gray-800 mb-3 text-lg">
                        Translation ({targetLanguage})
                      </h3>
                      <div className="p-4 bg-indigo-50 rounded-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {results.translation}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIFeaturesPanel;