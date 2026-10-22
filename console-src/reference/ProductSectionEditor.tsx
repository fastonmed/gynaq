'use client';
import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

const tools = [
  { command: 'bold', label: 'Bold', Icon: Bold },
  { command: 'italic', label: 'Italic', Icon: Italic },
  { command: 'insertUnorderedList', label: 'Bulleted list', Icon: List },
  { command: 'insertOrderedList', label: 'Numbered list', Icon: ListOrdered }
];
export default function ProductSectionEditor({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) {
  const editor = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string[]>([]);
  useEffect(() => {
    if (editor.current && document.activeElement !== editor.current && editor.current.innerHTML !== value) editor.current.innerHTML = value;
  }, [value]);
  const sync = () => {
    if (editor.current?.contains(document.getSelection()?.anchorNode || null)) setActive(tools.filter(tool => document.queryCommandState(tool.command)).map(tool => tool.command));
  };
  useEffect(() => { document.addEventListener('selectionchange', sync); return () => document.removeEventListener('selectionchange', sync); }, []);
  const format = (command: string) => {
    editor.current?.focus();
    document.execCommand(command);
    onChange(editor.current?.innerHTML || '');
    sync();
  };
  return <section className="product-section-editor">
    <h3>{title}</h3>
    <div className="section-editor-frame">
      <div className="section-editor-toolbar" role="toolbar" aria-label={`${title} formatting`}>
        {tools.map(({ command, label, Icon }, index) => <span className={index === 2 ? 'section-tool-group divided' : 'section-tool-group'} key={command}>
          <button className="section-format-button" type="button" title={label} aria-label={label} aria-pressed={active.includes(command)} onMouseDown={event => event.preventDefault()} onClick={() => format(command)}>
            <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
            {index >= 2 && <span>{index === 2 ? 'Bullets' : 'Numbered list'}</span>}
          </button>
        </span>)}
      </div>
      <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label={title} aria-multiline="true" data-placeholder={`Add ${title.toLowerCase()}…`} className="tk-unified-canvas section-editor-canvas" onInput={() => onChange(editor.current?.innerHTML || '')} />
    </div>
  </section>;
}
