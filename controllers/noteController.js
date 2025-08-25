import Note from "../models/Note.js";

// Get all notes
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find().sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new note
export const createNote = async (req, res) => {
  const note = new Note({
    title: req.body.title,
    content: req.body.content,
    tags: req.body.tags || [],
    isPinned: req.body.isPinned || false,
  });

  try {
    const newNote = await note.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a note
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (req.body.title != null) note.title = req.body.title;
    if (req.body.content != null) note.content = req.body.content;
    if (req.body.tags != null) note.tags = req.body.tags;
    if (req.body.isPinned != null) note.isPinned = req.body.isPinned;
    if (req.body.summary != null) note.summary = req.body.summary;
    if (req.body.isEncrypted != null) note.isEncrypted = req.body.isEncrypted;
    if (req.body.encryptedContent != null) note.encryptedContent = req.body.encryptedContent;

    note.updatedAt = Date.now();
    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a note
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    await Note.deleteOne({ _id: req.params.id });
    res.json({ message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search notes
export const searchNotes = async (req, res) => {
  try {
    const query = req.query.q || "";
    const notes = await Note.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
      ],
    }).sort({ updatedAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
