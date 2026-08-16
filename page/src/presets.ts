export interface Preset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly command: string;
  readonly template: string;
  readonly input: string;
}

export const PRESETS = [
  {
    id: 'interfaces',
    name: 'Interface status',
    description: 'Extract link state, line protocol, and IP addresses from interface output.',
    command: 'show interfaces',
    template: `Value INTERFACE (\\S+)
Value LINK (up|down)
Value PROTOCOL (up|down)
Value ADDRESS (\\S+)

Start
  ^\${INTERFACE} is \${LINK}, line protocol is \${PROTOCOL} -> Interface

Interface
  ^\\s+Internet address is \${ADDRESS} -> Record Start
  ^\${INTERFACE} is \${LINK}, line protocol is \${PROTOCOL} -> Continue.Record
  ^\${INTERFACE} is \${LINK}, line protocol is \${PROTOCOL} -> Interface`,
    input: `GigabitEthernet0/0 is up, line protocol is up
  Internet address is 192.0.2.1/24
GigabitEthernet0/1 is down, line protocol is down
  Internet address is 198.51.100.1/24
Loopback0 is up, line protocol is up`,
  },
  {
    id: 'bgp-neighbors',
    name: 'BGP neighbors',
    description: 'Turn a compact BGP summary into peer, ASN, uptime, and prefix records.',
    command: 'show ip bgp summary',
    template: `Value NEIGHBOR (\\d+\\.\\d+\\.\\d+\\.\\d+)
Value REMOTE_AS (\\d+)
Value UPTIME (\\S+)
Value PREFIXES (\\d+)

Start
  ^\${NEIGHBOR}\\s+\\d+\\s+\${REMOTE_AS}\\s+\\d+\\s+\\d+\\s+\\d+\\s+\\d+\\s+\\d+\\s+\${UPTIME}\\s+\${PREFIXES} -> Record`,
    input: `BGP router identifier 192.0.2.1, local AS number 64500
Neighbor        V    AS MsgRcvd MsgSent TblVer InQ OutQ Up/Down  State/PfxRcd
192.0.2.2      4 64501    1247    1204     42   0    0 2d03h               18
203.0.113.9    4 64502     884     901     42   0    0 04:18:22             7`,
  },
  {
    id: 'vlans',
    name: 'VLAN table',
    description: 'Parse VLAN identifiers, names, lifecycle state, and assigned ports.',
    command: 'show vlan brief',
    template: `Value VLAN_ID (\\d+)
Value NAME (\\S+)
Value STATUS (active|act/lshut|suspended)
Value PORTS (.*)

Start
  ^\${VLAN_ID}\\s+\${NAME}\\s+\${STATUS}\\s*\${PORTS} -> Record`,
    input: `VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Gi0/1, Gi0/2
10   USERS                            active    Gi0/3, Gi0/4
20   VOICE                            active    Gi0/5
999  PARKING                          suspended`,
  },
] as const satisfies readonly Preset[];
