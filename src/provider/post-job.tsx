import React, { createContext, useContext, useState } from 'react';
import PostJobModal from '../components/home/PostJobModal';
import { Alert } from 'react-native';

import { getOrCreateLocationChain } from '../../api/location';

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

  const handlePostSuccess = async (details: any) => {
    console.log('[post-job provider] onSuccess triggered with details:', details);
    try {
      let locationId: number;
      if (details.useSavedLocation && details.locationId) {
        locationId = details.locationId;
        console.log('[post-job provider] Using saved location ID:', locationId);
      } else {
        const location = await getOrCreateLocationChain({
          countryName: details.country,
          cityName: details.city,
          areaName: details.area,
          houseNumber: details.houseNumber,
          streetNumber: details.streetNumber,
          pinLocation: details.pinLocation,
          zipCode: details.zipCode,
          landmark: details.landmark || '',
        });
        locationId = location.id!;
        console.log('[post-job provider] Location created successfully:', location);
      }

      const locationDisplay = details.useSavedLocation
        ? 'your saved address'
        : `${details.area}, ${details.city}`;

      Alert.alert(
        'Success!',
        `Your job request for "${details.category}" in ${locationDisplay} has been posted.\n\nResolved Location ID: ${locationId}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('[post-job provider] Failed to create location:', err);
      Alert.alert(
        'Location Resolution Error',
        `Failed to resolve location: ${err?.message || err}`,
        [{ text: 'OK' }]
      );
    }
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
