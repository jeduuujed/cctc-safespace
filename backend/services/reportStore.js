const fs = require('fs');
const path = require('path');
const admin = require('../firebaseAdmin');

const STORE_PATH = path.join(__dirname, '..', 'data', 'reports.json');

function ensureStoreFile() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify([], null, 2));
  }
}

function readReports() {
  ensureStoreFile();
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  } catch (error) {
    console.warn('Local reports file is corrupted; starting fresh:', error.message);
    try {
      fs.renameSync(STORE_PATH, `${STORE_PATH}.bak-${Date.now()}`);
    } catch {
      // ignore backup failure
    }
    writeReports([]);
    return [];
  }
}

function writeReports(reports) {
  ensureStoreFile();
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(reports, null, 2));
  fs.renameSync(tmpPath, STORE_PATH);
}

async function saveReport(reportDoc) {
  try {
    const firestore = admin.firestore();
    const docRef = await firestore.collection('reports').add(reportDoc);
    return { mode: 'firebase', id: docRef.id };
  } catch (error) {
    console.warn('Falling back to local report storage:', error.message);
    try {
      const reports = readReports();
      const localDoc = {
        id: reportDoc.reportId || `local-${Date.now()}`,
        ...reportDoc,
        studentReport: reportDoc.studentReport || reportDoc.chat || []
      };
      reports.unshift(localDoc);
      writeReports(reports);
      return { mode: 'local', id: localDoc.id };
    } catch (saveErr) {
      console.error('Local report storage also failed; report was not persisted:', saveErr);
      return { mode: 'none', id: reportDoc.reportId || `local-${Date.now()}` };
    }
  }
}

async function listReports() {
  try {
    const snapshot = await admin.firestore().collection('reports').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : null
    }));
  } catch (error) {
    console.warn('Falling back to local report listing:', error.message);
    const reports = readReports();
    return reports.map((report) => ({ ...report }));
  }
}

async function updateReport(id, updateData) {
  try {
    await admin.firestore().collection('reports').doc(id).update(updateData);
    return { mode: 'firebase' };
  } catch (error) {
    console.warn('Falling back to local report update:', error.message);
    const reports = readReports();
    const index = reports.findIndex((report) => report.id === id || report.reportId === id);
    if (index >= 0) {
      reports[index] = { ...reports[index], ...updateData };
      writeReports(reports);
    }
    return { mode: 'local' };
  }
}

module.exports = {
  saveReport,
  listReports,
  updateReport
};
