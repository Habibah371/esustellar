
export type Announcement = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  createdAt: string;
};

const DEFAULT_MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'announce-1',
    title: 'New savings insights are live',
    message:
      'Open the new savings summary card to see contribution trends for your active groups.',
    type: 'info',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'announce-2',
    title: 'Weekly payout reminder',
    message:
      'Members in rotating groups should confirm payout readiness before the next cycle starts.',
    type: 'warning',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'announce-3',
    title: 'Performance improvements shipped',
    message:
      'Transaction and group screens now load faster after the latest mobile refresh.',
    type: 'success',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

let mockAnnouncements = [...DEFAULT_MOCK_ANNOUNCEMENTS];

export function setMockAnnouncements(items: Announcement[]) {
  mockAnnouncements = [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function appendMockAnnouncement(item: Announcement) {
  mockAnnouncements = [item, ...mockAnnouncements].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return [...mockAnnouncements];
  } catch (err) {
    console.warn('[announcements] Error fetching:', err);
    return [];
  }
}
