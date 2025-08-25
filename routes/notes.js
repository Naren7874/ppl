import express from "express";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
} from "../controllers/noteController.js";

const router = express.Router();

router.get("/", getNotes);
router.post("/", createNote);
router.patch("/:id", updateNote);
router.delete("/:id", deleteNote);
router.get("/search", searchNotes);

export default router;
