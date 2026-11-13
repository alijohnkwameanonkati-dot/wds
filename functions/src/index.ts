import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentWritten, onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

initializeApp();

const db = getFirestore();
const adminAuth = getAuth();

/**
 * Syncs custom claims (wdsRole & wdsActive) whenever an admin document is created, updated, or deleted.
 */
export const syncAdminCustomClaims = onDocumentWritten('admins/{uid}', async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after.data();

  if (!after || after.status !== 'active') {
    await adminAuth.setCustomUserClaims(uid, { wdsAdmin: false, wdsRole: null });
    return;
  }

  await adminAuth.setCustomUserClaims(uid, {
    wdsAdmin: true,
    wdsRole: after.role,
  });
});

/**
 * Keeps parent likesCount synchronized server-side whenever a session like is created.
 */
export const onLikeCreated = onDocumentCreated('likes/{likeId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const { targetType, targetId } = data;
  const collectionName =
    targetType === 'news'
      ? 'news'
      : targetType === 'writing'
      ? 'writings'
      : targetType === 'debateArgument'
      ? 'debateArguments'
      : targetType === 'document'
      ? 'documents'
      : null;

  if (!collectionName || !targetId) return;

  await db
    .collection(collectionName)
    .doc(targetId)
    .update({
      likesCount: FieldValue.increment(1),
    })
    .catch(() => null);
});

/**
 * Decrements parent likesCount if an admin removes a like document.
 */
export const onLikeDeleted = onDocumentDeleted('likes/{likeId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const { targetType, targetId } = data;
  const collectionName =
    targetType === 'news'
      ? 'news'
      : targetType === 'writing'
      ? 'writings'
      : targetType === 'debateArgument'
      ? 'debateArguments'
      : targetType === 'document'
      ? 'documents'
      : null;

  if (!collectionName || !targetId) return;

  await db
    .collection(collectionName)
    .doc(targetId)
    .update({
      likesCount: FieldValue.increment(-1),
    })
    .catch(() => null);
});

function getIsoWeekKey(date: Date): string {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function computeAndPersistWeeklySnapshot(computedByUid: string) {
  const weekKey = getIsoWeekKey(new Date());

  const [writingsSnap, argsSnap, newsSnap, docsSnap, likesSnap] = await Promise.all([
    db.collection('writings').where('moderationStatus', '==', 'approved').get(),
    db.collection('debateArguments').where('moderationStatus', '==', 'approved').get(),
    db.collection('news').where('status', '==', 'published').get(),
    db.collection('documents').where('moderationStatus', '==', 'approved').get(),
    db.collection('likes').where('weekKey', '==', weekKey).get(),
  ]);

  const likeMap = new Map<string, number>();
  likesSnap.forEach((docSnap) => {
    const d = docSnap.data();
    const key = `${d.targetType}:${d.targetId}`;
    likeMap.set(key, (likeMap.get(key) || 0) + 1);
  });

  interface Entry {
    contributionId: string;
    contributionType: string;
    title: string;
    authorDisplayName: string;
    authorClass: string;
    weeklyLikes: number;
    score: number;
  }

  const entries: Entry[] = [];

  writingsSnap.forEach((docSnap) => {
    const d = docSnap.data();
    const weeklyLikes = likeMap.get(`writing:${docSnap.id}`) || 0;
    entries.push({
      contributionId: docSnap.id,
      contributionType: d.writingType || 'writing',
      title: d.title,
      authorDisplayName: d.authorDisplayName,
      authorClass: d.authorClass || 'OLAG Contributor',
      weeklyLikes,
      score: 25 + weeklyLikes * 5,
    });
  });

  argsSnap.forEach((docSnap) => {
    const d = docSnap.data();
    const weeklyLikes = likeMap.get(`debateArgument:${docSnap.id}`) || 0;
    entries.push({
      contributionId: docSnap.id,
      contributionType: 'debateArgument',
      title: d.title,
      authorDisplayName: d.displayName,
      authorClass: d.authorClass || 'OLAG Contributor',
      weeklyLikes,
      score: 15 + weeklyLikes * 5,
    });
  });

  docsSnap.forEach((docSnap) => {
    const d = docSnap.data();
    const weeklyLikes = likeMap.get(`document:${docSnap.id}`) || 0;
    entries.push({
      contributionId: docSnap.id,
      contributionType: 'document',
      title: d.title,
      authorDisplayName: d.authorDisplayName,
      authorClass: d.authorClass || 'OLAG Contributor',
      weeklyLikes,
      score: 10 + weeklyLikes * 5,
    });
  });

  newsSnap.forEach((docSnap) => {
    const d = docSnap.data();
    if (d.isOfficial) return;
    const weeklyLikes = likeMap.get(`news:${docSnap.id}`) || 0;
    entries.push({
      contributionId: docSnap.id,
      contributionType: 'news',
      title: d.title,
      authorDisplayName: d.authorDisplayName,
      authorClass: d.authorClass || 'OLAG Contributor',
      weeklyLikes,
      score: 10 + weeklyLikes * 5,
    });
  });

  entries.sort((a, b) => b.score - a.score || b.weeklyLikes - a.weeklyLikes);

  await db
    .collection('weeklyRankings')
    .doc(weekKey)
    .set({
      weekKey,
      weekLabel: `Week ${weekKey}`,
      entries: entries.slice(0, 50),
      totalLikes: likesSnap.size,
      computedByUid,
      computedAt: FieldValue.serverTimestamp(),
    });

  return { weekKey, count: entries.length, totalLikes: likesSnap.size };
}

/**
 * Scheduled weekly ranking archival every Sunday at 23:55 UTC.
 */
export const scheduledWeeklyLeaderboard = onSchedule('55 23 * * 0', async () => {
  await computeAndPersistWeeklySnapshot('system_scheduler');
});

/**
 * Callable endpoint for authorised editors/super admins to recompute the weekly snapshot on demand.
 */
export const recomputeWeeklyLeaderboard = onCall(async (request) => {
  if (!request.auth || !request.auth.token.email_verified) {
    throw new HttpsError('unauthenticated', 'Administrator authentication required.');
  }

  const adminSnap = await db.collection('admins').doc(request.auth.uid).get();
  const isBootstrapped = request.auth.token.email === 'ghost.hex.12@gmail.com';
  const role = adminSnap.data()?.role;
  const active = adminSnap.data()?.status === 'active';

  if (!isBootstrapped && (!active || (role !== 'super_admin' && role !== 'editor'))) {
    throw new HttpsError('permission-denied', 'Editor or Super Admin privileges required.');
  }

  return computeAndPersistWeeklySnapshot(request.auth.uid);
});
