import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWdsData } from '../context/WdsDataContext';
import {
  OLAG_CLASSES,
  formatBytes,
  validateUploadFile,
  isValidHttpUrl,
} from '../utils/validation';
import { uploadSubmissionMedia, wdsService } from '../services/wdsService';
import { HumanVerification } from './HumanVerification';
import {
  X,
  FolderUp,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';
import { DocumentCategory, NewsCategory, WritingCategory } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'document' | 'writing' | 'news';
  onSubmitted?: (tab: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'document',
  onSubmitted,
}) => {
  const { sessionToken, visitorPrefs, saveVisitorPrefs } = useAuth();
  const { settings } = useWdsData();

  const [uploadType, setUploadType] = useState<'document' | 'writing' | 'news'>(defaultMode);
  const [authorName, setAuthorName] = useState(visitorPrefs.displayName || '');
  const [authorClass, setAuthorClass] = useState(visitorPrefs.authorClass || OLAG_CLASSES[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Document state
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('Debate Brief');
  const [docFormat, setDocFormat] = useState('PDF');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTextContent, setDocTextContent] = useState('');

  // Writing state
  const [writingTitle, setWritingTitle] = useState('');
  const [writingSubtitle, setWritingSubtitle] = useState('');
  const [writingCategory, setWritingCategory] = useState<WritingCategory>('poem');
  const [writingContent, setWritingContent] = useState('');
  const [writingImageUrl, setWritingImageUrl] = useState('');
  const [writingImageFile, setWritingImageFile] = useState<File | null>(null);

  // News state
  const [articleTitle, setArticleTitle] = useState('');
  const [articleExcerpt, setArticleExcerpt] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleCategory, setArticleCategory] = useState<NewsCategory>('General student news');
  const [articleImageUrl, setArticleImageUrl] = useState('');
  const [articleImageFile, setArticleImageFile] = useState<File | null>(null);

  // Bot protection + UX state
  const [humanVerified, setHumanVerified] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  useEffect(() => {
    setUploadType(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (visitorPrefs.displayName) setAuthorName(visitorPrefs.displayName);
    if (visitorPrefs.authorClass) setAuthorClass(visitorPrefs.authorClass);
  }, [visitorPrefs]);

  if (!isOpen) return null;

  const handleSelectDocFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedbackError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateUploadFile(file, 'document');
    if (err) {
      setFeedbackError(err);
      return;
    }
    setDocFile(file);
    const ext = file.name.split('.').pop()?.toUpperCase();
    if (ext) setDocFormat(ext);
  };

  const handleSelectImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void
  ) => {
    setFeedbackError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateUploadFile(file, 'image');
    if (err) {
      setFeedbackError(err);
      return;
    }
    setFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError('');
    setFeedbackSuccess('');

    if (!settings.allowPublicSubmissions) {
      setFeedbackError('Public submissions are temporarily paused by school administrators.');
      return;
    }

    if (!isAnonymous && authorName.trim().length < 2) {
      setFeedbackError('Please enter your display name or select "Submit Anonymously".');
      return;
    }

    setSubmitting(true);
    try {
      if (!isAnonymous && authorName.trim()) {
        saveVisitorPrefs(authorName.trim(), authorClass);
      }

      if (uploadType === 'document') {
        if (!docTitle.trim() || docDescription.trim().length < 10) {
          throw new Error('Please enter a title and an abstract (at least 10 characters).');
        }
        if (!docFile && docTextContent.trim().length < 20) {
          throw new Error('Please attach a PDF/DOCX/TXT file or paste full document text (at least 20 characters).');
        }

        let uploadedFileUrl = '';
        let uploadedStoragePath = '';
        if (docFile) {
          try {
            const up = await uploadSubmissionMedia(docFile, 'document', sessionToken);
            uploadedFileUrl = up.url;
            uploadedStoragePath = up.storagePath;
          } catch (storageErr) {
            const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
            if (!docTextContent.trim()) {
              throw new Error(
                `File storage upload could not complete (${msg}). You can paste the document text below so moderators can still review and publish it.`
              );
            }
          }
        }

        const safeFileName =
          docFile?.name || `${docTitle.trim().replace(/[^a-zA-Z0-9]+/g, '_')}.${docFormat.toLowerCase()}`;
        const computedSize = docFile
          ? formatBytes(docFile.size)
          : formatBytes(new Blob([docTextContent || docDescription]).size);

        await wdsService.submitPublicContribution({
          submissionType: 'document',
          title: docTitle.trim(),
          excerpt: docDescription.trim(),
          content: docTextContent.trim() || docDescription.trim(),
          category: docCategory,
          displayName: authorName.trim(),
          authorClass,
          isAnonymous,
          fileUrl: uploadedFileUrl || undefined,
          storagePath: uploadedStoragePath || undefined,
          fileName: safeFileName,
          fileSize: computedSize,
          fileFormat: docFormat,
          sessionToken,
          botChallengeVerified: humanVerified,
          honeypot,
        });

        setDocTitle('');
        setDocDescription('');
        setDocFile(null);
        setDocTextContent('');
        setFeedbackSuccess(
          'Submitted for moderation! Your document has entered the WDS review queue and will appear in the repository once approved by an editor or moderator.'
        );
      } else if (uploadType === 'writing') {
        if (!writingTitle.trim() || writingContent.trim().length < 20) {
          throw new Error('Manuscript title and text (at least 20 characters) are required.');
        }
        if (writingImageUrl.trim() && !isValidHttpUrl(writingImageUrl)) {
          throw new Error('Cover image URL must start with http:// or https://.');
        }

        let finalImageUrl = writingImageUrl.trim();
        let finalStoragePath = '';
        if (writingImageFile) {
          const up = await uploadSubmissionMedia(writingImageFile, 'image', sessionToken);
          finalImageUrl = up.url;
          finalStoragePath = up.storagePath;
        }

        await wdsService.submitPublicContribution({
          submissionType: writingCategory as 'poem' | 'short_story' | 'essay' | 'reflection' | 'creative_writing',
          title: writingTitle.trim(),
          excerpt: writingSubtitle.trim() || undefined,
          content: writingContent.trim(),
          category: writingCategory,
          displayName: authorName.trim(),
          authorClass,
          isAnonymous,
          imageUrl: finalImageUrl || undefined,
          storagePath: finalStoragePath || undefined,
          sessionToken,
          botChallengeVerified: humanVerified,
          honeypot,
        });

        setWritingTitle('');
        setWritingSubtitle('');
        setWritingContent('');
        setWritingImageUrl('');
        setWritingImageFile(null);
        setFeedbackSuccess(
          "Submitted for moderation! Your manuscript is in the WDS editorial queue and will appear in the Writers' Corner upon approval."
        );
      } else {
        if (!articleTitle.trim() || articleExcerpt.trim().length < 10 || articleContent.trim().length < 20) {
          throw new Error('Headline, summary excerpt (min 10 chars), and article text (min 20 chars) are required.');
        }
        if (articleImageUrl.trim() && !isValidHttpUrl(articleImageUrl)) {
          throw new Error('Cover photo URL must start with http:// or https://.');
        }

        let finalImageUrl = articleImageUrl.trim();
        let finalStoragePath = '';
        if (articleImageFile) {
          const up = await uploadSubmissionMedia(articleImageFile, 'image', sessionToken);
          finalImageUrl = up.url;
          finalStoragePath = up.storagePath;
        }

        await wdsService.submitPublicContribution({
          submissionType: 'news',
          title: articleTitle.trim(),
          excerpt: articleExcerpt.trim(),
          content: articleContent.trim(),
          category: articleCategory,
          displayName: authorName.trim(),
          authorClass,
          isAnonymous,
          imageUrl: finalImageUrl || undefined,
          storagePath: finalStoragePath || undefined,
          sessionToken,
          botChallengeVerified: humanVerified,
          honeypot,
        });

        setArticleTitle('');
        setArticleExcerpt('');
        setArticleContent('');
        setArticleImageUrl('');
        setArticleImageFile(null);
        setFeedbackSuccess(
          'Submitted for moderation! Your article will be reviewed by a WDS Editor or Moderator before appearing in the OLAG Gazette.'
        );
      }

      setHoneypot('');
      if (onSubmitted) {
        setTimeout(() => {
          onSubmitted(uploadType === 'news' ? 'news' : uploadType === 'writing' ? 'writters' : 'documents');
        }, 1600);
      }
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Unable to submit contribution.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
              <FolderUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-crest font-bold text-base">Public Contribution Portal</h3>
              <p className="text-[11px] text-slate-300 font-serif-literary">
                Contribute without an account • Reviewed by WDS Editors &amp; Moderators before publishing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setUploadType('document');
              setFeedbackError('');
              setFeedbackSuccess('');
            }}
            className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              uploadType === 'document'
                ? 'border-amber-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderUp className="w-3.5 h-3.5" />
            <span>Document / Brief</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUploadType('writing');
              setFeedbackError('');
              setFeedbackSuccess('');
            }}
            className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              uploadType === 'writing'
                ? 'border-amber-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Poem / Story / Essay</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUploadType('news');
              setFeedbackError('');
              setFeedbackSuccess('');
            }}
            className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              uploadType === 'news'
                ? 'border-amber-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>News Article</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Moderation Notice */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              All public submissions enter the private moderation queue first to ensure academic integrity and campus safety.
            </span>
          </div>

          {feedbackError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{feedbackError}</span>
            </div>
          )}

          {feedbackSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          {/* Optional Author Attribution */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Contributor Attribution (No Login Needed)</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600"
                />
                <span>Submit Anonymously</span>
              </label>
            </div>

            {!isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required={!isAnonymous}
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your Display Name *"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <select
                  value={authorClass}
                  onChange={(e) => setAuthorClass(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  {OLAG_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {uploadType === 'document' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Enter document title"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="Debate Brief">Debate Brief</option>
                    <option value="Essay Manuscript">Essay Manuscript</option>
                    <option value="Poetry Collection">Poetry Collection</option>
                    <option value="Speech Transcript">Speech Transcript</option>
                    <option value="Study Paper">Study Paper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">File Format</label>
                  <select
                    value={docFormat}
                    onChange={(e) => setDocFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="PDF">PDF (.pdf)</option>
                    <option value="DOCX">Word (.docx)</option>
                    <option value="TXT">Plain Text (.txt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attach File (PDF, DOCX, TXT up to 5 MB)
                </label>
                <label className="block border-2 border-dashed border-slate-200 hover:border-amber-400 p-4 rounded-2xl text-center cursor-pointer transition-colors bg-slate-50/50">
                  <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">
                    {docFile
                      ? `${docFile.name} (${formatBytes(docFile.size)})`
                      : 'Click to select PDF, DOCX, DOC, or TXT file'}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleSelectDocFile}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Abstract / Executive Summary *
                </label>
                <textarea
                  required
                  rows={2}
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  placeholder="Summarize the key ideas or purpose of this document (min 10 chars)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Text Transcript / Notes (Optional if file attached)
                </label>
                <textarea
                  rows={3}
                  value={docTextContent}
                  onChange={(e) => setDocTextContent(e.target.value)}
                  placeholder="Paste speech transcript or study notes..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {uploadType === 'writing' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={writingTitle}
                  onChange={(e) => setWritingTitle(e.target.value)}
                  placeholder="Enter literary title"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-serif-literary focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Genre</label>
                  <select
                    value={writingCategory}
                    onChange={(e) => setWritingCategory(e.target.value as WritingCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-serif-literary"
                  >
                    <option value="poem">Original Poem</option>
                    <option value="short_story">Short Story</option>
                    <option value="essay">Literary / Analytical Essay</option>
                    <option value="reflection">Creative Reflection</option>
                    <option value="creative_writing">Creative Writing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subtitle / Theme (Optional)
                  </label>
                  <input
                    type="text"
                    value={writingSubtitle}
                    onChange={(e) => setWritingSubtitle(e.target.value)}
                    placeholder="Short thematic subtitle"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cover Artwork (Optional • Max 3 MB)
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{writingImageFile ? writingImageFile.name : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => handleSelectImage(e, setWritingImageFile)}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    value={writingImageUrl}
                    onChange={(e) => setWritingImageUrl(e.target.value)}
                    placeholder="Or paste https:// image URL"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Poem / Manuscript Text *
                </label>
                <textarea
                  required
                  rows={6}
                  value={writingContent}
                  onChange={(e) => setWritingContent(e.target.value)}
                  placeholder="Compose your original verses, story, or essay (minimum 20 characters)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-serif-literary focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />
              </div>
            </>
          )}

          {uploadType === 'news' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Article Headline *
                </label>
                <input
                  type="text"
                  required
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="Enter your news headline"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={articleCategory}
                    onChange={(e) => setArticleCategory(e.target.value as NewsCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="General student news">General student news</option>
                    <option value="Academic news">Academic news</option>
                    <option value="Sports">Sports</option>
                    <option value="Clubs and societies">Clubs and societies</option>
                    <option value="Events">Events</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Summary Excerpt *
                  </label>
                  <input
                    type="text"
                    required
                    value={articleExcerpt}
                    onChange={(e) => setArticleExcerpt(e.target.value)}
                    placeholder="Short 1-2 line overview"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cover Photo (Optional • Max 3 MB)
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{articleImageFile ? articleImageFile.name : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => handleSelectImage(e, setArticleImageFile)}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    value={articleImageUrl}
                    onChange={(e) => setArticleImageUrl(e.target.value)}
                    placeholder="Or paste https:// image URL"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Article *</label>
                <textarea
                  required
                  rows={5}
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  placeholder="Write the full campus report or dispatch (minimum 20 characters)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />
              </div>
            </>
          )}

          <HumanVerification
            onVerifyChange={setHumanVerified}
            honeypotValue={honeypot}
            onHoneypotChange={setHoneypot}
          />

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting || !humanVerified}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-400 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              {submitting ? 'Submitting to Moderation Queue...' : 'Submit for Moderation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
