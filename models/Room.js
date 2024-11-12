const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  maxMembers: {
    type: Number,
    required: true,
  },
  members: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [],
  },
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
