# CPSMU Monitoring Hub

A professional role-based access control (RBAC) demonstration featuring Super Admin, Sub-Admin, CHQ, and Station user tiers with integrated Gemini-powered insights for each dashboard.

## Overview

This application provides a comprehensive monitoring dashboard tailored to different user roles within a hierarchical organization. It showcases advanced data management, including individual and consolidated views for performance indicators, target outlooks, and operational accomplishments.

## Features

- **Role-Based Access Control (RBAC):** Four distinct user roles with specific permissions and dashboard views.
- **Dynamic Dashboards:** Interactive dashboards for tracking monthly performance indicators (PIs).
- **Data Consolidation:** Admins can view aggregated data from all subordinate units.
- **Data Management:**
    - In-browser data persistence using `localStorage`.
    - Excel (`.xlsx`) import/export for both individual PIs and master templates.
- **File Uploads & Sync:** Securely upload and manage supporting documents (MOVs) for each data point, with a simulated sync to a central drive.
- **AI-Powered Insights:** (Demonstration) Integration with the Google Gemini API to provide strategic tips for each user role.

## User Roles & Test Credentials

The system is pre-populated with mock users. You can use the following credentials for testing:

| Role          | Email                       | Password      | Notes                                       |
|---------------|-----------------------------|---------------|---------------------------------------------|
| **Super Admin** | `barvickrunch@gmail.com`    | `Josepidal99` | Full control over all users and system data.|
| **Sub Admin**   | `soldevilla.victor.pnpti@gmail.com` | `admin123`  | Manages CHQ and Station units.            |
| **CHQ User**    | `carmu@gmail.com`           | `admin123`    | Represents a central headquarters unit.     |
| **Station User**| `station1@gmail.com`        | `admin123`    | Represents a local station unit.            |
| **Company User**| `cocpocmfc@gmail.com`       | `admin123`    | A special station-level unit.               |

*Note: There are 9 CHQ users and 11 Station users in total. You can find their credentials in `constants.ts`.*

## Getting Started

This project is a self-contained web application that runs entirely in the browser.

1.  Ensure all files (`index.html`, `index.tsx`, `App.tsx`, etc.) are in the same directory.
2.  Open `index.html` in a modern web browser.
3.  The application will load, and you can log in using the credentials above.

*No build step is required due to the use of an import map and CDN-hosted dependencies.*

## Technology Stack

- **Frontend:** React, TypeScript, TailwindCSS
- **AI Integration:** Google Gemini API (`@google/genai`)
- **Utilities:** `xlsx` for Excel operations

---
*This is a demonstration application. All data is stored locally in your browser's `localStorage` and is not transmitted to a server.*
