import express from "express";
import { Games } from "../db";
import logger from "../lib/logger";

const router = express.Router();

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const game = await Games.get(parseInt(id));
    logger.info("Readyup game data:", game);

    if (!game) {
      return res.status(404).render("errors/404", { url: req.originalUrl });
    }

    res.render("readyup/readyup", { ...game });
  } catch (err) {
    next(err);
  }
});

export default router;