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
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
}

function writeReports(reports) {
  ensureStoreFile();
  fs.writeFileSync(STORE_PATH, JSON.stringify(reports, null, 2));
}

async function saveReport(reportDoc) {
  try {
    const firestore = admin.firestore();
    const docRef = await firestore.collection('reports').add(reportDoc);
    return { mode: 'firebase', id: docRef.id };
  } catch (error) {
    console.warn('Falling back to local report storage:', error.message);
    const reports = readReports();
    const localDoc = {
      id: reportDoc.reportId || `local-${Date.now()}`,
      ...reportDoc,
      studentReport: reportDoc.studentReport || reportDoc.chat || []
    };
    reports.unshift(localDoc);
    writeReports(reports);
    return { mode: 'local', id: localDoc.id };
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
