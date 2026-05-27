
export type Announcement = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  createdAt: string;
};

export async function fetchAnnouncements(): Promise<Announcement[]> {
  try {
    const res = await fetch('/api/announcements');
    if (!res.ok) throw new Error('[announcements] Failed to fetch');
    const data = await res.json();
    console.log('[announcements] Fetched:', data.length);
    return data;
  } catch (err) {
    console.warn('[announcements] Error fetching:', err);
    return [];
  }
}
