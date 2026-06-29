import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ZoomIn, ZoomOut, FileText, Image as ImageIcon, FileQuestion } from 'lucide-react';
import toast from 'react-hot-toast';
import { Document, Page, pdfjs } from 'react-pdf';
import { api } from '../api/client';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

function FileViewerPage() {
  const getFriendlyErrorMessage = (fallback) => fallback || 'Something went wrong. Please try again.';
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [metadata, setMetadata] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [pdfSource, setPdfSource] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ start: 1, end: 3 });
  const viewerRef = useRef(null);

  const fileType = useMemo(() => {
    const name = String(metadata?.originalName || '').toLowerCase();
    const mime = String(metadata?.mimeType || '').toLowerCase();
    if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
    if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return 'image';
    if (mime.includes('text') || name.endsWith('.txt') || name.endsWith('.json') || name.endsWith('.csv')) return 'text';
    return 'unsupported';
  }, [metadata]);

  useEffect(() => {
    let objectUrl = '';

    const loadFile = async () => {
      setLoading(true);
      setPdfLoadError(false);
      setTextContent('');
      setNumPages(0);
      setPdfSource(null);
      setFileUrl('');
      try {
        const metaRes = await api.get(`/pdf/${id}`);
        const meta = metaRes.data;
        setMetadata(meta);

        const mime = String(meta?.mimeType || '').toLowerCase();
        const name = String(meta?.originalName || '').toLowerCase();
        const token = localStorage.getItem('token') || '';
        const baseURL = api.defaults.baseURL || '';
        const contentUrl = `${baseURL}/pdf/${id}/content`;

        // Use direct authenticated source for PDFs to avoid corrupted blob rendering edge cases.
        if (mime.includes('pdf') || name.endsWith('.pdf')) {
          setPdfSource({
            url: contentUrl,
            httpHeaders: token ? { Authorization: `Bearer ${token}` } : {},
          });
          setFileUrl(contentUrl);
          return;
        }

        const fileRes = await api.get(`/pdf/${id}/content`, { responseType: 'arraybuffer' });
        const responseMime = String(fileRes.headers?.['content-type'] || '').toLowerCase();
        const blobMime = responseMime || mime || 'application/octet-stream';
        const blob = new Blob([fileRes.data], { type: blobMime });
        objectUrl = URL.createObjectURL(blob);
        setFileUrl(objectUrl);

        const isText = mime.includes('text') || name.endsWith('.txt') || name.endsWith('.json') || name.endsWith('.csv');
        if (isText) {
          const text = await blob.text();
          setTextContent(text);
        }
      } catch {
        toast.error(getFriendlyErrorMessage('Failed to open file'));
      } finally {
        setLoading(false);
      }
    };

    loadFile();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  const zoomIn = () => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))));
  const zoomOut = () => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))));

  useEffect(() => {
    const node = viewerRef.current;
    if (!node || fileType !== 'pdf' || !numPages) return;

    const updateRange = () => {
      const estimatedPageHeight = Math.max(500, Math.round(1050 * zoom));
      const start = Math.max(1, Math.floor(node.scrollTop / estimatedPageHeight));
      const visibleCount = Math.max(3, Math.ceil(node.clientHeight / estimatedPageHeight) + 2);
      const end = Math.min(numPages, start + visibleCount);
      setVisibleRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };

    updateRange();
    node.addEventListener('scroll', updateRange);
    return () => node.removeEventListener('scroll', updateRange);
  }, [fileType, numPages, zoom]);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 flex items-center justify-between"
      >
        <div className="min-w-0">
          <button
            onClick={() => navigate('/teacher/upload-pdf')}
            className="mb-2 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white"
          >
            <ArrowLeft size={16} /> Back to uploads
          </button>
          <h1 className="text-lg md:text-xl font-bold text-white truncate">
            {metadata?.originalName || 'File viewer'}
          </h1>
          <p className="text-xs text-gray-400">
            {metadata?.mimeType || 'Unknown file type'}{numPages > 0 ? ` • ${numPages} pages` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white">
            <ZoomOut size={18} />
          </button>
          <span className="text-sm text-gray-300 min-w-14 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white">
            <ZoomIn size={18} />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        ref={viewerRef}
        className="glass rounded-2xl flex-1 overflow-auto p-4 md:p-6"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400">Loading file...</div>
        ) : !fileUrl ? (
          <div className="h-full flex items-center justify-center text-red-400">Unable to open this file.</div>
        ) : fileType === 'pdf' ? (
          <div className="space-y-5">
            <Document
              file={pdfSource || fileUrl}
              onLoadSuccess={({ numPages: pages }) => setNumPages(pages)}
              onLoadError={() => {
                setPdfLoadError(true);
                toast.error('Failed to load PDF file.');
              }}
              loading={<div className="text-gray-400">Preparing PDF...</div>}
            >
              {Array.from(
                { length: Math.max(0, (visibleRange.end || 1) - (visibleRange.start || 1) + 1) },
                (_, i) => (visibleRange.start || 1) + i
              ).map((pageNumber) => (
                <div key={pageNumber} className="flex justify-center">
                  <Page
                    pageNumber={pageNumber}
                    scale={zoom}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-2xl border border-white/10"
                  />
                </div>
              ))}
            </Document>
            {pdfLoadError && (
              <div className="text-center text-sm text-orange-300">
                PDF preview failed in renderer. You can still open it directly.
                <button
                  onClick={() => {
                    const token = localStorage.getItem('token') || '';
                    const baseURL = api.defaults.baseURL || '';
                    const contentUrl = `${baseURL}/pdf/${id}/content`;
                    if (!token) {
                      window.open(contentUrl, '_blank', 'noopener,noreferrer');
                      return;
                    }
                    api
                      .get(`/pdf/${id}/content`, { responseType: 'blob' })
                      .then((res) => {
                        const directBlobUrl = URL.createObjectURL(res.data);
                        window.open(directBlobUrl, '_blank', 'noopener,noreferrer');
                        setTimeout(() => URL.revokeObjectURL(directBlobUrl), 60_000);
                      })
                      .catch(() => toast.error('Unable to open PDF directly.'));
                  }}
                  className="ml-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  Open PDF
                </button>
              </div>
            )}
          </div>
        ) : fileType === 'image' ? (
          <div className="h-full flex justify-center">
            <img
              src={fileUrl}
              alt={metadata?.originalName || 'Uploaded file'}
              className="max-w-full h-auto rounded-xl border border-white/10 shadow-xl"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            />
          </div>
        ) : fileType === 'text' ? (
          <pre
            className="w-full h-full text-sm text-gray-200 whitespace-pre-wrap break-words p-4 bg-black/20 rounded-xl border border-white/10"
            style={{ fontSize: `${Math.max(12, Math.round(14 * zoom))}px`, lineHeight: 1.5 }}
          >
            {textContent || metadata?.extractedTextPreview || 'Text file is empty.'}
          </pre>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <FileQuestion size={42} className="text-gray-500 mb-3" />
            <p className="text-white font-semibold mb-1">Preview not supported</p>
            <p className="text-gray-400 text-sm">Only PDF, image, and text files can be previewed here.</p>
          </div>
        )}
      </motion.div>

      <div className="text-xs text-gray-500 flex items-center gap-3">
        <span className="inline-flex items-center gap-1"><FileText size={12} /> PDF/Text</span>
        <span className="inline-flex items-center gap-1"><ImageIcon size={12} /> Images</span>
        <span>Scroll to navigate content</span>
      </div>
    </div>
  );
}

export default FileViewerPage;
