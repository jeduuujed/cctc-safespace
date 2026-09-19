const admin = require('../firebaseAdmin');
const {
  isFaceAuthConfigured,
  enrollFace,
  verifyFaceAndGetUid,
  removeFaceEnrollment
} = require('../services/faceAuthService');

exports.getFaceStatus = async (req, res) => {
  res.json({
    configured: isFaceAuthConfigured(),
    enabled: !!req.profile?.faceLoginEnabled,
    message: isFaceAuthConfigured()
      ? 'Face login is available'
      : 'Configure AZURE_FACE_API_KEY and AZURE_FACE_ENDPOINT to enable secure face login'
  });
};

exports.enroll = async (req, res) => {
  try {
    const { imageBase64, consent } = req.body;
    if (!consent) {
      return res.status(400).json({ error: 'Explicit consent is required for face login enrollment' });
    }
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Camera capture is required' });
    }

    const result = await enrollFace(req.user.uid, imageBase64);
    if (!result.ok) {
      return res.status(result.status || 500).json({ error: result.error, docs: result.docs });
    }
    res.json({ success: true, message: result.message });
  } catch (err) {
    console.error('face enroll error:', err);
    res.status(500).json({ error: 'Face enrollment failed' });
  }
};

exports.verify = async (req, res) => {
  try {
    const { email, imageBase64 } = req.body;
    if (!email || !imageBase64) {
      return res.status(400).json({ error: 'email and imageBase64 are required' });
    }

    const result = await verifyFaceAndGetUid(email, imageBase64);
    if (!result.ok) {
      return res.status(result.status || 401).json({ error: result.error, docs: result.docs });
    }

    const customToken = await admin.auth().createCustomToken(result.uid);
    res.json({ customToken });
  } catch (err) {
    console.error('face verify error:', err);
    res.status(500).json({ error: 'Face verification failed' });
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await removeFaceEnrollment(req.user.uid);
    res.json(result);
  } catch (err) {
    console.error('face remove error:', err);
    res.status(500).json({ error: 'Failed to remove face login' });
  }
};
