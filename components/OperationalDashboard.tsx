import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { PIData, UserRole, User, MonthData } from '../types';

interface OperationalDashboardProps {
  title: string;
  onBack: () => void;
  currentUser: User;
  subjectUser: User;
  allUnits?: User[];
  isTemplateMode?: boolean;
}

interface ExtendedPIData extends PIData {
  tabLabel: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_VARIANTS: Record<string, string[]> = {
  Jan: ['january', 'jan', 'target jan', 'actual jan', 't jan'],
  Feb: ['february', 'feb', 'target feb', 'actual feb', 't feb'],
  Mar: ['march', 'mar', 'target mar', 'actual mar', 't mar'],
  Apr: ['april', 'apr', 'target apr', 'actual apr', 't apr'],
  May: ['may', 'target may', 'actual may', 't may'],
  Jun: ['june', 'jun', 'target jun', 'actual jun', 't jun'],
  Jul: ['july', 'jul', 'target july', 'actual july', 't jul'],
  Aug: ['august', 'aug', 'target august', 'actual august', 't aug'],
  Sep: ['september', 'sep', 'sept', 'target sep', 'actual sep'],
  Oct: ['october', 'oct', 'target oct', 'actual oct', 't oct'],
  Nov: ['november', 'nov', 'target november', 'actual nov', 't nov'],
  Dec: ['december', 'dec', 'target dec', 'actual dec', 't dec'],
};

const PI_TITLES_2026: Record<string, string> = {
  PI1: "Number of Community Awareness/Information Activities Initiated",
  PI2: "Number of sectoral groups/BPATs mobilized/organized",
  PI3: "Number of participating respondents",
  PI4: "Percentage of accounted loose firearms against the estimated baseline data",
  PI5: "Number of functional LACAP",
  PI6: "Number of police stations utilizing PIPS",
  PI7: "Number of Internal Security Operations conducted",
  PI8: "Number of target hardening measures conducted",
  PI9: "Percentage reduction of crimes involving foreign and domestic tourists",
  PI10: "Number of Police stations using COMPSTAT for crime prevention",
  PI11: "Number of threat group neutralized",
  PI12: "Number of utilized BINs",
  PI13: "Number of criminal cases filed",
  PI14: "Number of cases resulting to conviction/dismissal",
  PI15: "Percentage of Trained investigative personnel/ Percentage of certified investigative personnel",
  PI16: "Percentage of investigative positions filled up with trained investigators",
  PI17: "Improvement in response time",
  PI18: "Percentage of dedicated investigators assigned to handle specific cases",
  PI19: "Number of recipients of a. awards b. punished",
  PI20: "Percentage of investigative personnel equipped with standard investigative systems and procedures",
  PI21: "Percentage of Police Stations using e-based system",
  PI22: "Number of cases filed in court/total # of cases investigated",
  PI23: "Number of investigative infrastructure/equipment identified/accounted",
  PI24: "Percentage of fill- up of investigative equipment and infrastructure",
  PI25: "Percentage of IT- compliant stations",
  PI26: "Number of linkages established",
  PI27: "Number of community/ stakeholders support generated",
  PI28: "Number of investigative activities funded",
  PI29: "Number of special investigation cases requested for fund support"
};

const PI_STRUCTURE_2026: Record<string, { id: string, activity: string, indicator: string }[]> = {
  PI1: [
    { id: 'pi1_a1', activity: "Formulation of Stratcom Snapshots", indicator: "No. of stratcom shaphot formulated" },
    { id: 'pi1_a2', activity: "Social Media Analysis", indicator: "No. of Social Media Analysis conducted" },
    { id: 'pi1_a3', activity: "Implementation of IO", indicator: "No. of activities conducted" },
    { id: 'pi1_a4', activity: "Conduct of P.I.C.E.", indicator: "No. of PICE conducted" },
    { id: 'pi1_a5', activity: "Production of Leaflets and handouts as IEC Materials", indicator: "No. of Printed copies" },
    { id: 'pi1_a6', activity: "Production of Outdoor IEC Materials", indicator: "No. of Streamers and Tarpaulins, or LED Wall Displayed" },
    { id: 'pi1_a7', activity: "Face-to-face Awareness Activities", indicator: "No. of Face-to-face Awareness conducted" },
    { id: 'pi1_a8', activity: "Dissemination of related news articles involving the PNP in region for the information of Command Group/Commanders", indicator: "No. of emails and SMS sent" },
    { id: 'pi1_a9', activity: "Management of PNP Social Media Pages and Accounts", indicator: "No. of account followers" },
    { id: 'pi1_a10', activity: "Social Media Post Boosting", indicator: "No. of target audience reached" },
    { id: 'pi1_a11', activity: "Social Media Engagement", indicator: "No. of Engagement" },
    { id: 'pi1_a12', activity: "Radio/TV/Live Streaming", indicator: "No. of guesting/show" },
    { id: 'pi1_a13', activity: "Press Briefing", indicator: "No. of Press Briefing to be conducted" },
    { id: 'pi1_a14', activity: "Reproduction and Distribution of GAD-Related IEC Materials", indicator: "No. of copies GAD-Related IEC Materials to be distributed" },
    { id: 'pi1_a15', activity: "Conduct Awareness activity relative to clan/family feuds settlement and conflict resolution and mediation", indicator: "No. of Lectures on Islamic Religious and Cultural Sensitivity to be conducted" },
    { id: 'pi1_a16', activity: "Lectures on Islamic Religious and Cultural Sensitivity", indicator: "No. of Awareness activity relative to clan/family feuds settlement and conflict resolution and mediationto be conducted" },
    { id: 'pi1_a17', activity: "Dialogue on Peacebuilding and Counter Radicalization", indicator: "No. of Dialogue on Peacebuilding and Counter Radicalization to be conducted" }
  ],
  PI2: [
    { id: 'pi2_a1', activity: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders activities", indicator: "No. of collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders activities conducted" }
  ],
  PI3: [
    { id: 'pi3_a1', activity: "Secretariat Meetings", indicator: "No. Secretariat Meetings conducted" },
    { id: 'pi3_a2', activity: "Convening of IO Working Group", indicator: "No. of activities conducted" },
    { id: 'pi3_a3', activity: "Activation of SyncCom during major events", indicator: "No. of activities conducted" },
    { id: 'pi3_a4', activity: "Summing-up on Revitalized-Pulis Sa Barangay (R-PSB)", indicator: "No. of summing-up conducted" },
    { id: 'pi3_a5', activity: "Summing-up on Counter White Area Operations (CWAO)", indicator: "No. of summing-up conducted" },
    { id: 'pi3_a6', activity: "StratCom support to NTF-ELCAC", indicator: "No. of activities conducted" },
    { id: 'pi3_a7', activity: "StratCom and ComRel Support to NTF-DPAGs", indicator: "No. of activities conducted" },
    { id: 'pi3_a8', activity: "StratCom Support to TF-Sanglahi Bravo", indicator: "No. of activities conducted" },
    { id: 'pi3_a9', activity: "TG PCR Operations for Mid-Term Elections", indicator: "No. of activities conducted" },
    { id: 'pi3_a10', activity: "Enhanced Feedback Mechanism thru SMS", indicator: "No. of activities conducted" },
    { id: 'pi3_a11', activity: "PNP Good Deeds", indicator: "No. of PNP Good Deeds" },
    { id: 'pi3_a12', activity: "Conduct dialogue, meetings, and workshops with different audiences", indicator: "No. of activities conducted" },
    { id: 'pi3_a13', activity: "Deployment of SRR team", indicator: "No. of SRR team deployed" },
    { id: 'pi3_a14', activity: "PNP Help and Food Bank Initiatives", indicator: "No. of activities initiated" },
    { id: 'pi3_a15', activity: "Maintenance and Operationalization of PNP Help Desks (OFW/IP, etc)", indicator: "No of PNP Help Desk Maintained and Complaint/s or Referrals" },
    { id: 'pi3_a16', activity: "PNP Advocacy Support Groups and Force Multipliers (KKDAT, KALIGKASAN,KASIMBAYAN, etc)", indicator: "No. of support activities conducted" },
    { id: 'pi3_a17', activity: "Inter-Agency Cooperation on Anti-Illegal Drugs", indicator: "No. of inter-agency activities conducted" },
    { id: 'pi3_a18', activity: "Recovery and Wellness Program", indicator: "No. of activities conducted" },
    { id: 'pi3_a19', activity: "Drug Awareness Activities", indicator: "No. of activities conducted" },
    { id: 'pi3_a20', activity: "Support to Barangay Drug Clearing Program", indicator: "No. of activities conducted" },
    { id: 'pi3_a21', activity: "Coordination, Implementation and monitoring of the Interfaith Squad System", indicator: "No. of activities conducted" },
    { id: 'pi3_a22', activity: "National Day of Remembrance for SAF 44", indicator: "No. of activities conducted" },
    { id: 'pi3_a23', activity: "EDSA People's Power Anniversary", indicator: "No. of activities conducted" },
    { id: 'pi3_a24', activity: "Philippine Independence Day", indicator: "No. of activities conducted" },
    { id: 'pi3_a25', activity: "National Heroes Day", indicator: "No. of activities conducted" },
    { id: 'pi3_a26', activity: "National Flag Day", indicator: "No. of activities conducted" },
    { id: 'pi3_a27', activity: "National Crime Prevention Week (NCPW)", indicator: "No of adopted KASIMBAYANAN" },
    { id: 'pi3_a28', activity: "Celebration of National Women's Month", indicator: "No. of activities conducted" },
    { id: 'pi3_a29', activity: "18-Day Campaign to End-VAWC", indicator: "No. of activities conducted" },
    { id: 'pi3_a30', activity: "National Children's Month", indicator: "No. of activities conducted" }
  ],
  PI4: [
    { id: 'pi4_a1', activity: "JAPIC", indicator: "JAPIC conducted" },
    { id: 'pi4_a2', activity: "Operations on loose firearms", indicator: "Operations on loose firearms conducted" },
    { id: 'pi4_a3', activity: "Bakal/Sita", indicator: "Bakal/Sita conducted" }
  ],
  PI5: [
    { id: 'pi5_a1', activity: "P/CPOC meetings", indicator: "# P/CPOC meetings participated" },
    { id: 'pi5_a2', activity: "Oversight Committee Meetings", indicator: "# of Oversight Committee Meetings conducted" },
    { id: 'pi5_a3', activity: "Maintenance of AIDMC", indicator: "# of AIDMC maintained" },
    { id: 'pi5_a4', activity: "operations against highway robbery", indicator: "# of opns against highway robbery conducted" },
    { id: 'pi5_a5', activity: "anti-bank robbery operations", indicator: "# of anti-bank robbery opns conducted" },
    { id: 'pi5_a6', activity: "operations against OCGs/PAGs", indicator: "# of opns against OCGs/PAGs conducted" },
    { id: 'pi5_a7', activity: "operations against kidnapping", indicator: "# of opns against kidnapping conducted" },
    { id: 'pi5_a8', activity: "operations against carnapping", indicator: "# of operations against carnapping conducted" },
    { id: 'pi5_a9', activity: "operations against illegal gambling", indicator: "# of operations against illegal gambling conducted" },
    { id: 'pi5_a10', activity: "operations against illegal fishing", indicator: "# of operations against illegal fishing conducted" },
    { id: 'pi5_a11', activity: "operations against illegal logging", indicator: "# of operations against illegal logging conducted" },
    { id: 'pi5_a12', activity: "operations on anti-illegal drugs", indicator: "# of operations on anti-illegal drugs conducted" }
  ],
  PI6: [
    { id: 'pi6_a1', activity: "EMPO Assessment and Evaluations", indicator: "No. of EMPO Assessment and Evaluations conducted" },
    { id: 'pi6_a2', activity: "Field/sector inspection", indicator: "No. of Field/sector inspection conducted" }
  ],
  PI7: [
    { id: 'pi7_a1', activity: "Oversight Committee Meetings", indicator: "Oversight Committee Meetings on ISO conducted" },
    { id: 'pi7_a2', activity: "JPSCC meetings", indicator: "JPSCC meetings conducted" },
    { id: 'pi7_a3', activity: "Major LEO", indicator: "Major LEO conducted" },
    { id: 'pi7_a4', activity: "Minor LEO", indicator: "Minor LEO conducted" },
    { id: 'pi7_a5', activity: "PPSP", indicator: "PPSP conducted" },
    { id: 'pi7_a6', activity: "Clearing operations in support to AFP territorial units", indicator: "Clearing operations in support to AFP territorial units conducted" }
  ],
  PI8: [
    { id: 'pi8_a1', activity: "Security Survey/Inspection", indicator: "# of Security Survey/Inspection conducted" },
    { id: 'pi8_a2', activity: "CI check/validation", indicator: "# of CI check/validation conducted" },
    { id: 'pi8_a3', activity: "CI monitoring", indicator: "# of CI monitoring conducted" },
    { id: 'pi8_a4', activity: "Clearances issued to civilians", indicator: "# of Clearances issued to civilians" },
    { id: 'pi8_a5', activity: "Clearances issued to PNP/AFP per", indicator: "# of Clearances issued to PNP/AFP per" },
    { id: 'pi8_a6', activity: "Threat assessment", indicator: "# of Threat assessment conducted" },
    { id: 'pi8_a7', activity: "Recruitment/maintenance of FNKN", indicator: "# of Recruitment/maintenance of FNKN" },
    { id: 'pi8_a8', activity: "Communications with FNKN", indicator: "# of Communications with FNKN" },
    { id: 'pi8_a9', activity: "Monitoring of cases/incidents involving foreign nationals", indicator: "# of Monitoring of cases/incidents involving foreign nationals" },
    { id: 'pi8_a10', activity: "SO during national events", indicator: "# of SO during national events conducted" },
    { id: 'pi8_a11', activity: "Security to vital installations", indicator: "# of Security to vital installations conducted" },
    { id: 'pi8_a12', activity: "VIP security protection", indicator: "# of VIP security protection" },
    { id: 'pi8_a13', activity: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders re Muslim Affairs", indicator: "# of collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders re Muslim Affairs conducted" },
    { id: 'pi8_a14', activity: "Medical and Dental outreach and other Similar Activities in Muslim Community", indicator: "# of Medical and Dental outreach and other Similar Activities in Muslim Community conducted" },
    { id: 'pi8_a15', activity: "Awareness activity relative to clan/family feuds settlement and conflict resolution and mediation", indicator: "# of Awareness activity relative to clan/family feuds settlement and conflict resolution and mediation Conduct" },
    { id: 'pi8_a16', activity: "Conduct prayer rallies, peace covenant signing, peace caravan, and other peacebuilding-related activity like sports activity", indicator: "Conduct prayer rallies, peace covenant signing, peace caravan, and other peacebuilding-related activity like sports activity" },
    { id: 'pi8_a17', activity: "Strengthening of Salaam Force Multipliers/Salaam Police Advocacy Groups (SPAG)", indicator: "Strengthening of Salaam Force Multipliers/Salaam Police Advocacy Groups (SPAG)" },
    { id: 'pi8_a18', activity: "Peace and PCVE training for Muslim Scholars", indicator: "Peace and PCVE training for Muslim Scholars" },
    { id: 'pi8_a19', activity: "Understanding PCVE for BJMP Personnel", indicator: "Understanding PCVE for BJMP Personnel" },
    { id: 'pi8_a20', activity: "PNP Custodial Facility Visitation and Counseling of Muslim and Non-Muslim Person's Deprived of Liberty with TRC's", indicator: "PNP Custodial Facility Visitation and Counseling of Muslim and Non-Muslim Person's Deprived of Liberty with TRC's" },
    { id: 'pi8_a21', activity: "Open-house visitation of Masjid and Madrasah", indicator: "Open-house visitation of Masjid and Madrasah" },
    { id: 'pi8_a22', activity: "Masjid and Madrasah Visitation", indicator: "Masjid and Madrasah Visitation" },
    { id: 'pi8_a23', activity: "# of Security opns during rallies/demonstrations conducted", indicator: "# of Security opns during rallies/demonstrations conducted" },
    { id: 'pi8_a24', activity: "# of K9 patrols conducted", indicator: "# of K9 patrols conducted" },
    { id: 'pi8_a25', activity: "# of seaborne patrols conducted", indicator: "# of seaborne patrols conducted" },
    { id: 'pi8_a26', activity: "# of EOD counter measures conducted", indicator: "# of EOD counter measures conducted" },
    { id: 'pi8_a27', activity: "# of BI conducted", indicator: "# of BI conducted" },
    { id: 'pi8_a28', activity: "# of record check conducted", indicator: "# of record check conducted" },
    { id: 'pi8_a29', activity: "# of CI opns conducted", indicator: "# of CI opns conducted" },
    { id: 'pi8_a30', activity: "# of SIMEX conducted", indicator: "# of SIMEX conducted" },
    { id: 'pi8_a31', activity: "# of scty opns during local events conducted", indicator: "# of scty opns during local events conducted" },
    { id: 'pi8_a32', activity: "# of beat/foot patrols conducted", indicator: "# of beat/foot patrols conducted" },
    { id: 'pi8_a33', activity: "# of bike patrols conducted", indicator: "# of bike patrols conducted" },
    { id: 'pi8_a34', activity: "# of horse-riding patrols conducted", indicator: "# of horse-riding patrols conducted" },
    { id: 'pi8_a35', activity: "# of mobile patrols conducted", indicator: "# of mobile patrols conducted" },
    { id: 'pi8_a36', activity: "# of checkpoints conducted", indicator: "# of checkpoints conducted" }
  ],
  PI9: [
    { id: 'pi9_a1', activity: "Maintenance of TPU", indicator: "# of TPU maintained" },
    { id: 'pi9_a2', activity: "Maintenance of TAC", indicator: "# of TAC maintained" },
    { id: 'pi9_a3', activity: "Maintenance of TAD", indicator: "# of TAD maintained" }
  ],
  PI10: [
    { id: 'pi10_a1', activity: "Crime Information Reporting and Analysis System", indicator: "No. of Crime Information Reporting and Analysis System data recorded" },
    { id: 'pi10_a2', activity: "e-Wanted Persons Information System", indicator: "No. of Wanted Persons recorded" },
    { id: 'pi10_a3', activity: "e-Rogues' Gallery System", indicator: "No. of eRogues recorded" },
    { id: 'pi10_a4', activity: "e-Rogues' Maintenance (3rd Qtr or as needed)", indicator: "No. of e-Rogues' Maintened (3rd Qtr or as needed)" },
    { id: 'pi10_a5', activity: "e-Subpoena System", indicator: "No. of Subpoena recorded" },
    { id: 'pi10_a6', activity: "Proper encoding in CIDMS", indicator: "No. of CIDMS encoded" }
  ],
  PI11: [
    { id: 'pi11_a1', activity: "COPLANs formulated", indicator: "No. of COPLANs formulated" },
    { id: 'pi11_a2', activity: "COPLANs implemented", indicator: "No. of COPLANs implemented" },
    { id: 'pi11_a3', activity: "HVT reports submitted", indicator: "No. of HVT reports submitted" },
    { id: 'pi11_a4', activity: "information purchased", indicator: "No. of information purchased" },
    { id: 'pi11_a5', activity: "OCG/CG pers neutralized", indicator: "No. of OCG/CG pers neutralized" },
    { id: 'pi11_a6', activity: "HVTs newly identified", indicator: "No. of HVTs newly identified" },
    { id: 'pi11_a7', activity: "HVTs neutralized", indicator: "No. of HVTs neutralized" },
    { id: 'pi11_a8', activity: "PAG personalities neutralized", indicator: "No. of PAG personalities neutralized" },
    { id: 'pi11_a9', activity: "IRs (criminality) for validation referred", indicator: "No. of IRs (criminality) for validation referred" },
    { id: 'pi11_a10', activity: "Oversight Committee Meetings conducted", indicator: "No. of Oversight Committee Meetings conducted" },
    { id: 'pi11_a11', activity: "PICs conducted", indicator: "No. of PICs conducted" },
    { id: 'pi11_a12', activity: "IRs processed", indicator: "No. of IRs processed" },
    { id: 'pi11_a13', activity: "IRs validated", indicator: "No. of IRs validated" },
    { id: 'pi11_a14', activity: "compliances received and filed", indicator: "No. of compliances received and filed" },
    { id: 'pi11_a15', activity: "HVTs arrested/neutralized", indicator: "No. of HVTs arrested/neutralized" },
    { id: 'pi11_a16', activity: "IFCs maintained", indicator: "No. of IFCs maintained" },
    { id: 'pi11_a17', activity: "Periodic Reports on Organized Threat Groups produced", indicator: "No. of Periodic Reports on Organized Threat Groups produced" },
    { id: 'pi11_a18', activity: "assessment reports submitted", indicator: "No. of assessment reports submitted" },
    { id: 'pi11_a19', activity: "intel products disseminated/utilized", indicator: "No. of intel products disseminated/utilized" },
    { id: 'pi11_a20', activity: "debriefings conducted", indicator: "No. of debriefings conducted" },
    { id: 'pi11_a21', activity: "Interviews conducted", indicator: "No. of Interviews conducted" },
    { id: 'pi11_a22', activity: "elicitations conducted", indicator: "No. of elicitations conducted" }
  ],
  PI12: [
    { id: 'pi12_a1', activity: "# of inventory made", indicator: "# of inventory made" },
    { id: 'pi12_a2', activity: "# of assessment/ratings made", indicator: "# of assessment/ratings made" },
    { id: 'pi12_a3', activity: "# of directives disseminated", indicator: "# of directives disseminated" },
    { id: 'pi12_a4', activity: "# of BINs documented/registered and maintained", indicator: "# of BINs documented/registered and maintained" },
    { id: 'pi12_a5', activity: "# of IRs prepared and submitted", indicator: "# of IRs prepared and submitted" }
  ],
  PI13: [
    { id: 'pi13_a1', activity: "# of coordination with counterparts conducted", indicator: "# of coordination with counterparts conducted" },
    { id: 'pi13_a2', activity: "# of court hearing or Duty on filed cases attended", indicator: "# of court hearing or Duty on filed cases attended" },
    { id: 'pi13_a3', activity: "# of coordination made on COLA cases conducted", indicator: "# of coordination made on COLA cases conducted" },
    { id: 'pi13_a4', activity: "No. Of IEC materials distributed", indicator: "No. Of IEC materials distributed" }
  ],
  PI14: [
    { id: 'pi14_a1', activity: "Monitoring Cases Against Threat Group", indicator: "No. of Monitoring Cases Against Threat Group" },
    { id: 'pi14_a2', activity: "Attend or Initiate Case Conference", indicator: "No. of Case Conference Attended or Initiated" },
    { id: 'pi14_a3', activity: "Monitoring of Filed Cases", indicator: "No. of Filed Cases Monitored" },
    { id: 'pi14_a4', activity: "Liaising with other Pillars of Criminal Justice System", indicator: "No. of Liaising conducted" }
  ],
  PI15: [
    { id: 'pi15_a1', activity: "CIC", indicator: "Nr. of Inventory Conducted for investigators" },
    { id: 'pi15_a2', activity: "IOBC", indicator: "Nr. of Inventory Conducted for investigators" }
  ],
  PI16: [
    { id: 'pi16_a1', activity: "Screening and evaluation of candidates for certified investigators", indicator: "# of screening and evaluation of candidates for certified investigators conducted" }
  ],
  PI17: [
    { id: 'pi17_a1', activity: "Sports supervision and training component", indicator: "No. of Sports supervision and training component conducted" },
    { id: 'pi17_a2', activity: "Sports competition component", indicator: "No. of Sports competition component conducted" },
    { id: 'pi17_a3', activity: "Crime prevention sports component", indicator: "No. of Crime prevention sports component conducted" },
    { id: 'pi17_a4', activity: "Physical Conditioning and Combat Sport", indicator: "No. of Physical Conditioning and Combat Sport conducted" },
    { id: 'pi17_a5', activity: "Reporting of incidents /operational accomplishments of the PNP via Police Operations Management Information System (POMIS)", indicator: "No. of incidents /operational accomplishments of the PNP via POMIS reported" },
    { id: 'pi17_a6', activity: "Premium gasoline purchased", indicator: "# premium gasoline purchased" },
    { id: 'pi17_a7', activity: "Purchase of Premium diesel", indicator: "# premium diesel purchased" },
    { id: 'pi17_a8', activity: "Repair of patrol vehicles", indicator: "# of patrol vehicles repaired" },
    { id: 'pi17_a9', activity: "Change oil of patrol vehicles", indicator: "# of change oil made" },
    { id: 'pi17_a10', activity: "Repair of motorcycles", indicator: "# of motorcycles repaired" },
    { id: 'pi17_a11', activity: "Change oil of motorcycles", indicator: "# of change oil made" },
    { id: 'pi17_a12', activity: "Purchase of tires for patrol vehicles", indicator: "# of tires for patrol vehicles purchased" },
    { id: 'pi17_a13', activity: "Purchase of tires for MC", indicator: "# of tires for MC purchased" },
    { id: 'pi17_a14', activity: "Purchase of batteries for patrol vehicles", indicator: "# of batteries for patrol vehicles purchased" },
    { id: 'pi17_a15', activity: "Purchase of batteries for MC", indicator: "# of batteries for MC purchased" },
    { id: 'pi17_a16', activity: "Purchase of spare parts for patrol vehicles", indicator: "# of spare parts for patrol vehicles purchased" },
    { id: 'pi17_a17', activity: "Purchase of spare parts for MC", indicator: "# of spare parts for MC purchased" },
    { id: 'pi17_a18', activity: "Payment of cellphone bills", indicator: "# of cellphone bills paid" },
    { id: 'pi17_a19', activity: "Maintenance of OPCEN", indicator: "# of OPCEN maintained" }
  ],
  PI18: [
    { id: 'pi18_a1', activity: "Conduct case build up and investigation for filing of cases", indicator: "Conduct case build up and investigation for filing of cases" }
  ],
  PI19: [
    { id: 'pi19_a1', activity: "Monday Flag Raising/Awarding Ceremony", indicator: "# of Monday Flag Raising/Awarding Ceremony conducted" },
    { id: 'pi19_a2', activity: "Issuing commendations", indicator: "# of commendations issued" },
    { id: 'pi19_a3', activity: "Pre-Charge Investigation (PCI)", indicator: "# of PCE/I conducted: Conduct of Pre-Charge Investigation (PCI)" }
  ],
  PI20: [
    { id: 'pi20_a1', activity: "Attendance in specialized training and related seminar on investigation for enhancement of investigative personnel", indicator: "No. of specialized training and related seminar on investigation for enhancement of investigative personnel attended" }
  ],
  PI21: [
    { id: 'pi21_a1', activity: "Crime Information Reporting and Analysis System", indicator: "No. of Crime Information Reporting and Analysis System recorded" },
    { id: 'pi21_a2', activity: "e-Wanted Persons Information System", indicator: "No. of e-Wanted Persons recorded" },
    { id: 'pi21_a3', activity: "e-Rogues' Gallery System", indicator: "No. of e-Rogues' Gallery System recorded" },
    { id: 'pi21_a4', activity: "e-Rogues' Maintenance (3rd Qtr or as needed)", indicator: "No of e-Rogues' Maintened (3rd Qtr or as needed)" },
    { id: 'pi21_a5', activity: "e-Subpoena System", indicator: "No. of e-Subpoena System recorded" },
    { id: 'pi21_a6', activity: "Proper encoding in CIDMS", indicator: "No. of CIDMS recorded" }
  ],
  PI22: [
    { id: 'pi22_a1', activity: "Index Crime", indicator: "No. Of Index Crime Investigated" },
    { id: 'pi22_a2', activity: "Index Crime", indicator: "No. Of Index Crime Filed" },
    { id: 'pi22_a3', activity: "Non-Index crime", indicator: "No. Of Non-Index crime investigated" },
    { id: 'pi22_a4', activity: "Cases filing on Non-Index", indicator: "No. Of cases filed on Non-Index" },
    { id: 'pi22_a5', activity: "Investigation on RIR", indicator: "No. of investigation conducted on RIR" },
    { id: 'pi22_a6', activity: "Cases filing on RIR", indicator: "No. of cases filed on RIR" }
  ],
  PI23: [
    { id: 'pi23_a1', activity: "Inventory, inspection & Accounting", indicator: "# of Inventory, inspection & Accounting conducted" }
  ],
  PI24: [
    { id: 'pi24_a1', activity: "Field investigative crime scene kit", indicator: "No. of Field investigative crime scene kit accounted" },
    { id: 'pi24_a2', activity: "Police line", indicator: "No. of Police line accounted" },
    { id: 'pi24_a3', activity: "Police Blotter", indicator: "No. of Police Blotter accounted" },
    { id: 'pi24_a4', activity: "Digital Camera", indicator: "No. of Digital Camera accounted" },
    { id: 'pi24_a5', activity: "Video Camera", indicator: "No. of Video Camera accounted" }
  ],
  PI25: [
    { id: 'pi25_a1', activity: "computer preventive maintenance and trouble shootings", indicator: "# of computer preventive maintenance and trouble shootings conducted" },
    { id: 'pi25_a2', activity: "Maintenance of printers", indicator: "# of printers maintained" },
    { id: 'pi25_a3', activity: "Internet payment", indicator: "# of computer internet paid" },
    { id: 'pi25_a4', activity: "Telephone payment bills", indicator: "# of telephone bills paid" },
    { id: 'pi25_a5', activity: "cell phone payment bills", indicator: "# of cell phone bills paid" }
  ],
  PI26: [
    { id: 'pi26_a1', activity: "JSCC meetings", indicator: "No. of JSCC meetings conducted" },
    { id: 'pi26_a2', activity: "Liaising", indicator: "No. of liaising conducted" },
    { id: 'pi26_a3', activity: "coordination", indicator: "No. of coordination conducted" }
  ],
  PI27: [
    { id: 'pi27_a1', activity: "Memorandum of Agreement (MOA)/Memorandum of Understanding (MOU) signing", indicator: "No. of Memorandum of Agreement (MOA)/Memorandum of Understanding (MOU) signing initiated" },
    { id: 'pi27_a2', activity: 'Support to "Makakalikasan" activities (Tree planting clean-up, etc)', indicator: 'No. of Support to "Makakalikasan" activities (Tree planting clean-up, etc) conducted' },
    { id: 'pi27_a3', activity: "Support to bloodletting activity", indicator: "No of Support to bloodletting activity conducted" },
    { id: 'pi27_a4', activity: "Coordination with Other Government Agencies (GA) /Government Organizations (GO)", indicator: "No. of Other Government Agencies (GA) /Government Organizations (GO) coordinated" }
  ],
  PI28: [
    { id: 'pi28_a1', activity: "Monitoring of Investigation of Heinous and Sensational Crimes", indicator: "No. of monitored Investigation of Heinous and Sensational Crimes" },
    { id: 'pi28_a2', activity: "Filing of Heinous and Sensational Crimes", indicator: "No. of Heinous and Sensational Crimes Case Filed" },
    { id: 'pi28_a3', activity: "Monitoring and Investigation of Violation of Specials laws", indicator: "No. of Investigation of Violation of Specials laws monitored" },
    { id: 'pi28_a4', activity: "Filing of Violation of Specials laws", indicator: "No. Case Filed of Violation of Specials laws" },
    { id: 'pi28_a5', activity: "Monitoring and Investigation Referred Cases", indicator: "No. of monitored Investigation Referred Cases" },
    { id: 'pi28_a6', activity: "Conducting cold case review for major cases", indicator: "No. of conducted cold case review for major cases" },
    { id: 'pi28_a7', activity: "Reviewing of dismissed cases on illegal drugs, heinous and sensational cases", indicator: "No. of dismissed cases on illegal drugs, heinous and sensational cases reviewed" },
    { id: 'pi28_a8', activity: "Reviewing of Death Incidents", indicator: "No. of Death Incidents reviewed" },
    { id: 'pi28_a9', activity: "Case Review of WCPC Cases", indicator: "No. of Case Review of WCPC conducted" },
    { id: 'pi28_a10', activity: "Conduct of Rescue Operations & Extend Special Protection to Victims", indicator: "No. of Rescue Operations & Extend Special Protection to Victims conducted" },
    { id: 'pi28_a11', activity: "Administer Mediation & Perform Initial Counseling Between on Domestic Violence Cases", indicator: "No of Administer Mediation & Perform Initial Counseling Between on Domestic Violence Cases conducted" },
    { id: 'pi28_a12', activity: "Maintain Closer Partnership and Liaising w/ RIACAT, IACVAWC, IACAP, UN Agencies and other Stakeholders", indicator: "No of liaising /coordination conducted" },
    { id: 'pi28_a13', activity: "Investigation/case referral/monitoring of WCPC Cases", indicator: "No. of Investigation/case referral/monitoring of WCPC Cases conducted" },
    { id: 'pi28_a14', activity: "Investigation/case referral/monitoring of WCPC Cases (Referred)", indicator: "No. of Investigation/case referral/monitoring of WCPC Cases referred" },
    { id: 'pi28_a15', activity: "Conduct follow-up investigation of WCPD Cases", indicator: "No. of follow-up investigation of WCPD Cases conducted" },
    { id: 'pi28_a16', activity: "Filing of cases against identified and/or neutralized suspects of WCPD cases", indicator: "No. of cases against identified and/or neutralized suspects of WCPD cases filed" },
    { id: 'pi28_a17', activity: "Initiate community advocacy campaign to combat TIP/CICL/CAAC/VAWC", indicator: "No. of community advocacy campaign to combat TIP/CICL/CAAC/VAWC Initiated" },
    { id: 'pi28_a18', activity: "Administer distribution of PNP Manual on Investigation of Trafficking in Person", indicator: "No. of distribution of PNP Manual Administered (1st Qtr only)" }
  ],
  PI29: [
    { id: 'pi29_a1', activity: "Creation and activation of SITG Cases", indicator: "# of SITG Cases Created and Activated" },
    { id: 'pi29_a2', activity: "Creation of CIPLAN", indicator: "# of CIPLAN created" }
  ]
};

const PI1_STRUCTURE = [
  { id: 'pi1_a1', activity: "Implementation of Stratcom Snapshots", indicator: "No. of StratCom snapshot formulated" },
  { id: 'pi1_a2', activity: "Implementation of information Operation (IO) Plans (Non-lethal actions)", indicator: "No. of IO implemented" },
  { id: 'pi1_a3', activity: "Implementation of counter-Propaganda Strategies", indicator: "No. of counter-Propaganda Strategies activities conducted" },
  { id: 'pi1_a4', activity: "Conduct of Police Information and Continuing Education (P.I.C.E.)", indicator: "No. of PICE conducted" },
  { id: 'pi1_a5', activity: "Management of PNP Social Media Pages and Account", indicator: "No. of original contents posted in social media pages and accounts" },
  { id: 'pi1_a6', activity: "Social Media Post Boosting", indicator: "No. of target audience reached" },
  { id: 'pi1_a7', activity: "Social Media Engagement", indicator: "No. of Social Media Engagement" },
  { id: 'pi1_a8', activity: "Provide live news streaming of PNP, projects and activities", indicator: "No. of live news streaming, program, projects and activities conducted" },
  { id: 'pi1_a9', activity: "Dissemination of the PNP related issuances monitored from QUAD media", indicator: "No. of forwarded report on Dissemination" },
  { id: 'pi1_a10', activity: "Conceptualization Information and Education", indicator: "No. of printed IEC materials distributed" },
  { id: 'pi1_a11', activity: "Anti-Criminality and Public Safety Awareness Activities", indicator: "No. of anti-criminality activities conducted" },
  { id: 'pi1_a12', activity: "Radio/TV/Live Streaming", indicator: "No. of Radio/TV guestings conducted" },
  { id: 'pi1_a13', activity: "Press Briefing", indicator: "No. of press briefing conducted" },
  { id: 'pi1_a14', activity: "Conduct of FOI awareness activity", indicator: "No. of FOI awareness activities" },
  { id: 'pi1_a15', activity: "Drug Awareness Activities", indicator: "No. of drug awareness activities conducted" },
  { id: 'pi1_a16', activity: "Conduct of Information Operations Development", indicator: "No. IDO activities" },
  { id: 'pi1_a17', activity: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs", indicator: "No. of collaborative efforts activities conducted" }
];

// ... (Keep existing customPiSort, formatTabLabel, getEffectiveUserId, getSharedLabel, getSharedPITitle, getTabLabel, createMonthsForActivity, getPIDefinitions, getPropagationTargets)

// IMPORTANT: Including the modified createMonthsForActivity from previous updates to ensure context
const createMonthsForActivity = (prefix: string, year: string, userId: string, piId: string, activityId: string, activityName: string, role: UserRole, isConsolidated: boolean, units: User[]): MonthData[] => {
  return Array.from({ length: 12 }).map((_, mIdx) => {
    let value = 0;
    const key = `${prefix}_data_${year}_${userId}_${piId}_${activityId}_${mIdx}`;
    const stored = localStorage.getItem(key);
    
    if (isConsolidated && units && units.length > 0) {
      value = units.reduce((sum, unit) => {
        let targetId = activityId;
        const unitActIdsKey = `${prefix}_pi_act_ids_${year}_${unit.id}_${piId}`;
        const storedIds = localStorage.getItem(unitActIdsKey);
        let ids: string[] = [];
        
        if (storedIds) {
            ids = JSON.parse(storedIds);
        } else {
             if (year === '2026' && PI_STRUCTURE_2026[piId]) ids = PI_STRUCTURE_2026[piId].map(a => a.id);
             else if (piId === 'PI1') ids = PI1_STRUCTURE.map(a => a.id);
             else {
                 ids = [`${piId.toLowerCase()}_a1`];
             }
        }

        const foundId = ids.find(id => {
             const nameKey = `${prefix}_pi_act_name_${year}_${unit.id}_${piId}_${id}`;
             let name = localStorage.getItem(nameKey);
             if (!name) {
                 if (year === '2026' && PI_STRUCTURE_2026[piId]) {
                     const base = PI_STRUCTURE_2026[piId].find(a => a.id === id);
                     if (base) name = base.activity;
                 } else if (piId === 'PI1') {
                     const base = PI1_STRUCTURE.find(a => a.id === id);
                     if (base) name = base.activity;
                 } else {
                     const piNumMatch = piId.match(/^PI(\d+)$/);
                     const piNum = piNumMatch ? parseInt(piNumMatch[1], 10) : null;
                     if (piNum !== null && piNum >= 2 && piNum <= 29) name = "Sectoral groups/BPATs mobilized";
                     else name = "Operational Activity";
                 }
             }
             return name === activityName;
        });

        if (foundId) targetId = foundId;

        const unitKey = `${prefix}_data_${year}_${unit.id}_${piId}_${targetId}_${mIdx}`;
        const val = localStorage.getItem(unitKey);
        return sum + (val ? parseInt(val, 10) : 0);
      }, 0);
    } else {
      if (stored !== null) value = parseInt(stored, 10);
    }
    return { value, files: [] };
  });
};

const customPiSort = (a: string, b: string) => {
  const aUpper = a.toUpperCase();
  const bUpper = b.toUpperCase();
  
  const getWeight = (s: string) => {
    if (s.startsWith('PI')) return 1;
    if (s.startsWith('ODPI')) return 3;
    if (s.startsWith('OD')) return 2;
    return 4;
  };
  
  const wA = getWeight(aUpper);
  const wB = getWeight(bUpper);
  
  if (wA !== wB) return wA - wB;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

const formatTabLabel = (id: string): string => {
  const cleanId = id.toUpperCase().trim();
  if (cleanId.startsWith('PI') || cleanId.startsWith('OD') || cleanId.startsWith('ODPI')) return cleanId;
  return `PI ${cleanId}`;
};

const getEffectiveUserId = (userId: string, role?: UserRole, prefix?: string, isTemplateMode?: boolean): string => {
  if (isTemplateMode) return 'sa-1';
  if (role === UserRole.SUB_ADMIN && prefix === 'target') return 'sa-1';
  return userId;
};

const getSharedLabel = (prefix: string, year: string, userId: string, piId: string, activityId: string, type: 'act' | 'ind', defaultName: string): string => {
  const localKey = `${prefix}_pi_${type}_name_${year}_${userId}_${piId}_${activityId}`;
  const local = localStorage.getItem(localKey);
  if (local) return local;
  
  if (userId !== 'sa-1') {
    const templateKey = `${prefix}_pi_${type}_name_${year}_sa-1_${piId}_${activityId}`;
    return localStorage.getItem(templateKey) || defaultName;
  }
  return defaultName;
};

const getSharedPITitle = (prefix: string, year: string, userId: string, piId: string, defaultTitle: string): string => {
  const localKey = `${prefix}_pi_title_${year}_${userId}_${piId}`;
  const local = localStorage.getItem(localKey);
  if (local) return local;
  
  if (userId !== 'sa-1') {
    const templateKey = `${prefix}_pi_title_${year}_sa-1_${piId}`;
    return localStorage.getItem(templateKey) || defaultTitle;
  }
  return defaultTitle;
};

const getTabLabel = (prefix: string, year: string, userId: string, piId: string) => {
    const key = `${prefix}_tab_label_${year}_${userId}_${piId}`;
    const local = localStorage.getItem(key);
    if (local) return local;
    
    if (userId !== 'sa-1') {
         const templateKey = `${prefix}_tab_label_${year}_sa-1_${piId}`;
         return localStorage.getItem(templateKey) || formatTabLabel(piId);
    }
    return formatTabLabel(piId);
}

const getPIDefinitions = (prefix: string, year: string, userId: string, role: UserRole, isConsolidated: boolean, units: User[], isTemplateMode: boolean, ignoreHidden = false): ExtendedPIData[] => {
  const effectiveId = getEffectiveUserId(userId, role, prefix, isTemplateMode);
  const hiddenPIsKey = `${prefix}_hidden_pis_${year}_${effectiveId}`;
  const hiddenPIs: string[] = JSON.parse(localStorage.getItem(hiddenPIsKey) || '[]');
  
  let defaultList: string[];
  
  if (year === '2026') {
    defaultList = Array.from({ length: 29 }, (_, i) => `PI${i + 1}`);
  } else {
    defaultList = [
      ...Array.from({ length: 29 }, (_, i) => `PI${i + 1}`),
      ...Array.from({ length: 10 }, (_, i) => `OD${i + 1}`)
    ];
  }

  const importedListKey = `${prefix}_imported_pi_list_${year}_${effectiveId}`;
  let importedIds: string[] = JSON.parse(localStorage.getItem(importedListKey) || '[]');

  let baseIds = Array.from(new Set([...defaultList, ...importedIds]));
  
  if (isTemplateMode) {
    baseIds = baseIds.filter(id => {
      if (importedIds.includes(id)) return true;
      if (!id.startsWith('PI')) return false;
      const numStr = id.replace('PI', '');
      if (!/^\d+$/.test(numStr)) return false; 
      const num = parseInt(numStr, 10);
      return num >= 1 && num <= 29;
    });
  }

  const orderKey = `${prefix}_pi_order_${year}_${effectiveId}`;
  const savedOrder: string[] = JSON.parse(localStorage.getItem(orderKey) || '[]');
  
  if (savedOrder.length > 0) {
      baseIds.sort((a, b) => {
          const idxA = savedOrder.indexOf(a);
          const idxB = savedOrder.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return customPiSort(a, b);
      });
  } else {
      baseIds.sort(customPiSort);
  }

  return baseIds.map(piId => {
    const actIdsKey = `${prefix}_pi_act_ids_${year}_${effectiveId}_${piId}`;
    let storedIds = localStorage.getItem(actIdsKey);
    
    if (!storedIds && effectiveId !== 'sa-1') {
      storedIds = localStorage.getItem(`${prefix}_pi_act_ids_${year}_sa-1_${piId}`);
    }
    
    let activityIds: string[];
    let fallbackStructure: { id: string; activity: string; indicator: string }[];
    
    const isExplicitlyImported = importedIds.includes(piId) && storedIds;

    if (isExplicitlyImported) {
      activityIds = JSON.parse(storedIds!);
       if (PI_STRUCTURE_2026[piId]) {
         fallbackStructure = PI_STRUCTURE_2026[piId];
       } else if (piId === 'PI1') {
         fallbackStructure = PI1_STRUCTURE;
       } else {
         fallbackStructure = [{ id: `${piId.toLowerCase()}_a1`, activity: "Operational Activity", indicator: "Activity Unit" }];
       }
    } else if (year === '2026' && PI_STRUCTURE_2026[piId]) {
      fallbackStructure = PI_STRUCTURE_2026[piId];
      activityIds = fallbackStructure.map(a => a.id);
    } else if (piId === 'PI1') {
      fallbackStructure = PI1_STRUCTURE;
      activityIds = storedIds ? JSON.parse(storedIds) : fallbackStructure.map(a => a.id);
    } else {
      const piNumMatch = piId.match(/^PI(\d+)$/);
      const piNum = piNumMatch ? parseInt(piNumMatch[1], 10) : null;
      if (piNum !== null && piNum >= 2 && piNum <= 29) {
        fallbackStructure = [{ id: `${piId.toLowerCase()}_a1`, activity: "Sectoral groups/BPATs mobilized", indicator: "Collaborative efforts with NGOs" }];
      } else {
        fallbackStructure = [{ id: `${piId.toLowerCase()}_a1`, activity: "Operational Activity", indicator: "Activity Unit" }];
      }
      activityIds = storedIds ? JSON.parse(storedIds) : fallbackStructure.map(a => a.id);
    }

    const activities = activityIds.map(aid => {
      const base = fallbackStructure.find(a => a.id === aid) || fallbackStructure[0];
      const actName = getSharedLabel(prefix, year, effectiveId, piId, aid, 'act', base.activity);
      return {
        id: aid,
        activity: actName,
        indicator: getSharedLabel(prefix, year, effectiveId, piId, aid, 'ind', base.indicator),
        months: createMonthsForActivity(prefix, year, effectiveId, piId, aid, actName, role, isConsolidated, units),
        total: 0
      };
    });
    
    const defaultTitleBase = piId === 'PI1' ? "Community Awareness Activities Initiated" : `Indicator ${piId}`;
    const specificTitle = year === '2026' && PI_TITLES_2026[piId] ? PI_TITLES_2026[piId] : defaultTitleBase;
    
    return { 
      id: piId, 
      title: getSharedPITitle(prefix, year, effectiveId, piId, specificTitle), 
      tabLabel: getTabLabel(prefix, year, effectiveId, piId),
      activities 
    };
  }).filter(pi => ignoreHidden ? true : !hiddenPIs.includes(pi.id));
};

const getPropagationTargets = (currentUser: User, subjectUser: User, allUnits: User[], prefix: string, year: string, isTemplateMode: boolean): User[] => {
    if (isTemplateMode) return allUnits || [];
    if (currentUser.role === UserRole.SUPER_ADMIN && subjectUser.role === UserRole.SUPER_ADMIN && prefix === 'target') {
        return (allUnits || []).filter(u => u.role === UserRole.CHQ);
    }
    if (currentUser.role === UserRole.SUPER_ADMIN && prefix === 'target' && year === '2026' && subjectUser.name === 'Police Station 1') {
         return (allUnits || []).filter(u => 
            u.role === UserRole.STATION && 
            u.id !== subjectUser.id && 
            u.name !== 'City Mobile Force Company'
        );
    }
    return [];
};

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ title, onBack, currentUser, subjectUser, allUnits = [], isTemplateMode = false }) => {
  const [activeTab, setActiveTab] = useState('');
  const [piData, setPiData] = useState<ExtendedPIData[]>([]);
  const [editingCell, setEditingCell] = useState<{ piId: string; rowIdx: number; monthIdx: number } | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ piId: string; rowIdx: number; field: 'activity' | 'indicator' | 'title' | 'tab_label' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const masterImportRef = useRef<HTMLInputElement>(null);

  const year = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const isTargetOutlook = useMemo(() => title.toUpperCase().includes("TARGET OUTLOOK"), [title]);
  const prefix = isTargetOutlook ? 'target' : 'accomplishment';
  
  const isConsolidated = useMemo(() => (currentUser.role === UserRole.SUPER_ADMIN && (title.includes('Consolidation') || title.includes('Dashboard'))) || (currentUser.role === UserRole.CHQ && title.includes('Consolidation')), [currentUser.role, title]);
  const isOwner = currentUser.id === subjectUser.id;
  
  const isSuperAdminTargetMaster = currentUser.role === UserRole.SUPER_ADMIN && subjectUser.role === UserRole.SUPER_ADMIN && prefix === 'target';
  const isStationOneTarget2026 = currentUser.role === UserRole.SUPER_ADMIN && prefix === 'target' && year === '2026' && subjectUser.name === 'Police Station 1';
  const isStationOneAccomplishment2026 = currentUser.role === UserRole.SUPER_ADMIN && prefix === 'accomplishment' && year === '2026' && subjectUser.name === 'Police Station 1';

  const showTemplateControls = isTemplateMode || isSuperAdminTargetMaster || isStationOneTarget2026 || isStationOneAccomplishment2026;

  const canModifyData = useMemo(() => {
    if (isConsolidated) return false;
    if (isTargetOutlook) {
      if (currentUser.role === UserRole.CHQ || currentUser.role === UserRole.STATION) {
        return false;
      }
    }
    return isOwner || currentUser.role === UserRole.SUPER_ADMIN || (currentUser.role === UserRole.SUB_ADMIN && subjectUser.role === UserRole.STATION);
  }, [isConsolidated, isOwner, currentUser.role, subjectUser.role, isTargetOutlook]);

  const canModifyTemplate = useMemo(() => isTemplateMode && currentUser.role === UserRole.SUPER_ADMIN, [isTemplateMode, currentUser.role]);

  const canEditStructure = useMemo(() => 
    canModifyTemplate || 
    (canModifyData && (isTargetOutlook || currentUser.role === UserRole.SUPER_ADMIN)), 
    [canModifyTemplate, canModifyData, isTargetOutlook, currentUser.role]
  );

  const refresh = () => {
    const unitsToConsolidate = isConsolidated ? (allUnits || []) : [];
    const data = getPIDefinitions(prefix, year, subjectUser.id, subjectUser.role, isConsolidated, unitsToConsolidate, isTemplateMode);
    setPiData(data.map(d => ({ ...d, activities: d.activities.map(a => ({ ...a, total: a.months.reduce((sum, m) => sum + m.value, 0) })) })));
  };

  useEffect(() => { refresh(); }, [prefix, year, subjectUser.id, allUnits, isConsolidated, isTemplateMode]);
  useEffect(() => { 
    if (piData.length > 0) { 
      if (!activeTab || !piData.some(pi => pi.id === activeTab)) setActiveTab(piData[0].id); 
    } else {
      setActiveTab('');
    }
  }, [piData]);

  const currentPI = useMemo(() => piData.find(pi => pi.id === activeTab) || piData[0], [piData, activeTab]);

  const handleExportMaster = () => {
    const unitsToUse = isConsolidated ? (allUnits || []) : [];
    const fullPiData = getPIDefinitions(prefix, year, subjectUser.id, subjectUser.role, isConsolidated, unitsToUse, isTemplateMode, true);
    
    const workbook = XLSX.utils.book_new();
    const header = ['PI ID', 'Activity ID', 'PI Title', 'Activity', 'Performance Indicator', ...MONTHS];
    const wscols = [
      { wch: 10 }, { wch: 15 }, { wch: 40 }, { wch: 50 }, { wch: 50 },
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }
    ];

    fullPiData.forEach(pi => {
        const dataToExport: any[] = [];
        pi.activities.forEach(act => {
            const row: any = {
                'PI ID': pi.id,
                'Activity ID': act.id, 
                'PI Title': pi.title, 
                'Activity': act.activity, 
                'Performance Indicator': act.indicator,
            };
            MONTHS.forEach((month, idx) => { row[month] = act.months[idx].value; });
            dataToExport.push(row);
        });
        
        if (dataToExport.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header });
            worksheet['!cols'] = wscols;
            const sheetName = pi.id.replace(/[\\/?*[\]]/g, '').substring(0, 31);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
    });

    const safeName = subjectUser.name.replace(/[^a-z0-9]/gi, '_');
    XLSX.writeFile(workbook, `Master_Template_${safeName}_${year}_${prefix}.xlsx`);
  };

  const handleUnhideAll = () => {
    const effectiveId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    if (confirm('Restore ALL Performance Indicators?')) {
      localStorage.setItem(`${prefix}_hidden_pis_${year}_${effectiveId}`, JSON.stringify([]));
      localStorage.setItem(`${prefix}_pi_order_${year}_${effectiveId}`, JSON.stringify([]));
      refresh();
    }
  };

  const handleAddTab = () => {
    if (!canEditStructure) return;
    const newTabId = `CPI_${Date.now()}`; 
    const uId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    
    const importedKey = `${prefix}_imported_pi_list_${year}_${uId}`;
    const currentImported: string[] = JSON.parse(localStorage.getItem(importedKey) || '[]');
    const newImported = [...currentImported, newTabId];
    localStorage.setItem(importedKey, JSON.stringify(newImported));

    const orderKey = `${prefix}_pi_order_${year}_${uId}`;
    const currentOrder: string[] = piData.map(p => p.id); 
    const newOrder = [...currentOrder, newTabId]; 
    localStorage.setItem(orderKey, JSON.stringify(newOrder));
    
    localStorage.setItem(`${prefix}_tab_label_${year}_${uId}_${newTabId}`, "New Tab");
    localStorage.setItem(`${prefix}_pi_title_${year}_${uId}_${newTabId}`, "New Performance Indicator Section");
    
    const actId = `${newTabId.toLowerCase()}_a1`;
    const actIdsKey = `${prefix}_pi_act_ids_${year}_${uId}_${newTabId}`;
    localStorage.setItem(actIdsKey, JSON.stringify([actId]));
    localStorage.setItem(`${prefix}_pi_act_name_${year}_${uId}_${newTabId}_${actId}`, "New Activity");
    localStorage.setItem(`${prefix}_pi_ind_name_${year}_${uId}_${newTabId}_${actId}`, "New Indicator");
    for(let i=0; i<12; i++) {
         localStorage.setItem(`${prefix}_data_${year}_${uId}_${newTabId}_${actId}_${i}`, "0");
    }

    const targets = getPropagationTargets(currentUser, subjectUser, allUnits || [], prefix, year, isTemplateMode || false);
    targets.forEach(target => {
        const tImportedKey = `${prefix}_imported_pi_list_${year}_${target.id}`;
        const tImported = JSON.parse(localStorage.getItem(tImportedKey) || '[]');
        if (!tImported.includes(newTabId)) {
            localStorage.setItem(tImportedKey, JSON.stringify([...tImported, newTabId]));
        }
        const tOrderKey = `${prefix}_pi_order_${year}_${target.id}`;
        const tOrder = JSON.parse(localStorage.getItem(tOrderKey) || '[]');
        if (!tOrder.includes(newTabId)) {
            localStorage.setItem(tOrderKey, JSON.stringify([...tOrder, newTabId]));
        }
        localStorage.setItem(`${prefix}_tab_label_${year}_${target.id}_${newTabId}`, "New Tab");
        localStorage.setItem(`${prefix}_pi_title_${year}_${target.id}_${newTabId}`, "New Performance Indicator Section");
        localStorage.setItem(`${prefix}_pi_act_ids_${year}_${target.id}_${newTabId}`, JSON.stringify([actId]));
        localStorage.setItem(`${prefix}_pi_act_name_${year}_${target.id}_${newTabId}_${actId}`, "New Activity");
        localStorage.setItem(`${prefix}_pi_ind_name_${year}_${target.id}_${newTabId}_${actId}`, "New Indicator");
        for(let i=0; i<12; i++) {
             localStorage.setItem(`${prefix}_data_${year}_${target.id}_${newTabId}_${actId}_${i}`, "0");
        }
    });
    
    refresh();
    setActiveTab(newTabId);
  };

  const handleHideTab = (piId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const effectiveId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    if (confirm(`Delete ${formatTabLabel(piId)}?`)) {
      const hiddenKey = `${prefix}_hidden_pis_${year}_${effectiveId}`;
      const hidden: string[] = JSON.parse(localStorage.getItem(hiddenKey) || '[]');
      if (!hidden.includes(piId)) {
          const newHidden = [...hidden, piId];
          localStorage.setItem(hiddenKey, JSON.stringify(newHidden));
          const targets = getPropagationTargets(currentUser, subjectUser, allUnits || [], prefix, year, isTemplateMode || false);
          targets.forEach(target => {
            const tHiddenKey = `${prefix}_hidden_pis_${year}_${target.id}`;
            const tHidden = JSON.parse(localStorage.getItem(tHiddenKey) || '[]');
            if (!tHidden.includes(piId)) {
                localStorage.setItem(tHiddenKey, JSON.stringify([...tHidden, piId]));
            }
          });
          refresh();
      }
    }
  };

  const handleMoveTab = (piId: string, direction: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    const effectiveId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    const currentIndex = piData.findIndex(p => p.id === piId);
    if (currentIndex === -1) return;
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= piData.length) return;
    const newOrder = piData.map(p => p.id);
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    const orderKey = `${prefix}_pi_order_${year}_${effectiveId}`;
    localStorage.setItem(orderKey, JSON.stringify(newOrder));
    const targets = getPropagationTargets(currentUser, subjectUser, allUnits || [], prefix, year, isTemplateMode || false);
    targets.forEach(target => {
        const tOrderKey = `${prefix}_pi_order_${year}_${target.id}`;
        localStorage.setItem(tOrderKey, JSON.stringify(newOrder));
    });
    refresh();
  };

  const handleAddActivity = (piId: string) => {
    if (!canEditStructure) return;
    const uId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    let currentIds: string[] = [];
    const localKey = `${prefix}_pi_act_ids_${year}_${uId}_${piId}`;
    const storedLocal = localStorage.getItem(localKey);
    if (storedLocal) {
        currentIds = JSON.parse(storedLocal);
    } else {
        const pi = piData.find(p => p.id === piId);
        if (pi) {
            currentIds = pi.activities.map(a => a.id);
        } else {
            currentIds = [];
        }
    }
    const newId = `${piId.toLowerCase()}_custom_${Date.now()}`;
    const newIds = [...currentIds, newId];
    localStorage.setItem(localKey, JSON.stringify(newIds));
    localStorage.setItem(`${prefix}_pi_act_name_${year}_${uId}_${piId}_${newId}`, "New Activity");
    localStorage.setItem(`${prefix}_pi_ind_name_${year}_${uId}_${piId}_${newId}`, "New Indicator");
    for(let i=0; i<12; i++) {
         localStorage.setItem(`${prefix}_data_${year}_${uId}_${piId}_${newId}_${i}`, "0");
    }
    const targets = getPropagationTargets(currentUser, subjectUser, allUnits || [], prefix, year, isTemplateMode || false);
    targets.forEach(target => {
        const tLocalKey = `${prefix}_pi_act_ids_${year}_${target.id}_${piId}`;
        localStorage.setItem(tLocalKey, JSON.stringify(newIds));
        localStorage.setItem(`${prefix}_pi_act_name_${year}_${target.id}_${piId}_${newId}`, "New Activity");
        localStorage.setItem(`${prefix}_pi_ind_name_${year}_${target.id}_${piId}_${newId}`, "New Indicator");
        for(let i=0; i<12; i++) {
             localStorage.setItem(`${prefix}_data_${year}_${target.id}_${piId}_${newId}_${i}`, "0");
        }
    });
    refresh();
  };

  const handleRemoveActivity = (piId: string, activityId: string) => {
    if (!canEditStructure) return;
    if (!confirm('Are you sure you want to remove this activity row?')) return;
    const uId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    const localKey = `${prefix}_pi_act_ids_${year}_${uId}_${piId}`;
    const storedLocal = localStorage.getItem(localKey);
    let currentIds: string[] = [];
    if (storedLocal) {
      currentIds = JSON.parse(storedLocal);
    } else {
      const pi = piData.find(p => p.id === piId);
      currentIds = pi ? pi.activities.map(a => a.id) : [];
    }
    const newIds = currentIds.filter(id => id !== activityId);
    localStorage.setItem(localKey, JSON.stringify(newIds));
    const targets = getPropagationTargets(currentUser, subjectUser, allUnits || [], prefix, year, isTemplateMode || false);
    targets.forEach(target => {
        const tLocalKey = `${prefix}_pi_act_ids_${year}_${target.id}_${piId}`;
        localStorage.setItem(tLocalKey, JSON.stringify(newIds));
    });
    refresh();
  };

  const handleImportMasterTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isConsolidated) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const uId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
        const isStandardStation = (user: User) => user.role === UserRole.STATION && user.name !== 'City Mobile Force Company';
        const isCurrentTargetStandard = prefix === 'target' && isStandardStation(subjectUser);
        
        let propagationTargets: User[] = [];
        if (isSuperAdminTargetMaster) {
           propagationTargets = (allUnits || []).filter(u => u.role === UserRole.CHQ);
        } else if (isCurrentTargetStandard) {
           propagationTargets = (allUnits || []).filter(u => isStandardStation(u));
        }

        const foundPIs = new Set<string>();
        const orderedPIs: string[] = [];
        const piActivitiesMap: Record<string, string[]> = {};
        
        wb.SheetNames.forEach(sheetName => {
            const ws = wb.Sheets[sheetName];
            const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            if (!rows || rows.length === 0) return;

            let headerRowIdx = -1;
            for (let i = 0; i < Math.min(rows.length, 50); i++) {
               const row = rows[i];
               if (!row || !Array.isArray(row)) continue;
               const normalizedRow = row.map(c => String(c).toLowerCase().replace(/[^a-z0-9]/g, ''));
               const hasActivity = normalizedRow.some(c => c.includes('activity'));
               const hasIndicator = normalizedRow.some(c => c.includes('indicator') || c.includes('performance'));
               const hasPI = normalizedRow.some(c => c.includes('pi') || c.includes('id'));
               if (hasActivity || (hasPI && hasIndicator)) {
                   headerRowIdx = i;
                   break;
               }
            }
            if (headerRowIdx === -1) {
                 let maxCols = 0;
                 rows.forEach((r, i) => { if (r && r.length > maxCols) { maxCols = r.length; headerRowIdx = i; } });
            }

            const headerRowRaw = rows[headerRowIdx] || [];
            const normalizedHeaders = headerRowRaw.map(c => String(c).toLowerCase().replace(/[^a-z0-9]/g, ''));
            const findCol = (keywords: string[]) => {
                 const normalizedKeywords = keywords.map(k => k.replace(/[^a-z0-9]/g, ''));
                 // Priority: Exact Match -> Partial Match
                 const exactIdx = normalizedHeaders.findIndex(h => normalizedKeywords.includes(h));
                 if (exactIdx !== -1) return exactIdx;
                 return normalizedHeaders.findIndex(h => normalizedKeywords.some(k => h.includes(k)));
            };

            // Improved column mapping to match: PI ID, Activity ID, PI Title, Activity, Performance Indicator
            const columnMap: Record<string, number> = {
              piId: findCol(['piid', 'pi id', 'indicatorid', 'id']),
              aid: findCol(['activityid', 'activity id', 'actid', 'aid']),
              piTitle: findCol(['pititle', 'pi title', 'indicatortitle', 'title']),
              activityName: findCol(['activity', 'activityname', 'description']),
              indicatorName: findCol(['performanceindicator', 'performance indicator', 'performance', 'indicator']),
            };
            MONTHS.forEach((m, i) => { columnMap[`month_${i}`] = findCol(MONTH_VARIANTS[m].map(v => v.replace(/[^a-z0-9]/g, ''))); });

            let currentPiId = '';
            let currentActivityName = '';
            let currentIndicatorName = '';

            rows.slice(headerRowIdx + 1).forEach((row) => {
                if (!row || row.length < 2) return;
                const getVal = (idx: number) => (idx !== -1 && row[idx]) ? String(row[idx]).trim() : '';

                let rowPiId = getVal(columnMap.piId).toUpperCase().replace(/\s+/g, '');
                
                const isValidId = (s: string) => /^(PI|OD|ODPI)\d+$/.test(s);
                if (!isValidId(rowPiId)) {
                    const altPi = row.find(c => { 
                       const s = String(c).toUpperCase().trim().replace(/\s+/g, ''); 
                       return isValidId(s); 
                    });
                    if (altPi) rowPiId = String(altPi).trim().toUpperCase().replace(/\s+/g, '');
                    else rowPiId = '';
                }

                if (rowPiId) {
                    currentPiId = rowPiId;
                    currentActivityName = '';
                    currentIndicatorName = '';
                }
                
                if (!currentPiId) return;
                const piId = currentPiId;

                let aidFromCol = getVal(columnMap.aid).toLowerCase().replace(/\s+/g, '');
                let actNameInFile = getVal(columnMap.activityName);
                let indNameInFile = getVal(columnMap.indicatorName);

                if (actNameInFile) currentActivityName = actNameInFile;
                if (indNameInFile) currentIndicatorName = indNameInFile;

                if (!foundPIs.has(piId)) {
                    foundPIs.add(piId);
                    orderedPIs.push(piId);
                }
                if (!piActivitiesMap[piId]) piActivitiesMap[piId] = [];

                if (!actNameInFile && !indNameInFile && !currentActivityName && !currentIndicatorName && !aidFromCol) {
                    const titleInRow = getVal(columnMap.piTitle);
                    if (titleInRow) {
                       localStorage.setItem(`${prefix}_pi_title_${year}_${uId}_${piId}`, titleInRow);
                       propagationTargets.forEach(target => {
                         if (target.id === uId) return;
                         localStorage.setItem(`${prefix}_pi_title_${year}_${target.id}_${piId}`, titleInRow);
                       });
                    }
                    return;
                }

                let aid = aidFromCol;
                if (!aid) {
                   const normalizedActName = (actNameInFile || currentActivityName).toLowerCase().replace(/\s+/g, '');
                   if (normalizedActName.match(/^(pi|od|odpi)\d+_a\d+$/)) {
                      aid = normalizedActName;
                   } else {
                      aid = `${piId.toLowerCase()}_a${piActivitiesMap[piId].length + 1}`;
                   }
                }
                
                if (!piActivitiesMap[piId].includes(aid)) {
                   piActivitiesMap[piId].push(aid);
                }

                let actName = actNameInFile || currentActivityName;
                let indName = indNameInFile || currentIndicatorName;
                const isPlaceholder = (s: string) => s.toLowerCase().match(/^(pi|od|odpi)\d+(_a\d+)?$/) || s === '';
                const isActPlaceholder = isPlaceholder(actName);
                const isIndPlaceholder = isPlaceholder(indName);

                const struct = PI_STRUCTURE_2026[piId];
                if (struct) {
                    let match;
                    if (aid) match = struct.find(s => s.id.toLowerCase() === aid.toLowerCase());
                    if (!match && isActPlaceholder && actName) {
                        match = struct.find(s => s.id.toLowerCase() === actName.toLowerCase());
                    }
                    if (match) {
                        if (isActPlaceholder || !actName) actName = match.activity;
                        if (isIndPlaceholder || !indName) indName = match.indicator;
                    }
                }

                if (piId === 'ODPI6') {
                   if (isActPlaceholder || !actName) actName = "EMPO Assessment and Evaluations";
                   if (isIndPlaceholder || !indName) indName = "No. of EMPO Assessment and Evaluations conducted";
                } else if (piId === 'ODPI10') {
                   if (isActPlaceholder || !actName) actName = "Operational Resource Management";
                   if (isIndPlaceholder || !indName) indName = "No. of ODPI 10 activities conducted";
                } else if (piId.startsWith('ODPI')) {
                   const tabNum = piId.replace('ODPI', '');
                   if (isActPlaceholder || !actName) actName = `ODPI ${tabNum} Operational Task`;
                   if (isIndPlaceholder || !indName) indName = `No. of ODPI ${tabNum} activities conducted`;
                } else if (piId === 'PI2' && !struct) { 
                   if (isActPlaceholder || !actName) actName = "Sectoral groups/BPATs mobilized";
                   if (isIndPlaceholder || !indName) indName = "No. of collaborative efforts activities conducted";
                }

                if (!actName) actName = "Operational Activity";
                if (!indName) indName = "Activity Unit";

                localStorage.setItem(`${prefix}_pi_act_name_${year}_${uId}_${piId}_${aid}`, actName);
                localStorage.setItem(`${prefix}_pi_ind_name_${year}_${uId}_${piId}_${aid}`, indName);
                
                propagationTargets.forEach(target => {
                  if (target.id === uId) return;
                  localStorage.setItem(`${prefix}_pi_act_name_${year}_${target.id}_${piId}_${aid}`, actName);
                  localStorage.setItem(`${prefix}_pi_ind_name_${year}_${target.id}_${piId}_${aid}`, indName);
                });
                
                const titleInRow = getVal(columnMap.piTitle);
                if (titleInRow) {
                  localStorage.setItem(`${prefix}_pi_title_${year}_${uId}_${piId}`, titleInRow);
                  propagationTargets.forEach(target => {
                    if (target.id === uId) return;
                    localStorage.setItem(`${prefix}_pi_title_${year}_${target.id}_${piId}`, titleInRow);
                  });
                }
                
                MONTHS.forEach((_, i) => { 
                  const valCol = columnMap[`month_${i}`]; 
                  const val = valCol !== -1 ? (parseInt(String(row[valCol] || '0'), 10) || 0) : 0; 
                  localStorage.setItem(`${prefix}_data_${year}_${uId}_${piId}_${aid}_${i}`, String(val)); 
                  
                  propagationTargets.forEach(target => {
                    if (target.id === uId) return;
                    localStorage.setItem(`${prefix}_data_${year}_${target.id}_${piId}_${aid}_${i}`, String(val));
                  });
                });
            });
        });

        if (foundPIs.size > 0) {
          const existingImportedKey = `${prefix}_imported_pi_list_${year}_${uId}`;
          const existingImported: string[] = JSON.parse(localStorage.getItem(existingImportedKey) || '[]');
          const updatedImported = Array.from(new Set([...existingImported, ...Array.from(foundPIs)]));
          localStorage.setItem(existingImportedKey, JSON.stringify(updatedImported));

          Object.entries(piActivitiesMap).forEach(([pid, aids]) => {
            localStorage.setItem(`${prefix}_pi_act_ids_${year}_${uId}_${pid}`, JSON.stringify(aids));
          });

          localStorage.setItem(`${prefix}_pi_order_${year}_${uId}`, JSON.stringify(orderedPIs));

          const defaultList = [
            ...Array.from({ length: 29 }, (_, i) => `PI${i + 1}`),
            ...Array.from({ length: 10 }, (_, i) => `OD${i + 1}`)
          ];
          const allPotentialIds = Array.from(new Set([...defaultList, ...updatedImported]));
          
          const idsToHide = allPotentialIds.filter(id => !foundPIs.has(id));
          
          localStorage.setItem(`${prefix}_hidden_pis_${year}_${uId}`, JSON.stringify(idsToHide));

          propagationTargets.forEach(target => {
            if (target.id === uId) return;
            localStorage.setItem(`${prefix}_imported_pi_list_${year}_${target.id}`, JSON.stringify(updatedImported));
            localStorage.setItem(`${prefix}_hidden_pis_${year}_${target.id}`, JSON.stringify(idsToHide));
            localStorage.setItem(`${prefix}_pi_order_${year}_${target.id}`, JSON.stringify(orderedPIs));
            Object.entries(piActivitiesMap).forEach(([pid, aids]) => {
              localStorage.setItem(`${prefix}_pi_act_ids_${year}_${target.id}_${pid}`, JSON.stringify(aids));
            });
          });
        }

        refresh();
        alert(`Master Import Success: ${foundPIs.size} Indicators found. All tabs strictly synced to file content.${propagationTargets.length > 0 ? ` Updated ${propagationTargets.length} CHQ/Target units.` : ''}`);
      } catch (err: any) { 
        console.error(err);
        alert("Import Failed: Please verify Excel headers."); 
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const saveCell = () => {
    if (!editingCell) return;
    const { piId, rowIdx, monthIdx } = editingCell;
    const piIndex = piData.findIndex(p => p.id === piId);
    if (piIndex === -1) return;
    
    const pi = piData[piIndex];
    const act = pi.activities[rowIdx];
    
    const uId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    
    const key = `${prefix}_data_${year}_${uId}_${pi.id}_${act.id}_${monthIdx}`;
    const newValue = editValue || '0';
    localStorage.setItem(key, newValue);
    
    if (prefix === 'target' && year === '2026' && subjectUser.name === 'Police Station 1') {
        const propagationTargets = (allUnits || []).filter(u => 
            u.role === UserRole.STATION && 
            u.id !== subjectUser.id && 
            u.name !== 'City Mobile Force Company'
        );
        
        propagationTargets.forEach(target => {
            const targetKey = `${prefix}_data_${year}_${target.id}_${pi.id}_${act.id}_${monthIdx}`;
            localStorage.setItem(targetKey, newValue);
        });
    }
    
    setEditingCell(null);
    refresh();
  };

  const saveLabel = () => {
    if (!editingLabel) return;
    const { piId, rowIdx, field } = editingLabel;
    const uId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    
    const piIndex = piData.findIndex(p => p.id === piId);
    if (piIndex === -1) return;
    const pi = piData[piIndex];
    
    const targets = getPropagationTargets(currentUser, subjectUser, allUnits || [], prefix, year, isTemplateMode || false);

    if (field === 'tab_label') {
        const key = `${prefix}_tab_label_${year}_${uId}_${piId}`;
        localStorage.setItem(key, editValue);
        targets.forEach(target => {
            localStorage.setItem(`${prefix}_tab_label_${year}_${target.id}_${piId}`, editValue);
        });
    } else if (field === 'title') {
        const key = `${prefix}_pi_title_${year}_${uId}_${piId}`;
        localStorage.setItem(key, editValue);
        targets.forEach(target => {
            localStorage.setItem(`${prefix}_pi_title_${year}_${target.id}_${piId}`, editValue);
        });
    } else {
        const act = pi.activities[rowIdx];
        if (field === 'activity') {
            const key = `${prefix}_pi_act_name_${year}_${uId}_${piId}_${act.id}`;
            localStorage.setItem(key, editValue);
            targets.forEach(target => {
                localStorage.setItem(`${prefix}_pi_act_name_${year}_${target.id}_${piId}_${act.id}`, editValue);
            });
        } else if (field === 'indicator') {
            const key = `${prefix}_pi_ind_name_${year}_${uId}_${piId}_${act.id}`;
            localStorage.setItem(key, editValue);
            targets.forEach(target => {
                localStorage.setItem(`${prefix}_pi_ind_name_${year}_${target.id}_${piId}_${act.id}`, editValue);
            });
        }
    }
    setEditingLabel(null);
    refresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
            {isTemplateMode && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Configuration Mode</p>}
          </div>
        </div>
        
        {showTemplateControls && (
            <div className="flex gap-2">
                <button onClick={handleExportMaster} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-200">
                    Export Template
                </button>
                <button onClick={() => masterImportRef.current?.click()} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg">
                    Import Template
                </button>
                <input type="file" ref={masterImportRef} onChange={handleImportMasterTemplate} className="hidden" accept=".xlsx, .xls" />
                <button onClick={handleUnhideAll} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                    Reset Tabs
                </button>
            </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
            {piData.map((pi, index) => (
                <div key={pi.id} className="relative group flex items-center bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-200 hover:shadow-md transition-all">
                    <button
                        onClick={() => setActiveTab(pi.id)}
                        onDoubleClick={() => {
                            if (canEditStructure) {
                                setEditingLabel({ piId: pi.id, rowIdx: -1, field: 'tab_label' });
                                setEditValue(pi.tabLabel);
                            }
                        }}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === pi.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {pi.tabLabel}
                    </button>
                    {canEditStructure && (
                        <div className="flex items-center pr-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {index > 0 && (
                                <button onClick={(e) => handleMoveTab(pi.id, 'left', e)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                            )}
                            {index < piData.length - 1 && (
                                <button onClick={(e) => handleMoveTab(pi.id, 'right', e)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            )}
                            <button onClick={(e) => handleHideTab(pi.id, e)} className="p-1 hover:bg-rose-100 rounded text-rose-300 hover:text-rose-500">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            ))}
            {canEditStructure && (
                <button onClick={handleAddTab} className="px-4 py-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 font-black text-lg transition-colors min-w-[50px] shadow-sm border border-transparent hover:border-slate-200">
                    +
                </button>
            )}
        </div>

        {/* Content */}
        <div className="p-8 overflow-x-auto">
            {currentPI && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <div className="group flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">{currentPI.title}</h3>
                            {canEditStructure && (
                                <button 
                                    onClick={() => {
                                        setEditingLabel({ piId: currentPI.id, rowIdx: -1, field: 'title' });
                                        setEditValue(currentPI.title);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                            )}
                         </div>
                         {canEditStructure && (
                             <button onClick={() => handleAddActivity(currentPI.id)} className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-black uppercase tracking-widest transition-colors">
                                + Add Activity
                             </button>
                         )}
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="p-3 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 min-w-[200px]">Activity</th>
                                <th className="p-3 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 min-w-[200px]">Indicator</th>
                                {MONTHS.map(m => (
                                    <th key={m} className="p-3 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 text-center w-[60px]">{m}</th>
                                ))}
                                <th className="p-3 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 text-center w-[80px]">Total</th>
                                {canEditStructure && <th className="w-10 border-b border-slate-100"></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {currentPI.activities.map((act, idx) => (
                                <tr key={act.id} className="hover:bg-slate-50/50 group transition-colors">
                                    <td className="p-3 border-b border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-700 leading-snug">{act.activity}</span>
                                            {canEditStructure && (
                                                <button 
                                                    onClick={() => {
                                                        setEditingLabel({ piId: currentPI.id, rowIdx: idx, field: 'activity' });
                                                        setEditValue(act.activity);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-blue-600 transition"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3 border-b border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">{act.indicator}</span>
                                            {canEditStructure && (
                                                <button 
                                                    onClick={() => {
                                                        setEditingLabel({ piId: currentPI.id, rowIdx: idx, field: 'indicator' });
                                                        setEditValue(act.indicator);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-blue-600 transition"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    {act.months.map((m, mIdx) => (
                                        <td key={mIdx} className="p-1 border-b border-slate-50 text-center">
                                            <div 
                                                onClick={() => {
                                                    if (canModifyData) {
                                                        setEditingCell({ piId: currentPI.id, rowIdx: idx, monthIdx: mIdx });
                                                        setEditValue(String(m.value));
                                                    }
                                                }}
                                                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${m.value > 0 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-300 hover:bg-slate-100'}`}
                                            >
                                                {m.value}
                                            </div>
                                        </td>
                                    ))}
                                    <td className="p-3 border-b border-slate-50 text-center">
                                        <span className={`text-xs font-black ${act.total > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>{act.total}</span>
                                    </td>
                                    {canEditStructure && (
                                        <td className="p-3 border-b border-slate-50 text-center">
                                            <button 
                                                onClick={() => handleRemoveActivity(currentPI.id, act.id)}
                                                className="text-slate-300 hover:text-rose-500 transition"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      {/* Edit Value Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={() => setEditingCell(null)}>
            <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-black text-slate-900 mb-4">Update Value</h3>
                <input 
                    type="number" 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none focus:border-slate-900 font-bold text-xl mb-6"
                    autoFocus
                    onKeyDown={e => {
                        if (e.key === 'Enter') saveCell();
                        if (e.key === 'Escape') setEditingCell(null);
                    }}
                />
                <div className="flex gap-2">
                    <button onClick={() => setEditingCell(null)} className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50">Cancel</button>
                    <button onClick={saveCell} className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-lg">Save</button>
                </div>
            </div>
        </div>
      )}

      {/* Edit Label Modal */}
      {editingLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={() => setEditingLabel(null)}>
            <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-black text-slate-900 mb-4">
                    {editingLabel.field === 'title' ? 'Edit Section Title' : 
                     editingLabel.field === 'activity' ? 'Edit Activity Name' : 
                     editingLabel.field === 'tab_label' ? 'Edit Tab Name' :
                     'Edit Indicator Description'}
                </h3>
                <textarea 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none focus:border-slate-900 font-medium text-sm mb-6 min-h-[100px]"
                    autoFocus
                />
                <div className="flex gap-2">
                    <button onClick={() => setEditingLabel(null)} className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50">Cancel</button>
                    <button onClick={saveLabel} className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-lg">Save Update</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDashboard;