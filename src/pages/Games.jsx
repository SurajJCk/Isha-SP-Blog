import React, { useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Games = () => {
  const [selectedGame, setSelectedGame] = useState(null);

  const games = [
    {
      id: 1,
      title: 'Meditation Timer',
      description: 'A peaceful meditation timer with calming sounds and guided breathing exercises.',
      image: 'https://isha.sadhguru.org/yoga/wp-content/uploads/2021/02/meditation.jpg',
      component: MeditationTimer
    },
    {
      id: 2,
      title: 'Mindfulness Puzzle',
      description: 'Solve peaceful puzzles while practicing mindfulness and concentration.',
      image: 'https://isha.sadhguru.org/yoga/wp-content/uploads/2021/02/mindfulness.jpg',
      component: MindfulnessPuzzle
    },
    {
      id: 3,
      title: 'Wisdom Quest',
      description: 'Test your knowledge of Sadhguru\'s teachings in this engaging quiz game.',
      image: 'https://isha.sadhguru.org/yoga/wp-content/uploads/2021/02/wisdom.jpg',
      component: WisdomQuest
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Spiritual Games</h1>
        
        {!selectedGame ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <div
                key={game.id}
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105"
              >
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{game.title}</h3>
                  <p className="text-gray-400 mb-4">{game.description}</p>
                  <button
                    onClick={() => setSelectedGame(game)}
                    className="flex items-center justify-center w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    <FaPlay className="mr-2" />
                    Play Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedGame(null)}
              className="mb-6 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Back to Games
            </button>
            <selectedGame.component />
          </div>
        )}
      </div>
    </div>
  );
};

const MeditationTimer = () => {
  const [time, setTime] = useState(300); // 5 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState('bells');

  const sounds = {
    bells: '/sounds/bells.mp3',
    nature: '/sounds/nature.mp3',
    om: '/sounds/om.mp3'
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setIsRunning(true);
    // Add timer logic here
    toast.success('Meditation session started');
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8">
      <h2 className="text-3xl font-bold text-white text-center mb-6">Meditation Timer</h2>
      <div className="text-6xl font-mono text-white text-center mb-8">
        {formatTime(time)}
      </div>
      <div className="mb-6">
        <label className="block text-white mb-2">Background Sound</label>
        <select
          value={selectedSound}
          onChange={(e) => setSelectedSound(e.target.value)}
          className="w-full bg-gray-700 text-white rounded-md px-4 py-2"
        >
          <option value="bells">Meditation Bells</option>
          <option value="nature">Nature Sounds</option>
          <option value="om">Om Chanting</option>
        </select>
      </div>
      <button
        onClick={startTimer}
        className="w-full bg-purple-600 text-white rounded-md px-4 py-3 hover:bg-purple-700 transition-colors"
      >
        {isRunning ? 'Pause' : 'Start Meditation'}
      </button>
    </div>
  );
};

const MindfulnessPuzzle = () => {
  const [completed, setCompleted] = useState(false);
  
  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-8">
      <h2 className="text-3xl font-bold text-white text-center mb-6">Mindfulness Puzzle</h2>
      <div className="aspect-square bg-gray-700 rounded-lg mb-6">
        {/* Puzzle game canvas will go here */}
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-400">Puzzle game coming soon...</p>
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-400 mb-4">
          Arrange the pieces while maintaining your breath awareness.
        </p>
        <button
          onClick={() => toast.success('Feature coming soon!')}
          className="bg-purple-600 text-white rounded-md px-6 py-3 hover:bg-purple-700 transition-colors"
        >
          Start New Puzzle
        </button>
      </div>
    </div>
  );
};

const WisdomQuest = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);

  const questions = [
    {
      question: "What is the meaning of 'Sadhguru'?",
      options: [
        "Enlightened being",
        "Uneducated guru",
        "One who is not a guru",
        "One who is not bound by tradition"
      ],
      correct: 0
    },
    {
      question: "What is the core purpose of Isha Foundation?",
      options: [
        "Making money",
        "Political activism",
        "Inner transformation",
        "Entertainment"
      ],
      correct: 2
    },
    // Add more questions here
  ];

  const handleAnswer = (selectedIndex) => {
    if (selectedIndex === questions[currentQuestion].correct) {
      setScore(score + 1);
      toast.success('Correct answer!');
    } else {
      toast.error('Try again!');
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      toast.success(`Quiz completed! Score: ${score}/${questions.length}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-8">
      <h2 className="text-3xl font-bold text-white text-center mb-6">Wisdom Quest</h2>
      <div className="mb-8">
        <p className="text-xl text-white mb-4">
          {questions[currentQuestion].question}
        </p>
        <div className="space-y-4">
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className="w-full text-left px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="text-center text-gray-400">
        Question {currentQuestion + 1} of {questions.length} | Score: {score}
      </div>
    </div>
  );
};

export default Games;
