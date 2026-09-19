/**
 * Face authentication requires an external biometric provider with liveness detection.
 * Supported when AZURE_FACE_API_KEY + AZURE_FACE_ENDPOINT are configured.
 * Without these, enrollment/verification returns a clear configuration error.
 *
 * We never store raw facial images in Firestore. Only an opaque personId reference
 * from the provider is stored server-side.
 */

const { getFacePersonId, setFaceLogin, getUserByUid } = require('./userStore');

const MAX_IMAGE_CHARS = 2_500_000;

function decodeImage(imageBase64) {
  if (typeof imageBase64 !== 'string' || imageBase64.length > MAX_IMAGE_CHARS) {
    throw new Error('Image is too large or invalid');
  }
  return Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
}

function isFaceAuthConfigured() {
  return !!(process.env.AZURE_FACE_API_KEY && process.env.AZURE_FACE_ENDPOINT);
}

async function enrollFace(uid, imageBase64) {
  if (!isFaceAuthConfigured()) {
    return {
      ok: false,
      status: 503,
      error: 'Face login is not configured. Set AZURE_FACE_API_KEY and AZURE_FACE_ENDPOINT on the server.',
      docs: 'https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview-identity'
    };
  }

  const user = await getUserByUid(uid);
  if (!user) {
    return { ok: false, status: 404, error: 'User not found' };
  }

  try {
    const endpoint = process.env.AZURE_FACE_ENDPOINT.replace(/\/$/, '');
    const personGroupId = process.env.AZURE_FACE_PERSON_GROUP || 'cctc-safespace';
    const apiKey = process.env.AZURE_FACE_API_KEY;

    // Ensure person group exists (idempotent)
    await fetch(`${endpoint}/face/v1.0/persongroups/${personGroupId}`, {
      method: 'PUT',
      headers: { 'Ocp-Apim-Subscription-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: personGroupId, recognitionModel: 'recognition_04' })
    }).catch(() => {});

    let stored = await getFacePersonId(uid);
    let personId = stored && stored.includes(':') ? stored.split(':')[1] : stored;

    if (!personId) {
      const createRes = await fetch(`${endpoint}/face/v1.0/persongroups/${personGroupId}/persons`, {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.email, userData: uid })
      });
      if (!createRes.ok) {
        throw new Error('Failed to create face person');
      }
      const created = await createRes.json();
      personId = created.personId;
    }

    const imageBuffer = decodeImage(imageBase64);
    const addFaceRes = await fetch(`${endpoint}/face/v1.0/persongroups/${personGroupId}/persons/${personId}/persistedfaces`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: imageBuffer
    });

    if (!addFaceRes.ok) {
      return { ok: false, status: 400, error: 'Face enrollment failed. Ensure your face is clearly visible and try again.' };
    }

    await fetch(`${endpoint}/face/v1.0/persongroups/${personGroupId}/train`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': apiKey }
    });

    await setFaceLogin(uid, { enabled: true, facePersonId: `${personGroupId}:${personId}` });
    return { ok: true, message: 'Face login enrolled successfully' };
  } catch (err) {
    console.error('Face enrollment error:', err.message);
    return { ok: false, status: 500, error: 'Face enrollment failed' };
  }
}

async function verifyFaceAndGetUid(email, imageBase64) {
  if (!isFaceAuthConfigured()) {
    return {
      ok: false,
      status: 503,
      error: 'Face login is not configured on the server.',
      docs: 'https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview-identity'
    };
  }

  const user = await require('./userStore').getUserByEmail(email);
  if (!user || !user.faceLoginEnabled) {
    return { ok: false, status: 403, error: 'Face login is not enabled for this account' };
  }

  const facePersonId = await getFacePersonId(user.uid);
  if (!facePersonId) {
    return { ok: false, status: 403, error: 'No face profile enrolled' };
  }

  const [personGroupId, personId] = facePersonId.split(':');
  const endpoint = process.env.AZURE_FACE_API_ENDPOINT || process.env.AZURE_FACE_ENDPOINT;
  const apiKey = process.env.AZURE_FACE_API_KEY;
  const base = endpoint.replace(/\/$/, '');

  try {
    const imageBuffer = decodeImage(imageBase64);
    const detectRes = await fetch(`${base}/face/v1.0/detect?returnFaceId=true&recognitionModel=recognition_04&detectionModel=detection_03`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: imageBuffer
    });

    if (!detectRes.ok) {
      return { ok: false, status: 400, error: 'Could not detect a face. Please try again with better lighting.' };
    }

    const faces = await detectRes.json();
    if (!faces.length || !faces[0].faceId) {
      return { ok: false, status: 400, error: 'No face detected' };
    }

    const identifyRes = await fetch(`${base}/face/v1.0/identify`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personGroupId,
        faceIds: [faces[0].faceId],
        maxNumOfCandidatesReturned: 1,
        confidenceThreshold: 0.6
      })
    });

    if (!identifyRes.ok) {
      return { ok: false, status: 400, error: 'Face verification failed' };
    }

    const results = await identifyRes.json();
    const match = results[0]?.candidates?.[0];
    if (!match || match.personId !== personId || match.confidence < 0.6) {
      return { ok: false, status: 401, error: 'Face verification failed. Please use password login.' };
    }

    if (match.personId !== personId) {
      return { ok: false, status: 401, error: 'Face does not match enrolled profile' };
    }

    return { ok: true, uid: user.uid };
  } catch (err) {
    console.error('Face verify error:', err.message);
    return { ok: false, status: 500, error: 'Face verification failed' };
  }
}

async function removeFaceEnrollment(uid) {
  await setFaceLogin(uid, { enabled: false, facePersonId: null });
  return { ok: true, message: 'Face login removed' };
}

module.exports = {
  isFaceAuthConfigured,
  enrollFace,
  verifyFaceAndGetUid,
  removeFaceEnrollment
};
