from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import ids
import time

app = FastAPI(title="Network IDS Dashboard API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Start IDS in background
@app.on_event("startup")
async def startup_event():
    ids.start_ids_thread()

@app.get("/api/stats")
async def get_stats():
    uptime = time.time() - ids.stats["start_time"]
    return {
        "total_packets": ids.stats["total_packets"],
        "active_devices": len(ids.stats["device_activity"]),
        "uptime_seconds": int(uptime),
        "alerts_count": len(ids.stats["recent_alerts"])
    }

@app.get("/api/devices")
async def get_devices():
    # Convert defaultdict to regular dict for JSON serialization
    devices = []
    for ip, data in ids.stats["device_activity"].items():
        devices.append({
            "ip": ip,
            "first_seen": data["first_seen"],
            "last_seen": data["last_seen"],
            "packet_count": data["packet_count"]
        })
    return sorted(devices, key=lambda x: x["packet_count"], reverse=True)

@app.get("/api/ports")
async def get_ports():
    # Return top 10 ports
    ports = []
    for port, count in ids.stats["port_stats"].items():
        ports.append({"port": port, "count": count})
    return sorted(ports, key=lambda x: x["count"], reverse=True)[:10]

@app.get("/api/alerts")
async def get_alerts():
    return ids.stats["recent_alerts"]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
