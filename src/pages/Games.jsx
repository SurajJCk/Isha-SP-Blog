import React, { useState, useEffect } from 'react';
import { FaPlay } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { categories } from '../data/quizData';
import JigsawPuzzle from '../components/JigsawPuzzle';

// Game Components
const MeditationTimer = () => {
  const [time, setTime] = useState(300); // 5 minutes in seconds (default)
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState('bells');
  const [customTime, setCustomTime] = useState(5); // Default 5 minutes
  const [intervalId, setIntervalId] = useState(null);

  const sounds = {
    bells: 'https://assets.mixkit.co/active_storage/sfx/2400/2400.wav',
    nature: 'https://assets.mixkit.co/active_storage/sfx/2064/2064.wav',
    om: 'https://assets.mixkit.co/active_storage/sfx/2058/2058.wav'
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playSound = () => {
    const audioUrl = sounds[selectedSound];
    if (!audioUrl) {
      toast.error('Sound not available');
      return;
    }

    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Error playing sound:', error);
      toast.error('Could not play sound. Please try a different sound or check your browser settings.');
    });
  };

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      const id = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(id);
            setIsRunning(false);
            playSound();
            toast.success('Meditation session completed! 🧘‍♂️✨');
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      setIntervalId(id);
      toast.success('Meditation session started 🧘‍♂️');
    } else {
      // Pause timer
      clearInterval(intervalId);
      setIsRunning(false);
      toast.success('Meditation session paused');
    }
  };

  const resetTimer = () => {
    clearInterval(intervalId);
    setIsRunning(false);
    setTime(customTime * 60);
    toast.success('Timer reset');
  };

  const handleTimeChange = (e) => {
    const newTime = parseInt(e.target.value);
    if (newTime > 0 && newTime <= 120) {
      setCustomTime(newTime);
      setTime(newTime * 60);
    }
  };

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8">
      <h2 className="text-3xl font-bold text-white text-center mb-6">Meditation Timer</h2>
      
      {/* Timer Display */}
      <div className="text-6xl font-mono text-white text-center mb-8">
        {formatTime(time)}
      </div>

      {/* Time Settings */}
      <div className="mb-6">
        <label className="block text-white mb-2">Set Timer (minutes)</label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="1"
            max="120"
            value={customTime}
            onChange={handleTimeChange}
            className="w-24 bg-gray-700 text-white rounded-md px-4 py-2"
            disabled={isRunning}
          />
          <span className="text-gray-400">
            (1-120 minutes)
          </span>
        </div>
      </div>

      {/* Sound Settings */}
      <div className="mb-6">
        <label className="block text-white mb-2">Completion Sound</label>
        <select
          value={selectedSound}
          onChange={(e) => setSelectedSound(e.target.value)}
          className="w-full bg-gray-700 text-white rounded-md px-4 py-2"
          disabled={isRunning}
        >
          <option value="bells">Meditation Bells</option>
          <option value="nature">Nature Sounds</option>
          <option value="om">Om Chanting</option>
        </select>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4">
        <button
          onClick={startTimer}
          className="flex-1 bg-purple-600 text-white rounded-md px-4 py-3 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          <FaPlay className="w-4 h-4" />
          {isRunning ? 'Pause' : 'Start Meditation'}
        </button>
        <button
          onClick={resetTimer}
          className="px-4 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          disabled={isRunning}
        >
          Reset
        </button>
      </div>

      {/* Tips */}
      {!isRunning && (
        <div className="mt-6 text-gray-400 text-sm">
          <p>💡 Tips:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Find a quiet, comfortable place</li>
            <li>Sit in a relaxed, upright position</li>
            <li>Focus on your breath</li>
            <li>Let thoughts come and go without judgment</li>
          </ul>
        </div>
      )}
    </div>
  );
};

const MindfulnessPuzzle = () => {
  const [tiles, setTiles] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  // Calming images for the puzzle
  const puzzleImages = [
    'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=500', // Lotus
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500', // Beach
    'https://images.unsplash.com/photo-1546514714-df0ccc50d7bf?w=500', // Mountains
  ];

  const mindfulnessPrompts = [
    "Take a deep breath as you make your next move...",
    "Notice any feelings of frustration without judgment",
    "Stay present with each movement",
    "Observe your thoughts as you solve the puzzle",
    "Feel the gentle touch as you slide each piece"
  ];

  // Initialize puzzle
  const initializePuzzle = () => {
    const newTiles = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      position: i
    }));
    newTiles.push({ id: null, position: 8 }); // Empty tile
    
    // Shuffle tiles
    for (let i = newTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
    }
    
    // Ensure puzzle is solvable
    if (!isSolvable(newTiles)) {
      // Swap first two tiles to make it solvable
      [newTiles[0], newTiles[1]] = [newTiles[1], newTiles[0]];
    }
    
    setTiles(newTiles);
    setMoves(0);
    setIsComplete(false);
    setGameStarted(true);
  };

  // Check if puzzle is solvable
  const isSolvable = (tiles) => {
    let inversions = 0;
    const tileArray = tiles.map(t => t.id).filter(id => id !== null);
    
    for (let i = 0; i < tileArray.length - 1; i++) {
      for (let j = i + 1; j < tileArray.length; j++) {
        if (tileArray[i] > tileArray[j]) inversions++;
      }
    }
    
    return inversions % 2 === 0;
  };

  // Check if puzzle is complete
  const checkCompletion = (newTiles) => {
    return newTiles.every((tile, index) => {
      return tile.id === null || tile.position === tile.id - 1;
    });
  };

  // Handle tile click
  const handleTileClick = (clickedTile) => {
    if (!gameStarted || isComplete) return;

    const emptyTile = tiles.find(tile => tile.id === null);
    const emptyPos = emptyTile.position;
    const clickedPos = clickedTile.position;

    // Check if move is valid (adjacent to empty tile)
    const isAdjacent = (
      Math.abs(Math.floor(emptyPos / 3) - Math.floor(clickedPos / 3)) +
      Math.abs((emptyPos % 3) - (clickedPos % 3))
    ) === 1;

    if (isAdjacent) {
      const newTiles = tiles.map(tile => {
        if (tile.id === null) return { ...tile, position: clickedPos };
        if (tile.id === clickedTile.id) return { ...tile, position: emptyPos };
        return tile;
      });

      setTiles(newTiles);
      setMoves(moves + 1);

      const complete = checkCompletion(newTiles);
      if (complete) {
        setIsComplete(true);
        toast.success('Congratulations! Puzzle completed! 🎉');
      }
    }
  };

  // Get random mindfulness prompt
  const getRandomPrompt = () => {
    return mindfulnessPrompts[Math.floor(Math.random() * mindfulnessPrompts.length)];
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-8">
      <h2 className="text-3xl font-bold text-white text-center mb-6">Mindfulness Puzzle</h2>
      
      {/* Image Selection */}
      <div className="mb-6">
        <label className="block text-white mb-2">Select Puzzle Image</label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {puzzleImages.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Puzzle ${index + 1}`}
              className={`w-20 h-20 object-cover rounded-lg cursor-pointer transition-all ${
                selectedImage === index ? 'ring-4 ring-purple-500' : 'opacity-70 hover:opacity-100'
              }`}
              onClick={() => setSelectedImage(index)}
            />
          ))}
        </div>
      </div>

      {/* Game Board */}
      <div className="aspect-square bg-gray-700 rounded-lg mb-6 p-2">
        {gameStarted ? (
          <div className="relative w-full h-full">
            {tiles.map((tile) => (
              <div
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                className={`absolute w-[33.33%] h-[33.33%] transition-all duration-200 ${
                  tile.id === null ? 'opacity-0' : 'cursor-pointer'
                }`}
                style={{
                  left: `${(tile.position % 3) * 33.33}%`,
                  top: `${Math.floor(tile.position / 3) * 33.33}%`,
                }}
              >
                {tile.id && (
                  <div className="m-1 h-[calc(100%-8px)] rounded-lg overflow-hidden relative">
                    <div
                      className="w-[300%] h-[300%] absolute"
                      style={{
                        backgroundImage: `url(${puzzleImages[selectedImage]})`,
                        backgroundSize: 'cover',
                        left: `-${(tile.id - 1) % 3 * 100}%`,
                        top: `-${Math.floor((tile.id - 1) / 3) * 100}%`,
                        transform: 'scale(0.33333)',
                        transformOrigin: 'top left'
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <img
              src={puzzleImages[selectedImage]}
              alt="Complete puzzle"
              className="max-h-full rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Game Controls */}
      <div className="text-center">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400">Moves: {moves}</span>
          {gameStarted && !isComplete && (
            <span className="text-purple-400 text-sm italic">
              "{getRandomPrompt()}"
            </span>
          )}
          {isComplete && (
            <span className="text-green-400">Completed! ✨</span>
          )}
        </div>
        <button
          onClick={initializePuzzle}
          className="bg-purple-600 text-white rounded-md px-6 py-3 hover:bg-purple-700 transition-colors"
        >
          {gameStarted ? 'Start New Puzzle' : 'Start Puzzle'}
        </button>
      </div>
    </div>
  );
};

const WisdomQuest = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizCompleted(false);
  };

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    if (answerIndex === selectedCategory.questions[currentQuestionIndex].correct) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);

    if (currentQuestionIndex + 1 < selectedCategory.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setSelectedCategory(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowExplanation(false);
    setSelectedAnswer(null);
    setQuizCompleted(false);
  };

  if (!selectedCategory) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-gray-800 p-6 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => handleCategorySelect(category)}
          >
            <div className="text-4xl mb-4">{category.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
            <p className="text-gray-400">{category.description}</p>
          </div>
        ))}
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / selectedCategory.questions.length) * 100);
    const getFeedback = () => {
      if (percentage >= 90) return "Outstanding! You're a true expert! 🏆";
      if (percentage >= 70) return "Great job! You know your stuff! 🌟";
      if (percentage >= 50) return "Good effort! Keep learning! 📚";
      return "Keep practicing! Every attempt makes you stronger! 💪";
    };

    return (
      <div className="bg-gray-800 p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
        <div className="mb-6">
          <div className="text-4xl font-bold mb-2">{percentage}%</div>
          <p className="text-xl mb-2">
            Score: {score} out of {selectedCategory.questions.length}
          </p>
          <p className="text-gray-400">{getFeedback()}</p>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => handleCategorySelect(selectedCategory)}
          >
            Try Again
          </button>
          <button
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            onClick={handleRestartQuiz}
          >
            Choose Another Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = selectedCategory.questions[currentQuestionIndex];

  return (
    <div className="bg-gray-800 p-8 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">{selectedCategory.name}</h2>
          <p className="text-gray-400">
            Question {currentQuestionIndex + 1} of {selectedCategory.questions.length}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-green-400">
            Score: {score}
          </div>
          <div className="text-sm text-gray-400">
            {Math.round((score / selectedCategory.questions.length) * 100)}% Complete
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl mb-4">{currentQuestion.question}</h3>
        <div className="grid gap-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`p-4 rounded-lg text-left transition-colors ${
                selectedAnswer === null
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : selectedAnswer === index
                  ? index === currentQuestion.correct
                    ? 'bg-green-600'
                    : 'bg-red-600'
                  : index === currentQuestion.correct
                  ? 'bg-green-600'
                  : 'bg-gray-700'
              }`}
              onClick={() => handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {showExplanation && (
        <div className="mb-8 p-4 rounded-lg bg-gray-700">
          <h4 className="font-semibold mb-2">Explanation:</h4>
          <p className="text-gray-300">{currentQuestion.explanation}</p>
        </div>
      )}

      {selectedAnswer !== null && (
        <div className="flex justify-between items-center">
          <div className={`text-lg ${
            selectedAnswer === currentQuestion.correct 
              ? 'text-green-400' 
              : 'text-red-400'
          }`}>
            {selectedAnswer === currentQuestion.correct 
              ? '✨ Correct!' 
              : '❌ Incorrect'}
          </div>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={handleNextQuestion}
          >
            {currentQuestionIndex + 1 < selectedCategory.questions.length
              ? 'Next Question'
              : 'Complete Quiz'}
          </button>
        </div>
      )}
    </div>
  );
};

const Games = () => {
  const [selectedGame, setSelectedGame] = useState(null);

  const games = [
    {
      id: 1,
      title: 'Meditation Timer',
      description: 'A peaceful meditation timer with calming sounds and guided breathing exercises.',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      component: MeditationTimer
    },
    {
      id: 2,
      title: 'Jigsaw Game',
      description: 'Create and solve beautiful puzzles with customizable difficulty levels and your own images.',
      image: 'https://images.unsplash.com/photo-1525268771113-32d9e9021a97?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      component: JigsawPuzzle
    },
    {
      id: 3,
      title: 'Wisdom Quest',
      description: 'Test your knowledge of Sadhguru\'s teachings in this engaging quiz game.',
      image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      component: WisdomQuest
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Games</h1>
        
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

export default Games;
