import express from 'express';
import {
  sendConnectionRequest,
  searchUsers,
  getConnectionRequests,
  respondToConnectionRequest,
  removeConnection,
  getConnections,
  blockUser,
  unblockUser
} from '../controllers/connectionsController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

/**
 * @route   POST /api/connections
 * @desc    Send a connection request to another user
 * @access  Private
 */
router.post('/', authenticateToken, sendConnectionRequest);

/**
 * @route   GET /api/connections/search
 * @desc    Search for users by name or nickname
 * @access  Private
 */
router.get('/search', authenticateToken, searchUsers);

/**
 * @route   GET /api/connections/requests
 * @desc    Get pending connection requests for the current user
 * @access  Private
 */
router.get('/requests', authenticateToken, getConnectionRequests);

/**
 * @route   PUT /api/connections/:id
 * @desc    Accept or reject a connection request
 * @access  Private
 */
router.put('/:id', authenticateToken, respondToConnectionRequest);

/**
 * @route   DELETE /api/connections/:id
 * @desc    Remove an existing connection or cancel a pending request
 * @access  Private
 */
router.delete('/:id', authenticateToken, removeConnection);

/**
 * @route   GET /api/connections
 * @desc    Get all connections for the current user
 * @access  Private
 */
router.get('/', authenticateToken, getConnections);

/**
 * @route   POST /api/connections/block
 * @desc    Block a user from sending connection requests
 * @access  Private
 */
router.post('/block', authenticateToken, blockUser);

/**
 * @route   DELETE /api/connections/block/:id
 * @desc    Unblock a previously blocked user
 * @access  Private
 */
router.delete('/block/:id', authenticateToken, unblockUser);

export default router;