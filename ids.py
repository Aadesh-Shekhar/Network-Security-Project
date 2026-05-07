import argparse
import logging
import sys
import time
import sqlite3
import threading
from collections import defaultdict
from datetime import datetime

LOG_FILE = "ids_alerts.log"
DB_FILE = "ids_data.db"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("IDS")

# 🔥 LOWERED thresholds for easy detection
PORT_SCAN_THRESHOLD = 5
HIGH_FREQ_THRESHOLD = 10
TIME_WINDOW_SECONDS = 2

# Shared State for API
stats = {
    "total_packets": 0,
    "start_time": time.time(),
    "device_activity": defaultdict(lambda: {"first_seen": None, "last_seen": None, "packet_count": 0}),
    "port_stats": defaultdict(int),
    "recent_alerts": []
}

ip_state = defaultdict(lambda: {
    "ports": set(),
    "timestamps": [],
    "alerted_scan": False,
    "alerted_freq": False,
    "first_seen": None,
})

suspicious_ips = set()

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS alerts 
                     (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                      timestamp TEXT, src_ip TEXT, alert_type TEXT, detail TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS stats 
                     (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                      timestamp TEXT, total_packets INTEGER, active_ips INTEGER)''')
    conn.commit()
    conn.close()

def _record_alert(src_ip: str, alert_type: str, detail: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log.warning("ALERT [%s] from %s - %s", alert_type, src_ip, detail)
    
    # Update memory
    stats["recent_alerts"].insert(0, {"timestamp": timestamp, "src_ip": src_ip, "type": alert_type, "detail": detail})
    stats["recent_alerts"] = stats["recent_alerts"][:50] # Keep last 50
    
    # Update DB
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO alerts (timestamp, src_ip, alert_type, detail) VALUES (?, ?, ?, ?)",
                       (timestamp, src_ip, alert_type, detail))
        conn.commit()
        conn.close()
    except Exception as e:
        log.error("DB Error: %s", e)

    if src_ip not in suspicious_ips:
        suspicious_ips.add(src_ip)
        with open("suspicious_ips.txt", "a", encoding="utf-8") as fh:
            fh.write(src_ip + "\n")

def _prune_old_timestamps(ts_list, now):
    cutoff = now - TIME_WINDOW_SECONDS
    return [t for t in ts_list if t >= cutoff]

def process_packet(pkt):
    try:
        from scapy.layers.inet import IP, TCP, UDP

        if not pkt.haslayer(IP):
            return

        src_ip = pkt[IP].src
        dst_port = 0

        if pkt.haslayer(TCP):
            dst_port = pkt[TCP].dport
        elif pkt.haslayer(UDP):
            dst_port = pkt[UDP].dport

        now = time.time()
        
        # Update General Stats
        stats["total_packets"] += 1
        stats["port_stats"][dst_port] += 1
        
        device = stats["device_activity"][src_ip]
        if device["first_seen"] is None:
            device["first_seen"] = datetime.fromtimestamp(now).strftime("%Y-%m-%d %H:%M:%S")
            log.info("New source IP seen: %s", src_ip)
        device["last_seen"] = datetime.fromtimestamp(now).strftime("%H:%M:%S")
        device["packet_count"] += 1

        # IDS Logic
        state = ip_state[src_ip]
        if state["first_seen"] is None:
            state["first_seen"] = now

        state["timestamps"] = _prune_old_timestamps(state["timestamps"], now)
        state["timestamps"].append(now)

        if dst_port:
            state["ports"].add(dst_port)

        # 🚨 PORT SCAN
        if len(state["ports"]) >= PORT_SCAN_THRESHOLD and not state["alerted_scan"]:
            state["alerted_scan"] = True
            _record_alert(src_ip, "PORT SCAN", f"{len(state['ports'])} ports")

        # 🚨 FLOOD DETECTION
        pkt_rate = len(state["timestamps"]) / TIME_WINDOW_SECONDS
        if pkt_rate >= HIGH_FREQ_THRESHOLD and not state["alerted_freq"]:
            state["alerted_freq"] = True
            _record_alert(src_ip, "HIGH-FREQ", f"{pkt_rate:.1f} pkt/s")

    except Exception as e:
        log.error("Error: %s", e)

def run_live():
    try:
        from scapy.all import sniff
    except ImportError:
        log.error("Install scapy: pip install scapy")
        return

    log.info("Starting live capture...")
    sniff(prn=process_packet, store=False)

def start_ids_thread():
    init_db()
    thread = threading.Thread(target=run_live, daemon=True)
    thread.start()
    return thread

if __name__ == "__main__":
    init_db()
    log.info("IDS started at %s", datetime.now())
    run_live()