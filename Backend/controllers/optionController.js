const CandleColor = require("../models/CandleColor");
const Fragrance = require("../models/Fragrance");
const { sendError } = require("../utils/errorResponse");

const DEFAULT_FRAGRANCES = [
  "Honey",
  "Musk Oud",
  "Rose",
  "Vanilla Bean",
  "Vanilla Sweet",
  "Lavender",
  "Sandalwood",
  "Jasmine",
  "Mogra",
  "Cedarwood",
  "Rose and Oud",
  "Lotus",
  "Cinnamon",
  "Coffee",
  "Chocolate",
  "Chocolate and Coffee",
  "Oudh",
  "Mint",
  "Cinnamon and Vanilla",
  "Aqua",
  "Aqua Lotus",
  "Citrus",
  "Orchid Vanilla",
  "Orchid",
  "Strawberry",
  "Orange",
  "Blueberry",
  "Lemon",
  "Lemongrass",
  "Mixed Fruit",
  "Mithai",
  "Watermelon",
  "Wine",
  "Wooden and Spice",
  "Green Apple",
  "Rain Forest",
  "Sandal"
];

function normalizeHexCode(value) {
  const hexCode = String(value || "").trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(hexCode) ? hexCode : "";
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeEntity(entity) {
  if (!entity) {
    return null;
  }

  const normalized = entity.toObject ? entity.toObject() : entity;
  return {
    ...normalized,
    id: normalized.id ?? normalized._id
  };
}

async function seedDefaultFragrances() {
  await Promise.all(
    DEFAULT_FRAGRANCES.map((name) =>
      Fragrance.updateOne(
        { name },
        { $setOnInsert: { name, enabled: true } },
        { upsert: true }
      )
    )
  );
}

function buildOptionController(Model, { hasHex = false } = {}) {
  return {
    async list(req, res) {
      try {
        const filter = {};
        const enabled = String(req.query.enabled ?? "").trim().toLowerCase();
        const search = String(req.query.q ?? "").trim();

        if (enabled === "true" || enabled === "false") {
          filter.enabled = enabled === "true";
        }

        if (search) {
          filter.name = new RegExp(escapeRegex(search), "i");
        }

        const items = await Model.find(filter).sort({ name: 1 });
        res.json(items.map(normalizeEntity));
      } catch (error) {
        sendError(res, error);
      }
    },

    async create(req, res) {
      try {
        const payload = {
          name: String(req.body?.name ?? "").trim(),
          enabled: req.body?.enabled === undefined ? true : Boolean(req.body.enabled)
        };

        if (!payload.name) {
          return res.status(400).json({ error: "Name is required." });
        }

        if (hasHex) {
          payload.hexCode = normalizeHexCode(req.body?.hexCode);
          if (!payload.hexCode) {
            return res.status(400).json({ error: "Valid HEX code is required." });
          }
        }

        const created = await Model.create(payload);
        res.status(201).json(normalizeEntity(created));
      } catch (error) {
        if (error.code === 11000) {
          return res.status(409).json({ error: "Name already exists." });
        }
        res.status(500).json({ error: error.message });
      }
    },

    async update(req, res) {
      try {
        const payload = {};

        if (req.body?.name !== undefined) {
          payload.name = String(req.body.name).trim();
          if (!payload.name) {
            return res.status(400).json({ error: "Name is required." });
          }
        }

        if (req.body?.enabled !== undefined) {
          payload.enabled = Boolean(req.body.enabled);
        }

        if (hasHex && req.body?.hexCode !== undefined) {
          payload.hexCode = normalizeHexCode(req.body.hexCode);
          if (!payload.hexCode) {
            return res.status(400).json({ error: "Valid HEX code is required." });
          }
        }

        const updated = await Model.findByIdAndUpdate(req.params.id, payload, {
          new: true,
          runValidators: true
        });

        if (!updated) {
          return res.status(404).json({ error: "Option not found." });
        }

        res.json(normalizeEntity(updated));
      } catch (error) {
        if (error.code === 11000) {
          return res.status(409).json({ error: "Name already exists." });
        }
        res.status(500).json({ error: error.message });
      }
    },

    async remove(req, res) {
      try {
        const deleted = await Model.findByIdAndDelete(req.params.id);

        if (!deleted) {
          return res.status(404).json({ error: "Option not found." });
        }

        res.status(204).send();
      } catch (error) {
        sendError(res, error);
      }
    }
  };
}

module.exports = {
  candleColorController: buildOptionController(CandleColor, { hasHex: true }),
  fragranceController: buildOptionController(Fragrance),
  seedDefaultFragrances
};
