import { Pro } from '@/types';

export const MOCK_PROS: Pro[] = [
  {
    id: '1',
    name: 'Ahmad Ali Electrician',
    category: 'Electrician',
    rating: 4.8,
    reviews: 127,
    location: 'DHA Phase 5, Lahore',
    price: 'Rs. 1,500',
    timeEstimate: '~10 min',
    policeVerified: true,
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
  },
  {
    id: '2',
    name: 'Malik Brothers Plumbing',
    category: 'Plumber',
    rating: 4.6,
    reviews: 89,
    location: 'Clifton Block 4, Karachi',
    price: 'Rs. 1,200',
    timeEstimate: '~25 min',
    policeVerified: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  },
];
