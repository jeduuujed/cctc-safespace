const { generateAIResponse, generateSummary } = require('../services/openaiService');
const { sendNewReportNotification } = require('../services/emailService');
const { saveReport, listReports, updateReport } = require('../services/reportStore');
const { listUsersByRole } = require('../services/userStore');

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      role: entry.role || 'user',
      text: typeof entry.text === 'string' ? entry.text : '',
      ts: entry.ts || new Date().toISOString()
    }))
    .filter((entry) => entry.text.trim());
}

function extractIncidentCategory(messages, summary) {
  const text = [summary, ...(Array.isArray(messages) ? messages.map((entry) => entry.text || '') : [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/bully|bullied|bullying|cyberbullying/.test(text)) return 'Bullying';
  if (/harass|harassed|harassment/.test(text)) return 'Harassment';
  if (/sexual|assault|molest|inappropriate sexual/.test(text)) return 'Sexual misconduct';
  if (/abuse|abused/.test(text)) return 'Abuse';
  if (/threat|threatened|intimidat/.test(text)) return 'Threat';
  if (/discriminat|racist|sexist|homophobic|hate/.test(text)) return 'Discrimination';
  if (/fight|hit|punch|kick|physical violence|assault/.test(text)) return 'Physical violence';
  if (/self[- ]harm|suicid|cut myself|hurt myself/.test(text)) return 'Self-harm concern';
  if (/vandal|damage|property/.test(text)) return 'Property damage';
  if (/theft|steal|stole|stolen/.test(text)) return 'Theft';
  return 'Incident';
}

// POST /api/chat
exports.chatWithAI = async (req, res) => {
  try {
    const { message, conversation = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const normalizedMessages = normalizeMessages(conversation);
    const prompt = [
      'You are a calm, supportive school safety assistant. Ask one short guided question at a time and do not invent facts. Only collect the details the student explicitly shares. Keep the tone compassionate and non-judgmental. Do not ask for personal details beyond what is necessary for the report. If enough information is present, offer a brief summary and ask the student to confirm before submitting.',
      `Student conversation so far: ${JSON.stringify(normalizedMessages)}`,
      `Latest student message: ${message}`
    ].join('\n');

    const reply = await generateAIResponse(message, normalizedMessages, prompt);
    res.json({ reply });
  } catch (err) {
    console.error('chatWithAI error:', err);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
};

// POST /api/report
// Expects: { messages, evidenceURLs?: string[], anonymous?: boolean, reporterName?: string, reporterEmail?: string, reporterUid?: string }
exports.submitReport = async (req, res) => {
  try {
    const {
      messages = [],
      evidenceURLs = [],
      anonymous = true,
      reporterName,
      reporterEmail,
      reporterUid,
      summaryOverride
    } = req.body;

    const normalizedMessages = normalizeMessages(messages);

    if (!normalizedMessages.length) {
      return res.status(400).json({ error: 'Conversation is required' });
    }

    const summary = summaryOverride || (await generateSummary(JSON.stringify(normalizedMessages)));
    const reportDoc = {
      reportId: `R-${Date.now()}`,
      summary,
      chat: normalizedMessages,
      studentReport: normalizedMessages,
      evidenceURLs,
      status: 'Pending',
      anonymous,
      createdAt: new Date(),
      reporterName: anonymous ? null : reporterName || null,
      reporterEmail: anonymous ? null : reporterEmail || null,
      reporterUid: anonymous ? null : reporterUid || null,
      assignedTo: 'Unassigned',
      category: extractIncidentCategory(normalizedMessages, summary),
      priority: 'Medium',
      generatedReport: summary
    };

    const stored = await saveReport(reportDoc);

    try {
      await sendNewReportNotification(summary);
    } catch (emailErr) {
      console.error('Failed to send notification email:', emailErr);
    }

    res.json({ success: true, reportId: stored.id, generatedReport: summary, storageMode: stored.mode });
  } catch (err) {
    console.error('submitReport error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await listReports();
    if (req.profile?.role === 'admin' || req.isAdmin) {
      return res.json({ reports });
    }

    if (req.profile?.role === 'counselor') {
      const students = await listUsersByRole('student');
      const assignedIds = new Set(
        students.filter((student) => student.assignedCounselorId === req.user.uid).map((student) => student.uid)
      );
      const visible = reports.filter((report) => {
        if (report.anonymous) return true;
        return report.reporterUid && assignedIds.has(report.reporterUid);
      });
      return res.json({ reports: visible });
    }

    return res.status(403).json({ error: 'Not authorized to view reports' });
  } catch (err) {
    console.error('getReports error:', err);
    res.status(500).json({ error: 'Failed to load reports' });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const reports = await listReports();
    const mine = reports.filter((report) => report.reporterUid === req.user.uid && !report.anonymous);
    res.json({ reports: mine });
  } catch (err) {
    console.error('getMyReports error:', err);
    res.status(500).json({ error: 'Failed to load reports' });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, priority } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Report id is required' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (priority) updateData.priority = priority;

    await updateReport(id, updateData);
    res.json({ success: true });
  } catch (err) {
    console.error('updateReportStatus error:', err);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

