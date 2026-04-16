// components/SelfHostedTinyMCE.tsx - PROFESSIONAL GRADE
'use client';

import { extractFileName, deleteEditorImage, uploadEditorImage } from '@/lib/services/editorService';
import React, { useEffect, useRef, useState } from 'react';

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
  const editorRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const isUpdatingRef = useRef(false);
  const lastNotificationTimeRef = useRef<number>(0);
  const contentFromEditorRef = useRef<string>('');
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

  // ✅ Block-level tags that produce newlines in TinyMCE's text extraction
  const NEWLINE_TAGS = new Set([
    'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'LI', 'TR', 'BLOCKQUOTE', 'PRE', 'ADDRESS', 'DT', 'DD'
  ]);

  // ✅ Clean inter-tag whitespace from TinyMCE HTML output
  const cleanInterTagWhitespace = (html: string): string => {
    return html.replace(/>\s*\n\s*</g, '><');
  };

  // ✅ Count text length matching TinyMCE's getContent({format:'text'})
  // Counts block boundaries and <br> as newline characters
  const getPlainTextLength = (html: string): number => {
    if (!html) return 0;
    const tmp = document.createElement('div');
    tmp.innerHTML = cleanInterTagWhitespace(html);

    let length = 0;

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        length += (node.textContent || '').length;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;

        // <br> = newline character
        if (el.tagName === 'BR') {
          length++;
          return;
        }

        // Block element boundary = newline (only after we've already counted some content)
        if (NEWLINE_TAGS.has(el.tagName) && length > 0) {
          length++;
        }

        for (const child of Array.from(node.childNodes)) {
          walk(child);
        }
      }
    };

    walk(tmp);
    return length;
  };

  // ✅ Truncate HTML to maxChars, counting block boundaries + <br> as newlines
  const truncateHTML = (html: string, maxChars: number): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = cleanInterTagWhitespace(html);

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
        const el = node as Element;

        // <br> counts as a newline character
        if (el.tagName === 'BR') {
          charCount++;
          return charCount < maxChars;
        }

        // Block boundary = newline character (only after first content)
        if (NEWLINE_TAGS.has(el.tagName) && charCount > 0) {
          charCount++;
          if (charCount >= maxChars) {
            el.remove();
            return false;
          }
        }

        const children = Array.from(node.childNodes);
        for (let i = 0; i < children.length; i++) {
          if (!processNode(children[i])) {
            // Remove all subsequent siblings
            for (let j = children.length - 1; j > i; j--) {
              if (children[j].parentNode === node) {
                node.removeChild(children[j]);
              }
            }
            return false;
          }
        }
      }

      return true;
    };

    processNode(tmp);

    // Remove empty tags (but keep structural elements like BR, HR, IMG)
    const preserveTags = new Set(['BR', 'HR', 'IMG', 'INPUT', 'IFRAME', 'VIDEO', 'AUDIO', 'SOURCE', 'EMBED']);
    const removeEmptyTags = (element: Element) => {
      const children = Array.from(element.children);
      children.forEach(child => {
        removeEmptyTags(child);

        if (preserveTags.has(child.tagName)) return;

        const hasText = (child.textContent || '').length > 0;
        const hasMedia = child.querySelector('img, video, audio, iframe, br, hr');

        if (!hasText && !hasMedia) {
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
        
        skin: 'oxide-dark',
        content_css: 'dark',

        // Paste settings - preserve formatting exactly as copied
        paste_as_text: false,
        paste_retain_style_properties: 'all',
        paste_data_images: true,
        paste_merge_formats: true,
        paste_tab_spaces: 4,
        smart_paste: true,
        
        content_style: `
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px; 
            line-height: 1.6;
            color: #f1f5f9 !important;
            background-color: #0f172a !important;
            margin: 0;
            padding: 12px 14px !important;
            min-height: ${height - 100}px;
            box-sizing: border-box;
          }
          
          body:empty::before {
            content: "${placeholder}";
            color: #ffffff;
            opacity: 0.6;
          }
          
          * {
            color: #f1f5f9 !important;
          }
          
          p {
            margin: 0 0 0.8em 0;
            line-height: 1.6;
            color: #e2e8f0 !important;
            min-height: 1.4em;
          }
          
          p:first-child {
            margin-top: 0;
          }
          
          p:last-child {
            margin-bottom: 0;
          }
          
          h1, h2, h3, h4, h5, h6 { 
            color: #f8fafc !important; 
            margin: 1em 0 0.5em 0;
            font-weight: 600;
            line-height: 1.4;
          }
          
          strong, b {
            color: #f8fafc !important;
            font-weight: 600;
          }
          
          em, i {
            color: #e2e8f0 !important;
            font-style: italic;
          }
          
          u {
            color: #e2e8f0 !important;
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
            color: #e2e8f0 !important;
            padding-left: 1.5em;
            margin: 0.6em 0;
          }
          
          li {
            color: #e2e8f0 !important;
            margin: 0.3em 0;
            line-height: 1.6;
          }
          
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 0.8em 0;
            background-color: #1e293b !important;
            border: 1px solid #475569;
          }
          
          th, td { 
            border: 1px solid #475569; 
            padding: 6px 10px;
            text-align: left; 
            color: #e2e8f0 !important;
          }
          
          th { 
            background-color: #334155 !important; 
            font-weight: 600;
            color: #f1f5f9 !important;
          }
          
          code { 
            background-color: #374151 !important; 
            color: #fbbf24 !important; 
            padding: 2px 5px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, Consolas, monospace;
          }
          
          pre {
            background-color: #111827 !important;
            color: #f3f4f6 !important;
            padding: 12px;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid #374151;
          }
          
          blockquote {
            border-left: 4px solid #8b5cf6;
            margin: 0.8em 0;
            padding: 0.4em 0.8em;
            color: #cbd5e1 !important;
            background-color: #334155 !important;
            border-radius: 0 8px 8px 0;
          }
          
          hr {
            border: none;
            border-top: 2px solid #475569;
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

            const textLength = getPlainTextLength(editor.getContent());

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
          
          // ✅ PASTE PRE-CHECK - Only block if editor is completely full
          editor.on('PastePreProcess', (e: any) => {
            if (maxLength === Infinity) return;

            const currentLength = getPlainTextLength(editor.getContent());
            const selectedLength = getPlainTextLength(editor.selection.getContent());
            const effectiveLength = currentLength - selectedLength;

            // Only block if there's truly zero room left
            if (effectiveLength >= maxLength) {
              e.preventDefault();
              e.content = '';
              showNotification(
                editor,
                `❌ Cannot paste! Character limit (${maxLength}) already reached.`,
                'error',
                4000
              );
            }
            // Otherwise let paste through - PastePostProcess will truncate on CLEAN html
          });

          // ✅ AFTER PASTE - Truncate using block-boundary-aware counting
          editor.on('PastePostProcess', () => {
            setTimeout(() => {
              const content = editor.getContent();
              const textLen = getPlainTextLength(content);

              if (maxLength !== Infinity && textLen > maxLength) {
                const truncated = truncateHTML(content, maxLength);

                isUpdatingRef.current = true;
                editor.setContent(truncated);
                setTimeout(() => { isUpdatingRef.current = false; }, 100);

                const finalLen = getPlainTextLength(editor.getContent());
                setCharCount(finalLen);
                const finalContent = editor.getContent();
                contentFromEditorRef.current = finalContent;
                onChangeRef.current(finalContent);

                showNotification(
                  editor,
                  `⚠️ Content truncated to ${maxLength} character limit.`,
                  'warning',
                  3000
                );
              } else {
                setCharCount(textLen);
                contentFromEditorRef.current = content;
                onChangeRef.current(content);
              }
            }, 10);
          });

          // ✅ CONTENT CHANGE HANDLER - Block-boundary-aware counting
          editor.on('input change', () => {
            const content = editor.getContent();
            const textLen = getPlainTextLength(content);

            // ALWAYS update character count regardless of isUpdatingRef
            setCharCount(maxLength !== Infinity && textLen > maxLength ? maxLength : textLen);

            // Skip onChange if we're in a programmatic update (prevents loop)
            if (isUpdatingRef.current) return;

            if (maxLength !== Infinity && textLen > maxLength) {
              const truncatedContent = truncateHTML(content, maxLength);

              isUpdatingRef.current = true;
              const bookmark = editor.selection.getBookmark(2);
              editor.setContent(truncatedContent);
              try { editor.selection.moveToBookmark(bookmark); } catch (_) { /* cursor at end is fine */ }

              setTimeout(() => {
                isUpdatingRef.current = false;
              }, 100);

              const finalLen = getPlainTextLength(editor.getContent());
              setCharCount(finalLen);
              const finalContent = editor.getContent();
              contentFromEditorRef.current = finalContent;
              onChangeRef.current(finalContent);
            } else {
              isUpdatingRef.current = true;
              contentFromEditorRef.current = content;
              onChangeRef.current(content);
              setTimeout(() => {
                isUpdatingRef.current = false;
              }, 100);
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
                      contentFromEditorRef.current = content;
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
                      contentFromEditorRef.current = content;
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
              editor.setContent(value);
              const content = editor.getContent();
              const textLen = getPlainTextLength(content);

              if (maxLength !== Infinity && textLen > maxLength) {
                const truncated = truncateHTML(content, maxLength);
                editor.setContent(truncated);

                const finalLen = getPlainTextLength(editor.getContent());
                setCharCount(finalLen);
                contentFromEditorRef.current = editor.getContent();
                onChangeRef.current(contentFromEditorRef.current);

                setTimeout(() => {
                  showNotification(
                    editor,
                    `⚠️ Content was ${textLen} characters. Truncated to ${maxLength} character limit.`,
                    'warning',
                    5000
                  );
                }, 500);
              } else {
                setCharCount(textLen);
                contentFromEditorRef.current = value;
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

  // ✅ Handle external value changes (only from outside, NOT from editor itself)
  useEffect(() => {
    if (!editorRef.current || !isReady || isUpdatingRef.current) return;

    // Skip if value originated from the editor itself (prevents reset loop)
    if (value === contentFromEditorRef.current) return;

    const currentContent = editorRef.current.getContent();
    if (value === currentContent) return;

    isUpdatingRef.current = true;
    editorRef.current.setContent(value || '');
    const content = editorRef.current.getContent();
    const textLen = getPlainTextLength(content);

    if (maxLength !== Infinity && textLen > maxLength) {
      const truncated = truncateHTML(content, maxLength);
      editorRef.current.setContent(truncated);

      const finalLen = getPlainTextLength(editorRef.current.getContent());
      setCharCount(finalLen);
      contentFromEditorRef.current = editorRef.current.getContent();
      onChangeRef.current(contentFromEditorRef.current);
    } else {
      setCharCount(textLen);
      contentFromEditorRef.current = value || '';
    }

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 100);
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
