// CCTC Student Code of Conduct severity reference.
// Source: Consolatrix College of Toledo City, Inc. Student Handbook,
// Sections on Offenses and Sanctions (Minor and Major Offenses).
//
// The Prefect of Discipline and the Student Discipline Committee determine
// whether an offense is minor or major depending on the gravity of the case.
// This reference is used by the AI and the deterministic fallback to give a
// preliminary classification; final classification rests with the committee.

const MINOR_CORRECTIVE_MEASURES = [
  'First Offense: Verbal Reprimand & Counselling',
  'Second Offense: Counselling or administrative service (8) hours',
  'Third Offense: Considered as first offense on a major violation; transformative intervention imposed with a written summon to the parent/guardian issued by the guidance counselor (presence of parent or legal guardian is required for major violations)'
];

const MAJOR_SANCTIONS = [
  'First Offense: Suspension (up to 20% non-attendance in class for the entire semester, as allowed by CHED)',
  'Second Offense: Suspension; the College refuses admission for 1 year, subject to review and evaluation',
  'Third Offense: Non-Re Admission; the school denies admission or enrolment for the academic year immediately following the semester when the decision was promulgated'
];

const MINOR_OFFENSES = [
  { rule: 'Not wearing the proper uniform', keywords: ['proper uniform', 'not wearing uniform', 'no uniform', 'wrong uniform', 'out of uniform', 'not in uniform'] },
  { rule: 'Not following the hair code', keywords: ['hair code', 'haircut', 'hair color', 'hair color', 'dyed hair', 'long hair', 'hair rule'] },
  { rule: 'Not wearing the proper ID, wearing the ID of someone else, or lending out one\'s ID', keywords: ['no id', 'without id', 'not wearing id', 'faculty id', 'someone else id', 'lending id', 'id card', 'identification'] },
  { rule: 'Wearing a cap or hat inside the classroom during classes', keywords: ['cap inside', 'hat inside', 'wearing cap', 'wearing hat', 'cap in class', 'hat in class'] },
  { rule: 'Piercing the tongue, nose and other parts of the body, and putting earrings or pins', keywords: ['piercing', 'tongue piercing', 'nose piercing', 'body piercing', 'body pins'] },
  { rule: 'Wearing of earrings among male students', keywords: ['earrings', 'earring', 'male student earrings'] },
  { rule: 'Disturbing the normal flow of the school activities', keywords: ['disturbing', 'disturbance', 'disrupting class', 'disruptive', 'noisy', 'disrupting the flow', 'disturber'] },
  { rule: 'Littering within the school premises', keywords: ['litter', 'littering', 'throwing trash', 'throwing garbage', 'dumping trash'] },
  { rule: 'Using or charging electronic equipment, toys, games, or other disruptive items during class or school activities (cellphones, MP3 players, video games, portable electronic devices)', keywords: ['cellphone', 'phone in class', 'using phone', 'mp3', 'video game', 'videogame', 'portable device', 'charging phone', 'gadget during class', 'toy in class', 'electronic device during class'] },
  { rule: 'Using gadgets during school programs', keywords: ['gadget during program', 'phone during program', 'recording program', 'phone in program'] },
  { rule: 'Not using comfort rooms properly (throwing napkins in the toilet bowl, not flushing, stepping on the bowl)', keywords: ['comfort room', 'toilet bowl', 'not flushing', 'napkin in toilet', 'restroom', 'cr properly'] },
  { rule: 'Loitering', keywords: ['loiter', 'loitering', 'loitering around', 'hanging around campus'] },
  { rule: 'Unauthorized using of school facilities', keywords: ['unauthorized facility', 'using facility without permission', 'unauthorized school facility', 'without permission to use'] },
  { rule: 'Misbehaving', keywords: ['misbehaving', 'misbehave', 'unruly', 'rowdy'] },
  { rule: 'Unjust vexation or pestering', keywords: ['vexation', 'pestering', 'annoying', 'pester', 'unjust vexation'] },
  { rule: 'Possessing obscene or pornographic materials within the school premises', keywords: ['pornographic', 'obscene materials', 'porn', 'obscene material', 'pornography'] },
  { rule: 'Possessing any gambling paraphernalia', keywords: ['gambling paraphernalia', 'playing cards for gambling', 'dice for gambling', 'gambling items'] },
  { rule: 'Selling, collecting unauthorized payments and contributions, soliciting and raising funds without permission/approval from the school authorities', keywords: ['unauthorized selling', 'collecting money without permission', 'soliciting without permission', 'raising funds without approval', 'unauthorized contribution'] },
  { rule: 'Unauthorized posting of school/class materials (activity sheets/forms/documents/instructions, quizzes and answers) on social networking sites', keywords: ['posting quiz', 'posting answers', 'posting school materials', 'sharing quiz answers', 'leaking quiz', 'posting form', 'posting document', 'uploading quiz'] },
  { rule: 'Forging, tampering or falsifying official documents like school records, student\'s and parent\'s permit, excuse letters, official receipts, school ID, official notices, clearances, and letters to and from parents', keywords: ['fake excuse', 'forged excuse', 'forged permit', 'fake permit', 'tampered receipt', 'falsified document', 'forging letter', 'fake letter from parent'] },
  { rule: 'Using the name of the school, the school seal, or the school logo without due permission from the school authorities', keywords: ['school logo without permission', 'school seal', 'school name without permission', 'logo misuse'] },
  { rule: 'Practicing dishonesty in dealing with any person connected with the school and its client', keywords: ['practicing dishonesty', 'being dishonest', 'dishonest dealing'] },
  { rule: 'Circulating false and/or malicious information and/or accusations against the institution or its authorities, school personnel or other students in any form', keywords: ['circulating false information', 'false accusation', 'malicious information', 'spreading false', 'fake news about', 'false claim'] },
  { rule: 'Cutting classes', keywords: ['cutting classes', 'cut class', 'skipping class', 'skip class', 'ditching class', 'absent without excuse', 'truant', 'cutting the subject'] }
];

const MAJOR_OFFENSES = [
  { rule: 'Inflicting harm physically and emotionally, especially using profane obscene language', keywords: ['profane', 'obscene language', 'cursing', 'swearing', 'cussing', 'profanity', 'foul language', 'hit', 'punched', 'fight', 'physical fight', 'fist fight', 'slapped', 'assaulted physically', 'hurting someone'] },
  { rule: 'Public Display of Affection (PDA) - such as petting, necking, and other sexual acts', keywords: ['pda', 'public display of affection', 'petting', 'necking', 'kissing in school', 'making out in school', 'sexual act in public'] },
  { rule: 'Verbal Abuse - inflicting verbal harm on another person', keywords: ['verbal abuse', 'verbal abusing', 'insulting', 'insult', 'name calling', 'verbal harassment', 'calling names'] },
  { rule: 'Unauthorized possession of deadly weapons (PD 1866)', keywords: ['deadly weapon', 'knife', 'blade', 'gun', 'weapon', 'balisong', 'bottle', 'deadly'] },
  { rule: 'Possession or use of drugs, alcohol, or any controlled substance inside the school premises', keywords: ['drugs', 'shabu', 'marijuana', 'weed', 'alcohol', 'drunk', 'intoxicated', 'controlled substance', 'ecstacy', 'lsd', 'meth', 'inhalant', 'rugby', 'thinner', 'acetone', 'drug paraphernalia', 'smoking shabu'] },
  { rule: 'Plagiarism', keywords: ['plagiarism', 'plagiarized', 'plagiarize', 'copied someone work', 'copying without credit', 'stole someone work'] },
  { rule: 'Falsification of school documents (forgery of persons in authority: school officials, faculty, heads and staff; falsification of official documents and school records; illegal or unauthorized reproduction of school materials)', keywords: ['falsified school record', 'forged official document', 'fake transcript', 'altered grade', 'forged signature', 'fake school record', 'unauthorized reproduction of material'] },
  { rule: 'Theft and Stealing', keywords: ['theft', 'thief', 'stole', 'stolen', 'stealing', 'shoplifting', 'pickpocket', 'robbed'] },
  { rule: 'Malicious mischief (intentionally damaging the personal property of another person; restitution is required)', keywords: ['malicious mischief', 'damaged my property', 'destroyed my things', 'damaged personal property', 'broke my things'] },
  { rule: 'Gambling (any form of gambling within 15m radius distance from the College premises)', keywords: ['gambling', 'gambled', 'betting', 'bet', 'sabong', 'cockfighting', 'sugal'] },
  { rule: 'Organizations that are contrary to the objectives of the College (fraternities and sororities which behavioral patterns are contrary to the values and norms of the College)', keywords: ['fraternity', 'sorority', 'fraternity recruitment', 'gang recruitment', 'prohibited organization', 'initiation'] },
  { rule: 'Disrespect, Disobedience, or defiance of school authorities', keywords: ['disrespecting teacher', 'disrespect to teacher', 'disobedience', 'defiance', 'talking back to teacher', 'disrespectful to staff', 'refused instruction', 'refusing to follow teacher'] },
  { rule: 'Arson', keywords: ['arson', 'set fire', 'started a fire', 'burning school', 'fire on purpose'] },
  { rule: 'Sexual Assault / Rape / Harassment (RA 7877, RA 8353, Safe Space Act)', keywords: ['sexual assault', 'rape', 'sexual harassment', 'sexual harassment', 'molest', 'molested', 'unwanted touching', 'voyeur', 'sexual abuse', 'inappropriate touch'] },
  { rule: 'Bullying / Cyber Bullying', keywords: ['bully', 'bullied', 'bullying', 'cyberbullying', 'cyber bullying', 'mocked', 'harassed online', 'mobbing', 'constant teasing'] },
  { rule: 'Malversation of funds (using organization funds for personal use / tampering of receipts / using funds without consultation)', keywords: ['malversation', 'misused org funds', 'organization funds for personal', 'tampered receipts', 'took organization money'] },
  { rule: 'Hazing (RA 8049)', keywords: ['hazing', 'hazed', 'fraternity hazing'] },
  { rule: 'Failure or refusal to comply with school safety rules and regulations (including minimum public health standards)', keywords: ['refusing safety rules', 'not complying with safety', 'violating health standards', 'refusal to comply'] },
  { rule: 'Threatening, coercing, harassing, blackmailing, assaulting school administrators, lay mission partners, and fellow students', keywords: ['threatened', 'threatening', 'threat', 'blackmail', 'blackmailing', 'coercing', 'intimidated the teacher', 'threatened the staff', 'assaulted'] },
  { rule: 'Indulging in illicit relationships and lifestyle as in the case of prostitution', keywords: ['prostitution', 'prostitute', 'illicit relationship', 'selling body'] },
  { rule: 'Acts, omission, conditions or circumstances tending toward anti-life practices (such as but not limited to abortion, contraception)', keywords: ['abortion', 'anti-life', 'contraception'] },
  { rule: 'Bomb threat', keywords: ['bomb threat', 'bomb scare', 'bomb', 'bombing'] },
  { rule: 'Instigate or lead strikes or similar concerted activities resulting in disruption of classes without permission', keywords: ['instigating strike', 'leading strike', 'protest without permission', 'strike', 'walkout'] },
  { rule: 'Entering the campus while under the influence of alcohol, drugs or any illicit substance', keywords: ['drunk on campus', 'under the influence on campus', 'high on campus', 'entering campus drunk'] },
  { rule: 'Cheating in any form', keywords: ['cheating', 'cheated', 'cheat on exam', 'cheated on test', 'copying in exam', 'cheating in any form'] },
  { rule: 'Data Privacy violations (RA 10173 of 2012)', keywords: ['data privacy', 'leaked personal data', 'doxxing', 'leaked private info', 'exposed personal information'] },
  { rule: 'Damage to school property (including direct damage to school property/facility)', keywords: ['damaged school property', 'destroyed school property', 'broke school property', 'damaged school facility'] },
  { rule: 'Smoking / vaping (City Ordinance: smoking within 15m radius from the school premises)', keywords: ['smoking', 'smoked', 'cigarette', 'vaping', 'vape', 'cigar'] },
  { rule: 'Creating intrigues and malicious gossips to fellow students and other persons', keywords: ['malicious gossip', 'intrigues', 'spreading gossip', 'creating intrigue', 'malicious rumors'] },
  { rule: 'Vandalism', keywords: ['vandalism', 'vandalized', 'graffiti', 'deface', 'defacing', 'drew on wall'] },
  { rule: 'Libel, Cyber Libel (defamation via spoken, written, or digital media)', keywords: ['libel', 'cyber libel', 'defamation', 'defamed', 'defame'] },
  { rule: 'Dishonesty in all forms', keywords: ['dishonesty in all forms', 'dishonest', 'lied to authorities'] }
];

const CONTEXT_SUMMARY = `
CCTC Student Code of Conduct - Offenses and Sanctions (severity reference).

SEVERITY IS DETERMINED ONLY BY THIS HANDBOOK. Do not judge severity by how
emotional, intense, or detailed the student's description sounds. Classify the
described conduct against the offense lists below. When both categories could
apply, the more closely-matching handbook offense decides.

MINOR OFFENSES - corrective measures: ${MINOR_CORRECTIVE_MEASURES.join('; ')}.
Minor offense list: ${MINOR_OFFENSES.map((o) => o.rule).join(' | ')}.

MAJOR OFFENSES - sanctions: ${MAJOR_SANCTIONS.join('; ')}.
Major offense list: ${MAJOR_OFFENSES.map((o) => `${o.rule} (${o.keywords[0]})`).join(' | ')}.

Notes:
- The Prefect of Discipline and the Student Discipline Committee determine
  whether an offense is minor or major depending on the gravity of the offense.
- Teenage pregnancy is handled through a specific intervention due to its
  sensitive nature, not through the standard minor/major sanction table.
- Parents/guardians are notified for major violations.
`.trim();

const CODE_OF_CONDUCT = {
  school: 'Consolatrix College of Toledo City, Inc.',
  source: 'CCTC Student Handbook (Offenses and Sanctions)',
  minorCorrectiveMeasures: MINOR_CORRECTIVE_MEASURES,
  majorSanctions: MAJOR_SANCTIONS,
  minorOffenses: MINOR_OFFENSES,
  majorOffenses: MAJOR_OFFENSES,
  summary: CONTEXT_SUMMARY
};

module.exports = {
  CODE_OF_CONDUCT,
  MINOR_OFFENSES,
  MAJOR_OFFENSES,
  MINOR_CORRECTIVE_MEASURES,
  MAJOR_SANCTIONS
};