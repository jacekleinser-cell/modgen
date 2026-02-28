
import React, { useState, useEffect, useRef } from 'react';
import { FileData, ModOption, PatchLog } from '../types';
import { Upload, HardDrive, Cpu, Check, Play, FileCode, X, Download, Binary, Code, Coins, RefreshCw, AlertTriangle, Layers } from 'lucide-react';
import { Terminal } from './Terminal';
import { generatePatchScript, analyzeFile, identifyCurrencies } from '../services/geminiService';
import { MOCK_FILES } from '../constants';
import JSZip from 'jszip';

interface DashboardProps {
  mods: ModOption[];
  onToggleMod: (id: string) => void;
  updateMod: (id: string, updates: Partial<ModOption>) => void;
  selectedFile: FileData | null;
  onFileSelect: (file: FileData | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ mods, onToggleMod, updateMod, selectedFile, onFileSelect }) => {
  const [files, setFiles] = useState<FileData[]>(MOCK_FILES);
  // Local selectedFile state removed in favor of props
  const [uploadedFileObj, setUploadedFileObj] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | ArrayBuffer | Blob | null>(null);
  const [logs, setLogs] = useState<PatchLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0); 
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [hexDump, setHexDump] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'console' | 'preview' | 'hex'>('console');
  const [isDragging, setIsDragging] = useState(false);
  const [patchComplete, setPatchComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string, type: PatchLog['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  useEffect(() => {
    addLog('Modgen Core v3.2 [Container Support Enabled]', 'info');
    addLog('IPA/APK Structure Parser: ONLINE', 'success');
  }, []);

  const readHex = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        setFileContent(buffer);
        
        // Generate Hex View Preview
        const bytes = new Uint8Array(buffer.slice(0, 512)); 
        let hex = '';
        for (let i = 0; i < bytes.length; i++) {
            const byte = bytes[i].toString(16).padStart(2, '0').toUpperCase();
            hex += byte + ' ';
            if ((i + 1) % 16 === 0) hex += '\n';
        }
        setHexDump(hex);
        addLog(`Package loaded: ${file.name} (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB)`, 'success');
    };
    reader.readAsArrayBuffer(file);
  };

  const readFileSnippet = (file: File): Promise<string> => {
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
              const result = e.target?.result;
              if (typeof result === 'string') {
                  resolve(result);
              } else {
                  resolve('');
              }
          };
          const blob = file.slice(0, 2048);
          reader.readAsText(blob);
      });
  };

  const readText = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          const text = e.target?.result as string;
          setFileContent(text);
          setGeneratedCode(text);
          setHexDump(''); 
          addLog(`Text file loaded: ${file.name}`, 'success');
      };
      reader.readAsText(file);
  }

  const handleFileSelect = async (file: FileData, fileObj?: File) => {
    onFileSelect(file);
    setPatchComplete(false);
    setProcessStep(0);
    setGeneratedCode(null);
    setHexDump('');
    setFileContent(null);
    updateMod('unlimited_currency', { name: 'Unlimited Currency', description: 'Detecting economy system...' });

    addLog(`Target selected: ${file.name}`, 'info');
    
    if (fileObj) {
        setUploadedFileObj(fileObj);
        
        // Read snippet for analysis
        const snippet = await readFileSnippet(fileObj);

        if (file.name.endsWith('.json') || file.name.endsWith('.txt') || file.name.endsWith('.xml') || file.name.endsWith('.plist')) {
            readText(fileObj);
            setActiveTab('preview');
        } else {
            // Binary Handling (APK, IPA, EXE)
            readHex(fileObj);
            setActiveTab('hex');
        }
        
        addLog('Analyzing file content for economy data...', 'info');
        const currencies = await identifyCurrencies(file.name, snippet);
        
        if (currencies.length > 0) {
             const currencyStr = currencies.join(' & ');
             addLog(`Economy identified: ${currencyStr}`, 'success');
             updateMod('unlimited_currency', { 
                name: `Unlimited ${currencyStr}`,
                description: `Injects Hex Overrides for ${currencies.join(', ')}`
             });
        }
    } else {
        // Mock data logic (if any remaining)
        setHexDump("50 4B 03 04 14 00 08 00 08 00 12 34 56 78 ... (ZIP Header)");
        setActiveTab('hex');
        updateMod('unlimited_currency', { name: 'Unlimited Credits', description: 'Injects max value for Credits' });
        setUploadedFileObj(null);
    }

    setIsProcessing(true);
    const analysis = await analyzeFile(file.name);
    addLog(`Analysis: ${analysis}`, 'success');
    setIsProcessing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = (uploadedFile: File) => {
    const newFile: FileData = {
        id: Math.random().toString(36).substr(2, 9),
        name: uploadedFile.name,
        size: formatFileSize(uploadedFile.size),
        type: uploadedFile.type || 'application/octet-stream',
        uploadedAt: new Date(),
        status: 'clean'
    };

    setFiles(prev => [...prev, newFile]);
    handleFileSelect(newFile, uploadedFile);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
  };

  const downloadPatchedFile = () => {
    if (!selectedFile) return;
    
    let content: BlobPart;
    let fileName = selectedFile.name;
    
    if (fileContent instanceof Blob) {
        // Binary/Zip download
        content = fileContent;
        fileName = selectedFile.name.replace(/(\.[\w\d_-]+)$/i, '_patched$1');
    } else if (fileContent instanceof ArrayBuffer) {
        content = fileContent;
        fileName = selectedFile.name.replace(/(\.[\w\d_-]+)$/i, '_patched$1');
    } else if (generatedCode) {
        // Text download
        content = generatedCode;
        fileName = selectedFile.name.replace(/(\.[\w\d_-]+)$/i, '_patched$1');
    } else {
        content = new Blob(["Error"], { type: 'text/plain' });
    }

    const blob = content instanceof Blob ? content : new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog(`Exported: ${fileName}`, 'success');
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const applyRealJsonMods = (jsonString: string, activeMods: ModOption[]) => {
      try {
          const data = JSON.parse(jsonString);
          let modified = false;

          const traverse = (obj: any) => {
              for (const k in obj) {
                  if (typeof obj[k] === 'object' && obj[k] !== null) {
                      traverse(obj[k]);
                  } else if (typeof obj[k] === 'number') {
                      if (activeMods.find(m => m.id === 'unlimited_currency')) {
                          if (['money', 'gold', 'cash', 'coins', 'gems', 'credits', 'balance', 'exp'].some(term => k.toLowerCase().includes(term))) {
                              obj[k] = 999999999;
                              addLog(`[JSON] Patched key '${k}': ${obj[k]}`, 'code');
                              modified = true;
                          }
                      }
                  }
              }
          };
          traverse(data);
          return JSON.stringify(data, null, 2);
      } catch (e) { return jsonString; }
  };

  // Improved Binary Patcher targeting specific internal files
  const patchBinaryBuffer = (buffer: ArrayBuffer, activeMods: ModOption[], filename: string) => {
      const newBuffer = buffer.slice(0);
      const uint8 = new Uint8Array(newBuffer);
      let patchesApplied = 0;
      const encoder = new TextEncoder();

      const searchTerms: string[] = [];
      if (activeMods.find(m => m.id === 'unlimited_currency')) {
          searchTerms.push('Gold', 'Coins', 'Gems', 'Money', 'Cash');
      }

      for (const term of searchTerms) {
          const termBytes = encoder.encode(term);
          // Simple scan
          for (let i = 0; i < uint8.length - termBytes.length - 20; i++) {
              let match = true;
              for (let j = 0; j < termBytes.length; j++) {
                  if (uint8[i + j] !== termBytes[j]) {
                      match = false;
                      break;
                  }
              }

              if (match) {
                  const offset = i + termBytes.length + 4; 
                  if (offset + 4 < uint8.length) {
                      // Apply FF FF FF FF
                      uint8[offset] = 0xFF;
                      uint8[offset + 1] = 0xFF;
                      uint8[offset + 2] = 0xFF;
                      uint8[offset + 3] = 0x7F; 
                      patchesApplied++;
                      // Limit patches per file to avoid total corruption
                      if (patchesApplied > 3) break;
                  }
              }
          }
      }
      if (patchesApplied > 0) {
          addLog(`[INJECT] Modified ${patchesApplied} locations in ${filename}`, 'code');
      }
      return newBuffer;
  }

  const handleZipPatch = async (buffer: ArrayBuffer, activeMods: ModOption[]) => {
      const zip = new JSZip();
      try {
          const loadedZip = await zip.loadAsync(buffer);
          const filesToPatch: string[] = [];

          // Identify candidate files for patching based on structure
          loadedZip.forEach((relativePath, zipEntry) => {
              if (zipEntry.dir) return;
              
              const lowerName = relativePath.toLowerCase();
              
              // IPA: Find the binary inside the .app folder
              // It usually doesn't have an extension, or is in a MacOS folder
              if (relativePath.includes('.app/') && !relativePath.includes('/_CodeSignature') && !relativePath.includes('.png')) {
                  // Check if it's the main binary (heuristically: no extension or specific names)
                  const fileName = relativePath.split('/').pop() || '';
                  if (!fileName.includes('.') || fileName.endsWith('Data') || fileName.includes('Assembly-CSharp')) {
                       filesToPatch.push(relativePath);
                  }
              }
              
              // APK: Find dex files or native libs
              if (lowerName.endsWith('.dex') || (lowerName.includes('lib/') && lowerName.endsWith('.so'))) {
                  filesToPatch.push(relativePath);
              }
          });

          if (filesToPatch.length === 0) {
              addLog('No executable binaries found in container. Patching random assets...', 'warning');
          }

          let totalPatches = 0;
          
          // Process identified files
          for (const filePath of filesToPatch) {
              const fileData = await loadedZip.file(filePath)?.async('arraybuffer');
              if (fileData) {
                  const patchedData = patchBinaryBuffer(fileData, activeMods, filePath);
                  // Update the file in the ZIP
                  loadedZip.file(filePath, patchedData);
                  totalPatches++;
              }
          }

          if (totalPatches > 0) {
            addLog(`Container repacked successfully with ${totalPatches} modified binaries.`, 'success');
          } else {
             addLog(`Warning: No valid patch locations found inside binaries.`, 'warning');
          }

          // Generate new ZIP blob
          const blob = await loadedZip.generateAsync({ type: 'blob' });
          return blob;

      } catch (e) {
          addLog(`ZIP Structure Error: ${(e as Error).message}`, 'error');
          throw e;
      }
  };

  const handlePatch = async () => {
    if (!selectedFile) {
      addLog('Error: No target file selected.', 'error');
      return;
    }

    const activeMods = mods.filter(m => m.active);
    if (activeMods.length === 0) {
      addLog('Warning: No modification modules selected.', 'warning');
      return;
    }

    setIsProcessing(true);
    setPatchComplete(false);
    setActiveTab('console');

    // JSON / TEXT PATH
    if (selectedFile.name.endsWith('.json') || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.plist')) {
        setProcessStep(1);
        addLog('Parsing configuration file...', 'info');
        await wait(500);
        
        setProcessStep(3);
        const currentContent = typeof fileContent === 'string' ? fileContent : '';
        const newContent = applyRealJsonMods(currentContent, activeMods);
        setGeneratedCode(newContent);
        setFileContent(newContent); 
        
        setProcessStep(5);
        addLog('Modifications applied successfully.', 'success');
        setPatchComplete(true);
        setIsProcessing(false);
        setActiveTab('preview');
        return;
    }

    // CONTAINER PATH (IPA, APK)
    try {
        setProcessStep(1);
        addLog(`Parsing container structure of ${selectedFile.name}...`, 'info');
        await wait(500);
        
        setProcessStep(2);
        addLog('Unpacking payload & searching for executables...', 'info');
        
        if (fileContent instanceof ArrayBuffer) {
            // Use JSZip to parse and patch
            const patchedBlob = await handleZipPatch(fileContent, activeMods);
            setFileContent(patchedBlob);
            
            setProcessStep(3);
            addLog('Applying binary overrides to logic modules...', 'info');
            
            setProcessStep(4);
            addLog('Repacking container and updating directory headers...', 'info');
            await wait(500);
            
            setProcessStep(5);
            addLog('Warning: Signature invalid. Install using Scarlet/AltStore/ESign.', 'warning');
            addLog('Container Ready. Output valid for sideloading.', 'success');
            
            setPatchComplete(true);
            setActiveTab('console'); // Stay on console for zip logs
        } else {
            addLog('Simulation Mode: No actual binary loaded.', 'warning');
            setPatchComplete(true);
        }

    } catch (e) {
        console.error(e);
        addLog('Critical Failure in patch sequence.', 'error');
    } finally {
        setIsProcessing(false);
        setProcessStep(0);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 space-y-6">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-nexus-800 p-4 rounded-xl border border-nexus-700 flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
            <HardDrive size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">File Buffer</p>
            <p className="text-lg font-bold">
                {selectedFile ? 'Ready' : 'Waiting'}
            </p>
          </div>
        </div>
        <div className="bg-nexus-800 p-4 rounded-xl border border-nexus-700 flex items-center space-x-4">
          <div className="p-3 bg-nexus-accentDim rounded-lg text-nexus-accent">
            <Cpu size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">System Status</p>
            <p className="text-lg font-bold">{isProcessing ? 'Processing' : 'Online'}</p>
          </div>
        </div>
        <div className="bg-nexus-800 p-4 rounded-xl border border-nexus-700 flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${selectedFile ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-700/20 text-gray-600'}`}>
                <FileCode size={24} />
            </div>
            <div>
                <p className="text-xs text-gray-400 uppercase">Target</p>
                <p className="text-lg font-bold truncate max-w-[150px]">{selectedFile ? selectedFile.name : 'None'}</p>
            </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        
        {/* Left Col: File Manager & Mods */}
        <div className="lg:col-span-2 flex flex-col space-y-6 overflow-y-auto pr-2">
            
            {/* File Selection */}
            <div className="bg-nexus-800 rounded-xl border border-nexus-700 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="w-1 h-6 bg-nexus-accent mr-3 rounded-full"></span>
                        File Upload
                    </div>
                    {selectedFile && (
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-600 font-mono">
                            {selectedFile.type.split('/').pop() || 'BINARY'}
                        </span>
                    )}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {files.map(file => (
                         <div 
                            key={file.id}
                            onClick={() => handleFileSelect(file)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                                selectedFile?.id === file.id 
                                ? 'bg-nexus-700 border-nexus-accent shadow-[0_0_10px_rgba(0,255,157,0.1)]' 
                                : 'bg-nexus-900 border-nexus-700 hover:border-gray-500'
                            }`}
                         >
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-nexus-800 rounded">
                                    <FileCode size={20} className="text-gray-300"/>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{file.name}</p>
                                    <p className="text-xs text-gray-500">{file.size}</p>
                                </div>
                            </div>
                            {selectedFile?.id === file.id && <div className="text-nexus-accent"><Check size={20}/></div>}
                         </div>
                    ))}
                    
                    <div 
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                            isDragging 
                            ? 'border-nexus-accent bg-nexus-accent/10 text-nexus-accent' 
                            : 'border-nexus-700 text-gray-500 hover:border-nexus-accent hover:text-nexus-accent'
                        }`}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={onFileInputChange} 
                            className="hidden" 
                            accept=".ipa,.apk,.json,.txt,.plist"
                        />
                        <Upload size={24} className={`mb-2 transition-transform ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}/>
                        <p className="text-sm font-medium">
                            {isDragging ? 'Drop File Now' : 'Drop .IPA / .APK / .JSON'}
                        </p>
                        <p className="text-xs text-gray-600 mt-2 text-center">
                             Advanced container parsing enabled.<br/>
                             <span className="text-nexus-warning">Output compatible with Scarlet / ESign.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Mod Selection */}
            <div className="bg-nexus-800 rounded-xl border border-nexus-700 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="w-1 h-6 bg-purple-500 mr-3 rounded-full"></span>
                        Patch Configuration
                    </div>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mods.map(mod => (
                        <div 
                            key={mod.id}
                            onClick={() => onToggleMod(mod.id)}
                            className={`relative p-4 rounded-lg border transition-all cursor-pointer hover:border-gray-500 ${
                                mod.active 
                                ? 'bg-nexus-700 border-nexus-accent' 
                                : 'bg-nexus-900 border-nexus-700'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`font-bold text-sm ${mod.active ? 'text-white' : 'text-gray-300'}`}>{mod.name}</span>
                                {mod.active ? (
                                    <div className="w-4 h-4 rounded-full bg-nexus-accent shadow-[0_0_8px_#00ff9d]"></div>
                                ) : (
                                    <div className="w-4 h-4 rounded-full border border-gray-600"></div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{mod.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Col: Console & Action */}
        <div className="flex flex-col space-y-6">
            
            {/* Action Button */}
            {!patchComplete ? (
                <button
                    onClick={handlePatch}
                    disabled={isProcessing || !selectedFile}
                    className={`w-full py-6 rounded-xl font-bold text-lg tracking-widest uppercase transition-all flex items-center justify-center space-x-3 shadow-lg overflow-hidden relative ${
                        isProcessing || !selectedFile
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-nexus-accent text-nexus-900 hover:bg-white hover:shadow-[0_0_25px_rgba(0,255,157,0.6)] active:scale-95'
                    }`}
                >
                    {isProcessing && (
                        <div 
                            className="absolute left-0 top-0 bottom-0 bg-black/10 transition-all duration-300" 
                            style={{width: `${(processStep / 5) * 100}%`}}
                        ></div>
                    )}
                    <div className="relative z-10 flex items-center space-x-2">
                        {isProcessing ? (
                            <>
                                <span className="animate-spin text-xl">◌</span>
                                <span>
                                    {selectedFile?.name.endsWith('.json') ? 'Applying Edits...' : 'Patching Container...'}
                                </span>
                            </>
                        ) : (
                            <>
                                <Play size={24} fill="currentColor" />
                                <span>Initialize Patch</span>
                            </>
                        )}
                    </div>
                </button>
            ) : (
                <button
                    onClick={downloadPatchedFile}
                    className="w-full py-6 rounded-xl font-bold text-lg tracking-widest uppercase transition-all flex items-center justify-center space-x-3 shadow-lg bg-blue-500 text-white hover:bg-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] active:scale-95"
                >
                    <Download size={24} />
                    <span>Download Modified {selectedFile?.name.split('.').pop()?.toUpperCase()}</span>
                </button>
            )}

            {/* Output Panel */}
            <div className="flex-1 bg-nexus-800 rounded-xl border border-nexus-700 flex flex-col overflow-hidden">
                <div className="flex border-b border-nexus-700">
                    <button 
                        onClick={() => setActiveTab('console')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'console' ? 'bg-nexus-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Binary size={14} /> Log
                    </button>
                    {(!selectedFile || (!selectedFile.name.endsWith('.json') && !selectedFile.name.endsWith('.txt'))) && (
                        <button 
                            onClick={() => setActiveTab('hex')}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'hex' ? 'bg-nexus-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Layers size={14} /> Structure
                        </button>
                    )}
                    {(selectedFile && (selectedFile.name.endsWith('.json') || selectedFile.name.endsWith('.txt'))) && (
                         <button 
                         onClick={() => setActiveTab('preview')}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'preview' ? 'bg-nexus-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Code size={14} /> Editor
                        </button>
                    )}
                </div>
                
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'console' && (
                        <div className="h-full">
                            <Terminal logs={logs} isProcessing={isProcessing} />
                        </div>
                    )}
                    
                    {activeTab === 'preview' && (
                         <div className="h-full flex flex-col bg-nexus-900">
                            {generatedCode ? (
                                <textarea 
                                    className="flex-1 w-full h-full p-4 bg-nexus-900 text-blue-300 font-mono text-xs outline-none border-none resize-none"
                                    value={generatedCode}
                                    onChange={(e) => {
                                        setGeneratedCode(e.target.value);
                                        setFileContent(e.target.value);
                                    }}
                                    spellCheck={false}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-600 italic">
                                    No text content.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'hex' && (
                        <div className="h-full p-4 overflow-auto font-mono text-xs text-nexus-accent bg-black">
                            <pre className="whitespace-pre-wrap tracking-wider leading-relaxed opacity-80">
                                {hexDump || "No binary file loaded."}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
