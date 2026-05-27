import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAnnouncementsStore } from '../../stores/announcementsStore';
import { fetchAnnouncements } from '../../services/announcements';

export const AnnouncementBanner: React.FC = () => {
  const { setAnnouncements, dismiss, visibleAnnouncements } =
    useAnnouncementsStore();

  useEffect(() => {
    fetchAnnouncements().then(setAnnouncements);
  }, []);

  const visible = visibleAnnouncements();

  if (visible.length === 0) return null;

  const announcement = visible[0];

  const bgColor =
    announcement.type === 'warning'
      ? '#fff8e1'
      : announcement.type === 'success'
      ? '#e8f5e9'
      : '#eef6ff';

  return (
    <View
      style={{
        padding: 12,
        backgroundColor: bgColor,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: 'bold' }}>{announcement.title}</Text>
        <Text>{announcement.message}</Text>
      </View>
      <TouchableOpacity onPress={() => dismiss(announcement.id)}>
        <Text style={{ fontWeight: 'bold', paddingLeft: 12 }}>X</Text>
      </TouchableOpacity>
    </View>
  );
};
