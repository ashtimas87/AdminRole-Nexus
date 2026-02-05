
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
  const rawDefinitions = [
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
    }
  ];

  return rawDefinitions.map(pi => {
    const activeActivities = [];
    
    // Process hardcoded activities
    pi.activities.forEach((act, idx) => {
      if (localStorage.getItem(`pi_deleted_${year}_${userId}_${pi.id}_${idx}`) !== 'true') {
        activeActivities.push({
          activity: getSharedActivityName(pi.id, idx, act.name),
          indicator: getSharedIndicatorName(pi.id, idx, act.indicator),
          months: act.data,
          total: act.data.reduce((a, b) => a + b.value, 0),
          originalIdx: idx // Keep reference for persistent deletion
        });
      }
    });

    // Process extra added rows
    const extraRows = parseInt(localStorage.getItem(`pi_extra_rows_${pi.id}`) || '0');
    for (let i = 0; i < extraRows; i++) {
      const idx = pi.activities.length + i;
      if (localStorage.getItem(`pi_deleted_${year}_${userId}_${pi.id}_${idx}`) !== 'true') {
        activeActivities.push({
          activity: getSharedActivityName(pi.id, idx, "New Activity"),
          indicator: getSharedIndicatorName(pi.id, idx, "New Indicator"),
          months: createStaticMonths(year, userId, role, pi.id, idx, 0),
          total: 0,
          originalIdx: idx
        });
      }
    }

    return {
      id: pi.id,
      title: getSharedPITitle(pi.id, pi.title),
      activities: activeActivities
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

  return definitions.map((def) => {
    const isPercentagePI = ["PI4", "PI15", "PI16", "PI18", "PI20", "PI21", "PI24", "PI25"].includes(def.id);
    
    return {
      id: def.id,
      title: def.title,
      activities: def.activities.map((act) => {
        let monthsData: MonthData[];

        if (mode === 'consolidated') {
          monthsData = MONTHS.map((_, mIdx) => {
            let totalValue = 0;
            let targetIds = dashboardType === 'OPERATIONAL' ? [...allStationIds, ...allChqIds] : (dashboardType === 'CHQ' ? allChqIds : allStationIds);

            targetIds.forEach(unitId => {
              totalValue += getSharedAccomplishment(year, unitId, def.id, act.originalIdx, mIdx, 0);
            });
            
            return {
              value: isPercentagePI ? Math.round(totalValue / targetIds.length) : totalValue,
              files: []
            };
          });
        } else if (mode === 'zero') {
          monthsData = MONTHS.map(() => ({ value: 0, files: [] }));
        } else {
          monthsData = act.months;
        }

        return {
          ...act,
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

  const dashboardYear = useMemo(() => title.match(/\d{4}/)?.[0] || '2026', [title]);
  const dashboardType = useMemo(() => title.includes("CHQ") ? 'CHQ' : (title.includes("TACTICAL") ? 'TACTICAL' : 'OPERATIONAL'), [title]);
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  const is2026 = dashboardYear === '2026';
  const isManagementAllowed = isSuperAdmin && is2026 && (dashboardType === 'CHQ' || dashboardType === 'TACTICAL');

  const refreshData = () => {
    const isMainView = subjectUser.id === currentUser.id;
    const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SUB_ADMIN;
    let mode: 'normal' | 'zero' | 'consolidated' = 'normal';

    if (isMainView && isAdmin) mode = 'consolidated';
    else if (isMainView && currentUser.name === 'CHQ CCADU' && dashboardType === 'TACTICAL' && is2026) mode = 'consolidated';
    
    setDataMode(mode);
    setPiData(generateStructuredPIs(dashboardYear, subjectUser, mode, dashboardType));
  };

  useEffect(() => { refreshData(); }, [title, currentUser, subjectUser, dashboardYear]);

  const displayedPiData = useMemo(() => {
    if (currentUser.name === 'CHQ CCADU' && dashboardType === 'CHQ' && is2026) {
      const allowed = ['PI1', 'PI2', 'PI3', 'PI8', 'PI27'];
      return piData.filter(pi => allowed.includes(pi.id));
    }
    return piData;
  }, [piData, currentUser.name, dashboardType, is2026]);

  const currentPI = useMemo(() => displayedPiData.find(pi => pi.id === activeTab) || displayedPiData[0], [displayedPiData, activeTab]);

  const handleCellClick = (rowIdx: number, monthIdx: number, val: number) => {
    const isAdmin = isSuperAdmin || currentUser.role === UserRole.SUB_ADMIN;
    if ((isAdmin && dataMode !== 'consolidated') || (currentUser.role === UserRole.STATION && currentUser.id === subjectUser.id)) {
      setEditingCell({ rowIdx, monthIdx });
      setEditValue(String(val));
    }
  };

  const saveEditValue = () => {
    if (!editingCell || !currentPI) return;
    const newValue = parseInt(editValue, 10) || 0;
    const originalIdx = currentPI.activities[editingCell.rowIdx].originalIdx;
    localStorage.setItem(`accomplishment_${dashboardYear}_${subjectUser.id}_${activeTab}_${originalIdx}_${editingCell.monthIdx}`, String(newValue));
    refreshData();
    setEditingCell(null);
  };

  const handleAddActivity = () => {
    if (!isSuperAdmin) return;
    const currentExtraCount = parseInt(localStorage.getItem(`pi_extra_rows_${activeTab}`) || '0');
    localStorage.setItem(`pi_extra_rows_${activeTab}`, String(currentExtraCount + 1));
    refreshData();
  };

  const handleDeleteActivity = (piId: string, rowIdxInState: number) => {
    if (!isSuperAdmin || !window.confirm('Are you sure you want to remove this activity from the dashboard?')) return;
    const activity = currentPI.activities[rowIdxInState];
    localStorage.setItem(`pi_deleted_${dashboardYear}_${subjectUser.id}_${piId}_${activity.originalIdx}`, 'true');
    refreshData();
  };

  const saveLabel = () => {
    if (!editingLabel || !currentPI) return;
    const originalIdx = currentPI.activities[editingLabel.rowIdx].originalIdx;
    localStorage.setItem(`pi_${editingLabel.field}_${activeTab}_${originalIdx}`, textEditValue);
    refreshData();
    setEditingLabel(null);
  };

  const saveHeader = () => {
    if (!editingHeader) return;
    localStorage.setItem(`pi_title_${activeTab}`, textEditValue);
    refreshData();
    setEditingHeader(false);
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
          { text: { text: title, options: { x: 0.5, y: 0.2, w: 12.3, fontSize: 28, bold: true, color: "0f172a", align: "center" } } },
          { text: { text: `AdminRole - Monitoring System - ${subjectUser.name}`, options: { x: 0.5, y: 0.6, w: 12.3, fontSize: 10, color: "64748b", align: "center" } } }
        ],
      });
      displayedPiData.forEach(pi => {
        const slide = pptx.addSlide({ masterName: "MASTER" });
        slide.addText(`PI #${pi.id.replace('PI', '')}: ${pi.title}`, { x: 0.5, y: 0.9, w: 12.3, fontSize: 14, bold: true, align: "center" });
        const tableData = [[
          { text: "Activity", options: { fill: "FFFF00", bold: true, rowspan: 2 } },
          { text: "Indicator", options: { fill: "FFFF00", bold: true, rowspan: 2 } },
          { text: `${dashboardYear} Accomplishment`, options: { fill: "00B0F0", bold: true, color: "FFFFFF", colspan: 12 } },
          { text: "Total", options: { fill: "FFFF00", bold: true, rowspan: 2 } }
        ], MONTHS.map(m => ({ text: m, options: { fill: "FFFF00", bold: true } }))];
        pi.activities.forEach(act => tableData.push([
          act.activity, act.indicator, ...act.months.map(m => String(m.value)), String(act.total)
        ]));
        slide.addTable(tableData, { x: 0.3, y: 1.3, w: 12.7, fontSize: 8 });
      });
      await pptx.writeFile({ fileName: `${title}.pptx` });
    } catch (e) { console.error(e); } finally { setExporting(false); }
  };

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
             <span className="px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-lg uppercase tracking-widest">Unit: {subjectUser.name}</span>
             {dataMode === 'consolidated' && <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-400">CONSOLIDATED</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPPT} disabled={exporting} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition">PPT Export</button>
          {isManagementAllowed && <button onClick={handleAddActivity} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">+ Add Activity</button>}
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex gap-1.5 whitespace-nowrap">
          {displayedPiData.map((pi) => (
            <button key={pi.id} onClick={() => setActiveTab(pi.id)} className={`px-4 py-2 rounded-lg text-xs font-black transition-all border ${activeTab === pi.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>PI {pi.id.replace('PI', '')}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
        <div className="bg-white py-4 px-6 border-b border-slate-300 flex justify-center items-center text-center">
             {editingHeader ? (
               <input autoFocus className="max-w-xl flex-1 font-bold text-slate-800 text-center uppercase border-b-2 border-blue-500 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveHeader} onKeyDown={(e) => e.key === 'Enter' && saveHeader()} />
             ) : (
               <h3 onClick={() => isSuperAdmin && (setEditingHeader(true) || setTextEditValue(currentPI.title))} className={`inline-block font-black text-slate-800 text-base uppercase ${isSuperAdmin ? 'cursor-pointer hover:bg-blue-50 px-2 rounded transition' : ''}`}>
                 PI # {activeTab.replace('PI', '')} – {currentPI.title}
               </h3>
             )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px] leading-tight">
            <thead>
              <tr>
                {isManagementAllowed && <th rowSpan={2} className="border border-slate-300 bg-slate-900 p-2 text-white w-12 font-bold uppercase">Action</th>}
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase text-slate-900">Activity</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-72 font-bold uppercase text-slate-900">Performance Indicator</th>
                <th colSpan={12} className="border border-slate-300 bg-[#00B0F0] p-2 text-center text-white font-extrabold uppercase text-sm">{dashboardYear} Accomplishment</th>
                <th rowSpan={2} className="border border-slate-300 bg-[#FFFF00] p-2 text-center w-16 font-bold uppercase text-slate-900">Total</th>
              </tr>
              <tr>
                {MONTHS.map(m => (
                  <th key={m} className="border border-slate-300 bg-[#FFFF00] p-1.5 text-center font-bold text-[10px] w-11 uppercase text-slate-900">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentPI.activities.map((row, rIdx) => {
                const isPercent = ["PI4", "PI15", "PI16", "PI18", "PI20", "PI21", "PI24", "PI25"].includes(activeTab);
                return (
                  <tr key={rIdx} className="hover:bg-blue-50/30 group">
                    {isManagementAllowed && (
                      <td className="border border-slate-300 p-2 text-center">
                        <button onClick={() => handleDeleteActivity(activeTab, rIdx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete Row">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    )}
                    <td className={`border border-slate-300 p-2 text-slate-800 ${isSuperAdmin ? 'hover:bg-blue-50 cursor-pointer font-semibold' : ''}`} onClick={() => isSuperAdmin && (setEditingLabel({ rIdx, field: 'activity' }) || setTextEditValue(row.activity))}>
                       {editingLabel?.rIdx === rIdx && editingLabel.field === 'activity' ? (
                         <input autoFocus className="w-full bg-white border border-blue-500 rounded px-1 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveLabel} onKeyDown={(e) => e.key === 'Enter' && saveLabel()} />
                       ) : row.activity}
                    </td>
                    <td className={`border border-slate-300 p-2 text-slate-800 ${isSuperAdmin ? 'hover:bg-blue-50 cursor-pointer font-semibold' : ''}`} onClick={() => isSuperAdmin && (setEditingLabel({ rIdx, field: 'indicator' }) || setTextEditValue(row.indicator))}>
                       {editingLabel?.rIdx === rIdx && editingLabel.field === 'indicator' ? (
                         <input autoFocus className="w-full bg-white border border-blue-500 rounded px-1 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveLabel} onKeyDown={(e) => e.key === 'Enter' && saveLabel()} />
                       ) : row.indicator}
                    </td>
                    {row.months.map((m, mIdx) => (
                      <td key={mIdx} className="border border-slate-300 p-1.5 text-center text-blue-700 font-bold group relative cursor-pointer hover:bg-blue-100" onClick={() => handleCellClick(rIdx, mIdx, m.value)}>
                        {editingCell?.rowIdx === rIdx && editingCell?.monthIdx === mIdx ? (
                          <input autoFocus className="w-full text-center bg-white border border-blue-500 rounded px-0.5 outline-none font-black" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveEditValue} onKeyDown={(e) => e.key === 'Enter' && saveEditValue()} onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <div className="flex flex-col items-center">
                            <span>{m.value}{isPercent ? '%' : ''}</span>
                            {(currentUser.role === UserRole.STATION || isSuperAdmin) && (
                              <button onClick={(e) => { e.stopPropagation(); setFileViewerCell({ rowIdx: rIdx, monthIdx: mIdx }); }} className="mt-1 text-[8px] opacity-0 group-hover:opacity-100 text-blue-500 font-black">{m.files.length > 0 ? `(${m.files.length} 📄)` : '+'}</button>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="border border-slate-300 p-1.5 text-center font-black text-slate-900 bg-slate-100">{isPercent ? `${Math.round(row.total / 12)}%` : row.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OperationalDashboard;