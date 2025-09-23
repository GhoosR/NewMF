import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Link2, Image, Eye, EyeOff, Type, Quote, Code } from 'lucide-react';

interface ArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export function ArticleEditor({ content, onChange, onImageUpload }: ArticleEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end);
    
    onChange(newContent);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertHeading = (level: number) => {
    insertText('\n' + '#'.repeat(level) + ' ');
  };

  const insertList = (ordered: boolean = false) => {
    const prefix = ordered ? '\n1. ' : '\n- ';
    insertText(prefix);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    if (selectedText) {
      insertText(`[${selectedText}](`, ')');
    } else {
      insertText('[Link text](', ')');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    setUploadingImage(true);
    try {
      const imageUrl = await onImageUpload(file);
      insertText(`\n![Image](${imageUrl})\n`);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const renderPreview = () => {
    const blocks = content.split(/\n\s*\n/);
    
    return (
      <div className="prose max-w-none p-6 bg-white rounded-lg border border-accent-text/10 min-h-[400px]">
        {blocks.map((block, i) => {
          if (!block.trim()) return <br key={i} />;
          
          const lines = block.split('\n');
          
          // Headings
          if (lines[0].match(/^#{1,6}\s/)) {
            const level = lines[0].match(/^(#{1,6})/)?.[1].length || 1;
            const text = lines[0].replace(/^#{1,6}\s/, '');
            const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
            const headingClasses = {
              1: 'text-3xl font-bold mb-6 mt-8',
              2: 'text-2xl font-bold mb-4 mt-6',
              3: 'text-xl font-bold mb-3 mt-4',
              4: 'text-lg font-bold mb-2 mt-3',
              5: 'text-base font-bold mb-2 mt-2',
              6: 'text-sm font-bold mb-1 mt-2'
            };
            return React.createElement(HeadingTag, {
              key: i,
              className: headingClasses[level as keyof typeof headingClasses] || headingClasses[1]
            }, text);
          }
          
          // Images
          const imageMatch = lines[0].match(/!\[(.*?)\]\((.*?)\)/);
          if (imageMatch) {
            return (
              <div key={i} className="my-6">
                <img src={imageMatch[2]} alt={imageMatch[1]} className="rounded-lg max-w-full shadow-sm" />
                {imageMatch[1] && (
                  <p className="text-sm text-content/60 text-center mt-2 italic">{imageMatch[1]}</p>
                )}
              </div>
            );
          }
          
          // Lists
          if (lines.some(line => line.match(/^[-*]\s/) || line.match(/^\d+\.\s/))) {
            const isOrdered = lines.some(line => line.match(/^\d+\.\s/));
            const ListTag = isOrdered ? 'ol' : 'ul';
            const listClass = isOrdered ? 'list-decimal pl-6 mb-4' : 'list-disc pl-6 mb-4';
            
            return React.createElement(ListTag, {
              key: i,
              className: listClass
            }, lines.map((line, j) => {
              const listMatch = line.match(/^[-*]\s(.+)/) || line.match(/^\d+\.\s(.+)/);
              if (listMatch) {
                return React.createElement('li', {
                  key: j,
                  className: 'mb-1',
                  dangerouslySetInnerHTML: { __html: processInlineMarkdown(listMatch[1]) }
                });
              }
              return null;
            }).filter(Boolean));
          }
          
          // Blockquotes
          if (lines[0].match(/^>\s/)) {
            const quoteText = lines.map(line => line.replace(/^>\s?/, '')).join('\n');
            return (
              <blockquote key={i} className="border-l-4 border-accent-text pl-4 my-6 italic text-lg">
                <div dangerouslySetInnerHTML={{ __html: processInlineMarkdown(quoteText) }} />
              </blockquote>
            );
          }
          
          // Regular paragraphs
          return (
            <p key={i} className="mb-4 leading-relaxed" dangerouslySetInnerHTML={{ 
              __html: processInlineMarkdown(block) 
            }} />
          );
        })}
      </div>
    );
  };

  const processInlineMarkdown = (text: string) => {
    return text
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent-text hover:underline" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 bg-accent-base/5 rounded-lg border border-accent-text/10">
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center px-3 py-1.5 text-sm bg-white border border-accent-text/20 rounded-md hover:bg-accent-base/10 transition-colors"
        >
          {isPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {isPreview ? 'Edit' : 'Preview'}
        </button>
        
        {!isPreview && (
          <>
            <div className="w-px bg-accent-text/20 mx-1"></div>
            
            <button
              type="button"
              onClick={() => insertHeading(2)}
              className="flex items-center px-3 py-1.5 text-sm bg-white border border-accent-text/20 rounded-md hover:bg-accent-base/10 transition-colors"
            >
              <Type className="h-4 w-4 mr-1" />
              H2
            </button>
            
            <button
              type="button"
              onClick={() => insertHeading(3)}
              className="flex items-center px-3 py-1.5 text-sm bg-white border border-accent-text/20 rounded-md hover:bg-accent-base/10 transition-colors"
            >
              <Type className="h-4 w-4 mr-1" />
              H3
            </button>
            
            <button
              type="button"
              onClick={() => insertText('**', '**')}
              className="flex items-center px-3 py-1.5 text-sm bg-white border border-accent-text/20 rounded-md hover:bg-accent-base/10 transition-colors"
            >
              <Bold className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              onClick={() => insertText('*', '*')}
              className="flex items-center px-3 py-1.5 text-sm bg-white border border-accent-text/20 rounded-md hover:bg-accent-base/10 transition-colors"
            >
              <Italic className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              onClick={() => insertList(false)}
              className="flex items-center px-3 py-1.5 text-sm bg-white border border-accent-text/20 rounded-md hover:bg-accent-base/10 transition-colors"
            >
              <List className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              onClick={() => insertList(true)}
              className="flex items-center px-3 py-1.5 text-sm bg-white border border-accent-text/20 rounded-md hover:bg-accent-base/10 transition-colors"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              onClick={insertLink}
              className="flex items-center px-3 py-1.5 text-sm bg-white border border-accent-text/20 rounded-md hover:bg-accent-base/10 transition-colors"
            >
              <Link2 className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              onClick={() => insertText('\n> ')}
              className="flex items-center px-3 py-1.5 text-sm bg-white border border-accent-text/20 rounded-md hover:bg-accent-base/10 transition-colors"
            >
              <Quote className="h-4 w-4" />
            </button>
            
            <label className="flex items-center px-3 py-1.5 text-sm bg-white border border-accent-text/20 rounded-md hover:bg-accent-base/10 transition-colors cursor-pointer">
              <Image className="h-4 w-4 mr-1" />
              {uploadingImage ? 'Uploading...' : 'Image'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>
          </>
        )}
      </div>

      {/* Editor/Preview */}
      {isPreview ? (
        renderPreview()
      ) : (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[500px] p-6 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 font-mono text-sm leading-relaxed resize-none"
            placeholder="Start writing your article...

Use markdown for formatting:
# Heading 1
## Heading 2
**Bold text**
*Italic text*
- Bullet list
1. Numbered list
[Link text](URL)
> Blockquote

You can also paste images directly into the editor."
          />
          {uploadingImage && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-text"></div>
                <span className="text-sm text-content">Uploading image...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}