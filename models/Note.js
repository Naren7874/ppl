import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    encryptedContent: {
      type: String,
      default: "",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    summary: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, 
    versionKey: false, 
  }
);

const Note = mongoose.model("Note", noteSchema);

export default Note;