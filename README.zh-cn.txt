# CCOPS
A maintenance platform for managing private/public cloud hosts, supporting the maintenance of up to a hundred hosts.

Features:
* Web-based jump server
* Bulk host changes
* CMDB

# Project Structure

```
ccops
├── backend - Server side
├── frontend - Frontend
├── agent - Agent side
```

# Tech Stack

## Frontend
* Build Tool: Vite
* Framework: React
* Language: TypeScript
* UI Library: Ant Design
* State Management: Zustand
* Routing: React Router
* Network Requests: Fetch + React Query
* Styling: Tailwind CSS
* Editor: Monaco Editor
* Terminal: xterm.js

## Backend
* Framework: gin
* ORM: gorm
* Database: mysql
* Bulk Changes: ansible
* Simulated Terminal: ssh + websocket
* Data Collection: osquery
