export type AdminRole = 'super_admin' | 'editor' | 'moderator';
export type AdminStatus = 'active' | 'disabled';

export interface AdminRecord {
  uid: string;
  email: string;
  displayName: string;
  title?: string;
  role: AdminRole;
  status: AdminStatus;
  inviteId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminInvite {
  id: string;
  email: string;
  displayName: string;
  title?: string;
  role: AdminRole;
  status: 'pending' | 'claimed' | 'revoked';
  createdByUid: string;
  createdAt: string;
}

export type NewsCategory =
  | 'School announcements'
  | 'Academic news'
  | 'Sports'
  | 'Clubs and societies'
  | 'Events'
  | 'General student news';

export type ContentStatus = 'published' | 'draft' | 'scheduled' | 'archived';

export interface NewsArticle {
  id: string;
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
  createdByUid: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  publishedAt: string;
  updatedAt: string;
}

export type DebateStatus = 'active' | 'closed' | 'archived';
export type DebateSide = 'FOR' | 'AGAINST';

export interface DebateTopic {
  id: string;
  topic: string;
  description: string;
  category: string;
  proLabel: string;
  conLabel: string;
  openingDate: string;
  closingDate: string;
  status: DebateStatus;
  proCount: number;
  conCount: number;
  createdByUid: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebateArgument {
  id: string;
  debateId: string;
  side: DebateSide;
  displayName: string;
  authorClass?: string;
  title: string;
  argument: string;
  moderationStatus: 'approved' | 'pending' | 'rejected';
  likesCount: number;
  reviewedByUid: string;
  createdAt: string;
}

export interface DebateReply {
  id: string;
  debateId: string;
  argumentId: string;
  displayName: string;
  content: string;
  moderationStatus: 'approved' | 'rejected';
  reviewedByUid: string;
  createdAt: string;
}

export type WritingCategory =
  | 'poem'
  | 'short_story'
  | 'essay'
  | 'reflection'
  | 'creative_writing'
  | 'other';

export interface WritingPublication {
  id: string;
  title: string;
  subtitle?: string;
  dedication?: string;
  content: string;
  writingType: WritingCategory;
  authorDisplayName: string;
  authorClass?: string;
  imageUrl?: string;
  readingTime: string;
  featured: boolean;
  moderationStatus: 'approved' | 'pending' | 'rejected';
  likesCount: number;
  commentsCount: number;
  reviewedByUid: string;
  createdAt: string;
  publishedAt: string;
  updatedAt: string;
}

export type DocumentCategory =
  | 'Debate Brief'
  | 'Essay Manuscript'
  | 'Poetry Collection'
  | 'Speech Transcript'
  | 'Study Paper';

export interface UploadedDocument {
  id: string;
  title: string;
  description: string;
  category: DocumentCategory;
  fileFormat: string;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  storagePath?: string;
  textContent?: string;
  authorDisplayName: string;
  authorClass?: string;
  moderationStatus: 'approved' | 'pending' | 'rejected';
  downloadsCount: number;
  likesCount: number;
  reviewedByUid: string;
  createdAt: string;
  publishedAt: string;
}

export type SubmissionType =
  | 'news'
  | 'poem'
  | 'short_story'
  | 'essay'
  | 'reflection'
  | 'creative_writing'
  | 'debate_argument'
  | 'debate_reply'
  | 'document'
  | 'comment';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface PublicSubmission {
  id: string;
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
  status: SubmissionStatus;
  moderationNotes?: string;
  sessionToken: string;
  botChallengeVerified: boolean;
  submittedAt: string;
  reviewedAt?: string;
  reviewedByUid?: string;
  reviewedByName?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'normal' | 'important' | 'urgent';
  status: 'published' | 'draft';
  authorDisplayName: string;
  createdByUid: string;
  createdAt: string;
  publishedAt: string;
}

export type AchievementCategory =
  | 'Monthly Laureate'
  | 'Debate Honor'
  | 'Literary Distinction'
  | 'Inter-School Award'
  | 'Service';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  recipientDisplayName: string;
  recipientClass?: string;
  date: string;
  month?: string;
  year?: number;
  category: AchievementCategory;
  status: 'published' | 'draft';
  createdByUid: string;
  createdAt: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: 'Assembly' | 'Debate Meet' | 'Poetry Night' | 'Inter-School' | 'Seminar';
  organizer: string;
  status: 'published' | 'draft';
  createdByUid: string;
  createdAt: string;
}

export interface CommentRecord {
  id: string;
  targetType: 'news' | 'writing' | 'document';
  targetId: string;
  displayName: string;
  content: string;
  moderationStatus: 'approved' | 'rejected';
  reviewedByUid: string;
  createdAt: string;
}

export interface LikeRecord {
  id: string;
  targetType: 'news' | 'writing' | 'debateArgument' | 'document';
  targetId: string;
  sessionToken: string;
  weekKey: string;
  visibility: 'public';
  createdAt: string;
}

export interface WeeklyRankingEntry {
  rank: number;
  contributionId: string;
  contributionType: string;
  title: string;
  authorDisplayName: string;
  authorClass: string;
  weeklyLikes: number;
  totalLikes: number;
  score: number;
}

export interface WeeklyRankingSnapshot {
  id: string;
  weekKey: string;
  weekLabel: string;
  entries: WeeklyRankingEntry[];
  totalLikes: number;
  computedByUid: string;
  computedAt: string;
}

export interface PlatformSettings {
  schoolName: string;
  schoolShortName: string;
  societyName: string;
  societyMotto: string;
  academicYear: string;
  currentTerm: string;
  debateCycleDays: number;
  contactEmail?: string;
  contactLocation?: string;
  meetingSchedule?: string;
  allowPublicSubmissions: boolean;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}
