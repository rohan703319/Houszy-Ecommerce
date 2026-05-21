// components/SelfHostedTinyMCE.tsx - PROFESSIONAL GRADE
'use client';

import { extractFileName, deleteEditorImage, uploadEditorImage } from '@/lib/services/editorService';
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/app/admin/_context/theme-provider';

interface SelfHostedTinyMCEProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  className?: string;
  minLength?: number;
  maxLength?: number;
  showCharCount?: boolean;
}

declare global {
  interface Window {
    tinymce: any;
  }
}

export const SelfHostedTinyMCE: React.FC<SelfHostedTinyMCEProps> = ({
  value,
  onChange,
  placeholder = "Start typing...",
  height = 400,
  className = "",
  minLength = 0,
  maxLength = Infinity,
  showCharCount = true
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const editorRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const isUpdatingRef = useRef(false);
  const lastNotificationTimeRef = useRef<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [editorId] = useState(() => `tinymce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Get plain text length (NO trim - count all characters)
  const getPlainTextLength = (html: string): number => {
    if (!html) return 0;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length;
  };

  // ✅ Smart HTML truncation with empty tag removal
  const truncateHTML = (html: string, maxChars: number): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    
    let charCount = 0;
    
    const processNode = (node: Node): boolean => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (charCount + text.length > maxChars) {
          const remaining = maxChars - charCount;
          node.textContent = text.substring(0, remaining);
          charCount = maxChars;
          return false;
        }
        charCount += text.length;
        return true;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const children = Array.from(node.childNodes);
        for (let i = 0; i < children.length; i++) {
          if (!processNode(children[i])) {
            // Remove all subsequent siblings
            for (let j = i + 1; j < children.length; j++) {
              node.removeChild(children[j]);
            }
            return false;
          }
        }
      }
      
      return true;
    };
    
    processNode(tmp);
    
    // Remove empty tags
    const removeEmptyTags = (element: Element) => {
      const children = Array.from(element.children);
      children.forEach(child => {
        removeEmptyTags(child);
        
        const hasText = (child.textContent || '').trim().length > 0;
        const hasImage = child.tagName === 'IMG' || child.querySelector('img');
        
        if (!hasText && !hasImage) {
          child.remove();
        }
      });
    };
    
    removeEmptyTags(tmp);
    
    return tmp.innerHTML;
  };

  const showNotification = (editor: any, text: string, type: 'info' | 'warning' | 'error' | 'success', timeout: number = 3000) => {
    const now = Date.now();
    
    if (now - lastNotificationTimeRef.current < 1000) {
      return;
    }
    
    lastNotificationTimeRef.current = now;
    
    if (editor && editor.notificationManager) {
      editor.notificationManager.open({ text, type, timeout });
    }
  };

  const deleteImageFromServer = async (imageUrl: string): Promise<boolean> => {
    try {
      const fileName = extractFileName(imageUrl);
      
      if (!fileName) {
        console.error('Could not extract filename from URL:', imageUrl);
        return false;
      }

      await deleteEditorImage(fileName);
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting image:', error);
      return false;
    }
  };

  useEffect(() => {
    if (!isMounted) return;

    const loadTinyMCE = () => {
      if (window.tinymce && editorRef.current) {
        window.tinymce.remove(`#${editorId}`);
      }

      if (window.tinymce) {
        initializeEditor();
        return;
      }

      const script = document.createElement('script');
      script.src = '/tinymce/tinymce.min.js';
      script.onload = () => {
        setIsLoaded(true);
        setTimeout(() => {
          initializeEditor();
        }, 100);
      };
      script.onerror = () => {
        console.error('❌ Failed to load TinyMCE');
      };
      document.head.appendChild(script);
    };

    const initializeEditor = () => {
      if (!window.tinymce) return;

      window.tinymce.init({
        selector: `#${editorId}`,
        height: height,
        
        license_key: 'gpl',
        
        base_url: '/tinymce',
        suffix: '.min',
        
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
          'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'wordcount', 'help'
        ],
        
        menubar: 'edit view insert format tools',
        
        toolbar: 'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image deleteimage | removeformat code',
        
        skin: isDark ? 'oxide-dark' : 'oxide',
        content_css: isDark ? 'dark' : 'default',

        content_style: `
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: ${isDark ? '#f1f5f9' : '#1e293b'} !important;
            background-color: ${isDark ? '#0f172a' : '#ffffff'} !important;
            margin: 0;
            padding: 12px 14px !important;
            min-height: ${height - 100}px;
            box-sizing: border-box;
          }

          body:empty::before {
            content: "${placeholder}";
            color: ${isDark ? '#ffffff' : '#94a3b8'};
            opacity: 0.6;
          }

          * {
            color: ${isDark ? '#f1f5f9' : '#1e293b'} !important;
          }

          p {
            margin: 0 0 0.8em 0;
            line-height: 1.6;
            color: ${isDark ? '#e2e8f0' : '#334155'} !important;
            min-height: 1.4em;
          }
          
          p:first-child {
            margin-top: 0;
          }
          
          p:last-child {
            margin-bottom: 0;
          }
          
          h1, h2, h3, h4, h5, h6 {
            color: ${isDark ? '#f8fafc' : '#0f172a'} !important;
            margin: 1em 0 0.5em 0;
            font-weight: 600;
            line-height: 1.4;
          }

          strong, b {
            color: ${isDark ? '#f8fafc' : '#0f172a'} !important;
            font-weight: 600;
          }

          em, i {
            color: ${isDark ? '#e2e8f0' : '#334155'} !important;
            font-style: italic;
          }

          u {
            color: ${isDark ? '#e2e8f0' : '#334155'} !important;
            text-decoration: underline;
          }

          a {
            color: #a855f7 !important;
            text-decoration: underline;
          }

          a:hover {
            color: #c084fc !important;
          }

          ul, ol {
            color: ${isDark ? '#e2e8f0' : '#334155'} !important;
            padding-left: 1.5em;
            margin: 0.6em 0;
          }

          li {
            color: ${isDark ? '#e2e8f0' : '#334155'} !important;
            margin: 0.3em 0;
            line-height: 1.6;
          }

          table {
            border-collapse: collapse;
            width: 100%;
            margin: 0.8em 0;
            background-color: ${isDark ? '#1e293b' : '#f8fafc'} !important;
            border: 1px solid ${isDark ? '#475569' : '#cbd5e1'};
          }

          th, td {
            border: 1px solid ${isDark ? '#475569' : '#cbd5e1'};
            padding: 6px 10px;
            text-align: left;
            color: ${isDark ? '#e2e8f0' : '#334155'} !important;
          }

          th {
            background-color: ${isDark ? '#334155' : '#e2e8f0'} !important;
            font-weight: 600;
            color: ${isDark ? '#f1f5f9' : '#0f172a'} !important;
          }

          code {
            background-color: ${isDark ? '#374151' : '#f1f5f9'} !important;
            color: ${isDark ? '#fbbf24' : '#7c3aed'} !important;
            padding: 2px 5px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, Consolas, monospace;
          }

          pre {
            background-color: ${isDark ? '#111827' : '#f8fafc'} !important;
            color: ${isDark ? '#f3f4f6' : '#1e293b'} !important;
            padding: 12px;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid ${isDark ? '#374151' : '#e2e8f0'};
          }

          blockquote {
            border-left: 4px solid #8b5cf6;
            margin: 0.8em 0;
            padding: 0.4em 0.8em;
            color: ${isDark ? '#cbd5e1' : '#475569'} !important;
            background-color: ${isDark ? '#334155' : '#f1f5f9'} !important;
            border-radius: 0 8px 8px 0;
          }

          hr {
            border: none;
            border-top: 2px solid ${isDark ? '#475569' : '#e2e8f0'};
            margin: 1.2em 0;
          }
          
          img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            cursor: pointer;
          }
          
          img:hover {
            opacity: 0.8;
            box-shadow: 0 0 0 2px #a855f7;
          }
          
          img[data-mce-selected] {
            box-shadow: 0 0 0 3px #a855f7 !important;
          }
        `,
        
        branding: false,
        promotion: false,
        resize: true,
        
        toolbar_mode: 'sliding',
        statusbar: true,
        elementpath: false,
        
        images_upload_handler: async (blobInfo: any, progress: any) => {
          return new Promise(async (resolve, reject) => {
            try {
              const file = blobInfo.blob();
              const result = await uploadEditorImage(file);
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
              resolve(`${apiUrl}${result.location}`);
            } catch (error: any) {
              console.error('Upload error:', error);
              reject(error.message || '❌ Upload failed');
            }
          });
        },
        
        file_picker_types: 'image',
        file_picker_callback: (callback: any, value: any, meta: any) => {
          if (meta.filetype === 'image') {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/webp');
            input.style.display = 'none';
            
            document.body.appendChild(input);
            
            input.onchange = async function() {
              const file = (this as HTMLInputElement).files?.[0];
              document.body.removeChild(input);
              
              if (!file) return;
              
              try {
                if (editorRef.current) {
                  showNotification(editorRef.current, '⏳ Uploading image...', 'info', 3000);
                }
                
                const result = await uploadEditorImage(file);
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const imageUrl = `${apiUrl}${result.location}`;
                
                callback(imageUrl, {
                  alt: file.name,
                  title: file.name
                });
                
                if (editorRef.current) {
                  showNotification(editorRef.current, '✅ Image uploaded successfully', 'success', 3000);
                }
                
              } catch (error: any) {
                console.error('Upload error:', error);
                
                if (error.message && error.message.includes('❌')) {
                  alert(error.message);
                } else {
                  alert('❌ Image upload failed!\n\nPlease try again.');
                }
                
                if (editorRef.current) {
                  showNotification(editorRef.current, '❌ Image upload failed', 'error', 5000);
                }
              }
            };
            
            input.click();
          }
        },
        
        setup: (editor: any) => {
          editorRef.current = editor;
          
          // ✅ BLOCK TYPING when limit reached
          editor.on('keydown', (e: any) => {
            const allowedKeys = [8, 46, 37, 38, 39, 40, 35, 36, 33, 34]; // Backspace, Delete, Arrows, Home, End, PgUp, PgDn
            
            if (allowedKeys.includes(e.keyCode) || e.ctrlKey || e.metaKey) {
              return;
            }
            
            const content = editor.getContent();
            const textLength = getPlainTextLength(content);
            
            if (maxLength !== Infinity && textLength >= maxLength) {
              e.preventDefault();
              e.stopPropagation();
              
              showNotification(
                editor,
                `⚠️ Character limit reached! You cannot add more text. (${maxLength} characters maximum)`,
                'error',
                3000
              );
            }
          });
          
          // ✅ TINYMCE BUILT-IN PASTE PREPROCESSOR (Preserves formatting!)
          editor.on('PastePreProcess', (e: any) => {
            if (maxLength === Infinity) return;

            const pastedTextLength = getPlainTextLength(e.content);
            const currentContent = editor.getContent();
            const currentLength = getPlainTextLength(currentContent);
            const totalLength = currentLength + pastedTextLength;

            if (totalLength > maxLength) {
              const allowedLength = maxLength - currentLength;

              if (allowedLength <= 0) {
                e.preventDefault();
                e.content = '';

                showNotification(
                  editor,
                  `❌ Cannot paste! Character limit (${maxLength}) already reached.`,
                  'error',
                  4000
                );
                return;
              }

              // Truncate pasted content while preserving HTML formatting
              e.content = truncateHTML(e.content, allowedLength);

              showNotification(
                editor,
                `⚠️ Pasted content truncated! Only ${allowedLength} of ${pastedTextLength} characters pasted. Limit: ${maxLength}`,
                'warning',
                4000
              );
            }
          });
          
          // ✅ FINAL SAFETY CHECK - Enforce limit on any content change
          editor.on('input change', () => {
            const content = editor.getContent();
            const textLength = getPlainTextLength(content);
            
            if (maxLength !== Infinity && textLength > maxLength) {
              const truncatedContent = truncateHTML(content, maxLength);
              
              isUpdatingRef.current = true;
              editor.setContent(truncatedContent);
              
              setTimeout(() => {
                isUpdatingRef.current = false;
              }, 50);
              
              setCharCount(maxLength);
              onChangeRef.current(truncatedContent);
              
              showNotification(
                editor,
                `⚠️ Content exceeded limit and was automatically truncated to ${maxLength} characters`,
                'warning',
                3000
              );
            } else {
              setCharCount(textLength);
              
              if (!isUpdatingRef.current) {
                isUpdatingRef.current = true;
                onChangeRef.current(content);
                setTimeout(() => {
                  isUpdatingRef.current = false;
                }, 50);
              }
            }
          });
          
          // ✅ DELETE IMAGE BUTTON
          editor.ui.registry.addButton('deleteimage', {
            text: '🗑️',
            tooltip: 'Delete Selected Image',
            onAction: async () => {
              const selectedImg = editor.selection.getNode();
              if (selectedImg && selectedImg.nodeName === 'IMG') {
                const imageUrl = selectedImg.src;
                const imageName = imageUrl.split('/').pop() || 'this image';
                
                const confirmed = confirm(`⚠️ Delete "${imageName}"?`);
                
                if (confirmed) {
                  try {
                    const deleted = await deleteImageFromServer(imageUrl);
                    if (deleted) {
                      editor.dom.remove(selectedImg);
                      editor.nodeChanged();
                      
                      isUpdatingRef.current = true;
                      const content = editor.getContent();
                      onChangeRef.current(content);
                      setTimeout(() => isUpdatingRef.current = false, 100);
                      
                      showNotification(editor, '✅ Image deleted successfully', 'success', 2000);
                    }
                  } catch (error) {
                    console.error('Delete image error:', error);
                    showNotification(editor, '❌ Error deleting image', 'error', 3000);
                  }
                }
              } else {
                showNotification(editor, '📝 Please select an image first', 'warning', 2000);
              }
            }
          });

          // ✅ DELETE IMAGE with Backspace/Delete
          editor.on('keydown', async (e: any) => {
            if (e.keyCode === 8 || e.keyCode === 46) {
              const selectedNode = editor.selection.getNode();
              
              if (selectedNode && selectedNode.nodeName === 'IMG') {
                e.preventDefault();
                
                const imageUrl = selectedNode.src;
                const imageName = imageUrl.split('/').pop() || 'this image';
                
                const confirmed = confirm(`⚠️ Delete "${imageName}"?`);
                
                if (confirmed) {
                  try {
                    const deleted = await deleteImageFromServer(imageUrl);
                    if (deleted) {
                      editor.dom.remove(selectedNode);
                      editor.nodeChanged();
                      
                      isUpdatingRef.current = true;
                      const content = editor.getContent();
                      onChangeRef.current(content);
                      setTimeout(() => isUpdatingRef.current = false, 100);
                      
                      showNotification(editor, '✅ Image deleted successfully', 'success', 2000);
                    }
                  } catch (error) {
                    console.error('Delete image error:', error);
                  }
                }
              }
            }
          });
          
          // ✅ INIT EVENT
          editor.on('init', () => {
            setIsReady(true);
            
            // ✅ Set and validate initial content
            if (value) {
              const initialLength = getPlainTextLength(value);
              
              if (maxLength !== Infinity && initialLength > maxLength) {
                const truncatedValue = truncateHTML(value, maxLength);
                editor.setContent(truncatedValue);
                setCharCount(getPlainTextLength(truncatedValue));
                
                onChangeRef.current(truncatedValue);
                
                setTimeout(() => {
                  showNotification(
                    editor,
                    `⚠️ Content was ${initialLength} characters. Truncated to ${maxLength} character limit.`,
                    'warning',
                    5000
                  );
                }, 500);
              } else {
                editor.setContent(value);
                setCharCount(initialLength);
              }
            }
            
            // ✅ Styling
            const container = editor.getContainer();
            if (container) {
              container.style.backgroundColor = '#1e293b';
              container.style.border = '1px solid #475569';
              container.style.borderRadius = '12px';
              container.style.overflow = 'hidden';
              
              const header = container.querySelector('.tox-editor-header') as HTMLElement;
              if (header) {
                header.style.display = 'flex';
                header.style.flexDirection = 'row';
                header.style.flexWrap = 'wrap';
                header.style.alignItems = 'center';
                header.style.gap = '4px';
                header.style.padding = '2px 6px';
                header.style.borderBottom = '1px solid #475569';
                header.style.minHeight = 'auto';
              }
              
              const menubar = container.querySelector('.tox-menubar') as HTMLElement;
              if (menubar) {
                menubar.style.flex = '0 0 auto';
                menubar.style.padding = '2px 4px';
                menubar.style.minHeight = 'auto';
                menubar.style.borderBottom = 'none';
              }
              
              const toolbar = container.querySelector('.tox-toolbar__primary') as HTMLElement;
              if (toolbar) {
                toolbar.style.flex = '1 1 auto';
                toolbar.style.padding = '2px 4px';
                toolbar.style.gap = '2px';
                toolbar.style.borderTop = 'none';
                toolbar.style.minHeight = 'auto';
              }
              
              const statusbar = container.querySelector('.tox-statusbar') as HTMLElement;
              if (statusbar) {
                statusbar.style.padding = '3px 8px';
              }
              
              const mediaQuery = window.matchMedia('(max-width: 768px)');
              
              const handleMobileView = (e: MediaQueryListEvent | MediaQueryList) => {
                const header = container.querySelector('.tox-editor-header') as HTMLElement;
                if (header) {
                  if (e.matches) {
                    header.style.flexDirection = 'column';
                    header.style.alignItems = 'stretch';
                    
                    const menubar = container.querySelector('.tox-menubar') as HTMLElement;
                    if (menubar) {
                      menubar.style.borderBottom = '1px solid #475569';
                    }
                  } else {
                    header.style.flexDirection = 'row';
                    header.style.alignItems = 'center';
                    
                    const menubar = container.querySelector('.tox-menubar') as HTMLElement;
                    if (menubar) {
                      menubar.style.borderBottom = 'none';
                    }
                  }
                }
              };
              
              handleMobileView(mediaQuery);
              mediaQuery.addEventListener('change', handleMobileView);
            }
          });
        }
      });
    };

    loadTinyMCE();

    return () => {
      if (window.tinymce && editorRef.current) {
        window.tinymce.remove(`#${editorId}`);
      }
    };
  }, [isMounted, editorId, placeholder, height, minLength, maxLength]);

  // ✅ Handle external value changes
  useEffect(() => {
    if (editorRef.current && isReady && !isUpdatingRef.current) {
      const currentContent = editorRef.current.getContent();
      
      if (value !== currentContent) {
        const incomingLength = getPlainTextLength(value || '');
        
        if (maxLength !== Infinity && incomingLength > maxLength) {
          const truncatedValue = truncateHTML(value || '', maxLength);
          editorRef.current.setContent(truncatedValue);
          setCharCount(getPlainTextLength(truncatedValue));
          onChangeRef.current(truncatedValue);
        } else {
          editorRef.current.setContent(value || '');
          setCharCount(incomingLength);
        }
      }
    }
  }, [value, isReady, maxLength]);

  if (!isMounted) {
    return (
      <div className={`border border-slate-700 rounded-xl bg-slate-800/50 p-4 ${className}`} style={{ height: height + 50 }}>
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2 text-violet-400">
            <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Initializing editor...</span>
          </div>
        </div>
      </div>
    );
  }

  const getCharCountColor = () => {
    if (minLength > 0 && charCount < minLength) {
      return 'text-red-400';
    }
    if (maxLength !== Infinity) {
      const percentage = (charCount / maxLength) * 100;
      if (percentage >= 95) return 'text-red-500';
      if (percentage >= 90) return 'text-red-400';
      if (percentage >= 75) return 'text-orange-400';
    }
    return 'text-slate-400';
  };

  return (
    <div className={className}>
      {!isReady && (
        <div 
          className="border border-slate-700 rounded-xl bg-slate-800/50 p-4 flex items-center justify-center" 
          style={{ height: height }}
        >
          <div className="flex items-center gap-2 text-violet-400">
            <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading editor...</span>
          </div>
        </div>
      )}
      
      <div
        className="rounded-xl overflow-hidden border border-slate-700"
        style={{
          visibility: isReady ? 'visible' : 'hidden',
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.3s ease',
          backgroundColor: '#1e293b'
        }}
      >
        <textarea 
          id={editorId} 
          className="w-full"
          suppressHydrationWarning
        />
      </div>
      
      {showCharCount && isReady && (
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${getCharCountColor()}`}>
              {charCount} {maxLength !== Infinity && `/ ${maxLength}`} characters
            </span>
            
            {minLength > 0 && charCount < minLength && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Min {minLength} chars required
              </span>
            )}
            
            {maxLength !== Infinity && charCount >= maxLength && (
              <span className="text-xs text-red-500 flex items-center gap-1 font-semibold">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Limit reached
              </span>
            )}
          </div>
          
          {maxLength !== Infinity && (
            <div className="flex items-center gap-2">
              <div className="w-28 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    charCount >= maxLength 
                      ? 'bg-red-500' 
                      : charCount >= maxLength * 0.95 
                        ? 'bg-red-400'
                        : charCount >= maxLength * 0.9 
                          ? 'bg-orange-500'
                          : charCount >= maxLength * 0.75
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((charCount / maxLength) * 100, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${charCount >= maxLength ? 'text-red-500' : 'text-slate-500'}`}>
                {Math.max(0, maxLength - charCount)} left
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ProductDescriptionEditor = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "Start typing your description...",
  required = false,
  height = 350,
  showHelpText,
  className = "",
  minLength = 0,
  maxLength = Infinity,
  showCharCount = true
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  height?: number;
  showHelpText?: string;
  className?: string;
  minLength?: number;
  maxLength?: number;
  showCharCount?: boolean;
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <SelfHostedTinyMCE
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        height={height}
        className="w-full"
        minLength={minLength}
        maxLength={maxLength}
        showCharCount={showCharCount}
      />
      {showHelpText && (
        <p className="text-xs text-slate-400 mt-1">
          {showHelpText}
        </p>
      )}
    </div>
  );
};
