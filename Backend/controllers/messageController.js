const Message = require("../models/Message");
const mongoose = require("mongoose");
const { sendError } = require("../utils/errorResponse");

function isValidIndianMobile(value) {
  return /^[6-9][0-9]{9}$/.test(String(value || "").trim());
}

const listMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    sendError(res, error);
  }
};

const createMessage = async (req, res) => {
  try {
    const phone = String(req.body?.phone || "").trim();

    if (!isValidIndianMobile(phone)) {
      return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
    }

    // Only accept the known safe fields — never spread entire req.body
    const message = new Message({
      name: String(req.body?.name || "").trim(),
      email: String(req.body?.email || "").trim(),
      phone,
      message: String(req.body?.message || "").trim()
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * HIGH-2 FIX: Only whitelisted fields are updated.
 * Previously the entire req.body was spread into the update payload.
 */
const updateMessage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid message id" });
    }

    const payload = {};

    if (req.body?.name !== undefined)
      payload.name = String(req.body.name).trim();

    if (req.body?.email !== undefined)
      payload.email = String(req.body.email).trim();

    if (req.body?.message !== undefined)
      payload.message = String(req.body.message).trim();

    if (req.body?.status !== undefined && ["new", "read"].includes(req.body.status))
      payload.status = req.body.status;

    if (req.body?.phone !== undefined) {
      const phone = String(req.body.phone || "").trim();
      if (!isValidIndianMobile(phone)) {
        return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
      }
      payload.phone = phone;
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
    sendError(res, error);
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
    sendError(res, error);
  }
};

module.exports = {
  listMessages,
  createMessage,
  updateMessage,
  deleteMessage
};
