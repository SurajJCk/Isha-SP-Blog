import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const JigsawPuzzle = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const [pieces, setPieces] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [bestTimes, setBestTimes] = useState({
    easy: Infinity,
    medium: Infinity,
    hard: Infinity
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [puzzleArea, setPuzzleArea] = useState({ width: 0, height: 0 });
  const canvasRef = useRef(null);
  const puzzleContainerRef = useRef(null);
  const timerRef = useRef(null);

  // Base64 placeholder image for failed loads
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNODAgOTBIMTIwVjExMEg4MFY5MFoiIGZpbGw9IiM5Q0EzQUYiLz48cGF0aCBkPSJNNjUgNjVIMTM1Vjg1SDY1VjY1WiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg==';

  const puzzleImages = [
    { id: 1, src: './images/sadhanapada1.jpg', alt: 'Sadhana Pada 1' },
    { id: 2, src: './images/sadhanapada2.jpg', alt: 'Sadhana Pada 2' },
    { id: 3, src: './images/sadhanapada3.jpg', alt: 'Sadhana Pada 3' }
  ];

  useEffect(() => {
    const savedState = localStorage.getItem('jigsawGameState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setGameState(parsed);
      toast.success('Previous game found! Click "Resume" to continue.');
    }

    const savedTimes = localStorage.getItem('jigsawBestTimes');
    if (savedTimes) {
      setBestTimes(JSON.parse(savedTimes));
    }

    const updatePuzzleArea = () => {
      if (puzzleContainerRef.current) {
        const { width, height } = puzzleContainerRef.current.getBoundingClientRect();
        setPuzzleArea({ width, height });
      }
    };

    updatePuzzleArea();
    window.addEventListener('resize', updatePuzzleArea);

    // Preload images
    puzzleImages.forEach(image => {
      const img = new Image();
      img.src = image.src;
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('resize', updatePuzzleArea);
    };
  }, []);

  const createPuzzlePieces = async () => {
    if (!selectedImage || !puzzleArea) return;

    try {
      // Create and load image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = selectedImage;
      });

      const gridSize = {
        easy: 3,
        medium: 4,
        hard: 5
      }[difficulty];

      const maxWidth = Math.min(puzzleArea.width * 0.8, img.width);
      const scale = maxWidth / img.width;
      const pieceWidth = Math.floor((maxWidth / gridSize));
      const pieceHeight = Math.floor((img.height * scale / gridSize));

      // Create source canvas with loaded image
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = maxWidth;
      sourceCanvas.height = img.height * scale;
      const sourceCtx = sourceCanvas.getContext('2d');
      sourceCtx.drawImage(img, 0, 0, maxWidth, img.height * scale);

      const newPieces = [];
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          // Create piece canvas
          const pieceCanvas = document.createElement('canvas');
          pieceCanvas.width = pieceWidth;
          pieceCanvas.height = pieceHeight;
          const pieceCtx = pieceCanvas.getContext('2d');

          // Draw piece from source canvas
          pieceCtx.drawImage(
            sourceCanvas,
            col * pieceWidth,
            row * pieceHeight,
            pieceWidth,
            pieceHeight,
            0,
            0,
            pieceWidth,
            pieceHeight
          );

          const correctX = col * pieceWidth;
          const correctY = row * pieceHeight;

          // Calculate random position within puzzle area bounds
          const randomX = Math.random() * (puzzleArea.width - pieceWidth);
          const randomY = Math.random() * (puzzleArea.height - pieceHeight);

          newPieces.push({
            id: `piece-${row}-${col}`,
            canvas: pieceCanvas,
            currentX: randomX,
            currentY: randomY,
            correctX,
            correctY,
            width: pieceWidth,
            height: pieceHeight,
            isPlaced: false
          });
        }
      }

      setPieces(newPieces);
      setIsPlaying(true);
      startTimer();
    } catch (error) {
      console.error('Error creating puzzle pieces:', error);
      toast.error('Failed to create puzzle. Please try again.');
      setIsPlaying(false);
      setPieces([]);
    }
  };

  const startGame = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    try {
      setTimer(0);
      await createPuzzlePieces();
    } catch (error) {
      console.error('Game start error:', error);
      toast.error('Failed to start game. Please try again.');
    }
  };

  const handleDragStart = (e, piece) => {
    if (piece.isPlaced) return;
    setIsDragging(true);
  };

  const handleDragEnd = (e, piece) => {
    if (piece.isPlaced) return;
    setIsDragging(false);

    const snapThreshold = Math.min(piece.width, piece.height) * 0.3;
    const newPieces = [...pieces];
    const pieceIndex = newPieces.findIndex(p => p.id === piece.id);
    const draggedPiece = newPieces[pieceIndex];

    const containerRect = puzzleContainerRef.current.getBoundingClientRect();
    const newX = e.x - containerRect.left;
    const newY = e.y - containerRect.top;

    if (
      Math.abs(newX - draggedPiece.correctX) < snapThreshold &&
      Math.abs(newY - draggedPiece.correctY) < snapThreshold
    ) {
      newPieces[pieceIndex] = {
        ...draggedPiece,
        currentX: draggedPiece.correctX,
        currentY: draggedPiece.correctY,
        isPlaced: true
      };
      toast.success('Piece placed correctly!');
    } else {
      newPieces[pieceIndex] = {
        ...draggedPiece,
        currentX: Math.max(0, Math.min(newX, puzzleArea.width - draggedPiece.width)),
        currentY: Math.max(0, Math.min(newY, puzzleArea.height - draggedPiece.height)),
        isPlaced: false
      };
    }

    setPieces(newPieces);
    saveGameState(newPieces);

    if (newPieces.every(p => p.isPlaced)) {
      handlePuzzleComplete();
    }
  };

  const handlePuzzleComplete = () => {
    clearInterval(timerRef.current);
    
    if (time < bestTimes[difficulty]) {
      const newBestTimes = { ...bestTimes, [difficulty]: time };
      setBestTimes(newBestTimes);
      localStorage.setItem('jigsawBestTimes', JSON.stringify(newBestTimes));
      toast.success('New best time! 🎉');
    }
    
    toast.success('Puzzle completed! 🎉');
    setIsPlaying(false);
    localStorage.removeItem('jigsawGameState');
  };

  const saveGameState = (currentPieces) => {
    const state = {
      pieces: currentPieces,
      difficulty,
      image: selectedImage,
      time
    };
    localStorage.setItem('jigsawGameState', JSON.stringify(state));
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image.src);
    setIsPlaying(false);
    setPieces([]);
    setTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {!isPlaying ? (
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-6 space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4">Jigsaw Puzzle Setup</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2">Select Difficulty:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
              >
                <option value="easy">Easy (3x3)</option>
                <option value="medium">Medium (4x4)</option>
                <option value="hard">Hard (5x5)</option>
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Choose Image:</label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {puzzleImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative ${selectedImage === image.src ? 'ring-4 ring-blue-500' : ''}`}
                    onClick={() => handleImageSelect(image)}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-32 object-cover rounded cursor-pointer transition-transform hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                        toast.error(`Failed to load ${image.alt}`);
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity" />
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <label className="block text-white mb-2">Or Upload Your Own:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Image size should be less than 5MB');
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setSelectedImage(e.target.result);
                      toast.success('Image loaded successfully!');
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="w-full text-gray-300"
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => startGame()}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Start New Game
              </button>
              {gameState && (
                <button
                  onClick={() => startGame()}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Resume Previous Game
                </button>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-white font-semibold mb-2">Best Times:</h3>
              <div className="space-y-2">
                <p className="text-gray-300">Easy: {bestTimes.easy === Infinity ? '-' : formatTime(bestTimes.easy)}</p>
                <p className="text-gray-300">Medium: {bestTimes.medium === Infinity ? '-' : formatTime(bestTimes.medium)}</p>
                <p className="text-gray-300">Hard: {bestTimes.hard === Infinity ? '-' : formatTime(bestTimes.hard)}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative" ref={puzzleContainerRef}>
          <div className="fixed top-4 right-4 space-x-4 z-50">
            <span className="text-white bg-gray-800 px-4 py-2 rounded">
              Time: {formatTime(time)}
            </span>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              onMouseDown={() => setShowPreview(true)}
              onMouseUp={() => setShowPreview(false)}
              onMouseLeave={() => setShowPreview(false)}
            >
              Show Preview
            </button>
          </div>

          <div style={{ position: 'absolute', left: '-9999px' }}>
            <canvas ref={canvasRef} />
          </div>

          {showPreview && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40">
              <img
                src={selectedImage}
                alt="Preview"
                className="max-w-2xl max-h-2xl object-contain"
                crossOrigin="anonymous"
              />
            </div>
          )}

          <div className="relative w-full h-screen">
            <AnimatePresence>
              {pieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  drag={!piece.isPlaced}
                  dragMomentum={false}
                  onDragStart={(e) => handleDragStart(e, piece)}
                  onDragEnd={(e) => handleDragEnd(e, piece)}
                  initial={{ x: piece.currentX, y: piece.currentY }}
                  animate={{
                    x: piece.currentX,
                    y: piece.currentY,
                    scale: isDragging ? 1.1 : 1,
                    zIndex: isDragging ? 1 : 0
                  }}
                  className={`absolute cursor-grab active:cursor-grabbing ${
                    piece.isPlaced ? 'pointer-events-none' : ''
                  }`}
                >
                  <img
                    src={piece.canvas.toDataURL()}
                    alt={`Piece ${piece.id}`}
                    className={`select-none ${piece.isPlaced ? 'opacity-100' : 'opacity-90'}`}
                    draggable={false}
                    style={{
                      width: piece.width,
                      height: piece.height
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default JigsawPuzzle;