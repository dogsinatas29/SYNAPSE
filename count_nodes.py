import json

real = 0
ghost = 0
edges = 0
with open('/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_report/temp_target_state.json', 'r') as f:
    data = json.load(f)
    for n in data.get('nodes', []):
        if n.get('isGhost'): ghost += 1
        else: real += 1
    
    print(f"Total Nodes: {len(data.get('nodes', []))}")
    print(f"Real Nodes: {real}")
    print(f"Ghost Nodes: {ghost}")
    print(f"Total Edges: {len(data.get('edges', []))}")
