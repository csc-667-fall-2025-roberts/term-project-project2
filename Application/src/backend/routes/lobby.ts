import express from "express";

const router = express.Router();

router.get("/", (request, response) => {
  const { user } = request.session;

  response.render("lobby/lobby", { user });
});

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
