'use client';
import { useEffect, useRef } from 'react';

export default function ProductSectionEditor({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) {
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editor.current && document.activeElement !== editor.current && editor.current.innerHTML !== value) editor.current.innerHTML = value;
  }, [value]);
  const format = (command: string) => {
    editor.current?.focus();
    document.execCommand(command);
    onChange(editor.current?.innerHTML || '');
  };
  return <section style={{ marginTop: 24 }}>
    <h3>{title}</h3>
    <div style={{ border: '1px solid #d8e2df', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 8, padding: 10, background: '#f8fafc', borderBottom: '1px solid #d8e2df' }}>
        {[['bold', 'Bold'], ['italic', 'Italic'], ['insertUnorderedList', 'Bullets'], ['insertOrderedList', 'Numbered list']].map(([command, label]) => <button key={command} type="button" onMouseDown={event => event.preventDefault()} onClick={() => format(command)}>{label}</button>)}
      </div>
      <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label={title} aria-multiline="true" className="tk-unified-canvas" style={{ minHeight: 180, padding: 16 }} onInput={() => onChange(editor.current?.innerHTML || '')} />
    </div>
  </section>;
}
