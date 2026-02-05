
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PIData, UserRole, User, MonthFile, MonthData, PIActivity } from '../types';
import pptxgen from "pptxgenjs";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper to get shared definitions with year scoping
const getSharedActivityName = (year: string, piId: string, activityId: string, defaultName: string): string => {
  const stored = localStorage.getItem(`pi_activity_name_${year}_${piId}_${activityId}`);
  return stored || defaultName;
};

const getSharedIndicatorName = (year: string, piId: string, activityId: string, defaultIndicator: string): string => {
  const stored = localStorage.getItem(`pi_indicator_name_${year}_${piId}_${activityId}`);
  return stored || defaultIndicator;
};

const getSharedPITitle = (year: string, piId: string, defaultTitle: string): string => {
  const stored = localStorage.getItem(`pi_title_${year}_${piId}`);
  return stored || defaultTitle;
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
  return Array.from({ length: 12 }).map((_, mIdx) => ({
    value: getSharedAccomplishment(year, userId, piId, activityId, mIdx, isStation ? 0 : (defaultValues[mIdx] || 0)),
    files: getSharedFiles(year, userId, piId, activityId, mIdx)
  }));
};

const getPIDefinitions = (year: string, userId: string, role: UserRole) => {
  const baseDefinitions = [
    {
      id: "PI1",
      title: "Number of Community Awareness/Information Activities Initiated",
      activities: [
        { id: "pi1_a1", name: "Formulation of Stratcom Snapshots", indicator: "No. of stratcom snaphot formulated", defaults: Array(12).fill(1) },
        { id: "pi1_a2", name: "Social Media Analysis", indicator: "No. of Social Media Analysis conducted", defaults: Array(12).fill(13) },
        { id: "pi1_a3", name: "Implementation of IO", indicator: "No. of activities conducted", defaults: [10, 9, 9, 9, 9, 9, 9, 10, 9, 9, 10, 11] },
        { id: "pi1_a4", name: "Conduct of P.I.C.E.", indicator: "No. of PICE conducted", defaults: [56, 50, 51, 54, 50, 53, 51, 57, 54, 58, 55, 54] },
        { id: "pi1_a5", name: "Production of Leaflets and handouts as IEC Materials", indicator: "No. of Printed copies", defaults: [790, 691, 688, 757, 688, 721, 789, 688, 645, 766, 307, 688] },
        { id: "pi1_a6", name: "Production of Outdoor IEC Materials", indicator: "No. of Streamers/Tarpaulins/LED Wall Displayed", defaults: [23, 23, 24, 25, 23, 25, 25, 23, 24, 24, 29, 28] },
        { id: "pi1_a7", name: "Face-to-face Awareness Activities", indicator: "No. of Face-to-face Awareness conducted", defaults: [50, 50, 50, 50, 51, 51, 51, 51, 50, 52, 59, 64] },
        { id: "pi1_a8", name: "Dissemination of related news articles involving the PNP in region for info of Command Group", indicator: "No. of emails and SMS sent", defaults: Array(12).fill(36) },
        { id: "pi1_a9", name: "Management of PNP Social Media Pages and Accounts", indicator: "No. of account followers", defaults: [11, 11, 10, 9, 10, 10, 10, 11, 9, 10, 11, 13] },
        { id: "pi1_a10", name: "Social Media Post Boosting", indicator: "No. of target audience reached", defaults: [552, 511, 517, 570, 551, 660, 680, 644, 647, 557, 681, 712] },
        { id: "pi1_a11", name: "Social Media Engagement", indicator: "No. of Engagement", defaults: [39, 38, 38, 35, 36, 35, 36, 35, 39, 40, 42, 43] },
        { id: "pi1_a12", name: "Radio/TV/Live Streaming", indicator: "No. of guesting/show", defaults: [15, 14, 17, 15, 16, 14, 16, 14, 14, 14, 16, 14] },
        { id: "pi1_a13", name: "Press Briefing", indicator: "No. of Press Briefing conducted", defaults: [15, 14, 17, 16, 15, 14, 16, 16, 15, 18, 20, 17] },
        { id: "pi1_a14", name: "Reproduction and Distribution of GAD-Related IEC Materials", indicator: "No. of copies GAD-Related IEC Materials to be distributed", defaults: [15, 16, 16, 16, 15, 15, 15, 15, 15, 17, 19, 21] },
        { id: "pi1_a15", name: "Conduct Awareness activity relative to clan/family feuds settlement and conflict resolution", indicator: "No. of Lectures on Islamic Religious and Cultural Sensitivity", defaults: [14, 13, 14, 13, 14, 13, 14, 13, 13, 13, 12, 15] },
        { id: "pi1_a16", name: "Lectures on Islamic Religious and Cultural Sensitivity", indicator: "No. of Awareness activity relative to clan settlement and mediation", defaults: [19, 19, 17, 19, 17, 19, 19, 17, 19, 20, 30, 33] },
        { id: "pi1_a17", name: "Dialogue on Peacebuilding and Counter Radicalization", indicator: "No. of Dialogue on Peacebuilding conducted", defaults: [17, 17, 17, 16, 13, 17, 17, 17, 17, 18, 20, 22] }
      ]
    },
    {
      id: "PI2",
      title: "Number of sectoral groups/BPATs mobilized/organized",
      activities: [
        { id: "pi2_a1", name: "collaborative efforts with NGOs, CSOs, GAs and Non-GAs and other stakeholders activities", indicator: "No. of collaborative efforts activities conducted", defaults: [46, 43, 33, 33, 34, 35, 27, 26, 27, 27, 10, 25] }
      ]
    },
    {
      id: "PI3",
      title: "Number of participating respondents",
      activities: [
        { id: "pi3_a1", name: "Secretariat Meetings", indicator: "No. Secretariat Meetings conducted", defaults: Array(12).fill(5) },
        { id: "pi3_a2", name: "Convening of IO Working Group", indicator: "No. of activities conducted", defaults: Array(12).fill(6) },
        { id: "pi3_a3", name: "Activation of SyncCom", indicator: "No. of activities conducted", defaults: Array(12).fill(8) },
        { id: "pi3_a4", name: "Summing-up on Revitalized-Pulis Sa Barangay (R-PSB)", indicator: "No. of summing-up conducted", defaults: [11, 11, 11, 11, 11, 10, 10, 10, 10, 10, 9, 5] },
        { id: "pi3_a5", name: "Summing-up on Counter White Area Operations (CWAO)", indicator: "No. of summing-up conducted", defaults: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4] },
        { id: "pi3_a6", name: "StratCom support to NTF-ELCAC", indicator: "No. of activities conducted", defaults: [0, 2, 4, 2, 5, 4, 2, 5, 3, 4, 21, 17] },
        { id: "pi3_a7", name: "StratCom and ComRel Support to NTF-DPAGs", indicator: "No. of activities conducted", defaults: [24, 23, 25, 23, 26, 25, 23, 26, 24, 23, 21, 22] },
        { id: "pi3_a8", name: "StratCom Support to TF-Sanglahi Bravo", indicator: "No. of activities conducted", defaults: Array(12).fill(17) },
        { id: "pi3_a9", name: "TG PCR Operations for Mid-Term Elections", indicator: "No. of activities conducted", defaults: Array(12).fill(24) },
        { id: "pi3_a10", name: "Enhanced Feedback Mechanism thru SMS", indicator: "No. of activities conducted", defaults: [7, 7, 9, 7, 9, 5, 5, 5, 5, 5, 5, 6] },
        { id: "pi3_a11", name: "PNP Good Deeds", indicator: "No. of PNP Good Deeds", defaults: [17, 14, 11, 14, 17, 12, 15, 12, 15, 14, 15, 14] },
        { id: "pi3_a12", name: "Conduct dialogue, meetings, and workshops with different audiences", indicator: "No. of activities conducted", defaults: [18, 20, 20, 20, 20, 18, 22, 22, 20, 21, 19, 22] },
        { id: "pi3_a13", name: "Deployment of SRR team", indicator: "No. of SRR team deployed", defaults: Array(12).fill(25) },
        { id: "pi3_a14", name: "PNP Help and Food Bank Initiatives", indicator: "No. of activities initiated", defaults: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 7] },
        { id: "pi3_a15", name: "Maintenance and Operationalization of PNP Help Desks", indicator: "No of PNP Help Desk Maintained", defaults: Array(12).fill(6) },
        { id: "pi3_a16", name: "PNP Advocacy Support Groups and Force Multipliers", indicator: "No. of support activities conducted", defaults: [10, 10, 10, 10, 10, 11, 11, 11, 11, 11, 13, 14] },
        { id: "pi3_a17", name: "Inter-Agency Cooperation on Anti-Illegal Drugs", indicator: "No. of inter-agency activities conducted", defaults: [17, 17, 17, 18, 17, 17, 17, 18, 17, 16, 19, 17] },
        { id: "pi3_a18", name: "Recovery and Wellness Program", indicator: "No. of activities conducted", defaults: [8, 7, 7, 7, 8, 7, 7, 8, 8, 6, 7, 7] },
        { id: "pi3_a19", name: "Drug Awareness Activities", indicator: "No. of activities conducted", defaults: [9, 9, 9, 9, 9, 9, 10, 8, 9, 7, 7, 6] },
        { id: "pi3_a20", name: "Support to Barangay Drug Clearing Program", indicator: "No. of activities conducted", defaults: [15, 15, 15, 16, 15, 15, 16, 15, 15, 15, 15, 14] },
        { id: "pi3_a21", name: "Coordination, Implementation and monitoring of the Interfaith Squad System", indicator: "No. of activities conducted", defaults: [21, 22, 22, 22, 22, 19, 22, 23, 22, 21, 19, 22] },
        { id: "pi3_a22", name: "National Day of Remembrance for SAF 44", indicator: "No. of activities conducted", defaults: Array(12).fill(8) },
        { id: "pi3_a23", name: "EDSA People's Power Anniversary", indicator: "No. of activities conducted", defaults: Array(12).fill(9) },
        { id: "pi3_a24", name: "Philippine Independence Day", indicator: "No. of activities conducted", defaults: [13, 13, 13, 13, 13, 15, 13, 14, 13, 13, 12, 13] },
        { id: "pi3_a25", name: "National Heroes Day", indicator: "No. of activities conducted", defaults: [5, 4, 4, 4, 7, 4, 4, 4, 5, 4, 4, 4] },
        { id: "pi3_a26", name: "National Flag Day", indicator: "No. of activities conducted", defaults: Array(12).fill(9) },
        { id: "pi3_a27", name: "National Crime Prevention Week (NCPW)", indicator: "No. of activities conducted", defaults: Array(12).fill(9) },
        { id: "pi3_a28", name: "Celebration of National Women's Month", indicator: "No. of activities conducted", defaults: [5, 4, 4, 4, 7, 4, 4, 4, 5, 4, 4, 4] },
        { id: "pi3_a29", name: "18-Day Campaign to End-VAWC", indicator: "No. of activities conducted", defaults: Array(12).fill(6) },
        { id: "pi3_a30", name: "National Children's Month", indicator: "No. of activities conducted", defaults: [6, 6, 6, 6, 6, 6, 6, 7, 6, 6, 6, 7] }
      ]
    },
    {
      id: "PI4",
      title: "Percentage of accounted loose firearms against the estimated baseline data",
      activities: [
        { id: "pi4_a1", name: "JAPIC", indicator: "JAPIC conducted", defaults: [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
        { id: "pi4_a2", name: "Operations on loose firearms", indicator: "Operations on loose firearms conducted", defaults: [3, 4, 5, 3, 2, 2, 4, 0, 8, 3, 7, 3] },
        { id: "pi4_a3", name: "Bakal/Sita", indicator: "Bakal/Sita conducted", defaults: [796, 768, 794, 754, 794, 784, 761, 763, 754, 754, 574, 583] }
      ]
    },
    {
      id: "PI5",
      title: "Number of functional LACAP",
      activities: [
        { id: "pi5_a1", name: "P/CPOC meetings", indicator: "# P/CPOC meetings participated", defaults: [12, 13, 10, 11, 10, 8, 8, 8, 8, 12, 10, 11] },
        { id: "pi5_a2", name: "Oversight Committee Meetings", indicator: "# of Oversight Committee Meetings conducted", defaults: [52, 53, 49, 43, 43, 38, 38, 35, 35, 43, 39, 39] },
        { id: "pi5_a3", name: "Maintenance of AIDMC", indicator: "# of AIDMC maintained", defaults: Array(12).fill(1) },
        { id: "pi5_a4", name: "operations against highway robbery", indicator: "# of opns against highway robbery conducted", defaults: [2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1] },
        { id: "pi5_a5", name: "anti-bank robbery operations", indicator: "# of anti-bank robbery opns conducted", defaults: [4, 3, 3, 3, 2, 4, 1, 3, 4, 3, 4, 0] },
        { id: "pi5_a6", name: "operations against OCGs/PAGs", indicator: "# of opns against OCGs/PAGs conducted", defaults: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0] },
        { id: "pi5_a7", name: "operations against kidnapping", indicator: "# of opns against kidnapping conducted", defaults: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0] },
        { id: "pi5_a8", name: "operations against carnapping", indicator: "# of operations against carnapping conducted", defaults: [3, 2, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0] },
        { id: "pi5_a9", name: "operations against illegal gambling", indicator: "# of operations against illegal gambling conducted", defaults: [5, 7, 9, 11, 10, 6, 11, 9, 10, 9, 10, 10] },
        { id: "pi5_a10", name: "operations against illegal fishing", indicator: "# of operations against illegal fishing conducted", defaults: Array(12).fill(0) },
        { id: "pi5_a11", name: "operations against illegal logging", indicator: "# of operations against illegal logging conducted", defaults: [0, 1, 1, 1, 1, 0, 2, 2, 2, 1, 1, 3] },
        { id: "pi5_a12", name: "operations on anti-illegal drugs", indicator: "# of operations on anti-illegal drugs conducted", defaults: [61, 57, 53, 53, 49, 45, 58, 46, 56, 59, 49, 60] }
      ]
    },
    {
      id: "PI6",
      title: "Number of police stations utilizing PIPS",
      activities: [
        { id: "pi6_a1", name: "EMPO Assessment and Evaluations", indicator: "No. of EMPO Assessment and Evaluations conducted", defaults: [54, 57, 58, 58, 53, 53, 53, 53, 53, 53, 53, 49] },
        { id: "pi6_a2", name: "Field/sector inspection", indicator: "No. of Field/sector inspection conducted", defaults: Array(12).fill(138).map((v, i) => i === 0 ? 140 : v) }
      ]
    },
    {
      id: "PI7",
      title: "Number of Internal Security Operations conducted",
      activities: [
        { id: "pi7_a1", name: "Oversight Committee Meetings", indicator: "Oversight Committee Meetings on ISO conducted", defaults: Array(12).fill(0) },
        { id: "pi7_a2", name: "JPSCC meetings", indicator: "JPSCC meetings conducted", defaults: [4, 4, 4, 4, 5, 4, 4, 4, 4, 4, 3, 4] },
        { id: "pi7_a3", name: "Major LEO", indicator: "Major LEO conducted", defaults: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "pi7_a4", name: "Minor LEO", indicator: "Minor LEO conducted", defaults: [2, 0, 0, 0, 2, 1, 1, 0, 0, 0, 0, 0] },
        { id: "pi7_a5", name: "PPSP", indicator: "PPSP conducted", defaults: [31, 31, 31, 30, 30, 30, 30, 30, 30, 31, 30, 31] },
        { id: "pi7_a6", name: "Clearing operations in support to AFP territorial units", indicator: "Clearing operations conducted", defaults: Array(12).fill(0) }
      ]
    },
    {
      id: "PI8",
      title: "Number of target hardening measures conducted",
      activities: [
        { id: "pi8_a1", name: "Security Survey/Inspection", indicator: "# of Security Survey/Inspection conducted", defaults: [2, 0, 2, 2, 2, 2, 4, 2, 3, 2, 6, 2] },
        { id: "pi8_a2", name: "CI check/validation", indicator: "# of CI check/validation conducted", defaults: [22, 22, 16, 16, 19, 19, 18, 16, 21, 25, 7, 13] },
        { id: "pi8_a3", name: "CI monitoring", indicator: "# CI monitoring conducted", defaults: [14, 12, 5, 5, 5, 4, 6, 5, 8, 21, 7, 13] },
        { id: "pi8_a4", name: "Clearances issued to civilians", indicator: "# of Clearances issued to civilians", defaults: [6216, 4481, 3938, 3113, 3556, 3869, 3344, 2259, 4236, 2314, 1552, 705] },
        { id: "pi8_a5", name: "Clearances issued to PNP/AFP per", indicator: "# of Clearances issued to PNP/AFP per", defaults: [48, 53, 4, 148, 23, 16, 23, 64, 6, 19, 25, 38] },
        { id: "pi8_a6", name: "Threat assessment", indicator: "# of Threat assessment conducted", defaults: [1, 2, 2, 4, 2, 2, 2, 2, 0, 2, 0, 2] },
        { id: "pi8_a7", name: "SO during national events", indicator: "# of SO during national events conducted", defaults: [19, 19, 36, 17, 15, 15, 13, 17, 14, 14, 0, 696] },
        { id: "pi8_a8", name: "Security to vital installations", indicator: "# of Security to vital installations conducted", defaults: [52, 50, 51, 47, 48, 47, 48, 48, 47, 48, 0, 167] },
        { id: "pi8_a9", name: "VIP security protection", indicator: "# of VIP security protection", defaults: [31, 35, 24, 15, 19, 46, 53, 58, 50, 58, 0, 131] },
        { id: "pi8_a10", name: "collaborative efforts with NGOs...", indicator: "# of collaborative efforts conducted", defaults: [8, 6, 9, 9, 11, 6, 5, 5, 5, 5, 5, 10] },
        { id: "pi8_a11", name: "# of K9 patrols conducted", indicator: "# of K9 patrols conducted", defaults: [31, 41, 44, 38, 26, 43, 49, 56, 64, 45, 74, 68] },
        { id: "pi8_a12", name: "# of record check conducted", indicator: "# of record check conducted", defaults: [7, 8, 11, 9, 10, 18, 16, 12, 11, 14, 37, 42] },
        { id: "pi8_a13", name: "# of CI opns conducted", indicator: "# of CI opns conducted", defaults: [9, 12, 16, 15, 15, 24, 19, 19, 18, 17, 7, 27] },
        { id: "pi8_a14", name: "# of SIMEX conducted", indicator: "# of SIMEX conducted", defaults: [67, 69, 67, 67, 67, 66, 67, 68, 69, 76, 66, 94] },
        { id: "pi8_a15", name: "# of mobile patrols conducted", indicator: "# of mobile patrols conducted", defaults: [643, 629, 643, 630, 643, 630, 643, 643, 630, 643, 573, 639] },
        { id: "pi8_a16", name: "# of checkpoints conducted", indicator: "# of checkpoints conducted", defaults: [675, 659, 718, 712, 676, 690, 729, 678, 717, 748, 673, 787] }
      ]
    },
    {
      id: "PI9",
      title: "Percentage reduction of crimes involving foreign and domestic tourists",
      activities: [
        { id: "pi9_a1", name: "Maintenance of TPU", indicator: "# of TPU maintained", defaults: Array(12).fill(1) },
        { id: "pi9_a2", name: "Maintenance of TAC", indicator: "# of TAC maintained", defaults: Array(12).fill(1) },
        { id: "pi9_a3", name: "Maintenance of TAD", indicator: "# of TAD maintained", defaults: Array(12).fill(3) }
      ]
    },
    {
      id: "PI10",
      title: "Number of Police stations using COMPSTAT for crime prevention",
      activities: [
        { id: "pi10_a1", name: "Crime Information Reporting and Analysis System", indicator: "No. of data recorded", defaults: [282, 299, 327, 324, 284, 253, 310, 330, 314, 313, 267, 278] },
        { id: "pi10_a2", name: "e-Wanted Persons Information System", indicator: "No. of Wanted Persons recorded", defaults: [48, 104, 111, 67, 102, 83, 180, 92, 89, 137, 106, 69] },
        { id: "pi10_a3", name: "e-Rogues' Gallery System", indicator: "No. of eRogues recorded", defaults: [163, 185, 178, 179, 149, 157, 207, 169, 192, 216, 203, 151] },
        { id: "pi10_a4", name: "e-Rogues' Maintenance (3rd Qtr or as needed)", indicator: "No. of e-Rogues' Maintened", defaults: Array(12).fill(0) },
        { id: "pi10_a5", name: "e-Subpoena System", indicator: "No. of Subpoena recorded", defaults: [9, 8, 29, 29, 16, 16, 25, 25, 28, 21, 27, 24] },
        { id: "pi10_a6", name: "Proper encoding in CIDMS", indicator: "No. of CIDMS encoded", defaults: [7, 14, 12, 9, 4, 0, 0, 0, 0, 0, 0, 0] }
      ]
    },
    {
      id: "PI11",
      title: "Number of threat group neutralized",
      activities: [
        { id: "pi11_a1", name: "COPLANs formulated", indicator: "No. formulated", defaults: [0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0] },
        { id: "pi11_a2", name: "HVTs newly identified", indicator: "No. identified", defaults: [3, 2, 1, 3, 3, 3, 1, 1, 7, 0, 2, 1] },
        { id: "pi11_a3", name: "HVTs neutralized", indicator: "No. neutralized", defaults: [3, 3, 3, 5, 4, 4, 3, 1, 10, 0, 4, 4] },
        { id: "pi11_a4", name: "IRs processed", indicator: "No. processed", defaults: [45, 47, 39, 41, 50, 38, 36, 42, 78, 0, 82, 78] },
        { id: "pi11_a5", name: "IRs validated", indicator: "No. validated", defaults: [45, 47, 39, 41, 50, 38, 36, 42, 78, 0, 82, 78] }
      ]
    },
    {
      id: "PI12",
      title: "Number of utilized BINs",
      activities: [
        { id: "pi12_a1", name: "# of inventory made", indicator: "# of inventory made", defaults: [20, 20, 20, 20, 20, 31, 38, 43, 58, 59, 57, 51] },
        { id: "pi12_a2", name: "# of BINs documented/registered and maintained", indicator: "# documented", defaults: [20, 20, 20, 20, 20, 31, 38, 43, 58, 59, 57, 51] },
        { id: "pi12_a3", name: "# of IRs prepared and submitted", indicator: "# submitted", defaults: [45, 57, 39, 41, 50, 38, 36, 42, 78, 0, 82, 0] }
      ]
    },
    {
      id: "PI13",
      title: "Number of criminal cases filed",
      activities: [
        { id: "pi13_a1", name: "# of coordination with counterparts conducted", indicator: "# conducted", defaults: Array(12).fill(0) }
      ]
    },
    {
      id: "PI14",
      title: "Number of cases resulting to conviction/dismissal",
      activities: [
        { id: "pi14_a1", name: "Monitoring Cases Against Threat Group", indicator: "# monitored", defaults: Array(12).fill(0) }
      ]
    },
    {
      id: "PI15",
      title: "Percentage of Trained investigative personnel",
      activities: [
        { id: "pi15_a1", name: "CIC", indicator: "No. in inventory", defaults: [90, 87, 89, 89, 90, 93, 94, 97, 97, 93, 90, 90] },
        { id: "pi15_a2", name: "IOBC", indicator: "No. in inventory", defaults: [15, 15, 13, 13, 14, 14, 14, 13, 13, 13, 13, 13] }
      ]
    },
    {
      id: "PI16",
      title: "Percentage of investigative positions filled up with trained investigators",
      activities: [
        { id: "pi16_a1", name: "Screening and evaluation of candidates for certified investigators", indicator: "# conducted", defaults: Array(12).fill(0) }
      ]
    },
    {
      id: "PI17",
      title: "Improvement in response time",
      activities: [
        { id: "pi17_a1", name: "Sports supervision and training component", indicator: "No. conducted", defaults: Array(12).fill(0) },
        { id: "pi17_a2", name: "Physical Conditioning and Combat Sport", indicator: "No. conducted", defaults: Array(12).fill(0) },
        { id: "pi17_a3", name: "Repair of patrol vehicles", indicator: "# repaired", defaults: Array(12).fill(0) },
        { id: "pi17_a4", name: "Maintenance of OPCEN", indicator: "# maintained", defaults: Array(12).fill(0) }
      ]
    },
    {
      id: "PI18",
      title: "Percentage of dedicated investigators assigned to handle specific cases",
      activities: [
        { id: "pi18_a1", name: "Conduct case build up and investigation for filing of cases", indicator: "% handled", defaults: Array(12).fill(100) }
      ]
    },
    {
      id: "PI19",
      title: "Number of recipients of a. awards b. punished",
      activities: [
        { id: "pi19_a1", name: "Monday Flag Raising/Awarding Ceremony", indicator: "# ceremonies conducted", defaults: [3, 4, 5, 4, 3, 5, 4, 3, 4, 4, 4, 4] },
        { id: "pi19_a2", name: "Issuing commendations", indicator: "# issued", defaults: [181, 115, 226, 66, 13, 16, 19, 19, 0, 172, 232, 149] },
        { id: "pi19_a3", name: "Pre-Charge Investigation (PCI)", indicator: "# PCI conducted", defaults: [1, 4, 1, 1, 2, 0, 1, 0, 0, 0, 0, 0] }
      ]
    },
    {
      id: "PI20",
      title: "Percentage of investigative personnel equipped with standard systems",
      activities: [
        { id: "pi20_a1", name: "Attendance in specialized training and related seminar", indicator: "% attended", defaults: Array(12).fill(100) }
      ]
    },
    {
      id: "PI21",
      title: "Percentage of Police Stations using e-based system",
      activities: [
        { id: "pi21_a1", name: "Crime Information Reporting and Analysis System", indicator: "No. recorded", defaults: [282, 299, 327, 324, 284, 253, 310, 330, 314, 313, 267, 278] }
      ]
    },
    {
      id: "PI22",
      title: "Number of cases filed in court/total # of cases investigated",
      activities: [
        { id: "pi22_a1", name: "Index Crime Investigated", indicator: "No. investigated", defaults: [39, 27, 35, 36, 22, 31, 36, 30, 25, 35, 28, 19] },
        { id: "pi22_a2", name: "Index Crime Filed", indicator: "No. filed", defaults: [38, 27, 34, 35, 22, 31, 34, 27, 22, 25, 22, 16] },
        { id: "pi22_a3", name: "Non-Index crime investigated", indicator: "No. investigated", defaults: [37, 36, 34, 12, 26, 25, 17, 29, 19, 144, 161, 165] },
        { id: "pi22_a4", name: "Cases filing on Non-Index", indicator: "No. filed", defaults: [37, 36, 34, 12, 24, 25, 16, 28, 18, 128, 142, 136] },
        { id: "pi22_a5", name: "Investigation on RIR", indicator: "No. investigated", defaults: [110, 115, 159, 160, 139, 115, 137, 173, 166, 134, 78, 94] },
        { id: "pi22_a6", name: "Cases filing on RIR", indicator: "No. filed", defaults: [107, 114, 157, 157, 135, 107, 127, 161, 132, 96, 50, 44] }
      ]
    },
    {
      id: "PI23",
      title: "Number of investigative infrastructure/equipment identified/accounted",
      activities: [
        { id: "pi23_a1", name: "Inventory, inspection & Accounting", indicator: "# conducted", defaults: Array(12).fill(1) }
      ]
    },
    {
      id: "PI24",
      title: "Percentage of fill-up of investigative equipment and infrastructure",
      activities: [
        { id: "pi24_a1", name: "Field investigative crime scene kit", indicator: "# accounted", defaults: Array(12).fill(21) },
        { id: "pi24_a2", name: "Police line", indicator: "# accounted", defaults: Array(12).fill(45) },
        { id: "pi24_a3", name: "Police Blotter", indicator: "# accounted", defaults: Array(12).fill(21) },
        { id: "pi24_a4", name: "Digital Camera", indicator: "# accounted", defaults: Array(12).fill(24) },
        { id: "pi24_a5", name: "Video Camera", indicator: "# accounted", defaults: Array(12).fill(0) }
      ]
    },
    {
      id: "PI25",
      title: "Percentage of IT-compliant stations",
      activities: [
        { id: "pi25_a1", name: "computer preventive maintenance and trouble shootings", indicator: "# conducted", defaults: [205, 205, 205, 205, 205, 211, 211, 211, 211, 211, 211, 211] },
        { id: "pi25_a2", name: "Maintenance of printers", indicator: "# maintained", defaults: Array(12).fill(95) },
        { id: "pi25_a3", name: "Internet payment", indicator: "# paid", defaults: Array(12).fill(28) },
        { id: "pi25_a4", name: "Telephone payment bills", indicator: "# paid", defaults: Array(12).fill(11) },
        { id: "pi25_a5", name: "cell phone payment bills", indicator: "# paid", defaults: Array(12).fill(39) }
      ]
    },
    {
      id: "PI26",
      title: "Number of linkages established",
      activities: [
        { id: "pi26_a1", name: "JSCC meetings", indicator: "# conducted", defaults: Array(12).fill(1) },
        { id: "pi26_a2", name: "Liaising", indicator: "# conducted", defaults: [21, 23, 21, 16, 14, 14, 14, 13, 13, 13, 14, 15] },
        { id: "pi26_a3", name: "coordination", indicator: "# conducted", defaults: [10, 14, 15, 10, 13, 12, 12, 12, 11, 12, 11, 11] }
      ]
    },
    {
      id: "PI27",
      title: "Number of community/stakeholders support generated",
      activities: [
        { id: "pi27_a1", name: "Memorandum of Agreement (MOA)/MOU signing", indicator: "# signing initiated", defaults: [9, 9, 10, 9, 9, 10, 9, 9, 9, 9, 10, 10] },
        { id: "pi27_a2", name: "Support to Makakalikasan activities (Tree planting etc)", indicator: "# activities conducted", defaults: [7, 6, 7, 9, 6, 7, 6, 10, 9, 8, 6, 6] },
        { id: "pi27_a3", name: "Support to bloodletting activity", indicator: "# activities conducted", defaults: [3, 6, 7, 5, 5, 3, 5, 5, 8, 4, 6, 5] },
        { id: "pi27_a4", name: "Coordination with Other Government Agencies (GA)", indicator: "# coordinated", defaults: [9, 9, 9, 9, 9, 8, 8, 9, 8, 9, 8, 15] }
      ]
    },
    {
      id: "PI28",
      title: "Number of investigative activities funded",
      activities: [
        { id: "pi28_a1", name: "Monitoring of Investigation of Heinous and Sensational Crimes", indicator: "# monitored", defaults: [4, 0, 6, 4, 0, 4, 1, 2, 0, 1, 0, 6] },
        { id: "pi28_a2", name: "Filing of Heinous and Sensational Crimes Case Filed", indicator: "# cases filed", defaults: [4, 0, 6, 4, 0, 4, 1, 2, 0, 1, 0, 3] },
        { id: "pi28_a3", name: "Monitoring and Investigation of Violation of Specials laws monitored", indicator: "# monitored", defaults: [96, 121, 99, 116, 97, 82, 120, 98, 104, 125, 137, 147] },
        { id: "pi28_a4", name: "Filing of Violation of Specials laws Case Filed", indicator: "# cases filed", defaults: [96, 121, 98, 116, 97, 82, 117, 97, 99, 110, 122, 121] },
        { id: "pi28_a5", name: "Conduct follow-up investigation of WCPD Cases", indicator: "# conducted", defaults: [1, 1, 0, 1, 1, 2, 1, 2, 2, 4, 0, 2] },
        { id: "pi28_a6", name: "Filing of cases against identified/neutralized suspects of WCPD", indicator: "# cases filed", defaults: [30, 15, 24, 24, 20, 26, 23, 28, 20, 29, 35, 15] },
        { id: "pi28_a7", name: "Initiate community advocacy campaign to combat TIP/CICL/CAAC/VAWC", indicator: "Initiated", defaults: [66, 56, 51, 56, 56, 51, 48, 49, 48, 41, 32, 33] }
      ]
    },
    {
      id: "PI29",
      title: "Number of special investigation cases requested for fund support",
      activities: [
        { id: "pi29_a1", name: "Creation and activation of SITG Cases", indicator: "# created", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0] },
        { id: "pi29_a2", name: "Creation of CIPLAN", indicator: "# created", defaults: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0] }
      ]
    }
  ];

  return baseDefinitions.map(pi => {
    const storedIds = localStorage.getItem(`pi_activity_ids_${year}_${pi.id}`);
    let activityIds = storedIds ? JSON.parse(storedIds) : pi.activities.map(a => a.id);

    const fullActivities = activityIds.map((aid: string) => {
      const baseAct = pi.activities.find(a => a.id === aid);
      return {
        id: aid,
        activity: getSharedActivityName(year, pi.id, aid, baseAct?.name || "New Activity"),
        indicator: getSharedIndicatorName(year, pi.id, aid, baseAct?.indicator || "New Indicator"),
        months: createMonthsForActivity(year, userId, role, pi.id, aid, baseAct?.defaults || Array(12).fill(0))
      };
    });

    return {
      id: pi.id,
      title: getSharedPITitle(year, pi.id, pi.title),
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
  const deletedPIs = JSON.parse(localStorage.getItem('deleted_pi_ids') || '[]');

  return definitions
    .filter(def => !deletedPIs.includes(def.id))
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
          } else if (mode === 'zero') {
            monthsData = MONTHS.map(() => ({ value: 0, files: [] }));
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
    let mode: 'normal' | 'zero' | 'consolidated' = 'normal';

    if (isMainView && isAdmin) {
      mode = 'consolidated';
    }
    
    setDataMode(mode);
    const data = generateStructuredPIs(dashboardYear, subjectUser, mode, dashboardType);
    setPiData(data);
    
    // Ensure active tab exists in filtered data
    if (data.length > 0 && !data.find(pi => pi.id === activeTab)) {
      setActiveTab(data[0].id);
    }
  };

  useEffect(() => { refreshData(); }, [title, currentUser, subjectUser, dashboardYear, dashboardType, activeTab]);

  const currentPI = useMemo(() => {
    return piData.find(pi => pi.id === activeTab) || piData[0];
  }, [piData, activeTab]);

  const handleCellClick = (rowIdx: number, monthIdx: number, val: number) => {
    const canEdit = (isSuperAdmin && dataMode !== 'consolidated') || (currentUser.role === UserRole.STATION && currentUser.id === subjectUser.id);
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

  const handleAddActivity = () => {
    if (!isSuperAdmin || !currentPI) return;
    const newId = `custom_${Date.now()}`;
    const storedIds = localStorage.getItem(`pi_activity_ids_${dashboardYear}_${activeTab}`);
    const activityIds = storedIds ? JSON.parse(storedIds) : currentPI.activities.map(a => a.id);
    
    const updatedIds = [...activityIds, newId];
    localStorage.setItem(`pi_activity_ids_${dashboardYear}_${activeTab}`, JSON.stringify(updatedIds));
    localStorage.setItem(`pi_activity_name_${dashboardYear}_${activeTab}_${newId}`, "New Activity");
    localStorage.setItem(`pi_indicator_name_${dashboardYear}_${activeTab}_${newId}`, "New Indicator");
    
    refreshData();
  };

  const handleDeleteActivity = (activityId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (!isSuperAdmin || !window.confirm("Are you sure you want to delete this activity? This will remove it for ALL accounts.")) return;
    const storedIds = localStorage.getItem(`pi_activity_ids_${dashboardYear}_${activeTab}`);
    const activityIds = storedIds ? JSON.parse(storedIds) : currentPI.activities.map(a => a.id);
    
    const newIds = activityIds.filter((id: string) => id !== activityId);
    localStorage.setItem(`pi_activity_ids_${dashboardYear}_${activeTab}`, JSON.stringify(newIds));
    localStorage.removeItem(`pi_activity_name_${dashboardYear}_${activeTab}_${activityId}`);
    localStorage.removeItem(`pi_indicator_name_${dashboardYear}_${activeTab}_${activityId}`);
    
    refreshData();
  };

  const handleClearData = () => {
    if (!isSuperAdmin || !currentPI) return;
    if (!confirm(`Are you sure you want to clear all data for this PI (${currentPI.title}) for unit ${subjectUser.name}? This cannot be undone.`)) return;

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
    
    if (!isSuperAdmin || !window.confirm(`Are you sure you want to delete the tab ${piId}? This will hide it for all users.`)) return;
    
    const deletedPIs = JSON.parse(localStorage.getItem('deleted_pi_ids') || '[]');
    const newDeleted = [...deletedPIs, piId];
    localStorage.setItem('deleted_pi_ids', JSON.stringify(newDeleted));
    
    refreshData();
  };

  const handleLabelEdit = (rowIdx: number, field: 'activity' | 'indicator', currentVal: string) => {
    if (!isSuperAdmin) return;
    setEditingLabel({ rowIdx, field });
    setTextEditValue(currentVal);
  };

  const saveLabel = () => {
    if (!editingLabel || !currentPI) return;
    const activityId = currentPI.activities[editingLabel.rowIdx].id;
    localStorage.setItem(`pi_${editingLabel.field}_name_${dashboardYear}_${activeTab}_${activityId}`, textEditValue);
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
    localStorage.setItem(`pi_title_${dashboardYear}_${activeTab}`, textEditValue);
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
          { text: { text: title, options: { x: 0.5, y: 0.2, w: 12.3, fontSize: 24, bold: true, align: "center" } } }
        ],
      });
      piData.forEach(pi => {
        const slide = pptx.addSlide({ masterName: "MASTER" });
        slide.addText(`PI #${pi.id.replace('PI', '')}: ${pi.title}`, { x: 0.5, y: 0.8, w: 12.3, fontSize: 14, bold: true, align: "center" });
        
        const tableData: any[][] = [[
          { text: "Activity", options: { fill: "FFFF00", bold: true, border: { pt: 1 } } },
          { text: "Indicator", options: { fill: "FFFF00", bold: true, border: { pt: 1 } } },
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
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 font-bold">All performance indicators have been deleted.</p>
        <button onClick={() => { localStorage.removeItem('deleted_pi_ids'); window.location.reload(); }} className="mt-4 text-blue-600 font-bold underline">Restore Defaults</button>
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
        <div className="flex gap-2">
          {isSuperAdmin && dataMode !== 'consolidated' && (
            <button onClick={handleClearData} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition">Clear Data</button>
          )}
          <button onClick={handleExportPPT} disabled={exporting} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition">PPT Export</button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex gap-1.5 whitespace-nowrap">
          {piData.map((pi) => (
            <div key={pi.id} className="relative group/tab">
              <button 
                onClick={() => setActiveTab(pi.id)} 
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all border flex items-center gap-2 ${activeTab === pi.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                PI {pi.id.replace('PI', '')}
                {isSuperAdmin && (
                  <span 
                    onClick={(e) => handleDeletePI(pi.id, e)} 
                    className="ml-1 opacity-60 hover:opacity-100 hover:text-red-400 transition-all p-0.5 rounded-full hover:bg-white/10"
                    title="Delete PI tab"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
        <div className="bg-white py-4 px-6 border-b border-slate-300 flex justify-center items-center text-center">
             {editingHeader ? (
               <input autoFocus className="max-w-xl flex-1 font-black text-slate-800 text-center uppercase border-b-2 border-blue-500 outline-none" value={textEditValue} onChange={(e) => setTextEditValue(e.target.value)} onBlur={saveHeader} onKeyDown={(e) => e.key === 'Enter' && saveHeader()} />
             ) : (
               <h3 onClick={handleHeaderEdit} className={`inline-block font-black text-slate-800 text-base uppercase ${isSuperAdmin ? 'cursor-pointer hover:bg-blue-50 px-2 rounded transition' : ''}`}>
                 PI # {activeTab.replace('PI', '')} – {currentPI.title}
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
                {isSuperAdmin && <th rowSpan={2} className="border border-slate-300 bg-slate-900 p-2 text-white w-24 font-bold uppercase">Action</th>}
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
                          <div className="flex flex-col items-center">
                            <span>{m.value}{isPercent ? '%' : ''}</span>
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="border border-slate-300 p-1.5 text-center font-black text-slate-900 bg-slate-100">{isPercent ? `${Math.round(row.total / 12)}%` : row.total}</td>
                    {isSuperAdmin && (
                      <td className="border border-slate-300 p-2 text-center bg-slate-50">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleLabelEdit(rIdx, 'activity', row.activity)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="Edit Activity">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={(e) => handleDeleteActivity(row.id, e)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition" title="Delete Activity">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {isSuperAdmin && (
                <tr className="bg-slate-50/50">
                  <td colSpan={isSuperAdmin ? 16 : 15} className="border border-slate-300 p-4 text-center">
                    <button onClick={handleAddActivity} className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition text-xs uppercase tracking-wider group">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                      </div>
                      Add New Activity Row
                    </button>
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
