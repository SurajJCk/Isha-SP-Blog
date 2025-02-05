import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAtzKZWJwqVH5VKgqiHCWUYhEVBFYRWBRo",
  authDomain: "isha-sp-blog.firebaseapp.com",
  projectId: "isha-sp-blog",
  storageBucket: "isha-sp-blog.appspot.com",
  messagingSenderId: "1080982427735",
  appId: "1:1080982427735:web:7b91c9c265c7c7a4c9f4c1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const initialMemes = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    caption: 'When you finally find inner peace through meditation 🧘‍♂️✨',
    userId: 'system',
    likes: [],
    likeCount: 0,
    comments: [],
    timestamp: serverTimestamp()
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    caption: 'That moment when your mind becomes still during yoga 🌟',
    userId: 'system',
    likes: [],
    likeCount: 0,
    comments: [],
    timestamp: serverTimestamp()
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    caption: 'When someone asks why you wake up at 4 AM for meditation 😌',
    userId: 'system',
    likes: [],
    likeCount: 0,
    comments: [],
    timestamp: serverTimestamp()
  }
];

const seedMemes = async () => {
  try {
    const memesRef = collection(db, 'memes');
    
    for (const meme of initialMemes) {
      await addDoc(memesRef, meme);
      console.log('Added meme:', meme.caption);
    }
    
    console.log('Successfully seeded memes!');
  } catch (error) {
    console.error('Error seeding memes:', error);
  }
};

seedMemes();
