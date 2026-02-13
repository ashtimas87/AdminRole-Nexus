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
  year: string;
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

const createMonthsForActivity = (prefix: string, year: string, userId: string, piId: string, activityId: string, role: UserRole, isConsolidated: boolean, units: User[]): MonthData[] => {
  return Array.from({ length: 12 }).map((_, mIdx) => {
    let value = 0;
    const key = `${prefix}_data_${year}_${userId}_${piId}_${activityId}_${mIdx}`;
    const stored = localStorage.getItem(key);
    
    if (isConsolidated && units && units.length > 0) {
      value = units.reduce((sum, unit) => {
        const unitKey = `${prefix}_data_${year}_${unit.id}_${piId}_${activityId}_${mIdx}`;
        const val = localStorage.getItem(unitKey);
        return sum + (val ? parseInt(val, 10) : 0);
      }, 0);
    } else {
      if (stored !== null) value = parseInt(stored, 10);
    }
    return { value, files: [] };
  });
};

const getPIDefinitions = (prefix: string, year: string, userId: string, role: UserRole, isConsolidated: boolean, units: User[], isTemplateMode: boolean, ignoreHidden = false) => {
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
  
  // Filter for Template Mode ONLY
  if (isTemplateMode) {
    baseIds = baseIds.filter(id => {
      // Show only PI1 to PI29
      if (!id.startsWith('PI')) return false;
      const numStr = id.replace('PI', '');
      if (!/^\d+$/.test(numStr)) return false; 
      const num = parseInt(numStr, 10);
      return num >= 1 && num <= 29;
    });
  }

  baseIds = baseIds.sort(customPiSort);

  return baseIds.map(piId => {
    const actIdsKey = `${prefix}_pi_act_ids_${year}_${effectiveId}_${piId}`;
    let storedIds = localStorage.getItem(actIdsKey);
    
    if (!storedIds && effectiveId !== 'sa-1') {
      storedIds = localStorage.getItem(`${prefix}_pi_act_ids_${year}_sa-1_${piId}`);
    }
    
    let activityIds: string[];
    let fallbackStructure: { id: string; activity: string; indicator: string }[];
    
    // Check if this PI was explicitly imported to override defaults
    const isExplicitlyImported = importedIds.includes(piId) && storedIds;

    if (isExplicitlyImported) {
      // STRICTLY USE IMPORTED IDS
      activityIds = JSON.parse(storedIds!);
      // Fallback structure only for resolving NAMES if they are missing in local storage (e.g. placeholders)
       // Map ODPI to PI for structure lookup if needed
       let structId = piId;
       if (piId.startsWith('ODPI')) {
          structId = piId.replace('ODPI', 'PI');
       }
       
       if (PI_STRUCTURE_2026[structId]) {
         fallbackStructure = PI_STRUCTURE_2026[structId];
       } else if (piId === 'PI1' || piId === 'ODPI1') {
         fallbackStructure = PI1_STRUCTURE;
       } else {
         // Generic fallback
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
      let base = fallbackStructure.find(a => a.id === aid);
      if (!base && aid.toLowerCase().startsWith('odpi')) {
          const mappedAid = aid.toLowerCase().replace('odpi', 'pi');
          base = fallbackStructure.find(a => a.id === mappedAid);
      }
      base = base || fallbackStructure[0];
      return {
        id: aid,
        activity: getSharedLabel(prefix, year, effectiveId, piId, aid, 'act', base.activity),
        indicator: getSharedLabel(prefix, year, effectiveId, piId, aid, 'ind', base.indicator),
        months: createMonthsForActivity(prefix, year, effectiveId, piId, aid, role, isConsolidated, units),
        total: 0
      };
    });
    
    // Map ODPI to PI for title lookup
    let titleId = piId;
    if (piId.startsWith('ODPI')) {
        titleId = piId.replace('ODPI', 'PI');
    }
    const defaultTitleBase = piId === 'PI1' ? "Community Awareness Activities Initiated" : `Indicator ${piId}`;
    const specificTitle = year === '2026' && PI_TITLES_2026[titleId] ? PI_TITLES_2026[titleId] : defaultTitleBase;
    
    return { 
      id: piId, 
      title: getSharedPITitle(prefix, year, effectiveId, piId, specificTitle), 
      activities 
    };
  }).filter(pi => ignoreHidden ? true : !hiddenPIs.includes(pi.id));
};

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ title, onBack, currentUser, subjectUser, allUnits = [], isTemplateMode = false }) => {
  const [activeTab, setActiveTab] = useState('');
  const [piData, setPiData] = useState<PIData[]>([]);
  const [editingCell, setEditingCell] = useState<{ piId: string; rowIdx: number; monthIdx: number } | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ piId: string; rowIdx: number; field: 'activity' | 'indicator' | 'title' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [viewMode, setViewMode] = useState<'tabbed' | 'master'>('tabbed');
  const masterImportRef = useRef<HTMLInputElement>(null);

  const year = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const isTargetOutlook = useMemo(() => title.toUpperCase().includes("TARGET OUTLOOK"), [title]);
  const prefix = isTargetOutlook ? 'target' : 'accomplishment';
  
  const isConsolidated = useMemo(() => (currentUser.role === UserRole.SUPER_ADMIN && (title.includes('Consolidation') || title.includes('Dashboard'))) || (currentUser.role === UserRole.CHQ && title.includes('Consolidation')), [currentUser.role, title]);
  const isOwner = currentUser.id === subjectUser.id;
  const canModifyData = useMemo(() => isConsolidated ? false : isOwner || currentUser.role === UserRole.SUPER_ADMIN || (currentUser.role === UserRole.SUB_ADMIN && subjectUser.role === UserRole.STATION), [isConsolidated, isOwner, currentUser.role, subjectUser.role]);
  const canModifyTemplate = useMemo(() => isTemplateMode && currentUser.role === UserRole.SUPER_ADMIN, [isTemplateMode, currentUser.role]);
  const canEditStructure = useMemo(() => canModifyTemplate || (canModifyData && isTargetOutlook), [canModifyTemplate, canModifyData, isTargetOutlook]);

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
    const dataToExport: any[] = [];
    piData.forEach(pi => {
      pi.activities.forEach(act => {
        const row: any = {
          'PI ID': pi.id,
          'Activity ID': act.id, // Added to help strict mapping on re-import
          'Activity Name': act.activity,
          'Performance Indicator': act.indicator,
          'PI Title': pi.title
        };
        MONTHS.forEach((month, idx) => { row[month] = act.months[idx].value; });
        dataToExport.push(row);
      });
    });
    
    // Create sheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Set column widths for better "Template" feel
    const wscols = [
      { wch: 10 }, // PI ID
      { wch: 15 }, // Activity ID
      { wch: 50 }, // Activity Name
      { wch: 50 }, // Performance Indicator
      { wch: 40 }, // PI Title
      // Months
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, 
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, 
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Master Template");
    XLSX.writeFile(workbook, `Master_Template_${year}_${prefix}.xlsx`);
  };

  const handleUnhideAll = () => {
    const effectiveId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    if (confirm('Restore ALL Performance Indicators?')) {
      localStorage.setItem(`${prefix}_hidden_pis_${year}_${effectiveId}`, JSON.stringify([]));
      refresh();
    }
  };

  const handleHideTab = (piId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const effectiveId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    if (confirm(`Hide ${formatTabLabel(piId)}?`)) {
      const hiddenKey = `${prefix}_hidden_pis_${year}_${effectiveId}`;
      const hidden: string[] = JSON.parse(localStorage.getItem(hiddenKey) || '[]');
      if (!hidden.includes(piId)) hidden.push(piId);
      localStorage.setItem(hiddenKey, JSON.stringify(hidden));
      refresh();
    }
  };

  const handleAddActivity = (piId: string) => {
    if (!canEditStructure) return;
    const uId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    
    // 1. Get current IDs
    let currentIds: string[] = [];
    const localKey = `${prefix}_pi_act_ids_${year}_${uId}_${piId}`;
    const storedLocal = localStorage.getItem(localKey);
    
    if (storedLocal) {
        currentIds = JSON.parse(storedLocal);
    } else {
        // Fallback to what is currently rendered (derived from template or defaults)
        const pi = piData.find(p => p.id === piId);
        if (pi) {
            currentIds = pi.activities.map(a => a.id);
        } else {
            currentIds = [];
        }
    }

    // 2. Create new ID
    const newId = `${piId.toLowerCase()}_custom_${Date.now()}`;
    const newIds = [...currentIds, newId];

    // 3. Save new list
    localStorage.setItem(localKey, JSON.stringify(newIds));

    // 4. Initialize labels and data
    localStorage.setItem(`${prefix}_pi_act_name_${year}_${uId}_${piId}_${newId}`, "New Activity");
    localStorage.setItem(`${prefix}_pi_ind_name_${year}_${uId}_${piId}_${newId}`, "New Indicator");
    for(let i=0; i<12; i++) {
         localStorage.setItem(`${prefix}_data_${year}_${uId}_${piId}_${newId}_${i}`, "0");
    }

    // 5. Refresh
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
    refresh();
  };

  const handleImportMasterTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isConsolidated) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (!rows || rows.length === 0) throw new Error("File empty");
        
        // Improved header detection: Look for key columns
        let headerRowIdx = rows.findIndex(r => r && Array.isArray(r) && r.some(c => {
            const s = String(c).toLowerCase().trim();
            return s.includes('pi id') || s.includes('indicator') || s.includes('activity');
        }));
        
        if (headerRowIdx === -1) {
            // Fallback: try to find a row with enough columns
            headerRowIdx = rows.findIndex(r => r && r.filter(c => c).length >= 3);
        }
        if (headerRowIdx === -1) headerRowIdx = 0;
        
        const headerRow = rows[headerRowIdx];
        
        const findCol = (keywords: string[]) => headerRow.findIndex(cell => { 
          if (!cell) return false; 
          const norm = String(cell).toLowerCase().trim(); 
          return keywords.some(k => norm.includes(k)); 
        });

        const columnMap: Record<string, number> = {
          piId: findCol(['pi id', 'indicator id', 'pi', 'id', 'tab']),
          activityName: findCol(['activity', 'activity name', 'description', 'activity description']),
          indicatorName: findCol(['performance', 'indicator name', 'indicator description', 'measurement', 'measure', 'pi', 'indicator']),
          piTitle: findCol(['pi title', 'indicator title', 'summary', 'goal', 'title']),
          aid: findCol(['activity id', 'act id', 'aid', 'no.', 'order'])
        };
        MONTHS.forEach((m, i) => { columnMap[`month_${i}`] = findCol(MONTH_VARIANTS[m]); });

        const uId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
        
        const isStandardStation = (user: User) => user.role === UserRole.STATION && user.name !== 'City Mobile Force Company';
        const isCurrentTargetStandard = prefix === 'target' && isStandardStation(subjectUser);
        const propagationTargets = isCurrentTargetStandard 
          ? (allUnits || []).filter(u => isStandardStation(u))
          : [];

        const foundPIs = new Set<string>();
        const piActivitiesMap: Record<string, string[]> = {};
        
        // Fill-down state
        let currentPiId = '';
        let currentActivityName = '';
        let currentIndicatorName = '';

        rows.slice(headerRowIdx + 1).forEach((row) => {
          if (!row || row.length < 2) return;
          
          // 1. Extract potential PI ID from row
          // Allow loose matching initially to capture spacing, then normalize
          let rowPiId = String(row[columnMap.piId] || '').trim().toUpperCase().replace(/\s+/g, '');
          
          // Helper to validate ID format: allows standard PI/OD/ODPI
          const isValidId = (s: string) => /^(PI|OD|ODPI)\d+$/.test(s);
          
          // Fallback search if column value is invalid/empty
          if (!isValidId(rowPiId)) {
             const altPi = row.find(c => { 
                const s = String(c).toUpperCase().trim().replace(/\s+/g, ''); 
                return isValidId(s); 
             });
             if (altPi) rowPiId = String(altPi).trim().toUpperCase().replace(/\s+/g, '');
             else rowPiId = '';
          }
          
          // 2. Update fill-down state
          if (rowPiId) {
            currentPiId = rowPiId;
            currentActivityName = '';
            currentIndicatorName = '';
          }
          
          // 3. If no state, we can't process
          if (!currentPiId) return;
          
          const piId = currentPiId;
          
          // 4. Get content
          let aidFromCol = String(row[columnMap.aid] || '').trim().toLowerCase().replace(/\s+/g, '');
          let actNameInFile = String(row[columnMap.activityName] || '').trim();
          let indNameInFile = String(row[columnMap.indicatorName] || '').trim();

          // Update fill-down states if values present
          if (actNameInFile) currentActivityName = actNameInFile;
          if (indNameInFile) currentIndicatorName = indNameInFile;

          // 5. If we have a PI ID but no activity content at all (and no previous fill-down content), 
          // we track the PI but don't add an activity yet.
          foundPIs.add(piId);
          if (!piActivitiesMap[piId]) piActivitiesMap[piId] = [];

          if (!actNameInFile && !indNameInFile && !currentActivityName && !currentIndicatorName && !aidFromCol) {
            // Likely a header row for the PI itself
            // We check for PI Title in this row
            const titleInRow = String(row[columnMap.piTitle] || '').trim();
            if (titleInRow) {
               localStorage.setItem(`${prefix}_pi_title_${year}_${uId}_${piId}`, titleInRow);
               propagationTargets.forEach(target => {
                 if (target.id === uId) return;
                 localStorage.setItem(`${prefix}_pi_title_${year}_${target.id}_${piId}`, titleInRow);
               });
            }
            return; 
          }

          // Generate a stable ID for the activity
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

          // Resolve from Structure (PI1-29, etc) using PI_STRUCTURE_2026
          // Map ODPI to PI for structure lookup if needed to provide better defaults
          let structId = piId;
          if (piId.startsWith('ODPI')) {
             structId = piId.replace('ODPI', 'PI');
          }
          const struct = PI_STRUCTURE_2026[structId] || PI_STRUCTURE_2026[piId];

          if (struct) {
              let match;
              // Match by aid
              if (aid) match = struct.find(s => s.id.toLowerCase() === aid.toLowerCase());
              
              // NEW: Match by index if IDs are generated sequentially or simple mapping (e.g. odpi6_a1 matches pi6_a1)
              if (!match && aid && aid.toLowerCase().startsWith('odpi')) {
                 const piAid = aid.toLowerCase().replace('odpi', 'pi');
                 match = struct.find(s => s.id.toLowerCase() === piAid);
              }
              
              // Match by name-as-id
              if (!match && isActPlaceholder && actName) {
                  match = struct.find(s => s.id.toLowerCase() === actName.toLowerCase());
              }
              
              if (match) {
                  if (isActPlaceholder || !actName) actName = match.activity;
                  if (isIndPlaceholder || !indName) indName = match.indicator;
              }
          }

          // Fallbacks for specific ODPIs if needed - simplified since we now map ODPI to PI structure above
          if (piId.startsWith('ODPI') && !struct) {
             const tabNum = piId.replace('ODPI', '');
             if (isActPlaceholder || !actName) actName = `ODPI ${tabNum} Operational Task`;
             if (isIndPlaceholder || !indName) indName = `No. of ODPI ${tabNum} activities conducted`;
          } else if (piId === 'PI2' && !struct) { 
             if (isActPlaceholder || !actName) actName = "Sectoral groups/BPATs mobilized";
             if (isIndPlaceholder || !indName) indName = "No. of collaborative efforts activities conducted";
          }

          // Safety default
          if (!actName) actName = "Operational Activity";
          if (!indName) indName = "Activity Unit";

          localStorage.setItem(`${prefix}_pi_act_name_${year}_${uId}_${piId}_${aid}`, actName);
          localStorage.setItem(`${prefix}_pi_ind_name_${year}_${uId}_${piId}_${aid}`, indName);
          
          propagationTargets.forEach(target => {
            if (target.id === uId) return;
            localStorage.setItem(`${prefix}_pi_act_name_${year}_${target.id}_${piId}_${aid}`, actName);
            localStorage.setItem(`${prefix}_pi_ind_name_${year}_${target.id}_${piId}_${aid}`, indName);
          });
          
          const titleInRow = String(row[columnMap.piTitle] || '').trim();
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

        if (foundPIs.size > 0) {
          const existingImportedKey = `${prefix}_imported_pi_list_${year}_${uId}`;
          const existingImported: string[] = JSON.parse(localStorage.getItem(existingImportedKey) || '[]');
          const updatedImported = Array.from(new Set([...existingImported, ...Array.from(foundPIs)]));
          localStorage.setItem(existingImportedKey, JSON.stringify(updatedImported));

          Object.entries(piActivitiesMap).forEach(([pid, aids]) => {
            localStorage.setItem(`${prefix}_pi_act_ids_${year}_${uId}_${pid}`, JSON.stringify(aids));
          });

          const defaultList = [
            ...Array.from({ length: 29 }, (_, i) => `PI${i + 1}`),
            ...Array.from({ length: 10 }, (_, i) => `OD${i + 1}`)
          ];
          const allPotentialIds = Array.from(new Set([...defaultList, ...updatedImported]));
          
          // STRICT VISIBILITY: Hide anything that was NOT found in the current file upload
          const idsToHide = allPotentialIds.filter(id => !foundPIs.has(id));
          
          localStorage.setItem(`${prefix}_hidden_pis_${year}_${uId}`, JSON.stringify(idsToHide));

          propagationTargets.forEach(target => {
            if (target.id === uId) return;
            localStorage.setItem(`${prefix}_imported_pi_list_${year}_${target.id}`, JSON.stringify(updatedImported));
            localStorage.setItem(`${prefix}_hidden_pis_${year}_${target.id}`, JSON.stringify(idsToHide));
            Object.entries(piActivitiesMap).forEach(([pid, aids]) => {
              localStorage.setItem(`${prefix}_pi_act_ids_${year}_${target.id}_${pid}`, JSON.stringify(aids));
            });
          });
        }

        refresh();
        alert(`Master Import Success: ${foundPIs.size} Indicators found. Visible tabs strictly synced to file content. Activities strictly synced.`);
      } catch (err: any) { 
        console.error(err);
        alert("Import Failed: Please verify Excel headers."); 
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleCellClick = (piId: string, rowIdx: number, monthIdx: number, val: number) => { 
    if (canModifyData) { 
      setEditingCell({ piId, rowIdx, monthIdx }); 
      setEditValue(String(val)); 
    } 
  };
  
  const handleLabelClick = (piId: string, rowIdx: number, field: 'activity' | 'indicator' | 'title', currentVal: string) => { 
    if (canEditStructure) { 
      setEditingLabel({ piId, rowIdx, field }); 
      setEditValue(currentVal); 
    } 
  };

  const saveEdit = () => {
    const uId = getEffectiveUserId(subjectUser.id, subjectUser.role, prefix, isTemplateMode);
    if (editingCell) {
      const val = parseInt(editValue, 10) || 0;
      const targetPI = piData.find(p => p.id === editingCell.piId);
      if (targetPI) {
        const aid = targetPI.activities[editingCell.rowIdx].id;
        localStorage.setItem(`${prefix}_data_${year}_${uId}_${editingCell.piId}_${aid}_${editingCell.monthIdx}`, String(val));
      }
      setEditingCell(null);
    } else if (editingLabel) {
      const targetPI = piData.find(p => p.id === editingLabel.piId);
      if (targetPI) {
        if (editingLabel.field === 'title') {
          localStorage.setItem(`${prefix}_pi_title_${year}_${uId}_${editingLabel.piId}`, editValue);
        } else {
          const aid = targetPI.activities[editingLabel.rowIdx].id;
          const type = editingLabel.field === 'activity' ? 'act' : 'ind';
          localStorage.setItem(`${prefix}_pi_${type}_name_${year}_${uId}_${editingLabel.piId}_${aid}`, editValue);
        }
      }
      setEditingLabel(null);
    }
    refresh();
  };

  const renderRows = (pi: PIData) => {
    const rows = pi.activities.map((act, rIdx) => {
      const isRepeatedActivity = rIdx > 0 && pi.activities[rIdx - 1].activity === act.activity;

      return (
      <tr key={`${pi.id}-${act.id}`} className="hover:bg-slate-50/50 group transition-colors border-b border-slate-100 relative">
        <td className="px-6 py-4 relative group">
          {editingLabel?.piId === pi.id && editingLabel?.rowIdx === rIdx && editingLabel?.field === 'activity' ? 
            <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="w-full border-2 border-rose-500 rounded font-black text-[13px] px-2 outline-none" /> : 
            (!isRepeatedActivity ? 
              <span onClick={() => handleLabelClick(pi.id, rIdx, 'activity', act.activity)} className={`text-[13px] font-bold text-slate-900 leading-snug block py-1 ${canEditStructure ? 'cursor-pointer hover:bg-rose-50 p-1 rounded transition-colors' : ''}`}>{act.activity}</span>
              :
              <span onClick={() => handleLabelClick(pi.id, rIdx, 'activity', act.activity)} className={`text-[13px] font-bold text-transparent select-none leading-snug block py-1 ${canEditStructure ? 'cursor-pointer hover:bg-rose-50 hover:text-slate-400 p-1 rounded transition-colors' : ''}`}>{act.activity}</span>
            )
          }
            
            {canEditStructure && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleRemoveActivity(pi.id, act.id); }} 
                className="absolute -left-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="Remove Activity Row"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
        </td>
        <td className="px-6 py-4">
          {editingLabel?.piId === pi.id && editingLabel?.rowIdx === rIdx && editingLabel?.field === 'indicator' ? 
            <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="w-full border-2 border-rose-500 rounded font-black text-[11px] px-2 outline-none" /> : 
            <span onClick={() => handleLabelClick(pi.id, rIdx, 'indicator', act.indicator)} className={`text-[11px] font-semibold text-slate-500 leading-snug block py-1 ${canEditStructure ? 'cursor-pointer hover:bg-rose-50 p-1 rounded transition-colors' : ''}`}>{act.indicator}</span>}
        </td>
        {act.months.map((m, mIdx) => (
          <td key={mIdx} className="px-1 py-4 text-center">
            {editingCell?.piId === pi.id && editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? 
              <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} className="w-12 text-center border-2 border-slate-900 rounded font-black text-[11px] py-0.5 outline-none" /> : 
              <div onClick={() => handleCellClick(pi.id, rIdx, mIdx, m.value)} className={`rounded py-1 font-black text-[11px] transition-colors ${canModifyData ? 'cursor-pointer hover:bg-slate-100' : ''} ${m.value > 0 ? (isConsolidated ? 'text-emerald-700' : (isTemplateMode ? 'text-rose-700' : (isTargetOutlook ? 'text-amber-700' : 'text-slate-900'))) : 'text-slate-200'}`}>{m.value.toLocaleString()}</div>}
          </td>
        ))}
        <td className={`px-6 py-4 text-center text-xs font-black ${isConsolidated ? 'text-emerald-900' : (isTemplateMode ? 'text-rose-900' : (isTargetOutlook ? 'text-amber-900' : 'text-slate-900'))}`}>{act.total.toLocaleString()}</td>
      </tr>
      );
    });

    if (canEditStructure) {
      rows.push(
        <tr key={`${pi.id}-add-row`} className="bg-slate-50/30">
          <td colSpan={15} className="px-6 py-2">
             <button 
               onClick={() => handleAddActivity(pi.id)}
               className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 flex items-center gap-1 transition-colors"
             >
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
               Add Activity
             </button>
          </td>
        </tr>
      );
    }
    
    return rows;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg> Return
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{isTemplateMode ? 'Master Template Control' : title}</h1>
              {isConsolidated && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200">Consolidated</span>}
              {isTemplateMode && <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-200 shadow-sm animate-pulse">Master Source</span>}
              {!isTemplateMode && isTargetOutlook && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-200 shadow-sm">Projection</span>}
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-60">Unit: {subjectUser.name} • Year: {year}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setViewMode(prev => prev === 'tabbed' ? 'master' : 'tabbed')} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2 ${viewMode === 'master' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
            {viewMode === 'tabbed' ? 'List View' : 'Tab View'}
          </button>
          {!isConsolidated && (currentUser.role === UserRole.SUPER_ADMIN || (currentUser.role === UserRole.SUB_ADMIN && isTargetOutlook)) && (
            <>
              <button onClick={handleExportMaster} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg">Export Master</button>
              <button onClick={handleUnhideAll} className="bg-white text-slate-400 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition border border-slate-200">Unhide All</button>
              <button onClick={() => masterImportRef.current?.click()} className={`${isTargetOutlook ? 'bg-amber-600' : 'bg-slate-900'} text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition shadow-lg`}>Import Master</button>
              <input type="file" ref={masterImportRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportMasterTemplate} />
            </>
          )}
        </div>
      </div>

      {viewMode === 'tabbed' ? (
        <>
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {piData.map(pi => (
              <div key={pi.id} className="relative group">
                <button onClick={() => setActiveTab(pi.id)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap pr-10 ${activeTab === pi.id ? (isConsolidated ? 'bg-emerald-600 text-white shadow-lg' : isTemplateMode ? 'bg-rose-600 text-white shadow-lg' : (isTargetOutlook ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-900 text-white shadow-lg')) : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{formatTabLabel(pi.id)}</button>
                {(currentUser.role === UserRole.SUPER_ADMIN || (currentUser.role === UserRole.SUB_ADMIN && isTargetOutlook)) && !isConsolidated && (
                  <button onClick={(e) => handleHideTab(pi.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-400/20 text-slate-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">×</button>
                )}
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            <div className={`${isConsolidated ? 'bg-emerald-900' : isTemplateMode ? 'bg-rose-900' : (isTargetOutlook ? 'bg-amber-900' : 'bg-slate-900')} p-8 text-white`}>
              {editingLabel?.piId === activeTab && editingLabel?.field === 'title' ? 
                <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="bg-white/10 text-white border-2 border-white/30 rounded px-2 outline-none w-full font-black uppercase" /> : 
                <h2 onClick={() => handleLabelClick(activeTab, 0, 'title', currentPI?.title || '')} className={`text-xl font-black uppercase tracking-tight ${canEditStructure ? 'cursor-pointer hover:bg-rose-800/40 rounded px-2 transition-colors' : ''}`}>{formatTabLabel(activeTab)} - {currentPI?.title}</h2>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[300px]">Activity</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest min-w-[200px]">Performance Indicator</th>
                    {MONTHS.map(m => <th key={m} className="px-3 py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">{m}</th>)}
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-900 tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">{currentPI && renderRows(currentPI)}</tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-700">
          <div className="overflow-x-auto max-h-[75vh]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-30">
                <tr className={`${isTemplateMode ? 'bg-rose-900' : (isTargetOutlook ? 'bg-amber-900' : 'bg-slate-900')} text-white shadow-md`}>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] min-w-[300px] border-r border-slate-800">Activity</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] min-w-[200px] border-r border-slate-800">Performance Indicator</th>
                  {MONTHS.map(m => <th key={m} className="px-2 py-5 text-center text-[10px] font-black uppercase tracking-wider min-w-[50px]">{m}</th>)}
                  <th className={`px-6 py-5 text-center text-[11px] font-black uppercase tracking-[0.2em] ${isTargetOutlook ? 'bg-amber-700/50' : 'bg-indigo-900/50'}`}>Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {piData.map((pi) => (
                  <React.Fragment key={pi.id}>
                    <tr className="bg-slate-50/80 sticky z-20" style={{ top: '64px' }}>
                      <td colSpan={15} className="px-6 py-3 border-y border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white ${isConsolidated ? 'bg-emerald-600' : isTemplateMode ? 'bg-rose-600' : (isTargetOutlook ? 'bg-amber-600' : 'bg-slate-900')}`}>{formatTabLabel(pi.id)}</span>
                          {editingLabel?.piId === pi.id && editingLabel?.field === 'title' ? 
                            <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} className="text-xs font-black text-slate-800 uppercase tracking-tight border-b border-rose-500 outline-none bg-transparent" /> : 
                            <span onClick={() => handleLabelClick(pi.id, 0, 'title', pi.title)} className={`text-xs font-black text-slate-800 uppercase tracking-tight ${canEditStructure ? 'cursor-pointer hover:bg-rose-50 px-1 rounded transition-colors' : ''}`}>{pi.title}</span>}
                        </div>
                      </td>
                    </tr>
                    {renderRows(pi)}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDashboard;