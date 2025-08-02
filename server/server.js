const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Pippy Chatbot API'
  });
});

// Chat endpoint (placeholder for future AI integration)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, isEpisode } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // For now, return a simple response
    // In the future, this would integrate with an AI service
    const response = {
      text: "I'm here to support you! This is a placeholder response. pip!",
      shouldAnimate: true
    };

    res.json(response);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Grounding techniques endpoint
app.get('/api/grounding-techniques', (req, res) => {
  const techniques = [
    {
      id: '54321',
      name: '5-4-3-2-1 Technique',
      description: 'A sensory grounding technique to help you feel more present',
      steps: [
        'Look around and name 5 things you can see',
        'Touch 4 things you can feel',
        'Listen for 3 things you can hear',
        'Smell 2 things you can smell',
        'Taste 1 thing you can taste'
      ]
    },
    {
      id: 'breathing',
      name: 'Deep Breathing',
      description: 'Simple breathing exercise to calm your nervous system',
      steps: [
        'Sit comfortably and close your eyes',
        'Breathe in slowly through your nose for 4 counts',
        'Hold your breath for 4 counts',
        'Breathe out slowly through your mouth for 6 counts',
        'Repeat this cycle 5-10 times'
      ]
    }
  ];

  res.json(techniques);
});

// Distraction games endpoint
app.get('/api/distraction-games', (req, res) => {
  const games = [
    {
      id: 'color-naming',
      name: 'Color Hunt',
      description: 'Find objects of different colors around you',
      instructions: [
        'Look around your room',
        'Find 3 things that are blue',
        'Find 3 things that are red',
        'Find 3 things that are green',
        'Find 3 things that are yellow'
      ]
    },
    {
      id: 'animal-naming',
      name: 'Animal Alphabet',
      description: 'Name animals for each letter of the alphabet',
      instructions: [
        'Start with A - name an animal that starts with A',
        'Continue through the alphabet: B, C, D...',
        'Take your time and be creative!',
        'If you get stuck, skip that letter and continue'
      ]
    }
  ];

  res.json(games);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Pippy server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 