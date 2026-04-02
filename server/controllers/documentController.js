const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

// @desc    Get all documents for the user
// @route   GET /api/documents
// @access  Private (Admin)
exports.getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, documents });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload a new document
// @route   POST /api/documents
// @access  Private (Admin)
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/documents/${req.file.filename}`;

    const doc = await Document.create({
      name: req.file.originalname,
      url: fileUrl,
      uploadedBy: req.user._id,
    });

    res.status(201).json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private (Admin)
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (doc.url.includes('/uploads/documents/')) {
      const filename = doc.url.split('/uploads/documents/')[1];
      const filepath = path.join(__dirname, '../uploads/documents', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await doc.deleteOne();
    res.status(200).json({ success: true, message: 'Document deleted' });
  } catch (error) {
    next(error);
  }
};
