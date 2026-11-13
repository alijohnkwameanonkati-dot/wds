import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, doc, query, where, onSnapshot } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { useAuth } from './AuthContext';
import {
  Achievement,
  AdminInvite,
  AdminRecord,
  Announcement,
  AuditLog,
  CommentRecord,
  DebateArgument,
  DebateReply,
  DebateTopic,
  LikeRecord,
  NewsArticle,
  PlatformSettings,
  PublicSubmission,
  SchoolEvent,
  UploadedDocument,
  WeeklyRankingEntry,
  WeeklyRankingSnapshot,
  WritingPublication,
} from '../types';
import { DEFAULT_PLATFORM_SETTINGS, tsToIso, wdsService } from '../services/wdsService';
import { getIsoWeekKey } from '../utils/validation';

interface WdsDataContextType {
  loading: boolean;
  settings: PlatformSettings;

  // Public filtered collections (never expose pending/rejected/draft to non-admins)
  news: NewsArticle[];
  debates: DebateTopic[];
  debateArguments: DebateArgument[];
  debateReplies: DebateReply[];
  writings: WritingPublication[];
  documents: UploadedDocument[];
  comments: CommentRecord[];
  announcements: Announcement[];
  achievements: Achievement[];
  events: SchoolEvent[];
  likes: LikeRecord[];
  weeklyRankingsSnapshots: WeeklyRankingSnapshot[];
  liveWeeklyRankings: WeeklyRankingEntry[];

  // Admin collections (only populated when RBAC verified)
  allNewsAdmin: NewsArticle[];
  allAnnouncementsAdmin: Announcement[];
  allAchievementsAdmin: Achievement[];
  allEventsAdmin: SchoolEvent[];
  submissions: PublicSubmission[];
  adminsList: AdminRecord[];
  adminInvites: AdminInvite[];
  auditLogs: AuditLog[];

  // Quick lookup helpers
  hasSessionLiked: (targetType: LikeRecord['targetType'], targetId: string) => boolean;
  getLikeCount: (targetType: LikeRecord['targetType'], targetId: string, storedCount?: number) => number;
  getApprovedComments: (targetType: 'news' | 'writing' | 'document', targetId: string) => CommentRecord[];
  getApprovedReplies: (argumentId: string) => DebateReply[];
}

const WdsDataContext = createContext<WdsDataContextType | undefined>(undefined);

export const WdsDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authLoading, isAdmin, isSuperAdmin, isEditor, isModerator, sessionToken } = useAuth();

  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [rawNews, setRawNews] = useState<NewsArticle[]>([]);
  const [debates, setDebates] = useState<DebateTopic[]>([]);
  const [rawArguments, setRawArguments] = useState<DebateArgument[]>([]);
  const [rawReplies, setRawReplies] = useState<DebateReply[]>([]);
  const [rawWritings, setRawWritings] = useState<WritingPublication[]>([]);
  const [rawDocuments, setRawDocuments] = useState<UploadedDocument[]>([]);
  const [rawComments, setRawComments] = useState<CommentRecord[]>([]);
  const [rawAnnouncements, setRawAnnouncements] = useState<Announcement[]>([]);
  const [rawAchievements, setRawAchievements] = useState<Achievement[]>([]);
  const [rawEvents, setRawEvents] = useState<SchoolEvent[]>([]);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [weeklyRankingsSnapshots, setWeeklyRankingsSnapshots] = useState<WeeklyRankingSnapshot[]>([]);

  const [submissions, setSubmissions] = useState<PublicSubmission[]>([]);
  const [adminsList, setAdminsList] = useState<AdminRecord[]>([]);
  const [adminInvites, setAdminInvites] = useState<AdminInvite[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Public + Role-aware real-time listeners (wait for auth state readiness; all single-field where queries)
  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    const unsubs: (() => void)[] = [];

    // 1. Settings
    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'platform'),
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setSettings({
              schoolName: d.schoolName || DEFAULT_PLATFORM_SETTINGS.schoolName,
              schoolShortName: d.schoolShortName || DEFAULT_PLATFORM_SETTINGS.schoolShortName,
              societyName: d.societyName || DEFAULT_PLATFORM_SETTINGS.societyName,
              societyMotto: d.societyMotto || DEFAULT_PLATFORM_SETTINGS.societyMotto,
              academicYear: d.academicYear || DEFAULT_PLATFORM_SETTINGS.academicYear,
              currentTerm: d.currentTerm || DEFAULT_PLATFORM_SETTINGS.currentTerm,
              debateCycleDays: Number(d.debateCycleDays) || 3,
              contactEmail: d.contactEmail || DEFAULT_PLATFORM_SETTINGS.contactEmail,
              contactLocation: d.contactLocation || DEFAULT_PLATFORM_SETTINGS.contactLocation,
              meetingSchedule: d.meetingSchedule || DEFAULT_PLATFORM_SETTINGS.meetingSchedule,
              allowPublicSubmissions: d.allowPublicSubmissions !== false,
              updatedAt: d.updatedAt ? tsToIso(d.updatedAt) : undefined,
            });
          } else {
            setSettings(DEFAULT_PLATFORM_SETTINGS);
          }
          setLoading(false);
        },
        (err) => {
          setLoading(false);
          handleFirestoreError(err, OperationType.GET, 'settings/platform');
        }
      )
    );

    // 2. News
    const newsQuery = isEditor
      ? query(collection(db, 'news'), where('status', 'in', ['published', 'draft', 'scheduled', 'archived']))
      : query(collection(db, 'news'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        newsQuery,
        (snap) => {
          const items: NewsArticle[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              title: d.title || '',
              excerpt: d.excerpt || '',
              content: d.content || '',
              category: d.category || 'General student news',
              authorDisplayName: d.authorDisplayName || 'WDS Contributor',
              authorClass: d.authorClass || '',
              imageUrl: d.imageUrl || undefined,
              isOfficial: Boolean(d.isOfficial),
              isPinned: Boolean(d.isPinned),
              priority: d.priority || 'normal',
              status: d.status || 'published',
              createdByUid: d.createdByUid || '',
              likesCount: Number(d.likesCount) || 0,
              commentsCount: Number(d.commentsCount) || 0,
              createdAt: tsToIso(d.createdAt),
              publishedAt: tsToIso(d.publishedAt),
              updatedAt: tsToIso(d.updatedAt),
            };
          });
          items.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          });
          setRawNews(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'news')
      )
    );

    // 3. Debates
    unsubs.push(
      onSnapshot(
        query(collection(db, 'debates'), where('status', 'in', ['active', 'closed', 'archived'])),
        (snap) => {
          const items: DebateTopic[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              topic: d.topic || '',
              description: d.description || '',
              category: d.category || 'General Motion',
              proLabel: d.proLabel || 'FOR the Motion',
              conLabel: d.conLabel || 'AGAINST the Motion',
              openingDate: tsToIso(d.openingDate),
              closingDate: tsToIso(d.closingDate),
              status: d.status || 'active',
              proCount: Number(d.proCount) || 0,
              conCount: Number(d.conCount) || 0,
              createdByUid: d.createdByUid || '',
              createdByName: d.createdByName || 'WDS Executive',
              createdAt: tsToIso(d.createdAt),
              updatedAt: tsToIso(d.updatedAt),
            };
          });
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setDebates(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'debates')
      )
    );

    // 4. Debate Arguments
    const argsQuery = isModerator
      ? query(collection(db, 'debateArguments'), where('moderationStatus', 'in', ['approved', 'pending', 'rejected']))
      : query(collection(db, 'debateArguments'), where('moderationStatus', '==', 'approved'));
    unsubs.push(
      onSnapshot(
        argsQuery,
        (snap) => {
          const items: DebateArgument[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              debateId: d.debateId || '',
              side: d.side === 'AGAINST' ? 'AGAINST' : 'FOR',
              displayName: d.displayName || 'OLAG Orator',
              authorClass: d.authorClass || '',
              title: d.title || '',
              argument: d.argument || '',
              moderationStatus: d.moderationStatus || 'approved',
              likesCount: Number(d.likesCount) || 0,
              reviewedByUid: d.reviewedByUid || '',
              createdAt: tsToIso(d.createdAt),
            };
          });
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRawArguments(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'debateArguments')
      )
    );

    // 5. Debate Replies
    const repliesQuery = isModerator
      ? query(collection(db, 'debateReplies'), where('moderationStatus', 'in', ['approved', 'rejected']))
      : query(collection(db, 'debateReplies'), where('moderationStatus', '==', 'approved'));
    unsubs.push(
      onSnapshot(
        repliesQuery,
        (snap) => {
          const items: DebateReply[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              debateId: d.debateId || '',
              argumentId: d.argumentId || '',
              displayName: d.displayName || 'OLAG Contributor',
              content: d.content || '',
              moderationStatus: d.moderationStatus || 'approved',
              reviewedByUid: d.reviewedByUid || '',
              createdAt: tsToIso(d.createdAt),
            };
          });
          items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setRawReplies(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'debateReplies')
      )
    );

    // 6. Writings
    const writingsQuery = isModerator
      ? query(collection(db, 'writings'), where('moderationStatus', 'in', ['approved', 'pending', 'rejected']))
      : query(collection(db, 'writings'), where('moderationStatus', '==', 'approved'));
    unsubs.push(
      onSnapshot(
        writingsQuery,
        (snap) => {
          const items: WritingPublication[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              title: d.title || '',
              subtitle: d.subtitle || undefined,
              dedication: d.dedication || undefined,
              content: d.content || '',
              writingType: d.writingType || 'poem',
              authorDisplayName: d.authorDisplayName || 'OLAG Writer',
              authorClass: d.authorClass || '',
              imageUrl: d.imageUrl || undefined,
              readingTime: d.readingTime || '2 min read',
              featured: Boolean(d.featured),
              moderationStatus: d.moderationStatus || 'approved',
              likesCount: Number(d.likesCount) || 0,
              commentsCount: Number(d.commentsCount) || 0,
              reviewedByUid: d.reviewedByUid || '',
              createdAt: tsToIso(d.createdAt),
              publishedAt: tsToIso(d.publishedAt),
              updatedAt: tsToIso(d.updatedAt),
            };
          });
          items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          setRawWritings(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'writings')
      )
    );

    // 7. Documents
    const docsQuery = isModerator
      ? query(collection(db, 'documents'), where('moderationStatus', 'in', ['approved', 'pending', 'rejected']))
      : query(collection(db, 'documents'), where('moderationStatus', '==', 'approved'));
    unsubs.push(
      onSnapshot(
        docsQuery,
        (snap) => {
          const items: UploadedDocument[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              title: d.title || '',
              description: d.description || '',
              category: d.category || 'Study Paper',
              fileFormat: d.fileFormat || 'TXT',
              fileName: d.fileName || 'document.txt',
              fileSize: d.fileSize || '1 KB',
              fileUrl: d.fileUrl || undefined,
              storagePath: d.storagePath || undefined,
              textContent: d.textContent || undefined,
              authorDisplayName: d.authorDisplayName || 'OLAG Contributor',
              authorClass: d.authorClass || '',
              moderationStatus: d.moderationStatus || 'approved',
              downloadsCount: Number(d.downloadsCount) || 0,
              likesCount: Number(d.likesCount) || 0,
              reviewedByUid: d.reviewedByUid || '',
              createdAt: tsToIso(d.createdAt),
              publishedAt: tsToIso(d.publishedAt),
            };
          });
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRawDocuments(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'documents')
      )
    );

    // 8. Comments
    const commentsQuery = isModerator
      ? query(collection(db, 'comments'), where('moderationStatus', 'in', ['approved', 'rejected']))
      : query(collection(db, 'comments'), where('moderationStatus', '==', 'approved'));
    unsubs.push(
      onSnapshot(
        commentsQuery,
        (snap) => {
          const items: CommentRecord[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              targetType: d.targetType || 'news',
              targetId: d.targetId || '',
              displayName: d.displayName || 'OLAG Reader',
              content: d.content || '',
              moderationStatus: d.moderationStatus || 'approved',
              reviewedByUid: d.reviewedByUid || '',
              createdAt: tsToIso(d.createdAt),
            };
          });
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRawComments(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'comments')
      )
    );

    // 9. Announcements
    const annQuery = isEditor
      ? query(collection(db, 'announcements'), where('status', 'in', ['published', 'draft']))
      : query(collection(db, 'announcements'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        annQuery,
        (snap) => {
          const items: Announcement[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              title: d.title || '',
              message: d.message || '',
              priority: d.priority || 'normal',
              status: d.status || 'published',
              authorDisplayName: d.authorDisplayName || 'OLAG WDS',
              createdByUid: d.createdByUid || '',
              createdAt: tsToIso(d.createdAt),
              publishedAt: tsToIso(d.publishedAt),
            };
          });
          items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          setRawAnnouncements(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'announcements')
      )
    );

    // 10. Achievements (Monthly Recognition)
    const achQuery = isEditor
      ? query(collection(db, 'achievements'), where('status', 'in', ['published', 'draft']))
      : query(collection(db, 'achievements'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        achQuery,
        (snap) => {
          const items: Achievement[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              title: d.title || '',
              description: d.description || '',
              recipientDisplayName: d.recipientDisplayName || '',
              recipientClass: d.recipientClass || '',
              date: d.date || '',
              month: d.month || '',
              year: Number(d.year) || undefined,
              category: d.category || 'Monthly Laureate',
              status: d.status || 'published',
              createdByUid: d.createdByUid || '',
              createdAt: tsToIso(d.createdAt),
            };
          });
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRawAchievements(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'achievements')
      )
    );

    // 11. Events
    const evtQuery = isEditor
      ? query(collection(db, 'events'), where('status', 'in', ['published', 'draft']))
      : query(collection(db, 'events'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        evtQuery,
        (snap) => {
          const items: SchoolEvent[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              title: d.title || '',
              description: d.description || '',
              date: d.date || '',
              time: d.time || '',
              location: d.location || '',
              category: d.category || 'Debate Meet',
              organizer: d.organizer || 'WDS Council',
              status: d.status || 'published',
              createdByUid: d.createdByUid || '',
              createdAt: tsToIso(d.createdAt),
            };
          });
          items.sort((a, b) => a.date.localeCompare(b.date));
          setRawEvents(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'events')
      )
    );

    // 12. Public Likes
    unsubs.push(
      onSnapshot(
        query(collection(db, 'likes'), where('visibility', '==', 'public')),
        (snap) => {
          const items: LikeRecord[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              targetType: d.targetType,
              targetId: d.targetId,
              sessionToken: d.sessionToken,
              weekKey: d.weekKey || getIsoWeekKey(),
              visibility: 'public',
              createdAt: tsToIso(d.createdAt),
            };
          });
          setLikes(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'likes')
      )
    );

    // 13. Weekly Ranking Snapshots
    unsubs.push(
      onSnapshot(
        query(collection(db, 'weeklyRankings'), where('totalLikes', '>=', 0)),
        (snap) => {
          const items: WeeklyRankingSnapshot[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              weekKey: d.weekKey || docSnap.id,
              weekLabel: d.weekLabel || docSnap.id,
              entries: Array.isArray(d.entries) ? d.entries : [],
              totalLikes: Number(d.totalLikes) || 0,
              computedByUid: d.computedByUid || '',
              computedAt: tsToIso(d.computedAt),
            };
          });
          items.sort((a, b) => b.weekKey.localeCompare(a.weekKey));
          setWeeklyRankingsSnapshots(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'weeklyRankings')
      )
    );

    // 14. Admin-gated Private Listeners
    if (isModerator) {
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'submissions'),
            where('status', 'in', ['pending', 'approved', 'rejected', 'changes_requested'])
          ),
          (snap) => {
            const items: PublicSubmission[] = snap.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                submissionType: d.submissionType,
                title: d.title || '',
                excerpt: d.excerpt,
                content: d.content || '',
                category: d.category,
                displayName: d.displayName || 'Anonymous',
                authorClass: d.authorClass,
                isAnonymous: Boolean(d.isAnonymous),
                imageUrl: d.imageUrl,
                fileUrl: d.fileUrl,
                storagePath: d.storagePath,
                fileName: d.fileName,
                fileSize: d.fileSize,
                fileFormat: d.fileFormat,
                debateId: d.debateId,
                argumentId: d.argumentId,
                side: d.side,
                targetType: d.targetType,
                targetId: d.targetId,
                status: d.status || 'pending',
                moderationNotes: d.moderationNotes,
                sessionToken: d.sessionToken || '',
                botChallengeVerified: Boolean(d.botChallengeVerified),
                submittedAt: tsToIso(d.submittedAt),
                reviewedAt: d.reviewedAt ? tsToIso(d.reviewedAt) : undefined,
                reviewedByUid: d.reviewedByUid,
                reviewedByName: d.reviewedByName,
              };
            });
            items.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
            setSubmissions(items);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'submissions')
        )
      );
    } else {
      setSubmissions([]);
    }

    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'auditLogs'), where('actorUid', '>=', '')),
          (snap) => {
            const items: AuditLog[] = snap.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                actorUid: d.actorUid || '',
                actorName: d.actorName || '',
                actorRole: d.actorRole || '',
                action: d.action || '',
                targetType: d.targetType || '',
                targetId: d.targetId || '',
                details: d.details || '',
                timestamp: tsToIso(d.timestamp),
              };
            });
            items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setAuditLogs(items);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'auditLogs')
        )
      );
    } else {
      setAuditLogs([]);
    }

    if (isSuperAdmin) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'admins'), where('status', 'in', ['active', 'disabled'])),
          (snap) => {
            const items: AdminRecord[] = snap.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                uid: docSnap.id,
                email: d.email || '',
                displayName: d.displayName || '',
                title: d.title || '',
                role: d.role,
                status: d.status,
                inviteId: d.inviteId,
                createdAt: tsToIso(d.createdAt),
                updatedAt: d.updatedAt ? tsToIso(d.updatedAt) : undefined,
              };
            });
            setAdminsList(items);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'admins')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'adminInvites'), where('status', 'in', ['pending', 'claimed', 'revoked'])),
          (snap) => {
            const items: AdminInvite[] = snap.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                email: d.email || '',
                displayName: d.displayName || '',
                title: d.title || '',
                role: d.role,
                status: d.status,
                createdByUid: d.createdByUid || '',
                createdAt: tsToIso(d.createdAt),
              };
            });
            items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setAdminInvites(items);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'adminInvites')
        )
      );
    } else {
      setAdminsList([]);
      setAdminInvites([]);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authLoading, isAdmin, isSuperAdmin, isEditor, isModerator]);

  const publishedNews = useMemo(
    () =>
      rawNews.filter(
        (n) => n.status === 'published' && new Date(n.publishedAt).getTime() <= Date.now() + 60000
      ),
    [rawNews]
  );

  const approvedArguments = useMemo(
    () => rawArguments.filter((a) => a.moderationStatus === 'approved'),
    [rawArguments]
  );

  const approvedReplies = useMemo(
    () => rawReplies.filter((r) => r.moderationStatus === 'approved'),
    [rawReplies]
  );

  const approvedWritings = useMemo(
    () => rawWritings.filter((w) => w.moderationStatus === 'approved'),
    [rawWritings]
  );

  const approvedDocuments = useMemo(
    () => rawDocuments.filter((d) => d.moderationStatus === 'approved'),
    [rawDocuments]
  );

  const approvedComments = useMemo(
    () => rawComments.filter((c) => c.moderationStatus === 'approved'),
    [rawComments]
  );

  const publishedAnnouncements = useMemo(
    () => rawAnnouncements.filter((a) => a.status === 'published'),
    [rawAnnouncements]
  );

  const publishedAchievements = useMemo(
    () => rawAchievements.filter((a) => a.status === 'published'),
    [rawAchievements]
  );

  const publishedEvents = useMemo(
    () => rawEvents.filter((e) => e.status === 'published'),
    [rawEvents]
  );

  const likesByTarget = useMemo(() => {
    const map = new Map<string, number>();
    const sessionSet = new Set<string>();
    likes.forEach((l) => {
      const k = `${l.targetType}:${l.targetId}`;
      map.set(k, (map.get(k) || 0) + 1);
      if (l.sessionToken === sessionToken) {
        sessionSet.add(k);
      }
    });
    return { map, sessionSet };
  }, [likes, sessionToken]);

  const liveWeeklyRankings = useMemo(
    () =>
      wdsService.computeWeeklyRankings(
        likes,
        approvedWritings,
        approvedArguments,
        publishedNews,
        approvedDocuments
      ),
    [likes, approvedWritings, approvedArguments, publishedNews, approvedDocuments]
  );

  const hasSessionLiked = (targetType: LikeRecord['targetType'], targetId: string) =>
    likesByTarget.sessionSet.has(`${targetType}:${targetId}`);

  const getLikeCount = (targetType: LikeRecord['targetType'], targetId: string, storedCount = 0) =>
    Math.max(storedCount, likesByTarget.map.get(`${targetType}:${targetId}`) || 0);

  const getApprovedComments = (targetType: 'news' | 'writing' | 'document', targetId: string) =>
    approvedComments.filter((c) => c.targetType === targetType && c.targetId === targetId);

  const getApprovedReplies = (argumentId: string) =>
    approvedReplies.filter((r) => r.argumentId === argumentId);

  return (
    <WdsDataContext.Provider
      value={{
        loading,
        settings,
        news: publishedNews,
        debates,
        debateArguments: approvedArguments,
        debateReplies: approvedReplies,
        writings: approvedWritings,
        documents: approvedDocuments,
        comments: approvedComments,
        announcements: publishedAnnouncements,
        achievements: publishedAchievements,
        events: publishedEvents,
        likes,
        weeklyRankingsSnapshots,
        liveWeeklyRankings,
        allNewsAdmin: rawNews,
        allAnnouncementsAdmin: rawAnnouncements,
        allAchievementsAdmin: rawAchievements,
        allEventsAdmin: rawEvents,
        submissions,
        adminsList,
        adminInvites,
        auditLogs,
        hasSessionLiked,
        getLikeCount,
        getApprovedComments,
        getApprovedReplies,
      }}
    >
      {children}
    </WdsDataContext.Provider>
  );
};

export const useWdsData = (): WdsDataContextType => {
  const ctx = useContext(WdsDataContext);
  if (!ctx) {
    throw new Error('useWdsData must be used within a WdsDataProvider');
  }
  return ctx;
};
