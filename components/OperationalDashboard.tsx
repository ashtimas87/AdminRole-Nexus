import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';
import pptxgen from "pptxgenjs";
import * as XLSX from "xlsx";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper to get shared definitions with year and user scoping
const getSharedActivityName = (year: string, userId: string, piId: string, activityId: string, defaultName: string): string => {
  const scoped = localStorage.getItem(`pi_activity_name_${year}_${userId}_${piId}_${activityId}`);
  if (scoped) return scoped;
  const global = localStorage.getItem(`pi_activity_name_${year}_${piId}_${activityId}`);
  return global || defaultName;
};

const getSharedIndicatorName = (year: string, userId: string, piId: string, activityId: string, defaultIndicator: string): string => {
  const scoped = localStorage.getItem(`pi_indicator_name_${year}_${userId}_${piId}_${activityId}`);
  if (scoped) return scoped;
  const global = localStorage.getItem(`pi_indicator_name_${year}_${piId}_${activityId}`);
  return global || defaultIndicator;
};

const getSharedPITitle = (year: string, userId: string, piId: string, defaultTitle: string): string => {
  const scoped = localStorage.getItem(`pi_title_${year}_${userId}_${piId}`);
  if (scoped) return scoped;
  const global = localStorage.getItem(`pi_title_${year}_${piId}`);
  return global || defaultTitle;
};

const getSharedTabLabel = (year: string, userId: string, piId: string, defaultLabel: string): string => {
  const scoped = localStorage.getItem(`pi_tab_label_${year}_${userId}_${piId}`);
  if (scoped) return scoped;
  const global = localStorage.getItem(`pi_tab_label_${year}_${piId}`);
  return global || defaultLabel;
};

// Helper to get individual accomplishment data with year separation
const getSharedAccomplishment = (year: string, userId: string, piId: string, activityId: string, monthIdx: number, defaultValue: number): number => {
  const key = `accomplishment_${year}_${userId}_${piId}_${activityId}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored !== null ? parseInt(stored, 10) : defaultValue;
};

// Helper to get file metadata with year separation
const getSharedFiles = (year: string, userId: string, piId: string, activityId: string, monthIdx: number): MonthFile[] => {
  const key = `files_${year}_${userId}_${piId}_${activityId}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const createMonthsForActivity = (year: string, userId: string, role: UserRole, piId: string, activityId: string, defaultValues: number[]): MonthData[] => {
  const isStation = role === UserRole.STATION;
  const isCHQ = role === UserRole.CHQ;
  const zeroDefaultYears = ['2026', '2025', '2024', '2023'];
  
  return Array.from({ length: 12 }).map((_, mIdx) => {
    let defVal = defaultValues[mIdx] || 0;
    
    // For unit-level dashboards in these years, we always default to 0 accomplishment data.
    if ((zeroDefaultYears.includes(year) && (isStation || isCHQ)) || (year === '2025' && isCHQ)) {
      defVal = 0;
    }
    
    return {
      value: getSharedAccomplishment(year, userId, piId, activityId, mIdx, defVal),
      files: getSharedFiles(year, userId, piId, activityId, mIdx)
    };
  });
};

const getPIDefinitions = (year: string, userId: string, role: UserRole) => {
  const is2026 = year === '2026';
  const is2025 = year === '2025';
  
  const pi1_25_activities = [
    { id: "pi1_25_1", name: "Formulation of Stratcom Snapshots", indicator: "No. of stratcom snaphot formulated", defaults: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    { id: "pi1_25_2", name: "Social Media Analysis", indicator: "No. of Social Media Analysis conducted", defaults: [13, 13, 13, 12, 9, 13, 13, 13, 13, 13, 13, 13] },
    { id: "pi1_25_3", name: "Implementation of IO", indicator: "No. of activities conducted", defaults: [10, 9, 9, 9, 9, 9, 9, 10, 9, 9, 10, 11] },
    { id: "pi1_25_4", name: "Conduct of P.I.C.E.", indicator: "No. of PICE conducted", defaults: [56, 50, 51, 54, 50, 53, 51, 57, 54, 58, 55, 54] },
    { id: "pi1_25_5", name: "Production of Leaflets and handouts as IEC Materials", indicator: "No. of Printed copies", defaults: [790, 691, 688, 757, 688, 721, 789, 688, 645, 766, 307, 688] },
    { id: "pi1_25_6", name: "Production of Outdoor IEC Materials", indicator: "No. of Streamers and Tarpaulins, or LED Wall Displayed", defaults: [23, 23, 24, 25, 23, 25, 25, 23, 24, 24, 29, 28] },
    { id: "pi1_25_7", name: "Face-to-face Awareness Activities", indicator: "No. of Face-to-face Awareness conducted", defaults: [50, 50, 50, 50, 51, 51, 51, 51, 50, 52, 59, 64] },
    { id: "pi1_25_8", name: "Dissemination of related news articles involving the PNP in region for the information of Command Group/Commanders", indicator: "No. of emails and SMS sent", defaults: [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 35, 39] },
    { id: "pi1_25_9", name: "Management of PNP Social Media Pages and Accounts", indicator: "No. of account followers", defaults: [11, 11, 10, 9, 10, 10, 10, 11, 9, 10, 11, 13] },
    { id: "pi1_25_10", name: "Social Media Post Boosting", indicator: "No. of target audience reached", defaults: [552, 511, 517, 570, 551, 660, 680, 644, 647, 557, 681, 712] },
    { id: "pi1_25_11", name: "Social Media Engagement", indicator: "No. of Engagement", defaults: [39, 38, 38, 35, 36, 35, 36, 35, 39, 40, 42, 43] },
    { id: "pi1_25_12", name: "Radio/TV/Live Streaming", indicator: "No. of guesting/show", defaults: [15, 14, 17, 15, 16, 14, 16, 14, 14, 14, 16, 14] },
    { id: "pi1_25_13", name: "Press Briefing", indicator: "No. of Press Briefing to be conducted", defaults: [15, 14, 17, 16, 15, 14, 16, 16, 15, 18, 20, 17] },
    { id: "pi1_25_14", name: "Reproduction and Distribution of GAD-Related IEC Materials", indicator: "No. of copies GAD-Related IEC Materials to be distributed", defaults: [15, 16, 16, 16, 15, 15, 15, 15, 15, 17, 19, 21] },
    { id: "pi1_25_15", name: "Conduct Awareness activity relative to clan/family feuds settlement and conflict resolution and mediation", indicator: "No. of Lectures on Islamic Religious and Cultural Sensitivity to be conducted", defaults: [14, 13, 14, 13, 14, 13, 14, 13, 13, 13, 12, 15] },
    { id: "pi1_25_16", name: "Lectures on Islamic Religious and Cultural Sensitivity", indicator: "No. of Awareness activity relative to clan/family feuds settlement and conflict resolution and mediationto be conducted", defaults: [19, 19, 17, 19, 17, 19, 19, 17, 19, 20, 30, 33] },
    { id: "pi1_25_17", name: "Dialogue on Peacebuilding and Counter Radicalization", indicator: "No. of Dialogue on Peacebuilding and Counter Radicalization to be conducted", defaults: [17, 17, 17, 16, 13, 17, 17, 17, 17, 18, 20, 22] }
  ];

  const baseDefinitions = [
    {
      id: "PI1",
      title: "Number of Community Awareness/Information Activities Initiated",
      activities: is2025 ? pi1_25_activities : (is2026 ? [
        { id: "pi1_26_1", name: "Implementation of Stratcom Snapshots", indicator: "No. of StratCom snapshot formulated", defaults: Array(12).fill(11) },
        { id: "pi1_26_2", name: "Implementation of information Operation (IO) Plans (Non-lethal actions)", indicator: "No. of IO implemented", defaults: Array(12).fill(11) },
        { id: "pi1_26_3", name: "Implementation of counter-Propaganda Strategies", indicator: "No. of counter-Propaganda Strategies activities conducted", defaults: Array(12).fill(11) },
        { id: "pi1_26_4", name: "Conduct of Police Information and Continuing Education (P.I.C.E.)", indicator: "No. of PICE conducted", defaults: Array(12).fill(33) },
        { id: "pi1_26_5", name: "Management of PNP Social Media Pages and Account", indicator: "No. of original contents posted in social media pages and accounts", defaults: Array(12).fill(33) },
        { id: "pi1_26_6", name: "Social Media Post Boosting", indicator: "No. of target audience reached", defaults: Array(12).fill(33) },
        { id: "pi1_26_7", name: "Social Media Engagement", indicator: "No. of Social Media Engagement", defaults: Array(12).fill(33) },
        { id: "pi1_26_8", name: "Provide live news streaming of PNP, projects and activities", indicator: "No. of live news streaming, program, projects and activities conducted", defaults: Array(12).fill(11) },
        { id: "pi1_26_9", name: "Dissemination of the PNP related issuances monitored from QUAD media...", indicator: "No. of forwarded report on Dissemination of the PNP related issuances...", defaults: Array(12).fill(33) },
        { id: "pi1_26_10", name: "Conceptualization Information and Education", indicator: "No. of printed IEC materials distributed", defaults: Array(12).fill(253) },
        { id: "pi1_26_11", name: "Anti-Criminality and Public Safety Awareness Activities", indicator: "No. of Anti-criminality and Public Safety Awareness Activities conducted", defaults: Array(12).fill(11) },
        { id: "pi1_26_12", name: "Radio/TV/Live Streaming", indicator: "No. of Radio/TV/Live Streaming guestings/show conducted", defaults: Array(12).fill(3) },
        { id: "pi1_26_13", name: "Press Briefing", indicator: "No. of press briefing conducted", defaults: Array(12).fill(3) },
        { id: "pi1_26_14", name: "Conduct of FOI awareness activity", indicator: "No. of FOI awareness activities", defaults: Array(12).fill(11) },
        { id: "pi1_26_15", name: "Drug Awareness Activities", indicator: "No. drug awareness activities conducted", defaults: Array(12).fill(11) },
        { id: "pi1_26_16", name: "Conduct of Information Operations Development", indicator: "No. IDO activities conducted", defaults: Array(12).fill(3) }
      ] : pi1_25_activities)
    },
    {
      id: "PI2",
      title: "Number of sectoral groups/BPATs mobilized/organized",
      activities: [
        { id: "pi2_f_1", name: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders activities", indicator: "No. of collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders activities conducted", defaults: [46, 43, 33, 33, 34, 35, 27, 26, 27, 27, 10, 25] }
      ]
    },
    {
      id: "PI3",
      title: "Number of participating respondents",
      activities: [
        { id: "pi3_f_1", name: "Secretariat Meetings", indicator: "No. Secretariat Meetings conducted", defaults: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5] },
        { id: "pi3_f_2", name: "Convening of IO Working Group", indicator: "No. of activities conducted", defaults: [5, 6, 6, 6, 6, 6, 5, 6, 6, 6, 6, 6] },
        { id: "pi3_f_3", name: "Activation of SyncCom during major events", indicator: "No. of activities conducted", defaults: [9, 8, 8, 8, 8, 8, 8, 8, 9, 8, 8, 8] },
        { id: "pi3_f_4", name: "Summing-up on Revitalized-Pulis Sa Barangay (R-PSB)", indicator: "No. of summing-up conducted", defaults: [11, 11, 11, 11, 11, 10, 10, 10, 10, 10, 9, 5] },
        { id: "pi3_f_5", name: "Summing-up on Counter White Area Operations (CWAO)", indicator: "No. of summing-up conducted", defaults: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4] },
        { id: "pi3_f_6", name: "StratCom support to NTF-ELCAC", indicator: "No. of activities conducted", defaults: [0, 2, 4, 2, 5, 4, 2, 5, 3, 4, 21, 17] },
        { id: "pi3_f_7", name: "StratCom and ComRel Support to NTF-DPAGs", indicator: "No. of activities conducted", defaults: [24, 23, 25, 23, 26, 25, 23, 26, 24, 23, 21, 22] },
        { id: "pi3_f_8", name: "StratCom Support to TF-Sanglahi Bravo", indicator: "No. of activities conducted", defaults: [17, 17, 17, 17, 18, 17, 17, 18, 17, 17, 22, 18] },
        { id: "pi3_f_9", name: "TG PCR Operations for Mid-Term Elections", indicator: "No. of activities conducted", defaults: [6, 24, 25, 24, 24, 24, 24, 24, 24, 24, 23, 19] },
        { id: "pi3_f_10", name: "Enhanced Feedback Mechanism thru SMS", indicator: "No. of activities conducted", defaults: [7, 7, 9, 7, 9, 5, 5, 5, 5, 5, 5, 6] },
        { id: "pi3_f_11", name: "PNP Good Deeds", indicator: "No. of PNP Good Deeds", defaults: [17, 14, 11, 14, 17, 12, 15, 12, 15, 14, 15, 14] },
        { id: "pi3_f_12", name: "Conduct dialogue, meetings, and workshops with different audiences", indicator: "No. of activities conducted", defaults: [18, 20, 20, 20, 20, 18, 22, 22, 20, 21, 19, 22] },
        { id: "pi3_f_13", name: "Deployment of SRR team", indicator: "No. of SRR team deployed", defaults: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25] },
        { id: "pi3_f_14", name: "PNP Help and Food Bank Initiatives", indicator: "No. of activities initiated", defaults: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 7] },
        { id: "pi3_f_15", name: "Maintenance and Operationalization of PNP Help Desks (OFW/IP, etc)", indicator: "No of PNP Help Desk Maintained and Complaint/s or Referrals", defaults: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6] },
        { id: "pi3_f_16", name: "PNP Advocacy Support Groups and Force Multipliers (KKDAT, KALIGKASAN, KASIMBAYANAN, etc)", indicator: "No. of support activities conducted", defaults: [10, 10, 10, 10, 10, 11, 11, 11, 11, 11, 13, 14] },
        { id: "pi3_f_17", name: "Inter-Agency Cooperation on Anti-Illegal Drugs", indicator: "No. of inter-agency activities conducted", defaults: [17, 17, 17, 18, 17, 17, 17, 18, 17, 16, 19, 17] },
        { id: "pi3_f_18", name: "Recovery and Wellness Program", indicator: "No. of activities conducted", defaults: [8, 7, 7, 7, 8, 7, 7, 8, 8, 6, 7, 7] },
        { id: "pi3_f_19", name: "Drug Awareness Activities", indicator: "No. of activities conducted", defaults: [9, 9, 9, 9, 9, 9, 10, 8, 9, 9, 7, 6] },
        { id: "pi3_f_20", name: "Support to Barangay Drug Clearing Program", indicator: "No. of activities conducted", defaults: [15, 15, 15, 16, 15, 15, 16, 15, 15, 15, 15, 14] },
        { id: "pi3_f_21", name: "Coordination, Implementation and monitoring of the Interfaith Squad System", indicator: "No. of activities conducted", defaults: [21, 22, 22, 22, 22, 19, 22, 23, 22, 21, 19, 22] },
        { id: "pi3_f_22", name: "National Day of Remembrance for SAF 44", indicator: "No. of activities conducted", defaults: [10, 8, 8, 8, 9, 8, 8, 8, 8, 8, 8, 8] },
        { id: "pi3_f_23", name: "EDSA People's Power Anniversary", indicator: "No. of activities conducted", defaults: [9, 10, 9, 9, 9, 9, 9, 9, 9, 8, 9, 9] },
        { id: "pi3_f_24", name: "Philippine Independence Day", indicator: "No. of activities conducted", defaults: [13, 13, 13, 13, 13, 15, 13, 14, 13, 13, 12, 13] },
        { id: "pi3_f_25", name: "National Heroes Day", indicator: "No. of activities conducted", defaults: [5, 4, 4, 4, 7, 4, 4, 4, 5, 4, 4, 4] },
        { id: "pi3_f_26", name: "National Flag Day", indicator: "No. of activities conducted", defaults: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 8] },
        { id: "pi3_f_27", name: "National Crime Prevention Week (NCPW)", indicator: "No of adopted KASIMBAYANAN", defaults: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9] },
        { id: "pi28_f_28", name: "Celebration of National Women's Month", indicator: "No. of activities conducted", defaults: [5, 4, 4, 4, 7, 4, 4, 4, 4, 5, 4, 4] },
        { id: "pi28_f_29", name: "18-Day Campaign to End-VAWC", indicator: "No. of activities conducted", defaults: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5] },
        { id: "pi28_f_30", name: "National Children's Month", indicator: "No. of activities conducted", defaults: [6, 6, 6, 6, 6, 6, 6, 7, 6, 6, 6, 7] }
      ]
    },
    {
      id: "PI4",
      title: "Percentage of accounted loose firearms against the estimated baseline data",
      activities: [
        { id: "pi4_f_1", name: "JAPIC", indicator: "JAPIC conducted", defaults: [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
        { id: "pi4_f_2", name: "Operations on loose firearms", indicator: "Operations on loose firearms conducted", defaults: [3, 4, 5, 3, 2, 2, 4, 0, 8, 3, 7, 3] },
        { id: "pi4_f_3", name: "Bakal/Sita", indicator: "Bakal/Sita conducted", defaults: [796, 768, 794, 754, 794, 784, 761, 763, 754, 754, 574, 583] }
      ]
    },
    {
      id: "PI5",
      title: "Number of functional LACAP",
      activities: [
        { id: "pi5_f_1", name: "P/CPOC meetings", indicator: "# P/CPOC meetings participated", defaults: [12, 13, 10, 11, 10, 8, 8, 8, 8, 12, 10, 11] },
        { id: "pi5_f_2", name: "Oversight Committee Meetings", indicator: "# of Oversight Committee Meetings conducted", defaults: [52, 53, 49, 43, 43, 38, 38, 35, 35, 43, 39, 39] },
        { id: "pi5_f_3", name: "Maintenance of AIDMC", indicator: "# of AIDMC maintained", defaults: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        { id: "pi5_f_4", name: "operations against highway robbery", indicator: "# of opns against highway robbery conducted", defaults: [2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1] },
        { id: "pi5_f_5", name: "anti-bank robbery operations", indicator: "# of anti-bank robbery opns conducted", defaults: [4, 3, 3, 3, 2, 4, 1, 3, 4, 3, 4, 0] },
        { id: "pi5_f_6", name: "operations against OCGs/PAGs", indicator: "# of opns against OCGs/PAGs conducted", defaults: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0] },
        { id: "pi5_f_7", name: "operations against kidnapping", indicator: "# of opns against kidnapping conducted", defaults: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0] },
        { id: "pi5_f_8", name: "operations against carnapping", indicator: "# of operations against carnapping conducted", defaults: [3, 2, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0] },
        { id: "pi5_f_9", name: "operations against illegal gambling", indicator: "# of operations against illegal gambling conducted", defaults: [5, 7, 9, 11, 10, 6, 11, 9, 10, 9, 10, 10] },
        { id: "pi5_f_10", name: "operations against illegal fishing", indicator: "# of operations against illegal fishing conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi5_f_11", name: "operations against illegal logging", indicator: "# of operations against illegal logging conducted", defaults: [0, 1, 1, 1, 1, 0, 2, 2, 2, 1, 1, 3] },
        { id: "pi5_f_12", name: "operations on anti-illegal drugs", indicator: "# of operations on anti-illegal drugs conducted", defaults: [61, 57, 53, 53, 49, 45, 58, 46, 56, 59, 49, 60] }
      ]
    },
    {
      id: "PI6",
      title: "Number of police stations utilizing PIPS",
      activities: [
        { id: "pi6_f_1", name: "EMPO Assessment and Evaluations", indicator: "No. of EMPO Assessment and Evaluations conducted", defaults: [54, 57, 58, 58, 53, 53, 53, 53, 53, 53, 53, 49] },
        { id: "pi6_f_2", name: "Field/sector inspection", indicator: "No. of Field/sector inspection conducted", defaults: [140, 138, 138, 138, 138, 138, 138, 138, 138, 138, 138, 138] }
      ]
    },
    {
      id: "PI7",
      title: "Number of Internal Security Operations conducted",
      activities: [
        { id: "pi7_f_1", name: "Oversight Committee Meetings", indicator: "Oversight Committee Meetings on ISO conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi7_f_2", name: "JPSCC meetings", indicator: "JPSCC meetings conducted", defaults: [4, 4, 4, 4, 5, 4, 4, 4, 4, 4, 3, 4] },
        { id: "pi7_f_3", name: "Major LEO", indicator: "Major LEO conducted", defaults: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi7_f_4", name: "Minor LEO", indicator: "Minor LEO conducted", defaults: [2, 0, 0, 0, 2, 1, 1, 0, 0, 0, 0, 0] },
        { id: "pi7_f_5", name: "PPSP", indicator: "PPSP conducted", defaults: [31, 31, 31, 30, 30, 30, 30, 30, 30, 31, 30, 31] },
        { id: "pi7_f_6", name: "Clearing operations in support to AFP territorial units", indicator: "Clearing operations in support to AFP territorial units conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      ]
    },
    {
      id: "PI8",
      title: "Number of target hardening measures conducted",
      activities: [
        { id: "pi8_f_1", name: "Security Survey/Inspection", indicator: "# of Security Survey/Inspection conducted", defaults: [2, 0, 2, 2, 2, 2, 4, 2, 3, 2, 6, 2] },
        { id: "pi8_f_2", name: "CI check/validation", indicator: "# of CI check/validation conducted", defaults: [22, 22, 16, 16, 19, 19, 18, 16, 21, 25, 7, 13] },
        { id: "pi8_f_3", name: "CI monitoring", indicator: "# CI monitoring conducted", defaults: [14, 12, 5, 5, 5, 4, 6, 5, 8, 21, 7, 13] },
        { id: "pi8_f_4", name: "Clearances issued to civilians", indicator: "# of Clearances issued to civilians", defaults: [6216, 4481, 3938, 3113, 3556, 3869, 3344, 2259, 4236, 2314, 1552, 705] },
        { id: "pi8_f_5", name: "Clearances issued to PNP/AFP per", indicator: "# of Clearances issued to PNP/AFP per", defaults: [48, 53, 4, 148, 23, 16, 23, 64, 6, 19, 25, 38] },
        { id: "pi8_f_6", name: "Threat assessment", indicator: "# of Threat assessment conducted", defaults: [1, 2, 2, 4, 2, 2, 2, 2, 2, 0, 2, 0] },
        { id: "pi8_f_7", name: "Recruitment/maintenance of FNKN", indicator: "# of Recruitment/maintenance of FNKN", defaults: [0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0] },
        { id: "pi8_f_8", name: "Communications with FNKN", indicator: "# of Communications with FNKN", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi8_f_9", name: "Monitoring of cases/incidents involving foreign nationals", indicator: "# of Monitoring of cases/incidents involving foreign nationals", defaults: [1, 0, 0, 0, 2, 1, 3, 2, 1, 0, 0, 0] },
        { id: "pi8_f_10", name: "SO during national events", indicator: "# of SO during national events conducted", defaults: [19, 19, 36, 17, 15, 15, 13, 17, 14, 14, 0, 696] },
        { id: "pi8_f_11", name: "Security to vital installations", indicator: "# of Security to vital installations conducted", defaults: [52, 50, 51, 47, 48, 47, 48, 47, 48, 48, 0, 167] },
        { id: "pi8_f_12", name: "VIP security protection", indicator: "# of VIP security protection", defaults: [31, 35, 24, 15, 19, 46, 53, 58, 50, 58, 0, 131] },
        { id: "pi8_f_13", name: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders re Muslim Affairs", indicator: "# of collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders re Muslim Affairs conducted", defaults: [8, 6, 9, 9, 11, 6, 5, 5, 5, 5, 5, 10] },
        { id: "pi8_f_14", name: "Medical and Dental outreach and other Similar Activities in Muslim Community", indicator: "# of Medical and Dental outreach and other Similar Activities in Muslim Community conducted", defaults: [5, 2, 8, 5, 7, 2, 1, 1, 4, 1, 1, 1] },
        { id: "pi8_f_15", name: "Awareness activity relative to clan/family feuds settlement and conflict resolution and mediation", indicator: "# of Awareness activity relative to clan/family feuds settlement and conflict resolution and mediation Conduct", defaults: [7, 6, 6, 6, 6, 6, 6, 6, 9, 6, 6, 5] },
        { id: "pi8_f_16", name: "Conduct prayer rallies, peace covenant signing, peace caravan, and other peacebuilding-related activity like sports activity", indicator: "Conduct prayer rallies, peace covenant signing, peace caravan, and other peacebuilding-related activity like sports activity", defaults: [2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
        { id: "pi8_f_17", name: "Strengthening of Salaam Force Multipliers/Salaam Police Advocacy Groups (SPAG)", indicator: "Strengthening of Salaam Force Multipliers/Salaam Police Advocacy Groups (SPAG)", defaults: [8, 8, 11, 8, 8, 8, 8, 8, 8, 8, 8, 7] },
        { id: "pi8_f_18", name: "Peace and PCVE training for Muslim Scholars", indicator: "Peace and PCVE training for Muslim Scholars", defaults: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4] },
        { id: "pi8_f_19", name: "Understanding PCVE for BJMP Personnel", indicator: "Understanding PCVE for BJMP Personnel", defaults: [560, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi8_f_20", name: "PNP Custodial Facility Visitation and Counseling of Muslim and Non-Muslim Person's Deprived of Liberty with TRC's", indicator: "PNP Custodial Facility Visitation and Counseling of Muslim and Non-Muslim Person's Deprived of Liberty with TRC's", defaults: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5] },
        { id: "pi8_f_21", name: "Open-house visitation of Masjid and Madrasah", indicator: "Open-house visitation of Masjid and Madrasah", defaults: [20, 18, 17, 15, 17, 15, 19, 15, 20, 28, 20, 21] },
        { id: "pi8_f_22", name: "Masjid and Madrasah Visitation (No. 22)", indicator: "Masjid and Madrasah Visitation", defaults: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 3] },
        { id: "pi8_f_23", name: "Masjid and Madrasah Visitation (No. 23)", indicator: "Masjid and Madrasah Visitation", defaults: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9] },
        { id: "pi8_f_24", name: "# of Security opns during rallies/demonstrations conducted", indicator: "# of Security opns during rallies/demonstrations conducted", defaults: [5, 0, 0, 0, 0, 0, 0, 0, 15, 0, 3, 1] },
        { id: "pi8_f_25", name: "# of K9 patrols conducted", indicator: "# of K9 patrols conducted", defaults: [31, 41, 44, 38, 26, 43, 49, 56, 64, 45, 74, 68] },
        { id: "pi8_f_26", name: "# of seaborne patrols conducted", indicator: "# of seaborne patrols conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi8_f_27", name: "# of EOD counter measures conducted", indicator: "# of EOD counter measures conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi8_f_28", name: "# of BI conducted", indicator: "# of BI conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 37, 42] },
        { id: "pi8_f_29", name: "# of record check conducted", indicator: "# of record check conducted", defaults: [7, 8, 11, 9, 10, 18, 16, 12, 11, 14, 37, 42] },
        { id: "pi8_f_30", name: "# of CI opns conducted", indicator: "# of CI opns conducted", defaults: [9, 12, 16, 15, 15, 24, 19, 19, 18, 17, 7, 27] },
        { id: "pi8_f_31", name: "# of SIMEX conducted", indicator: "# of SIMEX conducted", defaults: [67, 69, 67, 67, 67, 66, 67, 68, 69, 76, 66, 94] },
        { id: "pi8_f_32", name: "# of scty opns during local events conducted", indicator: "# of scty opns during local events conducted", defaults: [19, 19, 12, 11, 10, 14, 11, 50, 10, 9, 6, 12] },
        { id: "pi8_f_33", name: "# of beat/foot patrols conducted", indicator: "# of beat/foot patrols conducted", defaults: [6156, 6146, 6145, 6139, 6142, 6136, 6155, 6154, 6120, 6141, 5520, 5726] },
        { id: "pi8_f_34", name: "# of bike patrols conducted", indicator: "# of bike patrols conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi8_f_35", name: "# of horse-riding patrols conducted", indicator: "# of horse-riding patrols conducted", defaults: [11, 6, 2, 4, 1, 2, 12, 2, 3, 19, 0, 0] },
        { id: "pi8_f_36", name: "# of mobile patrols conducted", indicator: "# of mobile patrols conducted", defaults: [643, 629, 643, 630, 643, 630, 643, 643, 630, 643, 573, 639] },
        { id: "pi8_f_37", name: "# of checkpoints conducted", indicator: "# of checkpoints conducted", defaults: [675, 659, 718, 712, 676, 690, 729, 678, 717, 748, 673, 787] }
      ]
    },
    {
      id: "PI9",
      title: "Percentage reduction of crimes involving foreign and domestic tourists",
      activities: [
        { id: "pi9_f_1", name: "Maintenance of TPU", indicator: "# of TPU maintained", defaults: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        { id: "pi9_f_2", name: "Maintenance of TAC", indicator: "# of TAC maintained", defaults: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        { id: "pi9_f_3", name: "Maintenance of TAD", indicator: "# of TAD maintained", defaults: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3] }
      ]
    },
    {
      id: "PI10",
      title: "Number of Police stations using COMPSTAT for crime prevention",
      activities: [
        { id: "pi10_f_1", name: "Crime Information Reporting and Analysis System", indicator: "No. of Crime Information Reporting and Analysis System data recorded", defaults: [282, 299, 327, 324, 284, 253, 310, 330, 314, 313, 267, 278] },
        { id: "pi10_f_2", name: "e-Wanted Persons Information System", indicator: "No. of Wanted Persons recorded", defaults: [48, 104, 111, 67, 102, 83, 180, 92, 89, 137, 106, 69] },
        { id: "pi10_f_3", name: "e-Rogues' Gallery System", indicator: "No. of eRogues recorded", defaults: [163, 185, 178, 179, 149, 157, 207, 169, 192, 216, 203, 151] },
        { id: "pi10_f_4", name: "e-Rogues' Maintenance (3rd Qtr or as needed)", indicator: "No. of e-Rogues' Maintened (3rd Qtr or as needed)", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi10_f_5", name: "e-Subpoena System", indicator: "No. of Subpoena recorded", defaults: [9, 8, 29, 29, 16, 16, 25, 25, 28, 21, 27, 24] },
        { id: "pi10_f_6", name: "Proper encoding in CIDMS", indicator: "No. of CIDMS encoded", defaults: [7, 14, 12, 9, 4, 0, 0, 0, 0, 0, 0, 0] }
      ]
    },
    {
      id: "PI11",
      title: "Number of threat group neutralized",
      activities: [
        { id: "pi11_f_1", name: "COPLANs formulated", indicator: "COPLANs formulated", defaults: [0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0] },
        { id: "pi11_f_2", name: "COPLANs implemented", indicator: "COPLANs implemented", defaults: [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0] },
        { id: "pi11_f_3", name: "HVT reports submitted", indicator: "HVT reports submitted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0] },
        { id: "pi11_f_4", name: "information purchased", indicator: "information purchased", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi11_f_5", name: "OCG/CG pers neutralized", indicator: "OCG/CG pers neutralized", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi11_f_6", name: "HVTs newly identified", indicator: "HVTs newly identified", defaults: [3, 2, 1, 3, 3, 3, 1, 1, 7, 0, 2, 1] },
        { id: "pi11_f_7", name: "HVTs neutralized", indicator: "HVTs neutralized", defaults: [3, 3, 3, 5, 4, 4, 3, 1, 10, 0, 4, 4] },
        { id: "pi11_f_8", name: "PAG personalities neutralized", indicator: "PAG personalities neutralized", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 74] },
        { id: "pi11_f_9", name: "IRs (criminality) for validation referred", indicator: "IRs (criminality) for validation referred", defaults: [45, 47, 39, 41, 50, 38, 36, 42, 78, 0, 71, 0] },
        { id: "pi11_f_10", name: "Oversight Committee Meetings conducted", indicator: "Oversight Committee Meetings conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi11_f_11", name: "PICs conducted", indicator: "PICs conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi11_f_12", name: "IRs processed", indicator: "IRs processed", defaults: [45, 47, 39, 41, 50, 38, 36, 42, 78, 0, 82, 78] },
        { id: "pi11_f_13", name: "IRs validated", indicator: "IRs validated", defaults: [45, 47, 39, 41, 50, 38, 36, 42, 78, 0, 82, 78] },
        { id: "pi11_f_14", name: "compliances received and filed", indicator: "compliances received and filed", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi11_f_15", name: "HVTs arrested/neutralized", indicator: "HVTs arrested/neutralized", defaults: [3, 3, 3, 5, 4, 4, 3, 1, 10, 0, 4, 4] },
        { id: "pi11_f_16", name: "IFCs maintained", indicator: "IFCs maintained", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi11_f_17", name: "Periodic Reports on Organized Threat Groups produced", indicator: "Periodic Reports on Organized Threat Groups produced", defaults: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        { id: "pi11_f_18", name: "assessment reports submitted", indicator: "assessment reports submitted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13] },
        { id: "pi11_f_19", name: "intel products disseminated/utilized", indicator: "intel products disseminated/utilized", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi11_f_20", name: "debriefings conducted", indicator: "debriefings conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi11_f_21", name: "Interviews conducted", indicator: "Interviews conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5] },
        { id: "pi11_f_22", name: "elicitations conducted", indicator: "elicitations conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3] }
      ]
    },
    {
      id: "PI12",
      title: "Number of utilized BINs",
      activities: [
        { id: "pi12_f_1", name: "# of inventory made", indicator: "# of inventory made", defaults: [20, 20, 20, 20, 20, 31, 38, 43, 58, 59, 57, 51] },
        { id: "pi12_f_2", name: "# of assessment/ratings made", indicator: "# of assessment/ratings made", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi12_f_3", name: "# of directives disseminated", indicator: "# of directives disseminated", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi12_f_4", name: "# of BINs documented/registered and maintained", indicator: "# of BINs documented/registered and maintained", defaults: [20, 20, 20, 20, 20, 31, 38, 43, 58, 59, 57, 51] },
        { id: "pi12_f_5", name: "# of IRs prepared and submitted", indicator: "# of IRs prepared and submitted", defaults: [45, 57, 39, 41, 50, 38, 36, 42, 78, 0, 82, 0] }
      ]
    },
    {
      id: "PI13",
      title: "Number of criminal cases filed",
      activities: [
        { id: "pi13_f_1", name: "# of coordination with counterparts conducted", indicator: "# of coordination with counterparts conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi13_f_2", name: "# of court hearing or Duty on filed cases attended", indicator: "# of court hearing or Duty on filed cases attended", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi13_f_3", name: "# of coordination made on COLA cases conducted", indicator: "# of coordination made on COLA cases conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi13_f_4", name: "No. Of IEC materials distributed", indicator: "No. Of IEC materials distributed", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      ]
    },
    {
      id: "PI14",
      title: "Number of cases resulting to conviction/dismissal",
      activities: [
        { id: "pi14_f_1", name: "Monitoring Cases Against Threat Group", indicator: "Monitoring Cases Against Threat Group", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi14_f_2", name: "Attend or Initiate Case Conference", indicator: "Attend or Initiate Case Conference", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi14_f_3", name: "Monitoring of Filed Cases", indicator: "Monitoring of Filed Cases", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi14_f_4", name: "Liaising with other Pillars of Criminal Justice System", indicator: "Liaising with other Pillars of Criminal Justice System", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      ]
    },
    {
      id: "PI15",
      title: "Percentage of Trained investigative personnel/ Percentage of certified investigative personnel",
      activities: [
        { id: "pi15_f_1", name: "CIC", indicator: "CIC", defaults: [90, 87, 89, 89, 90, 93, 94, 97, 97, 93, 90, 90] },
        { id: "pi15_f_2", name: "IOBC", indicator: "IOBC", defaults: [15, 15, 13, 13, 14, 14, 14, 13, 13, 13, 13, 13] }
      ]
    },
    {
      id: "PI16",
      title: "Percentage of investigative positions filled up with trained investigators",
      activities: [
        { id: "pi16_f_1", name: "Screening and evaluation of candidates for certified investigators conducted", indicator: "# of screening and evaluation of candidates for certified investigators conducted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      ]
    },
    {
      id: "PI17",
      title: "Improvement in response time",
      activities: [
        { id: "pi17_f_1", name: "Sports supervision and training component", indicator: "No. of Sports supervision and training component conducted", defaults: Array(12).fill(0) },
        { id: "pi17_f_2", name: "Sports competition component", indicator: "No. of Sports competition component conducted", defaults: Array(12).fill(0) },
        { id: "pi17_f_3", name: "Crime prevention sports component", indicator: "No. of Crime prevention sports component conducted", defaults: Array(12).fill(0) },
        { id: "pi17_f_4", name: "Physical Conditioning and Combat Sport", indicator: "No. of Physical Conditioning and Combat Sport conducted", defaults: Array(12).fill(0) },
        { id: "pi17_f_5", name: "Reporting operational accomplishments (POMIS)", indicator: "No. of incidents operational accomplishments... (POMIS) reported", defaults: Array(12).fill(0) }
      ]
    },
    {
      id: "PI18",
      title: "Percentage of dedicated investigators assigned to handle specific cases",
      activities: [
        { id: "pi18_f_1", name: "Conduct case build up and investigation for filing of cases", indicator: "Conduct case build up and investigation for filing of cases", defaults: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100] }
      ]
    },
    {
      id: "PI19",
      title: "Number of recipients of a. awards b. punished",
      activities: [
        { id: "pi19_f_1", name: "Monday Flag Raising/Awarding Ceremony", indicator: "# of Monday Flag Raising/Awarding Ceremony conducted", defaults: [3, 4, 5, 4, 3, 5, 4, 3, 4, 4, 4, 4] },
        { id: "pi19_f_2", name: "Issuing commendations", indicator: "# of commendations issued", defaults: [181, 115, 226, 66, 13, 16, 19, 19, 0, 172, 232, 149] },
        { id: "pi19_f_3", name: "Pre-Charge Investigation (PCI)", indicator: "# of PCE/I conducted: Conduct of Pre-Charge Investigation (PCI)", defaults: [1, 4, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0] }
      ]
    },
    {
      id: "PI20",
      title: "Percentage of investigative personnel equipped with standard investigative systems and procedures",
      activities: [
        { id: "pi20_f_1", name: "Attendance in specialized training and related seminar on investigation for enhancement of investigative personnel", indicator: "No. of specialized training and related seminar on investigation for enhancement of investigative personnel attended", defaults: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100] }
      ]
    },
    {
      id: "PI21",
      title: "Percentage of Police Stations using e-based system",
      activities: [
        { id: "pi21_f_1", name: "Crime Information Reporting and Analysis System", indicator: "No. of Crime Information Reporting and Analysis System recorded", defaults: [282, 299, 327, 324, 284, 253, 310, 330, 314, 313, 267, 278] },
        { id: "pi21_f_2", name: "e-Wanted Persons Information System", indicator: "No. of e-Wanted Persons recorded", defaults: [48, 104, 111, 67, 102, 83, 180, 92, 89, 137, 106, 67] },
        { id: "pi21_f_3", name: "e-Rogues' Gallery System", indicator: "No. of e-Rogues' Gallery System recorded", defaults: [163, 185, 178, 179, 149, 157, 207, 169, 192, 216, 203, 151] },
        { id: "pi21_f_4", name: "e-Rogues' Maintenance (3rd Qtr or as needed)", indicator: "No of e-Rogues' Maintened (3rd Qtr or as needed)", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi21_f_5", name: "e-Subpoena System", indicator: "No. of e-Subpoena System recorded", defaults: [9, 8, 29, 29, 16, 16, 25, 25, 28, 21, 27, 24] },
        { id: "pi21_f_6", name: "Proper encoding in CIDMS", indicator: "No. of CIDMS recorded", defaults: [7, 14, 12, 9, 4, 0, 0, 0, 0, 0, 0, 0] }
      ]
    },
    {
      id: "PI22",
      title: "Number of cases filed in court/total # of cases investigated",
      activities: [
        { id: "pi22_f_1", name: "Index Crime", indicator: "No. Of Index Crime Investigated", defaults: [39, 27, 35, 36, 22, 31, 36, 30, 25, 35, 28, 19] },
        { id: "pi22_f_2", name: "Index Crime", indicator: "No. Of Index Crime Filed", defaults: [38, 27, 34, 35, 22, 31, 34, 27, 22, 25, 22, 16] },
        { id: "pi22_f_3", name: "Non-Index crime", indicator: "No. Of Non-Index crime investigated", defaults: [37, 36, 34, 12, 26, 25, 17, 29, 19, 144, 161, 165] },
        { id: "pi22_f_4", name: "Cases filing on Non-Index", indicator: "No. of cases filed on Non-Index", defaults: [37, 36, 34, 12, 24, 25, 16, 28, 18, 128, 142, 136] },
        { id: "pi22_f_5", name: "Investigation on RIR", indicator: "No. of investigation conducted on RIR", defaults: [110, 115, 159, 160, 139, 115, 137, 173, 166, 134, 78, 94] },
        { id: "pi22_f_6", name: "Cases filing on RIR", indicator: "No. of cases filed on RIR", defaults: [107, 114, 157, 157, 135, 107, 127, 161, 132, 96, 50, 44] }
      ]
    },
    {
      id: "PI23",
      title: "Number of investigative infrastructure/equipment identified/accounted",
      activities: [
        { id: "pi23_f_1", name: "Inventory, inspection & Accounting", indicator: "# of Inventory, inspection & Accounting conducted", defaults: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }
      ]
    },
    {
      id: "PI24",
      title: "Percentage of fill-up of investigative equipment and infrastructure",
      activities: [
        { id: "pi24_f_1", name: "Field investigative crime scene kit", indicator: "No. of Field investigative crime scene kit accounted", defaults: [21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21] },
        { id: "pi24_f_2", name: "Police line", indicator: "No. of Police line accounted", defaults: [45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45] },
        { id: "pi24_f_3", name: "Police Blotter", indicator: "No. of Police Blotter accounted", defaults: [21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21] },
        { id: "pi24_f_4", name: "Digital Camera", indicator: "No. of Digital Camera accounted", defaults: [24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24] },
        { id: "pi24_f_5", name: "Video Camera", indicator: "No. of Video Camera accounted", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      ]
    },
    {
      id: "PI25",
      title: "Percentage of IT- compliant stations",
      activities: [
        { id: "pi25_f_1", name: "computer preventive maintenance and trouble shootings", indicator: "# of computer preventive maintenance and trouble shootings conducted", defaults: [205, 205, 205, 205, 205, 211, 211, 211, 211, 211, 211, 211] },
        { id: "pi25_f_2", name: "Maintenance of printers", indicator: "# of printers maintained", defaults: [95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95] },
        { id: "pi25_f_3", name: "Internet payment", indicator: "# of computer internet paid", defaults: [28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28] },
        { id: "pi25_f_4", name: "Telephone payment bills", indicator: "# of telephone bills paid", defaults: [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11] },
        { id: "pi25_f_5", name: "cell phone payment bills", indicator: "# of cell phone bills paid", defaults: [39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39] }
      ]
    },
    {
      id: "PI26",
      title: "Number of linkages established",
      activities: [
        { id: "pi26_f_1", name: "JSCC meetings", indicator: "No. of JSCC meetings conducted", defaults: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        { id: "pi26_f_2", name: "Liaising", indicator: "No. of liaising conducted", defaults: [21, 23, 21, 16, 14, 14, 14, 13, 13, 13, 14, 15] },
        { id: "pi26_f_3", name: "coordination", indicator: "No. of coordination conducted", defaults: [10, 14, 15, 10, 13, 12, 12, 12, 11, 12, 11, 11] }
      ]
    },
    {
      id: "PI27",
      title: "Number of community/ stakeholders support generated",
      activities: [
        { id: "pi27_f_1", name: "Memorandum of Agreement (MOA)/Memorandum of Understanding (MOU) signing", indicator: "No. of Memorandum of Agreement (MOA)/Memorandum of Understanding (MOU) signing initiated", defaults: [9, 9, 10, 9, 9, 10, 9, 9, 9, 9, 10, 10] },
        { id: "pi27_f_2", name: "Support to \"Makakalikasan\" activities (Tree planting clean-up, etc)", indicator: "No. of Support to \"Makakalikasan\" activities (Tree planting clean-up, etc) conducted", defaults: [7, 6, 7, 9, 6, 7, 6, 10, 9, 8, 6, 6] },
        { id: "pi27_f_3", name: "Support to bloodletting activity", indicator: "No of Support to bloodletting activity conducted", defaults: [3, 6, 7, 5, 5, 3, 5, 5, 8, 4, 6, 5] },
        { id: "pi27_f_4", name: "Coordination with Other Government Agencies (GA) /Government Organizations (GO)", indicator: "No. of Other Government Agencies (GA) /Government Organizations (GO) coordinated", defaults: [9, 9, 9, 9, 9, 8, 8, 9, 8, 9, 8, 15] }
      ]
    },
    {
      id: "PI28",
      title: "Number of investigative activities funded",
      activities: [
        { id: "pi28_f_1", name: "monitoring of Investigation of Heinous and Sensational Crimes", indicator: "No. of monitored Investigation of Heinous and Sensational Crimes", defaults: [4, 0, 6, 4, 0, 4, 1, 2, 0, 1, 0, 6] },
        { id: "pi28_f_2", name: "Filing of Heinous and Sensational Crimes", indicator: "No. of Heinous and Sensational Crimes Case Filed", defaults: [4, 0, 6, 4, 0, 4, 1, 2, 0, 1, 0, 3] },
        { id: "pi28_f_3", name: "Monitoring and Investigation of Violation of Specials laws", indicator: "No. of Investigation of Violation of Specials laws monitored", defaults: [96, 121, 99, 116, 97, 82, 120, 98, 104, 125, 137, 147] },
        { id: "pi28_f_4", name: "Filing of Violation of Specials laws", indicator: "No. Case Filed of Violation of Specials laws", defaults: [96, 121, 98, 116, 97, 82, 117, 97, 99, 110, 122, 121] },
        { id: "pi28_f_5", name: "Monitoring and Investigation Referred Cases", indicator: "No. of monitored Investigation Referred Cases", defaults: [40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 159, 226] },
        { id: "pi28_f_6", name: "Conducting cold case review for major cases", indicator: "No. of conducted cold case review for major cases", defaults: [40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40] },
        { id: "pi28_f_7", name: "Reviewing of dismissed cases on illegal drugs, heinous and sensational cases reviewed", indicator: "No. of dismissed cases on illegal drugs, heinous and sensational cases reviewed", defaults: [40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40] },
        { id: "pi28_f_8", name: "Reviewing of Death Incidents", indicator: "No. of Death Incidents reviewed", defaults: [40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40] },
        { id: "pi28_f_9", name: "Case Review of WCPC Cases", indicator: "No. of Case Review of WCPC conducted", defaults: [0, 1, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi28_f_10", name: "Conduct of Rescue Operations & Extend Special Protection to Victims", indicator: "No. of Rescue Operations & Extend Special Protection to Victims conducted", defaults: [2, 1, 3, 2, 3, 3, 2, 2, 0, 7, 0, 2] },
        { id: "pi28_f_11", name: "Administer Mediation & Perform Initial Counseling Between on Domestic Violence Cases (No. of counseling conducted)", indicator: "No of Administer Mediation & Perform Initial Counseling Between on Domestic Violence Cases (No. of counseling conducted)", defaults: [5, 0, 1, 3, 0, 0, 0, 2, 0, 2, 0, 2] },
        { id: "pi28_f_12", name: "Maintain Closer Partnership and Liaising w/ RIACAT, IACVAWC, IACAP, UN Agencies and other Stakeholders", indicator: "No of liaising /coordination conducted on Maintain Closer Partnership and Liaising w/ RIACAT, IACVAWC, IACAP, UN Agencies and other Stakeholders", defaults: [13, 13, 13, 13, 13, 14, 13, 13, 13, 13, 13, 16] },
        { id: "pi28_f_13", name: "Investigation/case referral/monitoring of WCPC Cases conducted", indicator: "No. of Investigation/case referral/monitoring of WCPC Cases conducted", defaults: [27, 14, 24, 21, 20, 26, 24, 24, 25, 25, 35, 13] },
        { id: "pi28_f_14", name: "Investigation/case referral/monitoring of WCPC Cases referred", indicator: "No. of Investigation/case referral/monitoring of WCPC Cases referred", defaults: [11, 9, 13, 16, 11, 16, 13, 12, 10, 13, 20, 8] },
        { id: "pi28_f_15", name: "Conduct follow-up investigation of WCPD Cases", indicator: "No. of follow-up investigation of WCPD Cases conducted", defaults: [1, 1, 0, 1, 1, 2, 1, 2, 2, 4, 0, 2] },
        { id: "pi28_f_16", name: "Filing of cases against identified and/or neutralized suspects of WCPD cases", indicator: "No. of cases against identified and/or neutralized suspects of WCPD cases filed", defaults: [30, 15, 24, 24, 20, 26, 23, 28, 20, 29, 35, 15] },
        { id: "pi28_f_17", name: "Initiate community advocacy campaign to combat TIP/CICL/CAAC/VAWC", indicator: "No. of community advocacy campaign to combat TIP/CICL/CAAC/VAWC Initiated", defaults: [66, 56, 51, 56, 56, 51, 48, 49, 48, 41, 32, 33] },
        { id: "pi28_f_18", name: "Administer distribution of PNP Manual on Investigation of Trafficking in Person (Nr. of PNP manuals distributed) (1st Qtr only)", indicator: "No. of distribution of PNP Manual on Investigation of Trafficking in Person Administered (PNP manuals distributed) (1st Qtr only)", defaults: [0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      ]
    },
    {
      id: "PI29",
      title: "Number of special investigation cases requested for fund support",
      activities: [
        { id: "pi29_f_1", name: "Creation and activation of SITG Cases", indicator: "# of SITG Cases Created and Activated", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0] },
        { id: "pi29_f_2", name: "Creation of CIPLAN", indicator: "# of CIPLAN created", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0] }
      ]
    }
  ];

  const storedCustomPIsStr = localStorage.getItem(`custom_pi_definitions_${year}`);
  const customPIs = storedCustomPIsStr ? JSON.parse(storedCustomPIsStr) : [];
  
  let allDefinitions = [...baseDefinitions, ...customPIs];

  // Apply custom order if it exists
  const storedOrder = localStorage.getItem(`pi_order_${year}`);
  if (storedOrder) {
    const orderIds = JSON.parse(storedOrder);
    allDefinitions = allDefinitions.sort((a, b) => {
      const aIdx = orderIds.indexOf(a.id);
      const bIdx = orderIds.indexOf(b.id);
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  }

  return allDefinitions.map(pi => {
    const unitSpecificIdsKey = `pi_activity_ids_${year}_${userId}_${pi.id}`;
    const globalIdsKey = `pi_activity_ids_${year}_${pi.id}`;
    
    const unitSpecificIds = localStorage.getItem(unitSpecificIdsKey);
    const globalIds = localStorage.getItem(globalIdsKey);
    
    // Independence logic: If viewing CHQ 2023, 2025, or 2026, we prioritize local unit activities to prevent leaking changes.
    let activityIds;
    if ((year === '2023' || year === '2025' || year === '2026') && role === UserRole.CHQ) {
       activityIds = unitSpecificIds ? JSON.parse(unitSpecificIds) : pi.activities.map(a => a.id);
    } else {
       activityIds = unitSpecificIds ? JSON.parse(unitSpecificIds) : (globalIds ? JSON.parse(globalIds) : pi.activities.map(a => a.id));
    }

    const fullActivities = activityIds.map((aid: string) => {
      const baseAct = pi.activities.find(a => a.id === aid);
      return {
        id: aid,
        activity: getSharedActivityName(year, userId, pi.id, aid, baseAct?.name || "New Activity"),
        indicator: getSharedIndicatorName(year, userId, pi.id, aid, baseAct?.indicator || "New Indicator"),
        months: createMonthsForActivity(year, userId, role, pi.id, aid, baseAct?.defaults || Array(12).fill(0))
      };
    });

    return {
      id: pi.id,
      title: getSharedPITitle(year, userId, pi.id, pi.title),
      activities: fullActivities
    };
  });
};

const generateStructuredPIs = (
  year: string,
  subjectUser: User, 
  mode: 'normal' | 'zero' | 'consolidated' = 'normal',
  dashboardType: 'OPERATIONAL' | 'CHQ' | 'TACTICAL' = 'OPERATIONAL'
): PIData[] => {
  const allStationIds = ['st-1', 'st-2', 'st-3', 'st-4', 'st-5', 'st-6', 'st-7', 'st-8', 'st-9', 'st-10', 'st-11'];
  const allChqIds = ['chq-1', 'chq-2', 'chq-3', 'chq-4', 'chq-5', 'chq-6', 'chq-7', 'chq-8', 'chq-9'];

  const definitions = getPIDefinitions(year, subjectUser.id, subjectUser.role);
  
  let groupHidden: string[] = [];
  
  // Independence logic: Scoped hidden PIs ensure changes in individual unit dashboards don't leak elsewhere.
  const unitHidden: string[] = JSON.parse(localStorage.getItem(`hidden_pis_${subjectUser.id}`) || '[]');
  
  // Group hiding only for Station users (excluding sandboxed individual views)
  if (mode !== 'consolidated' && subjectUser.role === UserRole.STATION && year !== '2023' && year !== '2025' && year !== '2026') {
    if (subjectUser.name === 'City Mobile Force Company') {
      groupHidden = JSON.parse(localStorage.getItem('hidden_pis_SPECIAL') || '[]');
    } else {
      groupHidden = JSON.parse(localStorage.getItem('hidden_pis_STATION_1_10') || '[]');
    }
  }

  // Check for CIU 2025 specific unhide request
  const isCiu2025 = year === '2025' && subjectUser.name === 'CHQ CIU';

  return definitions
    .filter(def => {
      if (isCiu2025) return true; // Force unhide for CIU 2025 as requested
      if (subjectUser.name === 'CHQ CCADU' && def.id === 'PI8') return true;
      if (unitHidden.includes(def.id)) return false;
      if (mode !== 'consolidated' && subjectUser.role === UserRole.STATION && groupHidden.includes(def.id)) return false;
      return true;
    })
    .map((def) => {
      const isPercentagePI = ["PI4", "PI13", "PI15", "PI16", "PI18", "PI20", "PI21", "PI24", "PI25"].includes(def.id);
      
      return {
        id: def.id,
        title: def.title,
        activities: def.activities.map((act) => {
          let monthsData: MonthData[];

          if (mode === 'consolidated') {
            monthsData = MONTHS.map((_, mIdx) => {
              let totalValue = 0;
              let targetIds: string[] = [];
              if (dashboardType === 'OPERATIONAL') targetIds = [...allStationIds, ...allChqIds];
              else if (dashboardType === 'CHQ') targetIds = allChqIds;
              else targetIds = allStationIds;

              targetIds.forEach(unitId => {
                totalValue += getSharedAccomplishment(year, unitId, def.id, act.id, mIdx, 0);
              });
              
              return {
                value: isPercentagePI ? Math.round(totalValue / targetIds.length) : totalValue,
                files: []
              };
            });
          } else {
            monthsData = act.months;
          }

          return {
            id: act.id,
            activity: act.activity,
            indicator: act.indicator,
            months: monthsData,
            total: monthsData.reduce((a, b) => a + b.value, 0)
          };
        })
      };
    });
};

interface OperationalDashboardProps {
  title?: string;
  onBack: () => void;
  currentUser: User;
  subjectUser: User; 
}

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ title = "OPERATIONAL DASHBOARD 2026", onBack, currentUser, subjectUser }) => {
  const [activeTab, setActiveTab] = useState('PI1');
  const [exporting, setExporting] = useState(false);
  const [piData, setPiData] = useState<PIData[]>([]);
  const [dataMode, setDataMode] = useState<'normal' | 'zero' | 'consolidated'>('normal');
  
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingHeader, setEditingHeader] = useState<boolean>(false);
  const [editingLabel, setEditingLabel] = useState<{ rowIdx: number; field: 'activity' | 'indicator' } | null>(null);
  const [textEditValue, setTextEditValue] = useState<string>('');
  
  const [editingTabName, setEditingTabName] = useState<string | null>(null);
  const [tabRenameValue, setTabRenameValue] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const dashboardYear = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const dashboardType = useMemo(() => {
    if (title.toUpperCase().includes("CHQ")) return 'CHQ';
    if (title.toUpperCase().includes("TACTICAL")) return 'TACTICAL';
    return 'OPERATIONAL';
  }, [title]);

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SUB_ADMIN;

  const refreshData = () => {
    const isMainView = subjectUser.id === currentUser.id;
    const isViewingSubAdmin = subjectUser.role === UserRole.SUB_ADMIN;
    let mode: 'normal' | 'zero' | 'consolidated' = 'normal';

    if (isAdmin && (isMainView || isViewingSubAdmin)) {
      mode = 'consolidated';
    }
    
    setDataMode(mode);
    const data = generateStructuredPIs(dashboardYear, subjectUser, mode, dashboardType);
    setPiData(data);
    
    if (data.length > 0 && !data.find(pi => pi.id === activeTab)) {
      setActiveTab(data[0].id);
    }
  };

  useEffect(() => { refreshData(); }, [title, currentUser, subjectUser, dashboardYear, dashboardType, activeTab]);

  useEffect(() => {
    const handleStorageChange = () => refreshData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const currentPI = useMemo(() => {
    return piData.find(pi => pi.id === activeTab) || piData[0];
  }, [piData, activeTab]);

  const columnTotals = useMemo(() => {
    if (!currentPI) return { monthly: Array(12).fill(0), grand: 0 };
    const monthlyTotals = Array(12).fill(0);
    let grandTotal = 0;
    
    const isPercent = ["PI4", "PI13", "PI15", "PI16", "PI18", "PI20", "PI21", "PI24", "PI25"].includes(activeTab);

    currentPI.activities.forEach(act => {
      act.months.forEach((m, mIdx) => {
        monthlyTotals[mIdx] += m.value;
      });
      grandTotal += isPercent ? Math.round(act.total / 12) : act.total;
    });

    if (isPercent) {
      const averagedMonthly = monthlyTotals.map(v => currentPI.activities.length > 0 ? Math.round(v / currentPI.activities.length) : 0);
      const averagedGrand = currentPI.activities.length > 0 ? Math.round(grandTotal / currentPI.activities.length) : 0;
      return { monthly: averagedMonthly, grand: averagedGrand, isPercent: true };
    }

    return { monthly: monthlyTotals, grand: grandTotal, isPercent: false };
  }, [currentPI, activeTab]);

  const handleCellClick = (rowIdx: number, monthIdx: number, val: number) => {
    const canEdit = (isSuperAdmin && dataMode !== 'consolidated') || ((currentUser.role === UserRole.CHQ || currentUser.role === UserRole.STATION) && currentUser.id === subjectUser.id);
    if (canEdit) {
      setEditingCell({ rowIdx, monthIdx });
      setEditValue(String(val));
    }
  };

  const saveEditValue = () => {
    if (!editingCell || !currentPI) return;
    const newValue = parseInt(editValue, 10) || 0;
    const activityId = currentPI.activities[editingCell.rowIdx].id;
    localStorage.setItem(`accomplishment_${dashboardYear}_${subjectUser.id}_${activeTab}_${activityId}_${editingCell.monthIdx}`, String(newValue));
    refreshData();
    setEditingCell(null);
  };

  const handleAddPI = () => {
    if (!isSuperAdmin) return;
    const newPIId = `PI_CUSTOM_${Date.now()}`;
    const newTitle = "New Performance Indicator";
    const activityId = `act_${Date.now()}`;
    
    const newPIDef = {
      id: newPIId,
      title: newTitle,
      activities: [
        { 
          id: activityId, 
          name: "New Activity Template", 
          indicator: "New Indicator Template", 
          defaults: Array(12).fill(0) 
        }
      ]
    };

    const storedCustomPIsStr = localStorage.getItem(`custom_pi_definitions_${dashboardYear}`);
    const customPIs = storedCustomPIsStr ? JSON.parse(storedCustomPIsStr) : [];
    
    localStorage.setItem(`custom_pi_definitions_${dashboardYear}`, JSON.stringify([...customPIs, newPIDef]));
    
    // Update order to include new PI at the end
    const storedOrder = localStorage.getItem(`pi_order_${dashboardYear}`);
    let orderIds = storedOrder ? JSON.parse(storedOrder) : piData.map(p => p.id);
    if (!orderIds.includes(newPIId)) {
        localStorage.setItem(`pi_order_${dashboardYear}`, JSON.stringify([...orderIds, newPIId]));
    }

    setActiveTab(newPIId);
    refreshData();
  };

  const handleAddActivity = () => {
    if (!isSuperAdmin || !currentPI) return;
    const newId = `custom_row_${Date.now()}`;
    const unitStorageKey = `pi_activity_ids_${dashboardYear}_${subjectUser.id}_${activeTab}`;
    const globalStorageKey = `pi_activity_ids_${dashboardYear}_${activeTab}`;
    
    const storedIds = localStorage.getItem(unitStorageKey) || localStorage.getItem(globalStorageKey);
    const activityIds = storedIds ? JSON.parse(storedIds) : currentPI.activities.map(a => a.id);
    
    const updatedIds = [...activityIds, newId];
    localStorage.setItem(unitStorageKey, JSON.stringify(updatedIds));
    
    refreshData();
  };

  const handleDeleteActivity = (activityId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (!isSuperAdmin || !window.confirm(`Are you sure you want to remove this activity row?`)) return;
    
    const unitStorageKey = `pi_activity_ids_${dashboardYear}_${subjectUser.id}_${activeTab}`;
    const globalStorageKey = `pi_activity_ids_${dashboardYear}_${activeTab}`;
    
    const storedIds = localStorage.getItem(unitStorageKey) || localStorage.getItem(globalStorageKey);
    const activityIds = storedIds ? JSON.parse(storedIds) : currentPI.activities.map(a => a.id);
    
    const newIds = activityIds.filter((id: string) => id !== activityId);
    localStorage.setItem(unitStorageKey, JSON.stringify(newIds));
    
    refreshData();
  };

  const handleClearData = () => {
    if (!isSuperAdmin || !currentPI) return;
    if (!confirm(`Clear all data for this PI (${currentPI.title}) for unit ${subjectUser.name}?`)) return;

    currentPI.activities.forEach(act => {
      MONTHS.forEach((_, mIdx) => {
        localStorage.removeItem(`accomplishment_${dashboardYear}_${subjectUser.id}_${activeTab}_${act.id}_${mIdx}`);
      });
    });
    refreshData();
  };

  const handleDeletePI = (piId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isSuperAdmin) return;
    const storageKey = `hidden_pis_${subjectUser.id}`;
    if (!window.confirm(`Hide PI tab ${piId} for ${subjectUser.name} ONLY? It will remain visible in other views.`)) return;
    const hidden = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!hidden.includes(piId)) {
        localStorage.setItem(storageKey, JSON.stringify([...hidden, piId]));
        window.dispatchEvent(new Event('storage'));
    }
  };

  const handleLabelEdit = (rowIdx: number, field: 'activity' | 'indicator', currentVal: string) => {
    if (!isSuperAdmin) return;
    setEditingLabel({ rowIdx, field });
    setTextEditValue(currentVal);
  };

  const saveLabel = () => {
    if (!editingLabel || !currentPI) return;
    const activityId = currentPI.activities[editingLabel.rowIdx].id;
    // Unit-scoped labels ensure Independence
    localStorage.setItem(`pi_${editingLabel.field}_name_${dashboardYear}_${subjectUser.id}_${activeTab}_${activityId}`, textEditValue);
    refreshData();
    setEditingLabel(null);
  };

  const handleHeaderEdit = () => {
    if (!isSuperAdmin) return;
    setEditingHeader(true);
    setTextEditValue(currentPI?.title || "");
  };

  const saveHeader = () => {
    if (!editingHeader) return;
    localStorage.setItem(`pi_title_${dashboardYear}_${subjectUser.id}_${activeTab}`, textEditValue);
    refreshData();
    setEditingHeader(false);
  };

  const handleStartRenameTab = (piId: string, currentLabel: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSuperAdmin) return;
    setEditingTabName(piId);
    setTabRenameValue(currentLabel);
  };

  const handleSaveTabRename = (piId: string) => {
    if (!editingTabName) return;
    localStorage.setItem(`pi_tab_label_${dashboardYear}_${subjectUser.id}_${piId}`, tabRenameValue);
    setEditingTabName(null);
    refreshData();
  };

  const handleMoveTab = (piId: string, direction: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSuperAdmin) return;
    const ids = piData.map(p => p.id);
    const idx = ids.indexOf(piId);
    if (direction === 'left' && idx > 0) {
      [ids[idx], ids[idx - 1]] = [ids[idx - 1], ids[idx]];
    } else if (direction === 'right' && idx < ids.length - 1) {
      [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    }
    localStorage.setItem(`pi_order_${dashboardYear}`, JSON.stringify(ids));
    refreshData();
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPI) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        rows.slice(1).forEach((row, index) => {
          if (index < currentPI.activities.length) {
            const activityId = currentPI.activities[index].id;
            const activityName = row[0] ? String(row[0]) : null;
            const indicatorName = row[1] ? String(row[1]) : null;

            if (activityName) {
              localStorage.setItem(`pi_activity_name_${dashboardYear}_${subjectUser.id}_${activeTab}_${activityId}`, activityName);
            }
            if (indicatorName) {
              localStorage.setItem(`pi_indicator_name_${dashboardYear}_${subjectUser.id}_${activeTab}_${activityId}`, indicatorName);
            }
          }
        });

        alert('Import successful! Activities and Indicators updated for this PI tab.');
        refreshData();
      } catch (err) {
        console.error(err);
        alert('Failed to process Excel file. Please ensure it follows the template (Column A: Activity, Column B: Indicator).');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportSampleExcel = () => {
    if (!currentPI) return;
    const headers = ["Activity", "Performance Indicator"];
    const data = currentPI.activities.map(act => [act.activity, act.indicator]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Update Template");
    XLSX.writeFile(wb, `Template_${activeTab}_Update.xlsx`);
  };

  const handleExportPPT = async () => {
    if (!currentPI) return;
    setExporting(true);
    try {
      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_WIDE";
      pptx.defineSlideMaster({
        title: "MASTER",
        background: { color: "FFFFFF" },
        objects: [
          { text: { text: title, options: { x: 0.5, y: 0.2, w: 12.3, fontSize: 24, bold: true, align: "center" } } }
        ],
      });
      piData.forEach(pi => {
        const slide = pptx.addSlide({ masterName: "MASTER" });
        slide.addText(`PI #${pi.id.replace('PI', '')}: ${pi.title}`, { x: 0.5, y: 0.8, w: 12.3, fontSize: 14, bold: true, align: "center" });
        
        const tableData: any[][] = [[
          { text: "Activity", options: { fill: "FFFF00", bold: true, border: { pt: 1 } } },
          { text: "Performance Indicator", options: { fill: "FFFF00", bold: true, border: { pt: 1 } } },
          ...MONTHS.map(m => ({ text: m, options: { fill: "00B0F0", color: "FFFFFF", bold: true, border: { pt: 1 } } })),
          { text: "Total", options: { fill: "FFFF00", bold: true, border: { pt: 1 } } }
        ]];
        
        pi.activities.forEach(act => tableData.push([
          act.activity, act.indicator, ...act.months.map(m => String(m.value)), String(act.total)
        ]));
        
        slide.addTable(tableData, { x: 0.3, y: 1.2, w: 12.7, fontSize: 8 });
      });
      await pptx.writeFile({ fileName: `${title}.pptx` });
    } catch (e) { console.error(e); } finally { setExporting(false); }
  };

  if (!currentPI && piData.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xl">
        <p className="text-slate-900 text-xl font-black uppercase mb-2">No Performance Indicators Active</p>
        <p className="text-slate-500 font-medium mb-6">Tabs for this specific unit have been hidden.</p>
        {isSuperAdmin && (
            <button 
                onClick={() => { 
                    localStorage.removeItem(`hidden_pis_${subjectUser.id}`);
                    window.location.reload(); 
                }} 
                className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 transition"
            >
                Restore Unit Tabs
            </button>
        )}
      </div>
    );
  }

  if (!currentPI) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button onClick={onBack} className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-3">
            <div className="p-1 rounded-full bg-slate-100 group-hover:bg-slate-200 transition"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></div>
            Back to Overview
          </button>
          <div className="flex flex-wrap items-center gap-3">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
             <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded uppercase tracking-widest">
                  {dataMode === 'consolidated' ? 'CONSOLIDATED VIEW' : `UNIT: ${subjectUser.name}`}
                </span>
             </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && dataMode !== 'consolidated' && (
            <div className="flex gap-2">
              <button onClick={handleExportSampleExcel} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition shadow-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Sample Template
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Import Excel
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
              <button onClick={handleClearData} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition shadow-sm">Clear Data</button>
            </div>
          )}
          <button onClick={handleExportPPT} disabled={exporting} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition shadow-sm flex items-center gap-2">
            {exporting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            PPT Export
          </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {piData.map((pi, idx) => {
            const label = getSharedTabLabel(dashboardYear, subjectUser.id, pi.id, pi.id.includes('CUSTOM') ? 'NEW PI' : `PI ${pi.id.replace('PI', '')}`);
            const isEditing = editingTabName === pi.id;
            
            return (
              <div key={pi.id} className="relative group/tab flex items-center gap-0.5">
                {isSuperAdmin && idx > 0 && (
                  <button onClick={(e) => handleMoveTab(pi.id, 'left', e)} className="p-1 text-slate-300 hover:text-slate-600 transition bg-slate-50 rounded-l border border-slate-200" title="Move Left">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19l-7-7 7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                )}
                
                <button 
                  onClick={() => setActiveTab(pi.id)} 
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all border flex items-center gap-2 ${activeTab === pi.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {isEditing ? (
                    <input autoFocus className="bg-white text-slate-900 px-1 border border-blue-500 rounded outline-none w-20" value={tabRenameValue} onChange={(e) => setTabRenameValue(e.target.value)} onBlur={() => handleSaveTabRename(pi.id)} onKeyDown={(e) => e.key === 'Enter' && handleSaveTabRename(pi.id)} onClick={(e) => e.stopPropagation()} />
                  ) : (
                    <span onDoubleClick={(e) => handleStartRenameTab(pi.id, label, e)}>{label}</span>
                  )}
                  
                  {isSuperAdmin && !isEditing && (
                    <div className="flex items-center gap-1">
                      <span onClick={(e) => handleStartRenameTab(pi.id, label, e)} className="opacity-40 hover:opacity-100 transition p-0.5">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </span>
                      <span onClick={(e) => handleDeletePI(pi.id, e)} className="opacity-40 hover:opacity-100 hover:text-red-400 transition p-0.5">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </span>
                    </div>
                  )}
                </button>

                {isSuperAdmin && idx < piData.length - 1 && (
                  <button onClick={(e) => handleMoveTab(pi.id, 'right', e)} className="p-1 text-slate-300 hover:text-slate-600 transition bg-slate-50 rounded-r border border-slate-200" title="Move Right">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                )}
              </div>
            );
          })}
          {isSuperAdmin && <button onClick={handleAddPI} className="px-4 py-2 rounded-lg text-xs font-black bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition shadow-sm ml-2">+ Add PI</button>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
        <div className="bg-white py-4 px-6 border-b border-slate-300 flex justify-center items-center text-center">
             {editingHeader ? (
               <input autoFocus className="max-w-xl flex-1 font-black text-slate-800 text-center uppercase border-b-2 border-blue-500 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveHeader} onKeyDown={(e) => e.key === 'Enter' && saveHeader()} />
             ) : (
               <h3 onClick={handleHeaderEdit} className={`inline-block font-black text-slate-800 text-base uppercase ${isSuperAdmin ? 'cursor-pointer hover:bg-blue-50 px-2 rounded transition' : ''}`}>
                 Performance Indicator #{activeTab.replace('PI', '')} – {currentPI.title}
               </h3>
             )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] leading-tight">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase text-slate-900">Activity</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase text-slate-900">Performance Indicator</th>
                <th colSpan={12} className="border border-slate-300 bg-[#00B0F0] p-2 text-center text-white font-extrabold uppercase text-sm">{dashboardYear} Accomplishment</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-16 font-bold uppercase text-slate-900">Total</th>
                {isSuperAdmin && <th rowSpan={2} className="border border-slate-300 bg-slate-900 p-2 text-white w-24 font-bold uppercase text-[9px]">Action</th>}
              </tr>
              <tr>
                {MONTHS.map(m => (
                  <th key={m} className="border border-slate-300 bg-[#FFFF00] p-1.5 text-center font-bold text-[10px] w-11 uppercase text-slate-900">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentPI.activities.map((row, rIdx) => {
                const isPercent = ["PI4", "PI13", "PI15", "PI16", "PI18", "PI20", "PI21", "PI24", "PI25"].includes(activeTab);
                return (
                  <tr key={row.id} className="hover:bg-blue-50/30 group">
                    <td className={`border border-slate-300 p-2 text-slate-800 ${isSuperAdmin ? 'hover:bg-blue-50 cursor-pointer font-semibold' : ''}`} onClick={() => handleLabelEdit(rIdx, 'activity', row.activity)}>
                       {editingLabel?.rowIdx === rIdx && editingLabel.field === 'activity' ? (
                         <input autoFocus className="w-full bg-white border border-blue-500 rounded px-1 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveLabel} onKeyDown={(e) => e.key === 'Enter' && saveLabel()} />
                       ) : row.activity}
                    </td>
                    <td className={`border border-slate-300 p-2 text-slate-800 ${isSuperAdmin ? 'hover:bg-blue-50 cursor-pointer font-semibold' : ''}`} onClick={() => handleLabelEdit(rIdx, 'indicator', row.indicator)}>
                       {editingLabel?.rowIdx === rIdx && editingLabel.field === 'indicator' ? (
                         <input autoFocus className="w-full bg-white border border-blue-500 rounded px-1 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveLabel} onKeyDown={(e) => e.key === 'Enter' && saveLabel()} />
                       ) : row.indicator}
                    </td>
                    {row.months.map((m, mIdx) => (
                      <td key={mIdx} className="border border-slate-300 p-1.5 text-center text-blue-700 font-bold group relative cursor-pointer hover:bg-blue-100" onClick={() => handleCellClick(rIdx, mIdx, m.value)}>
                        {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                          <input autoFocus className="w-center bg-white border border-blue-500 rounded px-0.5 outline-none font-black text-center" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEditValue} onKeyDown={(e) => e.key === 'Enter' && saveEditValue()} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <span>{m.value}{isPercent ? '%' : ''}</span>
                        )}
                      </td>
                    ))}
                    <td className="border border-slate-300 p-1.5 text-center font-black text-slate-900 bg-slate-100">{isPercent ? `${Math.round(row.total / 12)}%` : row.total}</td>
                    {isSuperAdmin && (
                      <td className="border border-slate-300 p-2 text-center bg-slate-50">
                        <button onClick={(e) => handleDeleteActivity(row.id, e)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </td>
                    )}
                  </tr>
                );
              })}
              <tr className="bg-slate-100 font-black">
                <td colSpan={2} className="border border-slate-300 p-2 text-right uppercase text-slate-900">Total</td>
                {columnTotals.monthly.map((total, idx) => (
                  <td key={idx} className="border border-slate-300 p-1.5 text-center text-slate-900">{total}{columnTotals.isPercent ? '%' : ''}</td>
                ))}
                <td className="border border-slate-300 p-1.5 text-center text-white bg-slate-900">{columnTotals.grand}{columnTotals.isPercent ? '%' : ''}</td>
                {isSuperAdmin && <td className="border border-slate-300"></td>}
              </tr>
              {isSuperAdmin && (
                <tr className="bg-slate-50/50">
                  <td colSpan={isSuperAdmin ? 16 : 15} className="border border-slate-300 p-4 text-center">
                    <button onClick={handleAddActivity} className="text-blue-600 font-bold hover:text-blue-800 transition text-xs uppercase">+ Add Row</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OperationalDashboard;