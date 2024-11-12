const express = require('express');
const Room = require('../models/Room');
const User = require('../models/User');
const router = express.Router();
const webPush = require('web-push');

// Create Room
router.post('/create', async (req, res) => {
  const { name, maxMembers } = req.body;
  const userId = req.user.userId; // Assuming that the userId is set in the request after token verification

  try {
    // Create a new room with the provided details and the creator as the first member
    const newRoom = new Room({
      name,
      maxMembers,
      members: [userId], // Add the creator as the first member
    });

    await newRoom.save();
    res.status(201).json({ message: 'Room created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Join Room
router.post('/join/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId;

  try {
    const room = await Room.findById(roomId);
    if (!room || !userId) {
      return res.status(404).json({ error: 'Room or User not found' });
    }

    // Check if the user is already in the room
    const isUserAlreadyInRoom = room.members.includes(userId);

    if (isUserAlreadyInRoom) {
      return res.status(400).json({ error: 'User is already in the room' });
    }

    // Check if the room has reached the maximum number of members
    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Add the user to the room's members
    room.members.push(userId);
    await room.save();
    res.status(200).json({ message: 'User added to the room' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// GET Rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('members', 'username email')
      .exec();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// GET Rooms for a specific user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log(userId);
  try {
    const rooms = await Room.find({ members: userId })
      .populate('members', 'username email')
      .exec();
    console.log(rooms);
    if (rooms.length === 0) {
      return res.status(404).json({ message: 'No rooms found for this user' });
    }
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Endpoint to send a push notification to all members in a room
router.post('/send-notification/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const { title, message } = req.body;

  try {
    const room = await Room.findById(roomId).populate('members');
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Filter out the sender from the members list
    const recipients = room.members.filter(
      (member) => member._id.toString() !== req.user.userId
    );

    // Map over the recipients and send the notifications
    const notifications = recipients.map(async (recipient) => {
      if (recipient.subscription) {
        const payload = JSON.stringify({
          title,
          message,
        });

        // Send the push notification using web-push
        await webPush.sendNotification(recipient.subscription, payload);
      }
    });

    await Promise.all(notifications);
    res.status(200).json({ message: 'Notifications sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

module.exports = router;
