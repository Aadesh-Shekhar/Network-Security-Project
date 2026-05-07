# Network Intrusion Detection System (IDS) Dashboard

A real-time network monitoring and intrusion detection system with a modern dashboard.

## Features
- **Real-time Packet Capture**: Monitors network traffic using Scapy.
- **Threat Detection**: 
  - **Port Scanning**: Detects multiple port access attempts from a single IP.
  - **Flooding/DoS**: Identifies high-frequency packet bursts.
- **Interactive Dashboard**: Built with React and Vite.
- **Backend API**: Powered by FastAPI.
- **Data Persistence**: Alerts and stats are logged to SQLite and a log file.

## Project Structure
- `app.py`: FastAPI server for the dashboard.
- `ids.py`: Core detection engine.
- `flood.py`: Utility script for testing detection.
- `frontend/`: React application code.

## Setup Instructions

### Backend
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the server:
   ```bash
   python app.py
   ```

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Requirements
- Python 3.8+
- Node.js (for frontend)
- Npcap/Libpcap (for Scapy live capture)
