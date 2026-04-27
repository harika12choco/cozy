const Message = require("../models/Message");
const mongoose = require("mongoose");

function isValidIndianMobile(value) {
  return /^[6-9][0-9]{9}$/.test(String(value || "").trim());
}

const defaultMessages = [
  {
    name: "Priya Nair",
    email: "priya@example.com",
    phone: "9876543210",
    message: "Hi, can I customize a candle gift set for a birthday order next week?",
    createdAt: "2026-03-12T10:15:00.000Z",
    status: "new"
  },
  {
    name: "Kabir Shah",
    email: "kabir@example.com",
    phone: "9123456789",
    message: "I would like to know if the lavender candle is available in a larger size.",
    createdAt: "2026-03-11T16:40:00.000Z",
    status: "read"
  }
];

async function ensureDefaults() {
  const total = await Message.countDocuments();
  if (total === 0) {
    await Message.insertMany(defaultMessages);
  }
}

const listMessages = async (req, res) => {
  try {
    await ensureDefaults();
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createMessage = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      phone: String(req.body?.phone || "").trim()
    };

    if (!isValidIndianMobile(payload.phone)) {
      return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
    }

    const message = new Message(payload);
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMessage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid message id" });
    }

    const payload = {
      ...req.body,
      ...(req.body?.phone !== undefined ? { phone: String(req.body.phone || "").trim() } : {})
    };

    if (payload.phone !== undefined && !isValidIndianMobile(payload.phone)) {
      return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
    }

    const message = await Message.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid message id" });
    }

    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listMessages,
  createMessage,
  updateMessage,
  deleteMessage
};
