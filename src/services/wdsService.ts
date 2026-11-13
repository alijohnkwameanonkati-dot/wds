import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, OperationType, handleFirestoreError } from '../firebase';
import {
  AdminRecord,
  AdminRole,
  ContentStatus,
  DebateTopic,
  DebateSide,
  NewsArticle,
  NewsCategory,
  PlatformSettings,
  PublicSubmission,
  SchoolEvent,
  SubmissionType,
  UploadedDocument,
  WritingCategory,
  WritingPublication,
  Announcement,
  Achievement,
  AchievementCategory,
  DocumentCategory,
  LikeRecord,
  WeeklyRankingEntry,
} from '../types';
import {
  FIELD_LIMITS,
  sanitizePlainText,
  generateFirestoreId,
  emailToHex,
  getIsoWeekKey,
  checkRateLimit,
  recordRateLimitHit,
  validateUploadFile,
  isValidHttpUrl,
} from '../utils/validation';

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  schoolName: 'Our Lady of Grace Senior High School',
  schoolShortName: 'OLAG',
  societyName: 'Writers and Debators Society (WDS)',
  societyMotto: 'Vincit Veritas • Eloquence, Truth, and Intellectual Rigor',
  academicYear: '2026–2027',
  currentTerm: 'Academic Session',
  debateCycleDays: 3,
  contactEmail: 'wds@olag.edu.gh',
  contactLocation: 'Our Lady of Grace Senior High School, Mamponteng, Ashanti Region, Ghana',
  meetingSchedule: 'Wednesdays & Fridays • 4:00 PM at the School Assembly Hall',
  allowPublicSubmissions: true,
};

export function tsToIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export async function uploadSubmissionMedia(
  file: File,
  kind: 'image' | 'document',
  sessionToken: string
): Promise<{ url: string; storagePath: string }> {
  const validationErr = validateUploadFile(file, kind);
  if (validationErr) {
    throw new Error(validationErr);
  }

  const safeSession = sessionToken.replace(/[^a-zA-Z0-9_\-]/g, '') || 'visitor';
  const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 80)}`;
  const folder = kind === 'image' ? 'submissions/images' : 'submissions/documents';
  const storagePath = `${folder}/${safeSession}/${safeFileName}`;

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, {
    contentType: file.type || (kind === 'image' ? 'image/jpeg' : 'application/octet-stream'),
  });
  const url = await getDownloadURL(storageRef);
  return { url, storagePath };
}

export async function uploadEditorialMedia(
  file: File,
  kind: 'image' | 'document',
  folder: 'news' | 'writings' | 'documents'
): Promise<{ url: string; storagePath: string }> {
  const validationErr = validateUploadFile(file, kind);
  if (validationErr) {
    throw new Error(validationErr);
  }

  const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 80)}`;
  const storagePath = `editorial/${folder}/${safeFileName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
  });
  const url = await getDownloadURL(storageRef);
  return { url, storagePath };
}

export interface SubmitContributionInput {
  submissionType: SubmissionType;
  title: string;
  excerpt?: string;
  content: string;
  category?: string;
  displayName: string;
  authorClass?: string;
  isAnonymous: boolean;
  imageUrl?: string;
  fileUrl?: string;
  storagePath?: string;
  fileName?: string;
  fileSize?: string;
  fileFormat?: string;
  debateId?: string;
  argumentId?: string;
  side?: DebateSide | '';
  targetType?: 'news' | 'writing' | 'document' | '';
  targetId?: string;
  sessionToken: string;
  botChallengeVerified: boolean;
  honeypot?: string;
}

export const wdsService = {
  // 1. PUBLIC CONTRIBUTION -> MODERATION QUEUE (NEVER AUTO-PUBLISHED)
  async submitPublicContribution(input: SubmitContributionInput): Promise<string> {
    if (input.honeypot && input.honeypot.trim().length > 0) {
      throw new Error('Submission blocked by anti-spam protection.');
    }
    if (!input.botChallengeVerified) {
      throw new Error('Please complete the human verification challenge before submitting.');
    }

    const rateErr = checkRateLimit(`submit_${input.submissionType}`, 15000, 10);
    if (rateErr) {
      throw new Error(rateErr);
    }

    const cleanTitle = sanitizePlainText(input.title).slice(0, FIELD_LIMITS.SUBMISSION_TITLE_MAX);
    const cleanContent = sanitizePlainText(input.content).slice(0, FIELD_LIMITS.WRITING_CONTENT_MAX);
    const cleanExcerpt = input.excerpt
      ? sanitizePlainText(input.excerpt).slice(0, FIELD_LIMITS.EXCERPT_MAX)
      : '';
    const cleanName = input.isAnonymous
      ? 'Anonymous OLAG Contributor'
      : sanitizePlainText(input.displayName).slice(0, FIELD_LIMITS.DISPLAY_NAME_MAX);
    const cleanClass = sanitizePlainText(input.authorClass || '').slice(0, FIELD_LIMITS.CLASS_MAX);

    if (cleanTitle.length < FIELD_LIMITS.SUBMISSION_TITLE_MIN) {
      throw new Error('Title must be at least 2 characters long.');
    }
    if (cleanContent.length < 5) {
      throw new Error('Content is too short. Please provide meaningful text.');
    }
    if (!input.isAnonymous && cleanName.length < FIELD_LIMITS.DISPLAY_NAME_MIN) {
      throw new Error('Please enter your display name or select Anonymous Submission.');
    }
    if (input.imageUrl && !isValidHttpUrl(input.imageUrl)) {
      throw new Error('Please enter a valid http:// or https:// image URL.');
    }

    if (input.submissionType === 'news' && cleanContent.length < FIELD_LIMITS.NEWS_CONTENT_MIN) {
      throw new Error('News articles must be at least 20 characters long.');
    }
    if (
      ['poem', 'short_story', 'essay', 'reflection', 'creative_writing'].includes(input.submissionType) &&
      cleanContent.length < FIELD_LIMITS.WRITING_CONTENT_MIN
    ) {
      throw new Error('Literary submissions must be at least 20 characters long.');
    }
    if (input.submissionType === 'debate_argument') {
      if (!input.debateId) throw new Error('Please select an active debate motion.');
      if (input.side !== 'FOR' && input.side !== 'AGAINST') {
        throw new Error('Please choose FOR or AGAINST position.');
      }
      if (cleanContent.length < FIELD_LIMITS.DEBATE_ARG_MIN) {
        throw new Error('Debate arguments must be at least 15 characters long.');
      }
    }

    const submissionId = generateFirestoreId('sub');
    const safeToken = input.sessionToken.replace(/[^a-zA-Z0-9_\-]/g, '') || 'visitor_anon';

    const payload: Record<string, unknown> = {
      submissionType: input.submissionType,
      title: cleanTitle,
      content: cleanContent,
      displayName: cleanName,
      isAnonymous: Boolean(input.isAnonymous),
      status: 'pending',
      sessionToken: safeToken,
      botChallengeVerified: true,
      submittedAt: serverTimestamp(),
    };

    if (cleanExcerpt) payload.excerpt = cleanExcerpt;
    if (input.category) payload.category = sanitizePlainText(input.category).slice(0, 80);
    if (cleanClass && !input.isAnonymous) payload.authorClass = cleanClass;
    if (input.imageUrl?.trim()) payload.imageUrl = input.imageUrl.trim().slice(0, FIELD_LIMITS.URL_MAX);
    if (input.fileUrl?.trim()) payload.fileUrl = input.fileUrl.trim().slice(0, FIELD_LIMITS.URL_MAX);
    if (input.storagePath?.trim()) payload.storagePath = input.storagePath.trim().slice(0, 300);
    if (input.fileName?.trim()) payload.fileName = sanitizePlainText(input.fileName).slice(0, 200);
    if (input.fileSize?.trim()) payload.fileSize = sanitizePlainText(input.fileSize).slice(0, 32);
    if (input.fileFormat?.trim()) payload.fileFormat = sanitizePlainText(input.fileFormat).slice(0, 16);
    if (input.debateId) payload.debateId = input.debateId;
    if (input.argumentId) payload.argumentId = input.argumentId;
    if (input.side) payload.side = input.side;
    if (input.targetType) payload.targetType = input.targetType;
    if (input.targetId) payload.targetId = input.targetId;

    try {
      await setDoc(doc(db, 'submissions', submissionId), payload);
      recordRateLimitHit(`submit_${input.submissionType}`);
      return submissionId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `submissions/${submissionId}`);
    }
  },

  // 2. ADMIN MODERATION ACTIONS
  async approveSubmission(
    sub: PublicSubmission,
    adminUser: AdminRecord,
    overrides?: { title?: string; excerpt?: string; content?: string; category?: string; moderationNotes?: string }
  ): Promise<void> {
    const batch = writeBatch(db);
    const title = sanitizePlainText(overrides?.title ?? sub.title).slice(0, FIELD_LIMITS.TITLE_MAX);
    const content = sanitizePlainText(overrides?.content ?? sub.content);
    const excerpt = sanitizePlainText(overrides?.excerpt ?? sub.excerpt ?? content.slice(0, 180)).slice(
      0,
      FIELD_LIMITS.EXCERPT_MAX
    );
    const category = sanitizePlainText(overrides?.category ?? sub.category ?? '');
    const displayName = sub.isAnonymous ? 'Anonymous OLAG Contributor' : sub.displayName;
    const authorClass = sub.isAnonymous ? '' : sub.authorClass || '';

    const subRef = doc(db, 'submissions', sub.id);
    batch.update(subRef, {
      title,
      content: content.slice(0, FIELD_LIMITS.WRITING_CONTENT_MAX),
      ...(excerpt ? { excerpt } : {}),
      ...(category ? { category } : {}),
      status: 'approved',
      moderationNotes: sanitizePlainText(overrides?.moderationNotes || 'Approved for public publication').slice(0, 1000),
      reviewedAt: serverTimestamp(),
      reviewedByUid: adminUser.uid,
      reviewedByName: adminUser.displayName,
    });

    let createdTargetPath = '';
    const targetId = generateFirestoreId('pub');

    if (sub.submissionType === 'news') {
      createdTargetPath = `news/${targetId}`;
      const validCategories: NewsCategory[] = [
        'School announcements',
        'Academic news',
        'Sports',
        'Clubs and societies',
        'Events',
        'General student news',
      ];
      const safeCat = validCategories.includes(category as NewsCategory)
        ? (category as NewsCategory)
        : 'General student news';

      batch.set(doc(db, 'news', targetId), {
        title: title.length >= 3 ? title : `${title} News`,
        excerpt: excerpt.length >= 10 ? excerpt : content.slice(0, 160).padEnd(10, '.'),
        content: content.slice(0, FIELD_LIMITS.NEWS_CONTENT_MAX).padEnd(20, ' '),
        category: safeCat,
        authorDisplayName: displayName,
        ...(authorClass ? { authorClass } : {}),
        ...(sub.imageUrl ? { imageUrl: sub.imageUrl } : {}),
        isOfficial: false,
        isPinned: false,
        priority: 'normal',
        status: 'published',
        createdByUid: adminUser.uid,
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (
      ['poem', 'short_story', 'essay', 'reflection', 'creative_writing'].includes(sub.submissionType)
    ) {
      createdTargetPath = `writings/${targetId}`;
      const words = content.split(/\s+/).filter(Boolean).length;
      const readingTime = `${Math.max(1, Math.round(words / 150))} min read`;
      batch.set(doc(db, 'writings', targetId), {
        title,
        ...(excerpt && excerpt !== content.slice(0, 180) ? { subtitle: excerpt.slice(0, 200) } : {}),
        content: content.slice(0, FIELD_LIMITS.WRITING_CONTENT_MAX).padEnd(20, ' '),
        writingType: sub.submissionType as WritingCategory,
        authorDisplayName: displayName,
        ...(authorClass ? { authorClass } : {}),
        ...(sub.imageUrl ? { imageUrl: sub.imageUrl } : {}),
        readingTime,
        featured: false,
        moderationStatus: 'approved',
        likesCount: 0,
        commentsCount: 0,
        reviewedByUid: adminUser.uid,
        createdAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (sub.submissionType === 'debate_argument') {
      if (!sub.debateId || (sub.side !== 'FOR' && sub.side !== 'AGAINST')) {
        throw new Error('Submission is missing debateId or FOR/AGAINST side.');
      }
      createdTargetPath = `debateArguments/${targetId}`;
      batch.set(doc(db, 'debateArguments', targetId), {
        debateId: sub.debateId,
        side: sub.side,
        displayName,
        ...(authorClass ? { authorClass } : {}),
        title: title.length >= 3 ? title.slice(0, 160) : `${title} Argument`,
        argument: content.slice(0, FIELD_LIMITS.DEBATE_ARG_MAX).padEnd(15, ' '),
        moderationStatus: 'approved',
        likesCount: 0,
        reviewedByUid: adminUser.uid,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'debates', sub.debateId), {
        ...(sub.side === 'FOR' ? { proCount: increment(1) } : { conCount: increment(1) }),
        updatedAt: serverTimestamp(),
      });
    } else if (sub.submissionType === 'debate_reply') {
      if (!sub.debateId || !sub.argumentId) {
        throw new Error('Reply submission is missing debateId or argumentId.');
      }
      createdTargetPath = `debateReplies/${targetId}`;
      batch.set(doc(db, 'debateReplies', targetId), {
        debateId: sub.debateId,
        argumentId: sub.argumentId,
        displayName,
        content: content.slice(0, FIELD_LIMITS.COMMENT_MAX),
        moderationStatus: 'approved',
        reviewedByUid: adminUser.uid,
        createdAt: serverTimestamp(),
      });
    } else if (sub.submissionType === 'document') {
      createdTargetPath = `documents/${targetId}`;
      const validDocCats: DocumentCategory[] = [
        'Debate Brief',
        'Essay Manuscript',
        'Poetry Collection',
        'Speech Transcript',
        'Study Paper',
      ];
      const safeDocCat = validDocCats.includes(category as DocumentCategory)
        ? (category as DocumentCategory)
        : 'Study Paper';
      batch.set(doc(db, 'documents', targetId), {
        title: title.length >= 3 ? title : `${title} Document`,
        description: excerpt.length >= 10 ? excerpt : content.slice(0, 400).padEnd(10, '.'),
        category: safeDocCat,
        fileFormat: sub.fileFormat || 'TXT',
        fileName: sub.fileName || `${targetId}.txt`,
        fileSize: sub.fileSize || '1 KB',
        ...(sub.fileUrl ? { fileUrl: sub.fileUrl } : {}),
        ...(sub.storagePath ? { storagePath: sub.storagePath } : {}),
        textContent: content.slice(0, 25000),
        authorDisplayName: displayName,
        ...(authorClass ? { authorClass } : {}),
        moderationStatus: 'approved',
        downloadsCount: 0,
        likesCount: 0,
        reviewedByUid: adminUser.uid,
        createdAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      });
    } else if (sub.submissionType === 'comment') {
      if (!sub.targetType || !sub.targetId) {
        throw new Error('Comment submission is missing target reference.');
      }
      createdTargetPath = `comments/${targetId}`;
      batch.set(doc(db, 'comments', targetId), {
        targetType: sub.targetType,
        targetId: sub.targetId,
        displayName,
        content: content.slice(0, FIELD_LIMITS.COMMENT_MAX),
        moderationStatus: 'approved',
        reviewedByUid: adminUser.uid,
        createdAt: serverTimestamp(),
      });
    }

    const logId = generateFirestoreId('aud');
    batch.set(doc(db, 'auditLogs', logId), {
      actorUid: adminUser.uid,
      actorName: adminUser.displayName,
      actorRole: adminUser.role,
      action: 'APPROVE_SUBMISSION',
      targetType: sub.submissionType,
      targetId: createdTargetPath || sub.id,
      details: `Approved "${title}" submitted by ${displayName}.`,
      timestamp: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `submissions/${sub.id}`);
    }
  },

  async updateSubmissionStatus(
    submissionId: string,
    status: 'rejected' | 'changes_requested',
    notes: string,
    adminUser: AdminRecord
  ): Promise<void> {
    const batch = writeBatch(db);
    batch.update(doc(db, 'submissions', submissionId), {
      status,
      moderationNotes: sanitizePlainText(notes || 'Reviewed by moderation team').slice(0, 1000),
      reviewedAt: serverTimestamp(),
      reviewedByUid: adminUser.uid,
      reviewedByName: adminUser.displayName,
    });
    batch.set(doc(db, 'auditLogs', generateFirestoreId('aud')), {
      actorUid: adminUser.uid,
      actorName: adminUser.displayName,
      actorRole: adminUser.role,
      action: status === 'rejected' ? 'REJECT_SUBMISSION' : 'REQUEST_CHANGES',
      targetType: 'submissions',
      targetId: submissionId,
      details: `Marked submission ${submissionId} as ${status}: ${sanitizePlainText(notes).slice(0, 180)}`,
      timestamp: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `submissions/${submissionId}`);
    }
  },

  // 3. NEWS CRUD (EDITOR / SUPER ADMIN)
  async createNewsArticle(
    data: {
      title: string;
      excerpt: string;
      content: string;
      category: NewsCategory;
      authorDisplayName: string;
      authorClass?: string;
      imageUrl?: string;
      isOfficial: boolean;
      isPinned: boolean;
      priority: 'normal' | 'important' | 'urgent';
      status: ContentStatus;
      scheduledPublishDate?: string;
    },
    adminUser: AdminRecord
  ): Promise<string> {
    const newsId = generateFirestoreId('news');
    const publishedTimestamp =
      data.status === 'scheduled' && data.scheduledPublishDate
        ? Timestamp.fromDate(new Date(data.scheduledPublishDate))
        : serverTimestamp();

    const batch = writeBatch(db);
    batch.set(doc(db, 'news', newsId), {
      title: sanitizePlainText(data.title).slice(0, FIELD_LIMITS.TITLE_MAX),
      excerpt: sanitizePlainText(data.excerpt).slice(0, FIELD_LIMITS.EXCERPT_MAX),
      content: sanitizePlainText(data.content).slice(0, FIELD_LIMITS.NEWS_CONTENT_MAX),
      category: data.category,
      authorDisplayName: sanitizePlainText(data.authorDisplayName).slice(0, FIELD_LIMITS.DISPLAY_NAME_MAX),
      ...(data.authorClass ? { authorClass: sanitizePlainText(data.authorClass).slice(0, 80) } : {}),
      ...(data.imageUrl ? { imageUrl: data.imageUrl.trim().slice(0, FIELD_LIMITS.URL_MAX) } : {}),
      isOfficial: data.isOfficial,
      isPinned: data.isPinned,
      priority: data.priority,
      status: data.status,
      createdByUid: adminUser.uid,
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
      publishedAt: publishedTimestamp,
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'auditLogs', generateFirestoreId('aud')), {
      actorUid: adminUser.uid,
      actorName: adminUser.displayName,
      actorRole: adminUser.role,
      action: 'CREATE_NEWS',
      targetType: 'news',
      targetId: newsId,
      details: `Created news article "${sanitizePlainText(data.title).slice(0, 100)}" (${data.status}).`,
      timestamp: serverTimestamp(),
    });

    try {
      await batch.commit();
      return newsId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `news/${newsId}`);
    }
  },

  async updateNewsArticle(
    newsId: string,
    updates: Partial<
      Pick<
        NewsArticle,
        'title' | 'excerpt' | 'content' | 'category' | 'imageUrl' | 'isOfficial' | 'isPinned' | 'priority' | 'status'
      >
    >,
    adminUser: AdminRecord
  ): Promise<void> {
    const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.title !== undefined) clean.title = sanitizePlainText(updates.title).slice(0, FIELD_LIMITS.TITLE_MAX);
    if (updates.excerpt !== undefined) clean.excerpt = sanitizePlainText(updates.excerpt).slice(0, FIELD_LIMITS.EXCERPT_MAX);
    if (updates.content !== undefined) clean.content = sanitizePlainText(updates.content).slice(0, FIELD_LIMITS.NEWS_CONTENT_MAX);
    if (updates.category !== undefined) clean.category = updates.category;
    if (updates.imageUrl !== undefined) clean.imageUrl = updates.imageUrl.trim().slice(0, FIELD_LIMITS.URL_MAX);
    if (updates.isOfficial !== undefined) clean.isOfficial = updates.isOfficial;
    if (updates.isPinned !== undefined) clean.isPinned = updates.isPinned;
    if (updates.priority !== undefined) clean.priority = updates.priority;
    if (updates.status !== undefined) {
      clean.status = updates.status;
      if (updates.status === 'published') clean.publishedAt = serverTimestamp();
    }

    const batch = writeBatch(db);
    batch.update(doc(db, 'news', newsId), clean);
    batch.set(doc(db, 'auditLogs', generateFirestoreId('aud')), {
      actorUid: adminUser.uid,
      actorName: adminUser.displayName,
      actorRole: adminUser.role,
      action: 'UPDATE_NEWS',
      targetType: 'news',
      targetId: newsId,
      details: `Updated news article ${newsId}.`,
      timestamp: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `news/${newsId}`);
    }
  },

  async deleteNewsArticle(newsId: string, adminUser: AdminRecord): Promise<void> {
    try {
      await deleteDoc(doc(db, 'news', newsId));
      await setDoc(doc(db, 'auditLogs', generateFirestoreId('aud')), {
        actorUid: adminUser.uid,
        actorName: adminUser.displayName,
        actorRole: adminUser.role,
        action: 'DELETE_NEWS',
        targetType: 'news',
        targetId: newsId,
        details: `Deleted news article ${newsId}.`,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `news/${newsId}`);
    }
  },

  // 4. DEBATES CRUD
  async createDebateTopic(
    data: {
      topic: string;
      description: string;
      category: string;
      proLabel: string;
      conLabel: string;
      cycleDays: number;
    },
    adminUser: AdminRecord
  ): Promise<string> {
    const debateId = generateFirestoreId('deb');
    const now = new Date();
    const closeDate = new Date(now.getTime() + Math.max(1, data.cycleDays) * 24 * 60 * 60 * 1000);

    const batch = writeBatch(db);
    batch.set(doc(db, 'debates', debateId), {
      topic: sanitizePlainText(data.topic).slice(0, 220),
      description: sanitizePlainText(data.description).slice(0, 3000),
      category: sanitizePlainText(data.category || 'General Motion').slice(0, 80),
      proLabel: sanitizePlainText(data.proLabel || 'FOR the Motion').slice(0, 120),
      conLabel: sanitizePlainText(data.conLabel || 'AGAINST the Motion').slice(0, 120),
      openingDate: Timestamp.fromDate(now),
      closingDate: Timestamp.fromDate(closeDate),
      status: 'active',
      proCount: 0,
      conCount: 0,
      createdByUid: adminUser.uid,
      createdByName: adminUser.title ? `${adminUser.displayName} (${adminUser.title})` : adminUser.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'auditLogs', generateFirestoreId('aud')), {
      actorUid: adminUser.uid,
      actorName: adminUser.displayName,
      actorRole: adminUser.role,
      action: 'CREATE_DEBATE',
      targetType: 'debates',
      targetId: debateId,
      details: `Scheduled debate motion "${sanitizePlainText(data.topic).slice(0, 100)}" (${data.cycleDays}-day cycle).`,
      timestamp: serverTimestamp(),
    });

    try {
      await batch.commit();
      return debateId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `debates/${debateId}`);
    }
  },

  async updateDebateStatus(
    debateId: string,
    status: DebateTopic['status'],
    adminUser: AdminRecord
  ): Promise<void> {
    const batch = writeBatch(db);
    batch.update(doc(db, 'debates', debateId), {
      status,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'auditLogs', generateFirestoreId('aud')), {
      actorUid: adminUser.uid,
      actorName: adminUser.displayName,
      actorRole: adminUser.role,
      action: 'UPDATE_DEBATE_STATUS',
      targetType: 'debates',
      targetId: debateId,
      details: `Set debate ${debateId} status to ${status}.`,
      timestamp: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `debates/${debateId}`);
    }
  },

  async deleteDebateArgument(argumentId: string, adminUser: AdminRecord): Promise<void> {
    try {
      await deleteDoc(doc(db, 'debateArguments', argumentId));
      await setDoc(doc(db, 'auditLogs', generateFirestoreId('aud')), {
        actorUid: adminUser.uid,
        actorName: adminUser.displayName,
        actorRole: adminUser.role,
        action: 'DELETE_DEBATE_ARGUMENT',
        targetType: 'debateArguments',
        targetId: argumentId,
        details: `Removed moderated argument ${argumentId}.`,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `debateArguments/${argumentId}`);
    }
  },

  // 5. WRITINGS MANAGEMENT
  async toggleFeatureWriting(writingId: string, featured: boolean, adminUser: AdminRecord): Promise<void> {
    try {
      await updateDoc(doc(db, 'writings', writingId), {
        featured,
        updatedAt: serverTimestamp(),
        reviewedByUid: adminUser.uid,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `writings/${writingId}`);
    }
  },

  async deleteWriting(writingId: string, adminUser: AdminRecord): Promise<void> {
    try {
      await deleteDoc(doc(db, 'writings', writingId));
      await setDoc(doc(db, 'auditLogs', generateFirestoreId('aud')), {
        actorUid: adminUser.uid,
        actorName: adminUser.displayName,
        actorRole: adminUser.role,
        action: 'DELETE_WRITING',
        targetType: 'writings',
        targetId: writingId,
        details: `Deleted literary piece ${writingId}.`,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `writings/${writingId}`);
    }
  },

  // 6. ANNOUNCEMENTS, ACHIEVEMENTS, EVENTS, DOCUMENTS
  async createAnnouncement(
    data: { title: string; message: string; priority: Announcement['priority']; status: 'published' | 'draft' },
    adminUser: AdminRecord
  ): Promise<void> {
    const id = generateFirestoreId('ann');
    try {
      await setDoc(doc(db, 'announcements', id), {
        title: sanitizePlainText(data.title).slice(0, 180),
        message: sanitizePlainText(data.message).slice(0, 5000),
        priority: data.priority,
        status: data.status,
        authorDisplayName: adminUser.displayName,
        createdByUid: adminUser.uid,
        createdAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `announcements/${id}`);
    }
  },

  async deleteAnnouncement(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
    }
  },

  async createAchievement(
    data: {
      title: string;
      description: string;
      recipientDisplayName: string;
      recipientClass?: string;
      date: string;
      month?: string;
      year?: number;
      category: AchievementCategory;
      status: 'published' | 'draft';
    },
    adminUser: AdminRecord
  ): Promise<void> {
    const id = generateFirestoreId('ach');
    try {
      await setDoc(doc(db, 'achievements', id), {
        title: sanitizePlainText(data.title).slice(0, 160),
        description: sanitizePlainText(data.description).slice(0, 1500),
        recipientDisplayName: sanitizePlainText(data.recipientDisplayName).slice(0, 100),
        ...(data.recipientClass ? { recipientClass: sanitizePlainText(data.recipientClass).slice(0, 60) } : {}),
        date: sanitizePlainText(data.date).slice(0, 40),
        ...(data.month ? { month: sanitizePlainText(data.month).slice(0, 20) } : {}),
        ...(data.year ? { year: data.year } : {}),
        category: data.category,
        status: data.status,
        createdByUid: adminUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `achievements/${id}`);
    }
  },

  async deleteAchievement(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'achievements', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `achievements/${id}`);
    }
  },

  async createEvent(
    data: Omit<SchoolEvent, 'id' | 'createdByUid' | 'createdAt'>,
    adminUser: AdminRecord
  ): Promise<void> {
    const id = generateFirestoreId('evt');
    try {
      await setDoc(doc(db, 'events', id), {
        title: sanitizePlainText(data.title).slice(0, 160),
        description: sanitizePlainText(data.description).slice(0, 1500),
        date: sanitizePlainText(data.date).slice(0, 40),
        time: sanitizePlainText(data.time).slice(0, 60),
        location: sanitizePlainText(data.location).slice(0, 120),
        category: data.category,
        organizer: sanitizePlainText(data.organizer).slice(0, 120),
        status: data.status,
        createdByUid: adminUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `events/${id}`);
    }
  },

  async deleteEvent(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
    }
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `documents/${id}`);
    }
  },

  // 7. SESSION LIKES & WEEKLY LEADERBOARD
  async castLike(
    targetType: LikeRecord['targetType'],
    targetId: string,
    sessionToken: string
  ): Promise<void> {
    const safeSession = sessionToken.replace(/[^a-zA-Z0-9_\-]/g, '');
    const safeTargetId = targetId.replace(/[^a-zA-Z0-9_\-]/g, '');
    const likeId = `${targetType}__${safeTargetId}__${safeSession}`;

    try {
      await setDoc(doc(db, 'likes', likeId), {
        targetType,
        targetId: safeTargetId,
        sessionToken: safeSession,
        weekKey: getIsoWeekKey(),
        visibility: 'public',
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `likes/${likeId}`);
    }
  },

  computeWeeklyRankings(
    likes: LikeRecord[],
    writings: WritingPublication[],
    debateArgs: { id: string; title: string; displayName: string; authorClass?: string; createdAt: string }[],
    news: NewsArticle[],
    docs: UploadedDocument[],
    targetWeekKey = getIsoWeekKey()
  ): WeeklyRankingEntry[] {
    const weeklyLikeCounts = new Map<string, number>();
    const totalLikeCounts = new Map<string, number>();

    likes.forEach((l) => {
      const key = `${l.targetType}:${l.targetId}`;
      totalLikeCounts.set(key, (totalLikeCounts.get(key) || 0) + 1);
      if (l.weekKey === targetWeekKey) {
        weeklyLikeCounts.set(key, (weeklyLikeCounts.get(key) || 0) + 1);
      }
    });

    const entries: WeeklyRankingEntry[] = [];

    writings.forEach((w) => {
      const weeklyLikes = weeklyLikeCounts.get(`writing:${w.id}`) || 0;
      const totalLikes = Math.max(w.likesCount, totalLikeCounts.get(`writing:${w.id}`) || 0);
      entries.push({
        rank: 0,
        contributionId: w.id,
        contributionType: w.writingType,
        title: w.title,
        authorDisplayName: w.authorDisplayName,
        authorClass: w.authorClass || 'OLAG Contributor',
        weeklyLikes,
        totalLikes,
        score: 25 + weeklyLikes * 5 + totalLikes * 2,
      });
    });

    debateArgs.forEach((a) => {
      const weeklyLikes = weeklyLikeCounts.get(`debateArgument:${a.id}`) || 0;
      const totalLikes = totalLikeCounts.get(`debateArgument:${a.id}`) || 0;
      entries.push({
        rank: 0,
        contributionId: a.id,
        contributionType: 'debateArgument',
        title: a.title,
        authorDisplayName: a.displayName,
        authorClass: a.authorClass || 'OLAG Contributor',
        weeklyLikes,
        totalLikes,
        score: 15 + weeklyLikes * 5 + totalLikes * 2,
      });
    });

    docs.forEach((d) => {
      const weeklyLikes = weeklyLikeCounts.get(`document:${d.id}`) || 0;
      const totalLikes = Math.max(d.likesCount, totalLikeCounts.get(`document:${d.id}`) || 0);
      entries.push({
        rank: 0,
        contributionId: d.id,
        contributionType: 'document',
        title: d.title,
        authorDisplayName: d.authorDisplayName,
        authorClass: d.authorClass || 'OLAG Contributor',
        weeklyLikes,
        totalLikes,
        score: 10 + weeklyLikes * 5 + totalLikes * 2,
      });
    });

    news
      .filter((n) => !n.isOfficial)
      .forEach((n) => {
        const weeklyLikes = weeklyLikeCounts.get(`news:${n.id}`) || 0;
        const totalLikes = Math.max(n.likesCount, totalLikeCounts.get(`news:${n.id}`) || 0);
        entries.push({
          rank: 0,
          contributionId: n.id,
          contributionType: 'news',
          title: n.title,
          authorDisplayName: n.authorDisplayName,
          authorClass: n.authorClass || 'OLAG Contributor',
          weeklyLikes,
          totalLikes,
          score: 10 + weeklyLikes * 5 + totalLikes * 2,
        });
      });

    entries.sort((a, b) => b.score - a.score || b.weeklyLikes - a.weeklyLikes || b.totalLikes - a.totalLikes);
    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });
    return entries;
  },

  async publishWeeklySnapshot(
    adminUser: AdminRecord,
    entries: WeeklyRankingEntry[],
    totalLikes: number,
    weekKey = getIsoWeekKey()
  ): Promise<void> {
    try {
      await setDoc(doc(db, 'weeklyRankings', weekKey), {
        weekKey,
        weekLabel: `Week ${weekKey}`,
        entries: entries.slice(0, 50),
        totalLikes,
        computedByUid: adminUser.uid,
        computedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `weeklyRankings/${weekKey}`);
    }
  },

  // 8. ADMIN MANAGEMENT & PLATFORM SETTINGS (SUPER ADMIN)
  async inviteAdmin(
    actor: AdminRecord,
    email: string,
    displayName: string,
    title: string,
    role: AdminRole
  ): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    const inviteId = emailToHex(cleanEmail);
    try {
      await setDoc(doc(db, 'adminInvites', inviteId), {
        email: cleanEmail,
        displayName: sanitizePlainText(displayName).slice(0, 100),
        title: sanitizePlainText(title || role).slice(0, 120),
        role,
        status: 'pending',
        createdByUid: actor.uid,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'auditLogs', generateFirestoreId('aud')), {
        actorUid: actor.uid,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: 'INVITE_ADMIN',
        targetType: 'adminInvites',
        targetId: inviteId,
        details: `Invited ${cleanEmail} with role ${role}.`,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `adminInvites/${inviteId}`);
    }
  },

  async updateAdminAccess(
    actor: AdminRecord,
    targetUid: string,
    updates: { role?: AdminRole; status?: 'active' | 'disabled'; title?: string; displayName?: string }
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'admins', targetUid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'auditLogs', generateFirestoreId('aud')), {
        actorUid: actor.uid,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: 'UPDATE_ADMIN_ACCESS',
        targetType: 'admins',
        targetId: targetUid,
        details: `Updated administrator ${targetUid}: ${JSON.stringify(updates)}`,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `admins/${targetUid}`);
    }
  },

  async revokeAdminInvite(inviteId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'adminInvites', inviteId), { status: 'revoked' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `adminInvites/${inviteId}`);
    }
  },

  async updateSettings(actor: AdminRecord, settings: PlatformSettings): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'platform'), {
        schoolName: sanitizePlainText(settings.schoolName).slice(0, 160),
        schoolShortName: sanitizePlainText(settings.schoolShortName).slice(0, 20),
        societyName: sanitizePlainText(settings.societyName).slice(0, 160),
        societyMotto: sanitizePlainText(settings.societyMotto).slice(0, 240),
        academicYear: sanitizePlainText(settings.academicYear).slice(0, 30),
        currentTerm: sanitizePlainText(settings.currentTerm).slice(0, 80),
        debateCycleDays: Math.min(30, Math.max(1, Number(settings.debateCycleDays) || 3)),
        contactEmail: sanitizePlainText(settings.contactEmail || '').slice(0, 160),
        contactLocation: sanitizePlainText(settings.contactLocation || '').slice(0, 200),
        meetingSchedule: sanitizePlainText(settings.meetingSchedule || '').slice(0, 200),
        allowPublicSubmissions: Boolean(settings.allowPublicSubmissions),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'auditLogs', generateFirestoreId('aud')), {
        actorUid: actor.uid,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: 'UPDATE_SETTINGS',
        targetType: 'settings',
        targetId: 'platform',
        details: 'Updated platform settings and debate schedule configuration.',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/platform');
    }
  },
};
