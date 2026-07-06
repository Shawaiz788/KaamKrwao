import React, { createContext, useContext, useState } from 'react';
import PostJobModal from '../components/home/PostJobModal';
import { Alert } from 'react-native';

interface PostJobContextType {
  openPostJob: (category?: string) => void;
  closePostJob: () => void;
}

const PostJobContext = createContext<PostJobContextType>({
  openPostJob: () => {},
  closePostJob: () => {},
});

export function PostJobProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [category, setCategory] = useState<string | undefined>(undefined);

  const openPostJob = (cat?: string) => {
    setCategory(cat);
    setVisible(true);
  };

  const closePostJob = () => {
    setVisible(false);
    setCategory(undefined);
  };

  const handlePostSuccess = (details: any) => {
    Alert.alert(
      'Success!',
      `Your job request for "${details.category}" in ${details.area}, ${details.city} has been posted.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <PostJobContext.Provider value={{ openPostJob, closePostJob }}>
      {children}
      <PostJobModal
        visible={visible}
        onClose={closePostJob}
        initialCategory={category}
        onSuccess={handlePostSuccess}
      />
    </PostJobContext.Provider>
  );
}

export const usePostJob = () => useContext(PostJobContext);
