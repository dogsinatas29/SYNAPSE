import json

history_path = 'data/synapse_history.json'

with open(history_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# The structure seems to be an array of snapshots or similar
# Based on grep, it's a deep structure with "file" or "filePath" fields

def purge_ghost(obj):
    if isinstance(obj, dict):
        # If this is a node object, check if it's the ghost
        if obj.get('file') == 'test_new_session.js' or obj.get('filePath') == 'test_new_session.js' or obj.get('id') == 'test_new_session':
            return None
        return {k: purge_ghost(v) for k, v in obj.items() if purge_ghost(v) is not None}
    elif isinstance(obj, list):
        return [purge_ghost(item) for item in obj if purge_ghost(item) is not None]
    else:
        return obj

purged_data = purge_ghost(data)

with open(history_path, 'w', encoding='utf-8') as f:
    json.dump(purged_data, f, indent=2, ensure_ascii=False)

print("Purge complete.")
