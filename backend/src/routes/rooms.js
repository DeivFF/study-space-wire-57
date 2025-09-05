import express from 'express';
import RoomsController from '../controllers/roomsController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

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
router.delete('/:roomId', RoomsController.deleteRoom);
router.post('/:roomId/leave', RoomsController.leaveRoom);

// Sistema de Convites
router.post('/:roomId/invites', joinRequestLimit, RoomsController.sendInvite);
router.get('/:roomId/invites', RoomsController.listInvites);
router.delete('/:roomId/invites/:inviteId', RoomsController.revokeInvite);
router.post('/:roomId/invites/:inviteId/accept', RoomsController.acceptInvite);
router.post('/:roomId/invites/:inviteId/reject', RoomsController.rejectInvite);
// Alternative routes that work with just invitation ID (for notifications)
router.post('/invites/:inviteId/accept', RoomsController.acceptInvite);
router.post('/invites/:inviteId/reject', RoomsController.rejectInvite);

// Links de Convite
router.post('/:roomId/invite-links', RoomsController.createInviteLink);
router.get('/:roomId/invite-links/active', RoomsController.getActiveInviteLink);

// Aprovação de Solicitações
router.get('/:roomId/access-requests', RoomsController.listAccessRequests);
router.post('/:roomId/access-requests/:requestId/approve', RoomsController.approveAccessRequest);
router.post('/:roomId/access-requests/:requestId/reject', RoomsController.rejectAccessRequest);

// Moderação
router.post('/:roomId/members/:memberId/promote', RoomsController.promoteMember);
router.post('/:roomId/members/:memberId/demote', RoomsController.demoteMember);
router.post('/:roomId/members/:memberId/kick', RoomsController.kickMember);

// Chat da Sala
router.get('/:roomId/messages', RoomsController.getRoomMessages);
router.post('/:roomId/messages', RoomsController.sendRoomMessage);

export default router;