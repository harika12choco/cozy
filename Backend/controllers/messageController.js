const Message = require("../models/Message");
const mongoose = require("mongoose");

function isValidIndianMobile(value) {
  return /^[6-9][0-9]{9}$/.test(String(value || "").trim());
}

const listMessages = async (req, res) => {
  try {
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
