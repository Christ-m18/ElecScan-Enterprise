# WireGuard VPN — Zone 2 ↔ Zone 3 (Modbus TCP)

Secures Modbus TCP traffic between connector-service (Zone 2) and MI-550 analyzers (Zone 3) per IEC 62443-3-3 SL2 requirements.

## Architecture

```
Zone 2 (connector-service)       WireGuard Tunnel        Zone 3 (MI-550 VLAN)
┌─────────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  connector-service   │────│  wg0: 10.200.0.1  │─────│ wg0: 10.200.0.10 │
│  Modbus TCP client   │    │  UDP 51820        │     │ MI-550 @ :5020   │
└─────────────────────┘     └───────────────────┘     └──────────────────┘
```

## Quick Setup

1. Install WireGuard on both gateway and site:
   ```bash
   apt install wireguard    # Debian/Ubuntu
   yum install wireguard    # RHEL/CentOS
   ```

2. Generate key pairs on each machine:
   ```bash
   wg genkey | tee privatekey | wg pubkey > publickey
   ```

3. Copy and fill templates:
   ```bash
   # On Zone 2 gateway:
   cp wg0-gateway.conf.template /etc/wireguard/wg0.conf
   # Edit: replace ${WG_GATEWAY_PRIVATE_KEY}, ${WG_SITE_A_PUBLIC_KEY}, etc.

   # On each site gateway:
   cp wg0-site.conf.template /etc/wireguard/wg0.conf
   # Edit: replace ${WG_SITE_PRIVATE_KEY}, ${WG_GATEWAY_PUBLIC_KEY}, etc.
   ```

4. Enable and start:
   ```bash
   systemctl enable --now wg-quick@wg0
   ```

5. Verify tunnel:
   ```bash
   wg show
   ping 10.200.0.1   # From site → gateway
   ```

## Key Rotation

Rotate keys quarterly. See `docs/runbooks/03-cert-rotation.md` for the full procedure.
