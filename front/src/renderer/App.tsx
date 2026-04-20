import React, { useState, useCallback, useEffect, useRef } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import CodeEditor from './components/CodeEditor'
import Terminal from './components/Terminal'
import NewFileModal from './components/NewFileModal'
import type { FileData, Language, TerminalLine } from './types'

const TEMPLATES: Record<Language, string> = {
  py: '# Python Script\nprint("Hello, World!")\n',
  c: '#include <stdio.h>\nint main() { printf("Hello!\\n"); return 0; }\n',
  js: '// JavaScript\nconsole.log("Hello, World!");\n',
}

function getTimestamp() {
  const n = new Date()
  return [n.getHours(), n.getMinutes(), n.getSeconds()]
    .map((x) => String(x).padStart(2, '0'))
    .join(':')
}

function fileDotColor(lang: string) {
  if (lang === 'js') return 'bg-yellow-400'
  if (lang === 'py') return 'bg-blue-500'
  return 'bg-indigo-500'
}

// ─── Dropdown Menu ────────────────────────────────────────────────────────────

interface DropdownProps {
  label: string
  activeMenu: string | null
  onToggle: (name: string) => void
  children: React.ReactNode
}

function DropdownMenu({ label, activeMenu, onToggle, children }: DropdownProps) {
  const isOpen = activeMenu === label
  return (
    <div className="relative h-full">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(label) }}
        className={`h-full px-4 text-sm font-mono text-[#c9d1d9] transition-colors ${
          isOpen ? 'bg-[#21262d]' : 'hover:bg-[#21262d]'
        }`}
      >
        {label}
      </button>
      {isOpen && (
        <div
          className="absolute top-full left-0 z-50 min-w-[160px] bg-[#161b22] border border-[#30363d] rounded shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface DdItemProps {
  onClick: () => void
  children: React.ReactNode
}
function DdItem({ onClick, children }: DdItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm font-mono text-[#c9d1d9] hover:bg-[#21262d] transition-colors block"
    >
      {children}
    </button>
  )
}
function DdSep() {
  return <div className="border-t border-[#21262d] my-1" />
}

// ─── Terminal Line ────────────────────────────────────────────────────────────

function TermLine({ line }: { line: TerminalLine }) {
  const color =
    line.type === 'error'   ? 'text-[#f85149]' :
    line.type === 'info'    ? 'text-[#58a6ff]' :
    line.type === 'success' ? 'text-[#a5d6ff]' :
    'text-[#3fb950]'
  return (
    <div className="flex gap-4 font-mono text-xs leading-7">
      <span className="text-[#484f58] shrink-0">{line.timestamp}</span>
      <span className={color}>&gt;&gt; {line.content}</span>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentFile, setCurrentFile]             = useState<FileData | null>(null)
  const [openFiles, setOpenFiles]                 = useState<FileData[]>([])
  const [dirtyFiles, setDirtyFiles]               = useState<Set<string>>(new Set())
  const [currentLanguage, setCurrentLanguage]     = useState<Language>('js')
  const [terminalHeight, setTerminalHeight]       = useState(180)
  const [terminalLines, setTerminalLines]         = useState<TerminalLine[]>([])
  const [isRunning, setIsRunning]                 = useState(false)
  const [showNewFileModal, setShowNewFileModal]   = useState(false)
  const [recents, setRecents]                     = useState<FileData[]>([])
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false)
  const [fontSize, setFontSize]                   = useState(14)
  const [zoom, setZoom]                           = useState(100)
  const [activeMenu, setActiveMenu]               = useState<string | null>(null)
  const termBodyRef                               = useRef<HTMLDivElement>(null)

  // ── Close menus on outside click ──
  useEffect(() => {
    const close = () => setActiveMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  // ── Apply zoom & font size ──
  useEffect(() => {
    document.documentElement.style.fontSize = `${(fontSize / 16) * 100}%`
    document.documentElement.style.zoom = `${zoom}%`
  }, [fontSize, zoom])

  // ── Auto-scroll terminal ──
  useEffect(() => {
    if (termBodyRef.current) {
      termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight
    }
  }, [terminalLines])

  const isDirtyFile = useCallback(
    (filepath: string) => dirtyFiles.has(filepath),
    [dirtyFiles]
  )

  const setFileAsDirty = useCallback((filepath: string, dirty: boolean) => {
    setDirtyFiles((prev) => {
      const next = new Set(prev)
      dirty ? next.add(filepath) : next.delete(filepath)
      return next
    })
  }, [])

  const addTerminalLine = useCallback(
    (content: string, type: 'output' | 'error' | 'info' | 'success' = 'output') => {
      setTerminalLines((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random()}`, timestamp: getTimestamp(), content, type },
      ])
    },
    []
  )

  const clearTerminal = useCallback(() => setTerminalLines([]), [])

  const loadRecents = useCallback(async () => {
    try {
      const files = await window.electronAPI.file.recents()
      setRecents(files)
    } catch (err) {
      console.error('Failed to load recents:', err)
    }
  }, [])

  useEffect(() => { loadRecents() }, [loadRecents])

  const handleNewFile  = useCallback(() => setShowNewFileModal(true), [])

  const handleOpenFile = useCallback(async () => {
    try {
      const file = await window.electronAPI.file.open()
      if (file) {
        setCurrentFile(file)
        setCurrentLanguage(file.language as Language)
        setFileAsDirty(file.filepath, false)
        setOpenFiles((prev) =>
          prev.some((f) => f.filepath === file.filepath) ? prev : [...prev, file]
        )
        addTerminalLine(`Opened: ${file.filename}`, 'info')
        loadRecents()
      }
    } catch (err) {
      addTerminalLine(`Error opening file: ${(err as Error).message}`, 'error')
    }
  }, [addTerminalLine, loadRecents, setFileAsDirty])

  const handleSaveFile = useCallback(async () => {
    if (!currentFile) return
    try {
      await window.electronAPI.file.save({
        filepath: currentFile.filepath,
        content:  currentFile.content,
        language: currentFile.language,
      })
      setFileAsDirty(currentFile.filepath, false)
      addTerminalLine(`Saved: ${currentFile.filename}`, 'success')
    } catch (err) {
      addTerminalLine(`Error saving file: ${(err as Error).message}`, 'error')
    }
  }, [currentFile, addTerminalLine, setFileAsDirty])

  const handleSaveAs = useCallback(async () => {
    if (!currentFile) return
    try {
      const newPath = await window.electronAPI.file.saveDialog()
      if (newPath) {
        await window.electronAPI.file.save({
          filepath: newPath,
          content:  currentFile.content,
          language: currentFile.language,
        })
        const updatedFile = { ...currentFile, filepath: newPath }
        setCurrentFile(updatedFile)
        setFileAsDirty(newPath, false)
        setFileAsDirty(currentFile.filepath, false)
        setOpenFiles((prev) =>
          prev.map((f) => (f.filepath === currentFile.filepath ? updatedFile : f))
        )
        addTerminalLine(`Saved as: ${newPath}`, 'success')
        loadRecents()
      }
    } catch (err) {
      addTerminalLine(`Error saving file: ${(err as Error).message}`, 'error')
    }
  }, [currentFile, addTerminalLine, loadRecents, setFileAsDirty])

  const handleExit = useCallback(() => {
    if (dirtyFiles.size > 0) {
      if (!window.confirm('You have unsaved changes. Exit anyway?')) return
    }
    window.close()
  }, [dirtyFiles])

const handleRunCode = useCallback(async () => {
  if (!currentFile) return
  setIsRunning(true)
  addTerminalLine(`Running ${currentFile.language.toUpperCase()}...`, 'info')

  const cleanLine = (line: string) =>
    line.replace(/\x1B\[[0-9;]*m/g, '').trim()

  try {
    const result = await window.electronAPI.code.run({
      code:     currentFile.content,
      language: currentFile.language,
      fileId:   currentFile._id,
    })
    if (result.output)
      result.output
        .split('\n')
        .filter(Boolean)
        .forEach((l: string) => addTerminalLine(cleanLine(l), 'output'))

    if (result.error)
      result.error
        .split('\n')
        .filter(Boolean)
        .forEach((l: string) => addTerminalLine(cleanLine(l), 'error'))

    addTerminalLine(`Completed in ${result.duration}ms`, 'success')
  } catch (err) {
    addTerminalLine(`Error: ${(err as Error).message}`, 'error')
  } finally {
    setIsRunning(false)
  }
}, [currentFile, addTerminalLine])

  const handleContentChange = useCallback(
    (content: string) => {
      if (currentFile) {
        setCurrentFile({ ...currentFile, content })
        setFileAsDirty(currentFile.filepath, true)
      }
    },
    [currentFile, setFileAsDirty]
  )

  const handleCloseFile = useCallback(
    (filepath: string) => {
      setOpenFiles((prev) => prev.filter((f) => f.filepath !== filepath))
      setFileAsDirty(filepath, false)
      if (currentFile?.filepath === filepath) setCurrentFile(null)
    },
    [currentFile, setFileAsDirty]
  )

  const handleDeleteFile = useCallback(
    (filepath: string) => {
      handleCloseFile(filepath)
      addTerminalLine(`Deleted: ${filepath}`, 'info')
    },
    [handleCloseFile, addTerminalLine]
  )

  const handleCreateFile = useCallback(
    async (filename: string, language: Language) => {
      try {
        const ext = language === 'py' ? '.py' : language === 'c' ? '.c' : '.js'
        const tmpDir = await window.electronAPI.tmpdir()
        const filepath = `${tmpDir}/${filename}${ext}`
        const file = await window.electronAPI.file.create({ filename, language, filepath })
        setCurrentFile(file)
        setCurrentLanguage(language)
        setFileAsDirty(file.filepath, false)
        setShowNewFileModal(false)
        setOpenFiles((prev) => [...prev, file])
        addTerminalLine(`Created: ${file.filename}`, 'success')
        loadRecents()
      } catch (err) {
        addTerminalLine(`Error creating file: ${(err as Error).message}`, 'error')
      }
    },
    [addTerminalLine, loadRecents, setFileAsDirty]
  )

  const handleSelectFile = useCallback((file: FileData) => {
    setCurrentFile(file)
    setCurrentLanguage(file.language as Language)
  }, [])

  // ── Resizer drag ──
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const startY = e.clientY
      const startH = terminalHeight
      const onMove = (ev: MouseEvent) => {
        const delta = startY - ev.clientY
        setTerminalHeight(Math.max(80, Math.min(500, startH + delta)))
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [terminalHeight]
  )

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 's')     { e.preventDefault(); handleSaveFile() }
      if (mod && e.key === 'Enter') { e.preventDefault(); handleRunCode() }
      if (mod && e.key === 'n')     { e.preventDefault(); handleNewFile() }
      if (mod && e.key === 'o')     { e.preventDefault(); handleOpenFile() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSaveFile, handleRunCode, handleNewFile, handleOpenFile])

  const toggleMenu = (name: string) =>
    setActiveMenu((prev) => (prev === name ? null : name))

  const editorHeight = isTerminalCollapsed
    ? '100%'
    : `calc(100% - ${terminalHeight + 36}px)`

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0d1117] text-[#c9d1d9] font-mono">

      {/* ══ TOP BAR ══ */}
      <div className="flex items-center justify-between bg-[#161b22] border-b border-[#30363d] h-10 flex-shrink-0 relative z-50">

        {/* Left — File / Display / Settings */}
        <div className="flex h-full">

          <DropdownMenu label="File" activeMenu={activeMenu} onToggle={toggleMenu}>
            <DdItem onClick={() => { setActiveMenu(null); handleNewFile() }}>New File</DdItem>
            <DdItem onClick={() => { setActiveMenu(null); handleOpenFile() }}>Open File</DdItem>
            <DdSep />
            <DdItem onClick={() => { setActiveMenu(null); handleSaveFile() }}>Save</DdItem>
            <DdItem onClick={() => { setActiveMenu(null); handleSaveAs() }}>Save as</DdItem>
            <DdSep />
            <DdItem onClick={() => { setActiveMenu(null); handleExit() }}>Exit</DdItem>
          </DropdownMenu>

          <DropdownMenu label="Display" activeMenu={activeMenu} onToggle={toggleMenu}>
            <DdItem onClick={() => { setActiveMenu(null); setFontSize(12) }}>Font Size: Small (12)</DdItem>
            <DdItem onClick={() => { setActiveMenu(null); setFontSize(14) }}>Font Size: Medium (14)</DdItem>
            <DdItem onClick={() => { setActiveMenu(null); setFontSize(16) }}>Font Size: Large (16)</DdItem>
            <DdSep />
            <DdItem onClick={() => { setActiveMenu(null); setZoom(90) }}>Zoom: 90%</DdItem>
            <DdItem onClick={() => { setActiveMenu(null); setZoom(100) }}>Zoom: 100%</DdItem>
            <DdItem onClick={() => { setActiveMenu(null); setZoom(110) }}>Zoom: 110%</DdItem>
          </DropdownMenu>

          <DropdownMenu label="Settings" activeMenu={activeMenu} onToggle={toggleMenu}>
            <DdItem onClick={() => { setActiveMenu(null); handleRunCode() }}>Run</DdItem>
            <DdItem onClick={() => { setActiveMenu(null); setIsRunning(false) }}>Stop</DdItem>
            <DdItem onClick={() => { setActiveMenu(null); clearTerminal() }}>Reset Terminal</DdItem>
            <DdSep />
            <DdItem onClick={() => {
              setActiveMenu(null)
              addTerminalLine('Shortcuts: Ctrl+S Save | Ctrl+Enter Run | Ctrl+N New | Ctrl+O Open', 'info')
            }}>
              Help ?
            </DdItem>
          </DropdownMenu>
        </div>

        {/* Center — Language selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8b949e]">Language :</span>
          <select
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value as Language)}
            className="bg-[#21262d] border border-[#30363d] text-[#c9d1d9] text-sm font-mono px-3 py-1 rounded outline-none cursor-pointer hover:border-[#388bfd] transition-colors"
          >
            <option value="js">Javascript</option>
            <option value="py">Python</option>
            <option value="c">C</option>
          </select>
        </div>

        {/* Right — Run / Stop button */}
        <div className="px-3">
          <button
            onClick={isRunning ? () => setIsRunning(false) : handleRunCode}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-mono text-white transition-all active:scale-95 ${
              isRunning
                ? 'bg-[#b62324] hover:bg-[#cf2323]'
                : 'bg-[#238636] hover:bg-[#2ea043]'
            }`}
          >
            {isRunning ? (
              <>
                <span className="w-2.5 h-2.5 bg-white rounded-sm inline-block" />
                Stop
              </>
            ) : (
              <>
                <span
                  className="inline-block"
                  style={{
                    width: 0, height: 0,
                    borderStyle: 'solid',
                    borderWidth: '5px 0 5px 9px',
                    borderColor: 'transparent transparent transparent white',
                  }}
                />
                Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <div className="w-44 bg-[#0d1117] border-r border-[#30363d] flex-shrink-0 overflow-y-auto py-2">
          {openFiles.length === 0 ? (
            <p className="text-xs text-[#484f58] px-3 py-2 leading-relaxed">
              No files open.<br />File → New File
            </p>
          ) : (
            openFiles.map((file) => {
              const isActive = currentFile?.filepath === file.filepath
              const isDirty  = isDirtyFile(file.filepath)
              return (
                <div
                  key={file.filepath}
                  onClick={() => handleSelectFile(file)}
                  title={file.filepath}
                  className={`group flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors border-l-2 ${
                    isActive
                      ? 'bg-[#1f6feb22] text-[#58a6ff] border-[#1f6feb]'
                      : 'text-[#8b949e] border-transparent hover:bg-[#161b22] hover:text-[#c9d1d9]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${fileDotColor(file.language)}`} />
                  <span className="flex-1 truncate">
                    {file.filename}
                    {isDirty && <span className="text-yellow-500 ml-1">●</span>}
                  </span>
                  <span
                    onClick={(e) => { e.stopPropagation(); handleCloseFile(file.filepath) }}
                    className="opacity-0 group-hover:opacity-100 text-[#484f58] hover:text-[#f85149] transition-opacity text-sm leading-none"
                  >
                    ×
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* ── Editor + Terminal ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Editor */}
          <div
            className="overflow-hidden transition-all duration-200"
            style={{ height: editorHeight }}
          >
            {currentFile ? (
              <CodeEditor
                file={currentFile}
                language={currentLanguage}
                onChange={handleContentChange}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-[#0d1117] text-[#8b949e] gap-4">
                <p className="text-base">No file open</p>
                <button
                  onClick={handleNewFile}
                  className="px-4 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white text-sm rounded transition-colors"
                >
                  + Create New File
                </button>
              </div>
            )}
          </div>

          {/* Resizer */}
          {!isTerminalCollapsed && (
            <div
              onMouseDown={handleMouseDown}
              className="h-1 bg-[#21262d] hover:bg-[#1f6feb] cursor-row-resize flex-shrink-0 transition-colors"
            />
          )}

          {/* Terminal */}
          {!isTerminalCollapsed ? (
            <div
              className="bg-[#010409] border-t border-[#30363d] flex flex-col flex-shrink-0 overflow-hidden"
              style={{ height: terminalHeight }}
            >
              {/* Terminal header */}
              <div className="flex items-center justify-between px-3 py-1 bg-[#0d1117] border-b border-[#21262d] flex-shrink-0">
                <span className="text-xs text-[#8b949e] tracking-wide">Terminal</span>
                <div className="flex gap-2">
                  <button
                    onClick={clearTerminal}
                    className="text-xs font-mono text-[#484f58] hover:text-[#c9d1d9] border border-[#21262d] hover:bg-[#21262d] px-2 py-0.5 rounded transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsTerminalCollapsed(true)}
                    className="text-xs font-mono text-[#484f58] hover:text-[#c9d1d9] border border-[#21262d] hover:bg-[#21262d] px-2 py-0.5 rounded transition-colors"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Terminal lines */}
              <div ref={termBodyRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                {terminalLines.map((line) => (
                  <TermLine key={line.id} line={line} />
                ))}
                {isRunning && (
                  <div className="flex gap-4 font-mono text-xs leading-7">
                    <span className="text-[#484f58] shrink-0">{getTimestamp()}</span>
                    <span className="text-[#58a6ff] animate-pulse">&gt;&gt; Running...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsTerminalCollapsed(false)}
              className="h-8 w-full bg-[#161b22] border-t border-[#30363d] text-xs font-mono text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] flex items-center justify-center flex-shrink-0 transition-colors"
            >
              ▲ Terminal (collapsed)
            </button>
          )}
        </div>
      </div>

      {/* ══ MODAL ══ */}
      {showNewFileModal && (
        <NewFileModal
          onCreate={handleCreateFile}
          onClose={() => setShowNewFileModal(false)}
        />
      )}
    </div>
  )
}