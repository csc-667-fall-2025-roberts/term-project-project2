import express from "express";
import {Games}from "../db";


const router = express.Router();

router.get("/", (request, response) => {
  const { user } = request.session;

  response.render("lobby/lobby", { user });
});

router.get("/rejoinable-game", async (request, response) => {
  try {
    const userId = request.session.user!.id;
    const game = await Games.rejoinableGame(userId);

    if (!game) {
      return response.status(200).json({ game: null });
    }

    response.status(200).json({
      game: {
        id: game.id,
        name: game.name,
        state: game.state
      }
    });
  } catch (error) {
    console.error("Error getting rejoinable game", error);
    response.status(500).json({ game: null });
  }
})

router.post("/update-display-name", async (request, response) => {
  const { display_name } = request.body;
  const userId = request.session.user!.id;

  try {
    const { Auth } = await import("../db");
    await Auth.updateDisplayName(userId, display_name);
    
    // Update session
    request.session.user!.display_name = display_name;
    
    response.status(200).json({ success: true });
  } catch (error) {
    console.error("cannot update display name:", error);
    response.status(500).json({ success: false });
  }
});


export default router;
