const asyncHandler = require('express-async-handler');
const Note = require('../models/Note');

// @desc    Get all notes for a user
// @route   GET /api/notes
// @access  Private
exports.getNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ userId: req.user._id }).sort({ updatedAt: -1 });
  res.json(notes);
});

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
exports.createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Title is required');
  }

  const note = new Note({
    userId: req.user._id,
    title,
    content,
  });

  const createdNote = await note.save();
  res.status(201).json(createdNote);
});

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
exports.updateNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const note = await Note.findById(req.params.id);

  if (note && note.userId.toString() === req.user._id.toString()) {
    note.title = title || note.title;
    note.content = content !== undefined ? content : note.content;

    const updatedNote = await note.save();
    res.json(updatedNote);
  } else {
    res.status(404);
    throw new Error('Note not found or user not authorized');
  }
});

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
exports.deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (note && note.userId.toString() === req.user._id.toString()) {
    await note.deleteOne(); // ⬅️ FIX: Use deleteOne() instead of deprecated remove()
    res.json({ message: 'Note removed' });
  } else {
    res.status(404);
    throw new Error('Note not found or user not authorized');
  }
});
