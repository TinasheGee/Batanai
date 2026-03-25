const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /conversations - Get list of people user has messaged
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Complex query to get latest message for each partner
    const query = `
      SELECT DISTINCT ON (partner_id)
        u.id AS partner_id,
        u.full_name AS partner_name,
        u.email AS partner_email,
        u.role AS partner_role,
        m.sender_id AS last_message_sender_id,
        m.content AS last_message,
        m.created_at AS last_message_time,
        m.is_read
      FROM messages m
      JOIN users u ON (u.id = m.sender_id OR u.id = m.receiver_id)
      WHERE (m.sender_id = $1 OR m.receiver_id = $1) AND u.id != $1
      ORDER BY partner_id, m.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    // Sort by last message time (descending) in JS since DISTINCT ON requires sorting by distinct column first
    const sortedConversations = result.rows.sort(
      (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
    );

    // Add avatar
    const conversationsWithAvatars = sortedConversations.map((conv) => ({
      ...conv,
      partner_image: `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.partner_name)}&background=random&color=fff&rounded=true`,
    }));

    res.json(conversationsWithAvatars);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:partnerId - Get messages with a specific user
router.get('/:partnerId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const partnerId = req.params.partnerId;

    const query = `
      SELECT 
        m.*,
        CASE WHEN m.sender_id = $1 THEN 'me' ELSE 'them' END as sender_type
      FROM messages m
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC
    `;

    const result = await pool.query(query, [userId, partnerId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /send - Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content, attachment, message_type } = req.body;

    if (!receiverId || (!content && !attachment)) {
      return res
        .status(400)
        .json({ error: 'Receiver and content or attachment are required' });
    }

    const newMessage = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, attachment, message_type) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        senderId,
        receiverId,
        content || null,
        attachment ? JSON.stringify(attachment) : null,
        message_type || null,
      ]
    );

    const message = newMessage.rows[0];

    // Get IO instance and emit event
    const io = req.app.get('io');
    if (io) {
      // Emit to receiver's room
      io.to(receiverId).emit('receive_message', {
        ...message,
        sender_type: 'them', // How the receiver sees it
        attachment: message.attachment ? message.attachment : null,
      });

      // Optional: Emit to sender's other devices
      // io.to(senderId).emit('message_sent', message);
    }

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /read/:partnerId - Mark messages from a partner as read
router.put('/read/:partnerId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const partnerId = req.params.partnerId;

    await pool.query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [partnerId, userId]
    );

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
