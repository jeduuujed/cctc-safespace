function getStudentReportDetails(report) {
  if (!report) return '';

  if (Array.isArray(report.chat) && report.chat.length > 0) {
    const conversation = report.chat
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry) => {
        const text = typeof entry.text === 'string' ? entry.text.trim() : '';
        return text ? `${entry.role === 'assistant' ? 'Assistant' : 'Student'}: ${text}` : '';
      })
      .filter(Boolean)
      .join('\n');

    if (conversation) {
      return `${report.summary || report.generatedReport || 'No summary provided.'}\n\n${conversation}`;
    }
  }

  return report.summary || report.generatedReport || 'No summary provided.';
}

module.exports = {
  getStudentReportDetails
};
