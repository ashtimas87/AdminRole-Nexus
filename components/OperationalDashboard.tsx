import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';
import pptxgen from "pptxgenjs";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper to get shared definitions (Editable only by Super Admin)
const getSharedActivityName = (piId: string, index: number, defaultName: string): string => {
  const stored = localStorage.getItem(`pi_activity_${piId}_${index}`);
  return stored || defaultName;
};

const getSharedIndicatorName = (piId: string, index: number, defaultIndicator: string): string => {
  const stored = localStorage.getItem(`pi_indicator_${piId}_${index}`);
  return stored || defaultIndicator;
};

const getSharedPITitle = (piId: string, defaultTitle: string): string => {
  const stored = localStorage.getItem(`pi_title_${piId}`);
  return stored || defaultTitle;
};

// Helper to get individual accomplishment data with year separation
const getSharedAccomplishment = (year: string, userId: string, piId: string, activityIdx: number, monthIdx: number, defaultValue: number): number => {
  const key = `accomplishment_${year}_${userId}_${piId}_${activityIdx}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored !== null ? parseInt(stored, 10) : defaultValue;
};

// Helper to get file metadata with year separation
const getSharedFiles = (year: string, userId: string, piId: string, activityIdx: number, monthIdx: number): MonthFile[] => {
  const key = `files_${year}_${userId}_${piId}_${activityIdx}_${monthIdx}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const createMonths = (year: string, userId: string, role: UserRole, piId: string, activityIdx: number, values: number[]): MonthData[] => {
  const isStation = role === UserRole.STATION;
  return values.map((v, mIdx) => ({
    value: getSharedAccomplishment(year, userId, piId, activityIdx, mIdx, isStation ? 0 : v),
    files: getSharedFiles(year, userId, piId, activityIdx, mIdx)
  }));
};

const createStaticMonths = (year: string, userId: string, role: UserRole, piId: string, activityIdx: number, val: number): MonthData[] => {
  const isStation = role === UserRole.STATION;
  return Array.from({ length: 12 }).map((_, mIdx) => ({
    value: getSharedAccomplishment(year, userId, piId, activityIdx, mIdx, isStation ? 0 : val),
    files: getSharedFiles(year, userId, piId, activityIdx, mIdx)
  }));
};

const getPIDefinitions = (year: string, userId: string, role: UserRole) => {
  const piDefinitions = [
    {
      id: "PI1",
      title: "Number of Community Awareness/Information Activities Initiated",
      activities: [
        { name: "Formulation of Stratcom Snapshots", indicator: "No. of stratcom snapshot formulated", data: createStaticMonths(year, userId, role, "PI1", 0, 1) },
        { name: "Social Media Analysis", indicator: "No. of Social Media Analysis conducted", data: createMonths(year, userId, role, "PI1", 1, [13, 13, 13, 12, 9, 13, 13, 13, 13, 13, 13, 13]) },
        { name: "Implementation of IO", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI1", 2, [10, 9, 9, 9, 9, 9, 9, 10, 9, 9, 10, 11]) },
        { name: "Conduct of P.I.C.E.", indicator: "No. of PICE conducted", data: createMonths(year, userId, role, "PI1", 3, [56, 50, 51, 54, 50, 53, 51, 57, 54, 58, 55, 54]) },
        { name: "Production of Leaflets and handouts as IEC Materials", indicator: "No. of Printed copies", data: createMonths(year, userId, role, "PI1", 4, [790, 691, 688, 757, 688, 721, 789, 688, 645, 766, 307, 688]) },
        { name: "Production of Outdoor IEC Materials", indicator: "No. of Streamers and Tarpaulins, or LED Wall Displayed", data: createMonths(year, userId, role, "PI1", 5, [23, 23, 24, 25, 23, 25, 25, 23, 24, 24, 29, 28]) },
        { name: "Face-to-face Awareness Activities", indicator: "No. of Face-to-face Awareness conducted", data: createMonths(year, userId, role, "PI1", 6, [50, 50, 50, 50, 51, 51, 51, 51, 50, 52, 59, 64]) },
        { name: "Dissemination of related news articles involving the PNP...", indicator: "No. of emails and SMS sent", data: createMonths(year, userId, role, "PI1", 7, [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 35, 39]) },
        { name: "Management of PNP Social Media Pages and Accounts", indicator: "No. of account followers", data: createMonths(year, userId, role, "PI1", 8, [11, 11, 10, 9, 10, 10, 10, 11, 9, 10, 11, 13]) },
        { name: "Social Media Post Boosting", indicator: "No. of target audience reached", data: createMonths(year, userId, role, "PI1", 9, [552, 511, 517, 570, 551, 660, 680, 644, 647, 557, 681, 712]) },
        { name: "Social Media Engagement", indicator: "No. of Engagement", data: createMonths(year, userId, role, "PI1", 10, [39, 38, 38, 35, 36, 35, 36, 35, 39, 40, 42, 43]) },
        { name: "Radio/TV/Live Streaming", indicator: "No. of guesting/show", data: createMonths(year, userId, role, "PI1", 11, [15, 14, 17, 15, 16, 14, 16, 14, 14, 14, 16, 14]) },
        { name: "Press Briefing", indicator: "No. of Press Briefing to be conducted", data: createMonths(year, userId, role, "PI1", 12, [15, 14, 17, 16, 15, 14, 16, 16, 15, 18, 20, 17]) },
        { name: "Reproduction and Distribution of GAD-Related IEC Materials", indicator: "No. of copies to be distributed", data: createMonths(year, userId, role, "PI1", 13, [15, 16, 16, 16, 15, 15, 15, 15, 15, 17, 19, 21]) },
        { name: "Conduct Awareness activity relative to clan/family feuds...", indicator: "No. of Lectures conducted", data: createMonths(year, userId, role, "PI1", 14, [14, 13, 14, 13, 14, 13, 14, 13, 13, 13, 12, 15]) },
        { name: "Lectures on Islamic Religious and Cultural Sensitivity", indicator: "No. of Awareness activity conducted", data: createMonths(year, userId, role, "PI1", 15, [19, 19, 17, 19, 17, 19, 19, 17, 19, 20, 30, 33]) },
        { name: "Dialogue on Peacebuilding and Counter Radicalization", indicator: "No. of Dialogue on Peacebuilding conducted", data: createMonths(year, userId, role, "PI1", 16, [17, 17, 17, 16, 13, 17, 17, 17, 17, 18, 20, 22]) }
      ]
    },
    {
      id: "PI2",
      title: "Number of sectoral groups/BPATs mobilized/organized",
      activities: [
        { name: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders activities", indicator: "No. of collaborative efforts with NGOs... activities conducted", data: createMonths(year, userId, role, "PI2", 0, [46, 43, 33, 33, 34, 35, 27, 26, 27, 27, 10, 25]) }
      ]
    },
    {
      id: "PI3",
      title: "Number of participating respondents",
      activities: [
        { name: "Secretariat Meetings", indicator: "No. Secretariat Meetings conducted", data: createMonths(year, userId, role, "PI3", 0, [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]) },
        { name: "Convening of IO Working Group", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 1, [5, 6, 6, 6, 6, 6, 5, 6, 6, 6, 6, 6]) },
        { name: "Activation of SyncCom during major events", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 2, [9, 8, 8, 8, 9, 8, 8, 8, 9, 8, 8, 8]) },
        { name: "Summing-up on Revitalized-Pulis Sa Barangay (R-PSB)", indicator: "No. of summing-up conducted", data: createMonths(year, userId, role, "PI3", 3, [11, 11, 11, 11, 11, 10, 10, 10, 10, 10, 9, 5]) },
        { name: "Summing-up on Counter White Area Operations (CWAO)", indicator: "No. of summing-up conducted", data: createMonths(year, userId, role, "PI3", 4, [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4]) },
        { name: "StratCom support to NTF-ELCAC", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 5, [0, 2, 4, 2, 5, 4, 2, 5, 3, 4, 21, 17]) },
        { name: "StratCom and ComRel Support to NTF-DPAGs", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 6, [24, 23, 25, 23, 26, 25, 23, 26, 24, 23, 21, 22]) },
        { name: "StratCom Support to TF-Sanglahi Bravo", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 7, [17, 17, 17, 17, 18, 17, 17, 18, 17, 17, 22, 18]) },
        { name: "TG PCR Operations for Mid-Term Elections", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 8, [6, 24, 25, 24, 24, 24, 24, 24, 24, 24, 23, 19]) },
        { name: "Enhanced Feedback Mechanism thru SMS", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 9, [7, 7, 9, 7, 9, 5, 5, 5, 5, 5, 5, 6]) },
        { name: "PNP Good Deeds", indicator: "No. of PNP Good Deeds", data: createMonths(year, userId, role, "PI3", 10, [17, 14, 11, 14, 17, 12, 15, 12, 15, 14, 15, 14]) },
        { name: "Conduct dialogue, meetings, and workshops...", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 11, [18, 20, 20, 20, 20, 18, 22, 22, 20, 21, 19, 22]) },
        { name: "Deployment of SRR team", indicator: "Deployment of SRR team", data: createStaticMonths(year, userId, role, "PI3", 12, 25) },
        { name: "PNP Help and Food Bank Initiatives", indicator: "No. of activities initiated", data: createMonths(year, userId, role, "PI3", 13, [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 7]) },
        { name: "Maintenance and Operationalization of PNP Help Desks", indicator: "No of PNP Help Desk Maintained...", data: createStaticMonths(year, userId, role, "PI3", 14, 6) },
        { name: "PNP Advocacy Support Groups and Force Multipliers", indicator: "No. of support activities conducted", data: createMonths(year, userId, role, "PI3", 15, [10, 10, 10, 10, 10, 11, 11, 11, 11, 11, 13, 14]) },
        { name: "Inter-Agency Cooperation on Anti-Illegal Drugs", indicator: "No. of inter-agency activities conducted", data: createMonths(year, userId, role, "PI3", 16, [17, 17, 17, 18, 17, 17, 17, 18, 17, 16, 19, 17]) },
        { name: "Recovery and Wellness Program", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 17, [8, 7, 7, 7, 8, 7, 7, 8, 8, 6, 7, 7]) },
        { name: "Drug Awareness Activities", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 18, [9, 9, 9, 9, 9, 9, 10, 8, 9, 9, 7, 6]) },
        { name: "Support to Barangay Drug Clearing Program", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 19, [15, 15, 15, 16, 15, 15, 16, 15, 15, 15, 15, 14]) },
        { name: "Coordination, Implementation and monitoring of Interfaith Squad...", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 20, [21, 22, 22, 22, 22, 19, 22, 23, 22, 21, 19, 22]) },
        { name: "National Day of Remembrance for SAF 44", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 21, [10, 8, 8, 8, 9, 8, 8, 8, 8, 8, 8, 8]) },
        { name: "EDSA People's Power Anniversary", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 22, [9, 10, 9, 9, 9, 9, 9, 9, 9, 8, 9, 9]) },
        { name: "Philippine Independence Day", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 23, [13, 13, 13, 13, 13, 15, 13, 14, 13, 13, 12, 13]) },
        { name: "National Heroes Day", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 24, [5, 4, 4, 4, 7, 4, 4, 4, 5, 4, 4, 4]) },
        { name: "National Flag Day", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 25, [9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 9, 8]) },
        { name: "National Crime Prevention Week (NCPW)", indicator: "No of adopted KASIMBAYANAN", data: createStaticMonths(year, userId, role, "PI3", 26, 9) },
        { name: "Celebration of National Women's Month", indicator: "No. of activities conducted", data: createMonths(year, userId, role, "PI3", 27, [5, 4, 4, 4, 7, 4, 4, 4, 5, 4, 4, 4]) },
        { name: "18-Day Campaign to End-VAWC", indicator: "No. of activities conducted", data: createStaticMonths(year, userId, role, "PI3", 28, 6) },
        { name: "National Children's Month", indicator: "No. of complaints/Referral", data: createMonths(year, userId, role, "PI3", 29, [6, 6, 6, 6, 6, 6, 6, 7, 6, 6, 5, 7]) }
      ]
    },
    {
      id: "PI4",
      title: "Percentage of accounted loose firearms against the estimated baseline data",
      activities: [
        { name: "JAPIC", indicator: "JAPIC conducted", data: createMonths(year, userId, role, "PI4", 0, [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0]) },
        { name: "Operations on loose firearms", indicator: "Operations on loose firearms conducted", data: createMonths(year, userId, role, "PI4", 1, [3, 4, 5, 3, 2, 2, 4, 0, 8, 3, 7, 3]) },
        { name: "Bakal/Sita", indicator: "Bakal/Sita conducted", data: createMonths(year, userId, role, "PI4", 2, [796, 768, 794, 754, 794, 784, 761, 763, 754, 754, 574, 583]) }
      ]
    },
    {
      id: "PI5",
      title: "Number of functional LACAP",
      activities: [
        { name: "P/CPOC meetings", indicator: "# P/CPOC meetings participated", data: createMonths(year, userId, role, "PI5", 0, [12, 13, 10, 11, 10, 8, 8, 8, 8, 12, 10, 11]) },
        { name: "Oversight Committee Meetings", indicator: "# of Oversight Committee Meetings conducted", data: createMonths(year, userId, role, "PI5", 1, [52, 53, 49, 43, 43, 38, 38, 35, 35, 43, 39, 39]) },
        { name: "Maintenance of AIDMC", indicator: "# of AIDMC maintained", data: createStaticMonths(year, userId, role, "PI5", 2, 1) },
        { name: "operations against highway robbery", indicator: "# of opns against highway robbery conducted", data: createMonths(year, userId, role, "PI5", 3, [2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1]) },
        { name: "anti-bank robbery operations", indicator: "# of anti-bank robbery opns conducted", data: createMonths(year, userId, role, "PI5", 4, [4, 3, 3, 3, 2, 4, 1, 3, 4, 3, 4, 0]) },
        { name: "operations against OCGs/PAGs", indicator: "# of opns against OCGs/PAGs conducted", data: createMonths(year, userId, role, "PI5", 5, [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0]) },
        { name: "operations against kidnapping", indicator: "# of opns against kidnapping conducted", data: createMonths(year, userId, role, "PI5", 6, [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0]) },
        { name: "operations against carnapping", indicator: "# of operations against carnapping conducted", data: createMonths(year, userId, role, "PI5", 7, [3, 2, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0]) },
        { name: "operations against illegal gambling", indicator: "# of operations against illegal gambling conducted", data: createMonths(year, userId, role, "PI5", 8, [5, 7, 9, 11, 10, 6, 11, 9, 10, 9, 10, 10]) },
        { name: "operations against illegal fishing", indicator: "# of operations against illegal fishing conducted", data: createStaticMonths(year, userId, role, "PI5", 9, 0) },
        { name: "operations against illegal logging", indicator: "# of operations against illegal logging conducted", data: createMonths(year, userId, role, "PI5", 10, [0, 1, 1, 1, 1, 0, 2, 2, 2, 1, 1, 3]) },
        { name: "operations on anti-illegal drugs", indicator: "# of operations on anti-illegal drugs conducted", data: createMonths(year, userId, role, "PI5", 11, [61, 57, 53, 53, 49, 45, 58, 46, 56, 59, 49, 60]) }
      ]
    },
    {
      id: "PI6",
      title: "Number of police stations utilizing PIPS",
      activities: [
        { name: "EMPO Assessment and Evaluations", indicator: "No. of EMPO Assessment and Evaluations conducted", data: createMonths(year, userId, role, "PI6", 0, [54, 57, 58, 58, 53, 53, 53, 53, 53, 53, 53, 49]) },
        { name: "Field/sector inspection", indicator: "No. of Field/sector inspection conducted", data: createStaticMonths(year, userId, role, "PI6", 1, 138) }
      ]
    },
    {
      id: "PI7",
      title: "Strategic Operational Indicator #7",
      activities: [ { name: "General Monitoring", indicator: "No. of units monitored", data: createStaticMonths(year, userId, role, "PI7", 0, 10) } ]
    },
    {
      id: "PI8",
      title: "Number of target hardening measures conducted",
      activities: [
        { name: "Security Survey/Inspection", indicator: "# of Security Survey/Inspection conducted", data: createMonths(year, userId, role, "PI8", 0, [2, 0, 2, 2, 2, 2, 4, 2, 3, 2, 6, 2]) },
        { name: "CI check/validation", indicator: "# of CI check/validation conducted", data: createMonths(year, userId, role, "PI8", 1, [22, 22, 16, 16, 19, 19, 18, 16, 21, 25, 7, 13]) },
        { name: "CI monitoring", indicator: "# of CI monitoring conducted", data: createMonths(year, userId, role, "PI8", 2, [14, 12, 5, 5, 5, 4, 6, 5, 8, 21, 7, 13]) },
        { name: "Clearances issued to civilians", indicator: "# of Clearances issued to civilians", data: createMonths(year, userId, role, "PI8", 3, [6216, 4481, 3938, 3113, 3556, 3869, 3344, 2259, 4236, 2314, 1552, 705]) },
        { name: "Clearances issued to PNP/AFP per", indicator: "# of Clearances issued to PNP/AFP per", data: createMonths(year, userId, role, "PI8", 4, [48, 53, 4, 148, 23, 16, 23, 64, 6, 19, 25, 38]) },
        { name: "Threat assessment", indicator: "# of Threat assessment conducted", data: createMonths(year, userId, role, "PI8", 5, [1, 2, 2, 4, 2, 2, 2, 2, 0, 2, 0, 2]) },
        { name: "Recruitment/maintenance of FNKN", indicator: "# of Recruitment/maintenance of FNKN", data: createMonths(year, userId, role, "PI8", 6, [0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0]) },
        { name: "Monitoring of cases involving foreign nationals", indicator: "# of Monitoring of cases... involving foreign nationals", data: createMonths(year, userId, role, "PI8", 7, [1, 0, 0, 0, 2, 1, 3, 2, 1, 0, 0, 0]) },
        { name: "SO during national events", indicator: "# of SO during national events conducted", data: createMonths(year, userId, role, "PI8", 8, [19, 19, 36, 17, 15, 15, 13, 17, 14, 14, 0, 696]) },
        { name: "Security to vital installations", indicator: "# of Security to vital installations conducted", data: createMonths(year, userId, role, "PI8", 9, [52, 50, 51, 47, 48, 47, 48, 47, 47, 48, 0, 167]) },
        { name: "VIP security protection", indicator: "# of VIP security protection", data: createMonths(year, userId, role, "PI8", 10, [31, 35, 24, 15, 19, 46, 53, 58, 50, 58, 0, 131]) },
        { name: "# of K9 patrols conducted", indicator: "# of K9 patrols conducted", data: createMonths(year, userId, role, "PI8", 11, [31, 41, 44, 38, 26, 43, 49, 56, 64, 45, 74, 68]) },
        { name: "# of beat/foot patrols conducted", indicator: "# of beat/foot patrols conducted", data: createMonths(year, userId, role, "PI8", 12, [6156, 6146, 6145, 6139, 6142, 6136, 6155, 6154, 6120, 6141, 5520, 5726]) },
        { name: "# of mobile patrols conducted", indicator: "# of mobile patrols conducted", data: createMonths(year, userId, role, "PI8", 13, [643, 629, 643, 630, 643, 630, 643, 643, 630, 643, 573, 639]) },
        { name: "# of checkpoints conducted", indicator: "# of checkpoints conducted", data: createMonths(year, userId, role, "PI8", 14, [675, 659, 718, 712, 676, 690, 729, 678, 717, 748, 673, 787]) }
      ]
    },
    {
      id: "PI9",
      title: "Percentage reduction of crimes involving foreign and domestic tourists",
      activities: [
        { name: "Maintenance of TPU", indicator: "# of TPU maintained", data: createStaticMonths(year, userId, role, "PI9", 0, 1) },
        { name: "Maintenance of TAC", indicator: "# of TAC maintained", data: createStaticMonths(year, userId, role, "PI9", 1, 1) },
        { name: "Maintenance of TAD", indicator: "# of TAD maintained", data: createStaticMonths(year, userId, role, "PI9", 2, 3) }
      ]
    },
    {
      id: "PI10",
      title: "Number of Police stations using COMPSTAT for crime prevention",
      activities: [
        { name: "Crime Information Reporting and Analysis System", indicator: "No. of Crime Information Reporting... data recorded", data: createMonths(year, userId, role, "PI10", 0, [282, 299, 327, 324, 284, 253, 310, 330, 314, 313, 267, 278]) },
        { name: "e-Wanted Persons Information System", indicator: "No. of Wanted Persons recorded", data: createMonths(year, userId, role, "PI10", 1, [48, 104, 111, 67, 102, 83, 180, 92, 89, 137, 106, 69]) },
        { name: "e-Rogues' Gallery System", indicator: "No. of eRogues recorded", data: createMonths(year, userId, role, "PI10", 2, [163, 185, 178, 179, 149, 157, 207, 169, 192, 216, 203, 151]) },
        { name: "e-Rogues' Maintenance (3rd Qtr or as needed)", indicator: "No. of e-Rogues' Maintened", data: createStaticMonths(year, userId, role, "PI10", 3, 0) },
        { name: "e-Subpoena System", indicator: "No. of Subpoena recorded", data: createMonths(year, userId, role, "PI10", 4, [9, 8, 29, 29, 16, 16, 25, 25, 28, 21, 27, 24]) },
        { name: "Proper encoding in CIDMS", indicator: "No. of CIDMS encoded", data: createMonths(year, userId, role, "PI10", 5, [7, 14, 12, 9, 4, 0, 0, 0, 0, 0, 0, 0]) }
      ]
    },
    {
      id: "PI11",
      title: "Number of threat group neutralized",
      activities: [
        { name: "COPLANs formulated", indicator: "# of COPLANs formulated", data: createMonths(year, userId, role, "PI11", 0, [0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0]) },
        { name: "HVTs newly identified", indicator: "No. of HVTs newly identified", data: createMonths(year, userId, role, "PI11", 1, [3, 2, 1, 3, 3, 3, 1, 1, 7, 0, 2, 1]) },
        { name: "HVTs neutralized", indicator: "No. of HVTs neutralized", data: createMonths(year, userId, role, "PI11", 2, [3, 3, 3, 5, 4, 4, 3, 1, 10, 0, 4, 4]) },
        { name: "IRs (criminality) for validation referred", indicator: "No. of IRs validated", data: createMonths(year, userId, role, "PI11", 3, [45, 47, 39, 41, 50, 38, 36, 42, 78, 0, 71, 0]) }
      ]
    },
    {
      id: "PI12",
      title: "Number of utilized BINs",
      activities: [
        { name: "# of inventory made", indicator: "# of inventory made", data: createMonths(year, userId, role, "PI12", 0, [20, 20, 20, 20, 20, 31, 38, 43, 58, 59, 57, 51]) },
        { name: "# of BINs documented/registered and maintained", indicator: "# of BINs documented... and maintained", data: createMonths(year, userId, role, "PI12", 1, [20, 20, 20, 20, 20, 31, 38, 43, 58, 59, 57, 51]) },
        { name: "# of IRs prepared and submitted", indicator: "# of IRs prepared and submitted", data: createMonths(year, userId, role, "PI12", 2, [45, 57, 39, 41, 50, 38, 36, 42, 78, 0, 82, 0]) }
      ]
    },
    {
      id: "PI13",
      title: "Number of criminal cases filed",
      activities: [
        { name: "coordination with counterparts conducted", indicator: "# of coordination conducted", data: createStaticMonths(year, userId, role, "PI13", 0, 0) },
        { name: "court hearing or Duty on filed cases attended", indicator: "# of court hearing attended", data: createStaticMonths(year, userId, role, "PI13", 1, 0) }
      ]
    },
    {
      id: "PI14",
      title: "Number of cases resulting to conviction/dismissal",
      activities: [
        { name: "Monitoring Cases Against Threat Group", indicator: "No. of cases monitored", data: createStaticMonths(year, userId, role, "PI14", 0, 0) },
        { name: "Monitoring of Filed Cases", indicator: "No. of filed cases monitored", data: createStaticMonths(year, userId, role, "PI14", 1, 0) }
      ]
    },
    {
      id: "PI15",
      title: "Percentage of Trained investigative personnel",
      activities: [
        { name: "CIC", indicator: "No. of CIC conducted", data: createMonths(year, userId, role, "PI15", 0, [90, 87, 89, 89, 90, 93, 94, 97, 97, 93, 90, 90]) },
        { name: "IOBC", indicator: "No. of IOBC conducted", data: createMonths(year, userId, role, "PI15", 1, [15, 15, 13, 13, 14, 14, 14, 13, 13, 13, 13, 13]) }
      ]
    },
    {
      id: "PI16",
      title: "Percentage of investigative positions filled up with trained investigators",
      activities: [
        { name: "Screening and evaluation of candidates", indicator: "# of screening conducted", data: createStaticMonths(year, userId, role, "PI16", 0, 0) }
      ]
    },
    {
      id: "PI17",
      title: "Improvement in response time",
      activities: [
        { name: "Reporting of incidents via POMIS", indicator: "No. of incidents reported", data: createStaticMonths(year, userId, role, "PI17", 0, 0) },
        { name: "Repair of patrol vehicles", indicator: "# of patrol vehicles repaired", data: createStaticMonths(year, userId, role, "PI17", 1, 0) },
        { name: "Change oil of patrol vehicles", indicator: "# of change oil made", data: createStaticMonths(year, userId, role, "PI17", 2, 0) },
        { name: "Maintenance of OPCEN", indicator: "# of OPCEN maintained", data: createStaticMonths(year, userId, role, "PI17", 3, 0) }
      ]
    },
    {
      id: "PI18",
      title: "Percentage of dedicated investigators assigned to handle specific cases",
      activities: [
        { name: "Conduct case build up and investigation", indicator: "% of dedicated investigators", data: createStaticMonths(year, userId, role, "PI18", 0, 100) }
      ]
    },
    {
      id: "PI19",
      title: "Number of recipients of a. awards b. punished",
      activities: [
        { name: "Monday Flag Raising/Awarding Ceremony", indicator: "# of ceremonies conducted", data: createMonths(year, userId, role, "PI19", 0, [3, 4, 5, 4, 3, 5, 4, 3, 4, 4, 4, 4]) },
        { name: "Issuing commendations", indicator: "# of commendations issued", data: createMonths(year, userId, role, "PI19", 1, [181, 115, 226, 66, 13, 16, 19, 19, 0, 172, 232, 149]) },
        { name: "Pre-Charge Investigation (PCI)", indicator: "Conduct of PCI", data: createMonths(year, userId, role, "PI19", 2, [1, 4, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0]) }
      ]
    },
    {
      id: "PI20",
      title: "Percentage of investigative personnel equipped with standard systems",
      activities: [
        { name: "Attendance in specialized training", indicator: "No. of specialized training attended", data: createStaticMonths(year, userId, role, "PI20", 0, 100) }
      ]
    },
    {
      id: "PI21",
      title: "Percentage of Police Stations using e-based system",
      activities: [
        { name: "Crime Information Reporting and Analysis System", indicator: "No. of data recorded", data: createMonths(year, userId, role, "PI21", 0, [282, 299, 327, 324, 284, 253, 310, 330, 314, 313, 267, 278]) },
        { name: "e-Wanted Persons Information System", indicator: "No. of persons recorded", data: createMonths(year, userId, role, "PI21", 1, [48, 104, 111, 67, 102, 83, 180, 92, 89, 137, 106, 69]) }
      ]
    },
    {
      id: "PI22",
      title: "Number of cases filed in court/total # of cases investigated",
      activities: [
        { name: "Index Crime Investigated", indicator: "No. Of Index Crime Investigated", data: createMonths(year, userId, role, "PI22", 0, [39, 27, 35, 36, 22, 31, 36, 30, 25, 35, 28, 19]) },
        { name: "Index Crime Filed", indicator: "No. Of Index Crime Filed", data: createMonths(year, userId, role, "PI22", 1, [38, 27, 34, 35, 22, 31, 34, 27, 22, 25, 22, 16]) },
        { name: "Non-Index crime investigated", indicator: "No. Of Non-Index crime investigated", data: createMonths(year, userId, role, "PI22", 2, [37, 36, 34, 12, 26, 25, 17, 29, 19, 144, 161, 165]) },
        { name: "Cases filing on Non-Index", indicator: "No. of cases filed on Non-Index", data: createMonths(year, userId, role, "PI22", 3, [37, 36, 34, 12, 24, 25, 16, 28, 18, 128, 142, 136]) }
      ]
    },
    {
      id: "PI23",
      title: "Number of investigative infrastructure/equipment identified/accounted",
      activities: [
        { name: "Inventory, inspection & Accounting", indicator: "# of Inventory conducted", data: createStaticMonths(year, userId, role, "PI23", 0, 1) }
      ]
    },
    {
      id: "PI24",
      title: "Percentage of fill-up of investigative equipment and infrastructure",
      activities: [
        { name: "Field investigative crime scene kit", indicator: "No. accounted", data: createStaticMonths(year, userId, role, "PI24", 0, 21) },
        { name: "Police line", indicator: "No. accounted", data: createStaticMonths(year, userId, role, "PI24", 1, 45) },
        { name: "Police Blotter", indicator: "No. accounted", data: createStaticMonths(year, userId, role, "PI24", 2, 21) },
        { name: "Digital Camera", indicator: "No. accounted", data: createStaticMonths(year, userId, role, "PI24", 3, 24) }
      ]
    },
    {
      id: "PI25",
      title: "Percentage of IT-compliant stations",
      activities: [
        { name: "computer preventive maintenance", indicator: "# of maintenance conducted", data: createMonths(year, userId, role, "PI25", 0, [205, 205, 205, 205, 205, 211, 211, 211, 211, 211, 211, 211]) },
        { name: "Maintenance of printers", indicator: "# of printers maintained", data: createStaticMonths(year, userId, role, "PI25", 1, 95) },
        { name: "Internet payment", indicator: "# of computer internet paid", data: createStaticMonths(year, userId, role, "PI25", 2, 28) }
      ]
    },
    {
      id: "PI26",
      title: "Number of linkages established",
      activities: [
        { name: "JSCC meetings", indicator: "No. of JSCC meetings conducted", data: createStaticMonths(year, userId, role, "PI26", 0, 1) },
        { name: "Liaising", indicator: "No. of liaising conducted", data: createMonths(year, userId, role, "PI26", 1, [21, 23, 21, 16, 14, 14, 14, 13, 13, 13, 14, 15]) },
        { name: "coordination", indicator: "No. of coordination conducted", data: createMonths(year, userId, role, "PI26", 2, [10, 14, 15, 10, 13, 12, 12, 12, 11, 12, 11, 11]) }
      ]
    },
    {
      id: "PI27",
      title: "Number of community/ stakeholders support generated",
      activities: [
        { name: "Memorandum of Agreement (MOA) signing", indicator: "No. of MOA signing initiated", data: createMonths(year, userId, role, "PI27", 0, [9, 9, 10, 9, 9, 10, 9, 9, 9, 9, 10, 10]) },
        { name: "Support to 'Makakalikasan' activities", indicator: "No. of Support conducted", data: createMonths(year, userId, role, "PI27", 1, [7, 6, 7, 9, 6, 7, 6, 10, 9, 8, 6, 6]) },
        { name: "Support to bloodletting activity", indicator: "No. of Support activity conducted", data: createMonths(year, userId, role, "PI27", 2, [3, 6, 7, 5, 5, 3, 5, 5, 8, 4, 6, 5]) },
        { name: "Coordination with Other Government Agencies (GA)", indicator: "No. coordinated", data: createMonths(year, userId, role, "PI27", 3, [9, 9, 9, 9, 9, 8, 8, 9, 8, 9, 8, 15]) }
      ]
    },
    {
      id: "PI28",
      title: "Number of investigative activities funded",
      activities: [
        { name: "monitoring of Investigation of Heinous Crimes", indicator: "No. of monitored crimes", data: createMonths(year, userId, role, "PI28", 0, [4, 0, 6, 4, 0, 4, 1, 2, 0, 1, 0, 6]) },
        { name: "Filing of Heinous and Sensational Crimes", indicator: "No. of Crimes Case Filed", data: createMonths(year, userId, role, "PI28", 1, [4, 0, 6, 4, 0, 4, 1, 2, 0, 1, 0, 3]) },
        { name: "Monitoring and Investigation of Violation of Specials laws", indicator: "No. of Investigation monitored", data: createMonths(year, userId, role, "PI28", 2, [96, 121, 99, 116, 97, 82, 120, 98, 104, 125, 137, 147]) }
      ]
    },
    {
      id: "PI29",
      title: "Number of special investigation cases requested for fund support",
      activities: [
        { name: "Creation and activation of SITG Cases", indicator: "# of SITG Cases Activated", data: createMonths(year, userId, role, "PI29", 0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]) },
        { name: "Creation of CIPLAN", indicator: "# of CIPLAN created", data: createMonths(year, userId, role, "PI29", 1, [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]) }
      ]
    }
  ];

  // Append extra rows from localStorage if any
  piDefinitions.forEach(pi => {
    const extraRows = parseInt(localStorage.getItem(`pi_extra_rows_${pi.id}`) || '0');
    for (let i = 0; i < extraRows; i++) {
      const idx = pi.activities.length;
      pi.activities.push({
        name: getSharedActivityName(pi.id, idx, "New Activity"),
        indicator: getSharedIndicatorName(pi.id, idx, "New Indicator"),
        data: createStaticMonths(year, userId, role, pi.id, idx, 0)
      });
    }
  });

  return piDefinitions;
};

const generateStructuredPIs = (
  year: string,
  subjectUser: User, 
  mode: 'normal' | 'zero' | 'consolidated' = 'normal',
  dashboardType: 'OPERATIONAL' | 'CHQ' | 'TACTICAL' = 'OPERATIONAL'
): PIData[] => {
  const allStationIds = [
    'st-1', 'st-2', 'st-3', 'st-4', 'st-5', 'st-6', 'st-7', 'st-8', 'st-9', 'st-10', 'st-11'
  ];
  const allChqIds = [
    'chq-1', 'chq-2', 'chq-3', 'chq-4', 'chq-5', 'chq-6', 'chq-7', 'chq-8', 'chq-9'
  ];

  const definitions = getPIDefinitions(year, subjectUser.id, subjectUser.role);

  return definitions.map((def) => {
    const isPercentagePI = def.id === "PI4" || def.id === "PI15" || def.id === "PI16" || def.id === "PI18" || def.id === "PI20" || def.id === "PI21" || def.id === "PI24" || def.id === "PI25";
    
    return {
      id: def.id,
      title: getSharedPITitle(def.id, def.title),
      activities: def.activities.map((act, idx) => {
        let monthsData: MonthData[];

        if (mode === 'consolidated') {
          monthsData = MONTHS.map((_, mIdx) => {
            let totalValue = 0;
            let targetIds: string[] = [];

            if (dashboardType === 'OPERATIONAL') {
              targetIds = [...allStationIds, ...allChqIds];
            } else if (dashboardType === 'CHQ') {
              targetIds = allChqIds;
            } else {
              // Tactical Dashboard: Consolidate Stations + CMFC (st-1 to st-11)
              targetIds = allStationIds;
            }

            targetIds.forEach(unitId => {
              totalValue += getSharedAccomplishment(year, unitId, def.id, idx, mIdx, 0);
            });
            
            return {
              value: isPercentagePI ? Math.round(totalValue / targetIds.length) : totalValue,
              files: []
            };
          });
        } else if (mode === 'zero') {
          monthsData = MONTHS.map(() => ({ value: 0, files: [] }));
        } else {
          monthsData = act.data;
        }

        return {
          activity: getSharedActivityName(def.id, idx, act.name),
          indicator: getSharedIndicatorName(def.id, idx, act.indicator),
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
  const [dataMode, setDataMode] = useState<'normal' | 'zero' | 'consolidated'>('normal');
  const [piData, setPiData] = useState<PIData[]>([]);
  
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  const [editingHeader, setEditingHeader] = useState<boolean>(false);
  const [editingLabel, setEditingLabel] = useState<{ rowIdx: number; field: 'activity' | 'indicator' } | null>(null);
  const [textEditValue, setTextEditValue] = useState<string>('');

  const [fileViewerCell, setFileViewerCell] = useState<{ rowIdx: number; monthIdx: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dashboardYear = useMemo(() => {
    const match = title.match(/\d{4}/);
    return match ? match[0] : '2026';
  }, [title]);

  const dashboardType = useMemo(() => {
    if (title.includes("CHQ OPERATIONAL")) return 'CHQ';
    if (title.includes("TACTICAL")) return 'TACTICAL';
    return 'OPERATIONAL';
  }, [title]);

  const refreshData = () => {
    const isTargetYear = dashboardYear === '2026';
    const isTacticalView = dashboardType === 'TACTICAL';

    let mode: 'normal' | 'zero' | 'consolidated' = 'normal';

    const isMainView = subjectUser.id === currentUser.id;
    const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SUB_ADMIN;
    const isCCADU = currentUser.name === 'CHQ CCADU';

    if (isMainView) {
      if (isAdmin) {
        mode = 'consolidated';
      } else if (isCCADU && isTacticalView && isTargetYear) {
        // Specifically consolidate station data for CCADU on Tactical 2026
        mode = 'consolidated';
      } else if (currentUser.role === UserRole.CHQ) {
        // Other CHQ see their own data only by default (mode normal)
        mode = 'normal';
      } else if (currentUser.role === UserRole.STATION) {
        // Station users always see separated data (mode normal)
        mode = 'normal';
      }
    } else if (isAdmin) {
      // Admin viewing someone else: show specific data (mode normal)
      mode = 'normal';
    }
    
    setDataMode(mode);
    setPiData(generateStructuredPIs(dashboardYear, subjectUser, mode, dashboardType));
  };

  useEffect(() => {
    refreshData();
  }, [title, currentUser, subjectUser, dashboardYear]);

  const displayedPiData = useMemo(() => {
    // CCADU Account filtering: on CHQ Operational Dashboard 2026, hide all except PI1, PI2, PI3, PI8, PI27
    const isCCADU = currentUser.name === 'CHQ CCADU';
    const isCHQDashboard = dashboardType === 'CHQ';
    const isYear2026 = dashboardYear === '2026';

    if (isCCADU && isCHQDashboard && isYear2026) {
      const allowedPIs = ['PI1', 'PI2', 'PI3', 'PI8', 'PI27'];
      return piData.filter(pi => allowedPIs.includes(pi.id));
    }
    return piData;
  }, [piData, currentUser.name, dashboardType, dashboardYear]);

  const currentPI = useMemo(() => {
    const found = displayedPiData.find(pi => pi.id === activeTab);
    return found || displayedPiData[0];
  }, [displayedPiData, activeTab]);

  useEffect(() => {
    if (displayedPiData.length > 0 && !displayedPiData.some(pi => pi.id === activeTab)) {
      setActiveTab(displayedPiData[0].id);
    }
  }, [displayedPiData, activeTab]);

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const isSubAdmin = currentUser.role === UserRole.SUB_ADMIN;
  const isOwner = currentUser.id === subjectUser.id;
  const isStationAccount = currentUser.role === UserRole.STATION;
  const subjectIsStation = subjectUser.role === UserRole.STATION;

  const canInteractWithFiles = (isStationAccount && isOwner) || ((isSuperAdmin || isSubAdmin) && subjectIsStation);
  const canManageFiles = isStationAccount && isOwner;

  const handleCellClick = (rowIdx: number, monthIdx: number, val: number) => {
    const isAdmin = isSuperAdmin || isSubAdmin;
    const canEditValue = (isAdmin && dataMode !== 'consolidated') || (isStationAccount && isOwner);
    
    if (canEditValue) {
      setEditingCell({ rowIdx, monthIdx });
      setEditValue(String(val));
    }
  };

  const saveEditValue = () => {
    if (!editingCell) return;
    const newValue = parseInt(editValue, 10);
    if (isNaN(newValue)) {
      setEditingCell(null);
      return;
    }

    const key = `accomplishment_${dashboardYear}_${subjectUser.id}_${activeTab}_${editingCell.rowIdx}_${editingCell.monthIdx}`;
    localStorage.setItem(key, String(newValue));

    setPiData(prev => prev.map(pi => {
      if (pi.id !== activeTab) return pi;
      const newActivities = [...pi.activities];
      const activity = { ...newActivities[editingCell.rowIdx] };
      const newMonths = [...activity.months];
      newMonths[editingCell.monthIdx].value = newValue;
      activity.total = newMonths.reduce((a, b) => a + b.value, 0);
      newActivities[editingCell.rowIdx] = activity;
      return { ...pi, activities: newActivities };
    }));
    setEditingCell(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fileViewerCell || !e.target.files?.length || !canManageFiles) return;
    const uploadedFiles: MonthFile[] = Array.from(e.target.files).map((f: File) => ({
      id: Math.random().toString(36).substring(2, 11),
      name: f.name,
      url: '#', 
      type: f.type,
      uploadedAt: new Date().toISOString()
    }));

    setPiData(prev => prev.map(pi => {
      if (pi.id !== activeTab) return pi;
      const newActivities = [...pi.activities];
      const activity = { ...newActivities[fileViewerCell.rowIdx] };
      const newMonths = [...activity.months];
      const monthData = { ...newMonths[fileViewerCell.monthIdx] };
      monthData.files = [...monthData.files, ...uploadedFiles];
      newMonths[fileViewerCell.monthIdx] = monthData;
      
      const key = `files_${dashboardYear}_${subjectUser.id}_${activeTab}_${fileViewerCell.rowIdx}_${fileViewerCell.monthIdx}`;
      localStorage.setItem(key, JSON.stringify(monthData.files));
      
      activity.months = newMonths;
      newActivities[fileViewerCell.rowIdx] = activity;
      return { ...pi, activities: newActivities };
    }));
  };

  const removeFile = (fileId: string) => {
    if (!fileViewerCell || !canManageFiles) return;
    setPiData(prev => prev.map(pi => {
      if (pi.id !== activeTab) return pi;
      const newActivities = [...pi.activities];
      const activity = { ...newActivities[fileViewerCell.rowIdx] };
      const newMonths = [...activity.months];
      const monthData = { ...newMonths[fileViewerCell.monthIdx] };
      monthData.files = monthData.files.filter(f => f.id !== fileId);
      newMonths[fileViewerCell.monthIdx] = monthData;
      
      const key = `files_${dashboardYear}_${subjectUser.id}_${activeTab}_${fileViewerCell.rowIdx}_${fileViewerCell.monthIdx}`;
      localStorage.setItem(key, JSON.stringify(monthData.files));

      activity.months = newMonths;
      newActivities[fileViewerCell.rowIdx] = activity;
      return { ...pi, activities: newActivities };
    }));
  };

  const handleLabelClick = (rowIdx: number, field: 'activity' | 'indicator', currentVal: string) => {
    if (!isSuperAdmin) return;
    setEditingLabel({ rowIdx, field });
    setTextEditValue(currentVal);
  };

  const handleHeaderClick = (currentVal: string) => {
    if (!isSuperAdmin) return;
    setEditingHeader(true);
    setTextEditValue(currentVal);
  };

  const saveLabel = () => {
    if (!editingLabel) return;
    const piId = activeTab;
    const { rowIdx, field } = editingLabel;
    const key = `pi_${field}_${piId}_${rowIdx}`;
    localStorage.setItem(key, textEditValue);
    
    setPiData(prev => prev.map(pi => {
      if (pi.id !== piId) return pi;
      const newActivities = [...pi.activities];
      newActivities[rowIdx] = { ...newActivities[rowIdx], [field]: textEditValue };
      return { ...pi, activities: newActivities };
    }));
    setEditingLabel(null);
  };

  const saveHeader = () => {
    if (!editingHeader) return;
    const piId = activeTab;
    const key = `pi_title_${piId}`;
    localStorage.setItem(key, textEditValue);
    
    setPiData(prev => prev.map(pi => {
      if (pi.id !== piId) return pi;
      return { ...pi, title: textEditValue };
    }));
    setEditingHeader(false);
  };

  const handleAddActivity = () => {
    if (!isSuperAdmin) return;
    
    setPiData(prev => prev.map(pi => {
      if (pi.id !== activeTab) return pi;
      
      const newActivityIdx = pi.activities.length;
      const defaultName = "New Activity";
      const defaultIndicator = "New Indicator";
      
      // Persist metadata for labels
      localStorage.setItem(`pi_activity_${activeTab}_${newActivityIdx}`, defaultName);
      localStorage.setItem(`pi_indicator_${activeTab}_${newActivityIdx}`, defaultIndicator);
      
      // Persist that an extra row was added
      const currentExtraCount = parseInt(localStorage.getItem(`pi_extra_rows_${activeTab}`) || '0');
      localStorage.setItem(`pi_extra_rows_${activeTab}`, String(currentExtraCount + 1));

      const newActivity: PIActivity = {
        activity: defaultName,
        indicator: defaultIndicator,
        months: Array.from({ length: 12 }).map(() => ({ value: 0, files: [] })),
        total: 0
      };
      
      return { ...pi, activities: [...pi.activities, newActivity] };
    }));
  };

  const handleExportPPT = async () => {
    if (!currentPI) return;
    setExporting(true);
    try {
      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_WIDE";
      pptx.defineSlideMaster({
        title: "OPERATIONAL_DASHBOARD_MASTER",
        background: { color: "FFFFFF" },
        objects: [
          { text: { text: title, options: { x: 0.5, y: 0.2, w: 12.3, fontSize: 28, bold: true, color: "0f172a", align: "center" } } },
          { text: { text: `Nexus Admin - Performance Monitoring System - ${subjectUser.name}`, options: { x: 0.5, y: 0.6, w: 12.3, fontSize: 10, color: "64748b", align: "center" } } }
        ],
      });
      displayedPiData.forEach((pi) => {
        const slide = pptx.addSlide({ masterName: "OPERATIONAL_DASHBOARD_MASTER" });
        const piNum = pi.id.replace('PI', '');
        slide.addText(`Performance Indicator #${piNum}: ${pi.title}`, { x: 0.5, y: 0.9, w: 12.3, fontSize: 14, bold: true, color: "334155", align: "center" });
        const tableData = [];
        tableData.push([
          { text: "Activity", options: { fill: "FFFF00", bold: true, align: "center", border: { pt: 1, color: "cbd5e1" }, rowspan: 2 } },
          { text: "Performance Indicator", options: { fill: "FFFF00", bold: true, align: "center", border: { pt: 1, color: "cbd5e1" }, rowspan: 2 } },
          { text: `${dashboardYear} Accomplishment`, options: { fill: "00B0F0", bold: true, align: "center", color: "FFFFFF", border: { pt: 1, color: "cbd5e1" }, colspan: 12 } },
          { text: "Total", options: { fill: "FFFF00", bold: true, align: "center", border: { pt: 1, color: "cbd5e1" }, rowspan: 2 } }
        ]);
        tableData.push(MONTHS.map(m => ({ text: m.toUpperCase(), options: { fill: "FFFF00", bold: true, align: "center", border: { pt: 1, color: "cbd5e1" } } })));
        
        pi.activities.forEach((act) => {
          tableData.push([
            { text: act.activity, options: { border: { pt: 1, color: "cbd5e1" }, fontSize: 8 } },
            { text: act.indicator, options: { border: { pt: 1, color: "cbd5e1" }, fontSize: 8 } },
            ...act.months.map(m => ({ text: String(m.value), options: { align: "center", color: "1d4ed8", border: { pt: 1, color: "cbd5e1" }, fontSize: 8 } })),
            { text: String(act.total), options: { bold: true, align: "center", fill: "F8FAFC", border: { pt: 1, color: "cbd5e1" }, fontSize: 8 } }
          ]);
        });
        slide.addTable(tableData, { x: 0.3, y: 1.3, w: 12.7, fontSize: 8, border: { pt: 0.5, color: "cbd5e1" } });
      });
      await pptx.writeFile({ fileName: `${title.replace(/\s+/g, '_')}.pptx` });
    } catch (e) { console.error(e); } finally { setExporting(false); }
  };

  if (!currentPI) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button onClick={onBack} className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition mb-3">
            <div className="p-1 rounded-full bg-slate-100 group-hover:bg-slate-200 transition"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></div>
            Back to Overview
          </button>
          <div className="flex flex-wrap items-center gap-3">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
             <span className="px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-lg uppercase tracking-widest">Unit View: {subjectUser.name}</span>
             {dataMode === 'consolidated' && <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest animate-pulse border border-indigo-400">CONSOLIDATED DISTRICT VIEW</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportPPT} disabled={exporting} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition disabled:opacity-50">{exporting ? 'Exporting...' : 'Export PPT'}</button>
          <button className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold">Full Report</button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex gap-1.5 whitespace-nowrap">
          {displayedPiData.map((pi) => (
            <button key={pi.id} onClick={() => setActiveTab(pi.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeTab === pi.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>PI {pi.id.replace('PI', '')}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
        <div className="bg-white py-3 px-6 border-b border-slate-300 flex justify-between items-center text-center">
          <div className="flex-1 flex items-center justify-center gap-4">
             {editingHeader ? (
               <div className="max-w-2xl mx-auto flex gap-2">
                  <input autoFocus className="flex-1 font-bold text-slate-800 text-sm md:text-base uppercase border-b-2 border-blue-500 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveHeader} onKeyDown={(e) => e.key === 'Enter' && saveHeader()} />
               </div>
             ) : (
               <h3 onClick={() => handleHeaderClick(currentPI.title)} className={`inline-block font-bold text-slate-800 text-sm md:text-base uppercase ${isSuperAdmin ? 'cursor-edit hover:bg-blue-50 px-2 rounded transition' : ''}`}>
                 PI # {activeTab.replace('PI', '')} – {currentPI.title}
                 {isSuperAdmin && <span className="ml-2 text-[10px] text-blue-400 opacity-0 group-hover:opacity-100">✎</span>}
               </h3>
             )}
             {isSuperAdmin && title.includes('2026') && (
               <button onClick={handleAddActivity} className="px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition active:scale-95 flex items-center gap-1 shadow-sm">
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                 Add Activity
               </button>
             )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] leading-tight">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase text-slate-900">Activity</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase text-slate-900">Performance Indicator</th>
                <th colSpan={12} className="border border-slate-300 bg-[#00B0F0] p-2 text-center text-white font-extrabold uppercase text-sm">{dashboardYear} Accomplishment</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-16 font-bold uppercase text-slate-900">Total</th>
              </tr>
              <tr>
                {MONTHS.map(m => (
                  <th key={m} className="border border-slate-300 bg-[#FFFF00] p-1.5 text-center font-bold text-[10px] w-11 uppercase text-slate-900">
                    {m.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentPI.activities.map((row, rIdx) => {
                const isPercent = activeTab === "PI4" || activeTab === "PI15" || activeTab === "PI16" || activeTab === "PI18" || activeTab === "PI20" || activeTab === "PI21" || activeTab === "PI24" || activeTab === "PI25";
                return (
                  <tr key={rIdx} className="hover:bg-blue-50/30 group">
                    <td className={`border border-slate-300 p-2 text-slate-800 ${isSuperAdmin ? 'hover:bg-blue-50 cursor-pointer' : ''}`} onClick={() => handleLabelClick(rIdx, 'activity', row.activity)}>
                       {editingLabel?.rowIdx === rIdx && editingLabel.field === 'activity' ? (
                         <input autoFocus className="w-full bg-white border border-blue-500 rounded px-1 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveLabel} onKeyDown={(e) => e.key === 'Enter' && saveLabel()} />
                       ) : (
                         <div className="flex justify-between items-center">
                           <span>{row.activity}</span>
                           {isSuperAdmin && <span className="text-[8px] text-blue-400 opacity-0 group-hover:opacity-100">✎</span>}
                         </div>
                       )}
                    </td>
                    <td className={`border border-slate-300 p-2 text-slate-800 ${isSuperAdmin ? 'hover:bg-blue-50 cursor-pointer' : ''}`} onClick={() => handleLabelClick(rIdx, 'indicator', row.indicator)}>
                       {editingLabel?.rowIdx === rIdx && editingLabel.field === 'indicator' ? (
                         <input autoFocus className="w-full bg-white border border-blue-500 rounded px-1 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveLabel} onKeyDown={(e) => e.key === 'Enter' && saveLabel()} />
                       ) : (
                         <div className="flex justify-between items-center">
                           <span>{row.indicator}</span>
                           {isSuperAdmin && <span className="text-[8px] text-blue-400 opacity-0 group-hover:opacity-100">✎</span>}
                         </div>
                       )}
                    </td>
                    {row.months.map((m, mIdx) => (
                      <td key={mIdx} className="border border-slate-300 p-1.5 text-center text-blue-700 font-medium group relative cursor-pointer hover:bg-blue-100" onClick={() => handleCellClick(rIdx, mIdx, m.value)}>
                        {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                          <input autoFocus className="w-full text-center bg-white border border-blue-500 rounded px-0.5 outline-none font-bold" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEditValue} onKeyDown={(e) => e.key === 'Enter' && saveEditValue()} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <div className="flex flex-col items-center">
                            <span>{m.value}{isPercent ? '%' : ''}</span>
                            {canInteractWithFiles && (
                              <div className="mt-1 flex items-center justify-center gap-1">
                                {m.files.length > 0 ? (
                                  <button onClick={(e) => { e.stopPropagation(); setFileViewerCell({ rowIdx: rIdx, monthIdx: mIdx }); }} className="text-[8px] text-blue-500 hover:text-blue-700 font-bold block bg-blue-50 px-1 rounded">({m.files.length} 📄)</button>
                                ) : (
                                  canManageFiles && (
                                    <button onClick={(e) => { e.stopPropagation(); setFileViewerCell({ rowIdx: rIdx, monthIdx: mIdx }); }} className="text-[8px] text-slate-300 hover:text-blue-500 font-bold px-1 opacity-0 group-hover:opacity-100 transition-opacity">+</button>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-900 bg-slate-50/50">{isPercent ? `${Math.round(row.total / 12)}%` : row.total}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold">
                <td colSpan={2} className="border border-slate-300 p-2 text-right uppercase text-slate-700">Total</td>
                {MONTHS.map((_, mIdx) => {
                  const colTotal = currentPI.activities.reduce((sum, row) => sum + row.months[mIdx].value, 0);
                  const isPercent = activeTab === "PI4" || activeTab === "PI15" || activeTab === "PI16" || activeTab === "PI18" || activeTab === "PI20" || activeTab === "PI21" || activeTab === "PI24" || activeTab === "PI25";
                  return (
                    <td key={mIdx} className="border border-slate-300 p-1.5 text-center text-blue-800 bg-slate-100/50">
                      {isPercent ? `${Math.round(colTotal / currentPI.activities.length)}%` : colTotal}
                    </td>
                  );
                })}
                <td className="border border-slate-300 p-1.5 text-center text-blue-900 bg-slate-200">
                  {activeTab === "PI4" || activeTab === "PI15" || activeTab === "PI16" || activeTab === "PI18" || activeTab === "PI20" || activeTab === "PI21" || activeTab === "PI24" || activeTab === "PI25"
                    ? `${Math.round(currentPI.activities.reduce((sum, row) => sum + row.total, 0) / (currentPI.activities.length * 12))}%`
                    : currentPI.activities.reduce((sum, row) => sum + row.total, 0)
                  }
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {fileViewerCell && canInteractWithFiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold">Files for {MONTHS[fileViewerCell.monthIdx]}</h3>
              <button onClick={() => setFileViewerCell(null)} className="p-2 text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-bold uppercase">Attachments ({currentPI.activities[fileViewerCell.rowIdx]?.months[fileViewerCell.monthIdx].files.length || 0})</h4>
                {canManageFiles && (
                  <>
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition">Upload Evidence</button>
                    <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  </>
                )}
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {!currentPI.activities[fileViewerCell.rowIdx]?.months[fileViewerCell.monthIdx].files.length ? (
                  <div className="text-center py-12 text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed">No evidence files uploaded yet.</div>
                ) : (
                  currentPI.activities[fileViewerCell.rowIdx].months[fileViewerCell.monthIdx].files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-white border rounded-xl hover:border-blue-200 transition">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center font-bold">📄</div>
                        <div>
                          <p className="text-sm font-bold truncate max-w-xs">{file.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition">View</button>
                        {canManageFiles && (
                          <button onClick={() => removeFile(file.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t text-right">
              <button onClick={() => setFileViewerCell(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalDashboard;