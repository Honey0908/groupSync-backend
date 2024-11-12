const express = require('express');
const webPush = require('web-push');
const Room = require('../models/Room');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

// Send Push Notification to Room Members
router.post(
  '/send/:roomId',
  authenticate,
  [check('message', 'Message is required').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roomId } = req.params;
    const { message } = req.body;

    try {
      const room = await Room.findById(roomId).populate('members');
      if (!room) return res.status(404).json({ error: 'Room not found' });

      // Batch sending notifications to avoid overwhelming the server
      const notificationPromises = room.members.map((member) => {
        if (member.subscription) {
          const payload = JSON.stringify({
            title: 'Notification',
            body: message,
          });
          return webPush
            .sendNotification(member.subscription, payload)
            .catch((err) =>
              console.error(
                `Failed to send notification to ${member.email}:`,
                err
              )
            );
        }
      });

      await Promise.all(notificationPromises);

      res.status(200).json({ message: 'Notifications sent successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send notifications' });
    }
  }
);

module.exports = router;
