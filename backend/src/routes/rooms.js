const express = require('express');
const router = express.Router();
const RoomsController = require('../controllers/roomsController');
const authenticateToken = require('../middleware/authenticateToken');
const rateLimit = require('express-rate-limit');

// Rate limiting para criação de salas
const createRoomLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 salas por 15 minutos
  message: { error: 'TooManyRequests', msg: 'Muitas salas criadas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para join/requests
const joinRequestLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // máximo 20 tentativas por 5 minutos
  message: { error: 'TooManyRequests', msg: 'Muitas tentativas. Tente novamente em 5 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware para adicionar traceId
const addTraceId = (req, res, next) => {
  req.traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  next();
};

// Aplicar middleware a todas as rotas
router.use(addTraceId);
router.use(authenticateToken);

// Rotas principais
router.post('/', createRoomLimit, RoomsController.createRoom);
router.get('/', RoomsController.listRooms);
router.post('/:roomId/join', joinRequestLimit, RoomsController.joinRoom);
router.post('/:roomId/request-access', joinRequestLimit, RoomsController.requestAccess);
router.patch('/:roomId/favorite', RoomsController.toggleFavorite);
router.get('/:roomId/members', RoomsController.listMembers);
router.post('/:roomId/leave', RoomsController.leaveRoom);

module.exports = router;