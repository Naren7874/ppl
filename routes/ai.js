import express from "express";
import {
  generateGlossary,
  generateSummary,
  suggestTags,
  checkGrammar,
  translateContent,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/glossary", generateGlossary);
router.post("/summary", generateSummary);
router.post("/tags", suggestTags);
router.post("/grammar", checkGrammar);
router.post("/translate", translateContent);

export default router;
