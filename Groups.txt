import json

# Assuming you've loaded nodes and edges from JSON files as previously described

def construct_groups(nodes, edges):
    adjacency_list = {node['id']: [] for node in nodes}
    print("Adjacency List Initial:", adjacency_list)  # Debug print

    for edge in edges:
        adjacency_list[edge['source']].append(edge['target'])
    
    print("Adjacency List with Edges:", adjacency_list)  # Debug print

    def find_lineage(node_id, visited, current_group):
        if node_id not in visited:
            visited.add(node_id)
            current_group.append(node_id)
            for child in adjacency_list[node_id]:
                find_lineage(child, visited, current_group)
    
    visited = set()
    groups = []
    group_count = 1
    
    for node in nodes:
        if node['id'] not in visited:
            current_group = []
            find_lineage(node['id'], visited, current_group)
            print(f"Current Group for {node['id']}: ", current_group)  # Debug print
            if current_group:
                groups.append({
                    "id": f"Group{group_count}",
                    "nodes": current_group,
                    "label": f"Family Lineage {group_count}"
                })
                group_count += 1
    
    print("Final Groups:", groups)  # Debug print
    return groups

# Replace 'nodes.json' and 'edges.json' with the correct paths if necessary
with open('nodes.json', 'r') as file:
    nodes = json.load(file)

with open('edges.json', 'r') as file:
    edges = json.load(file)

groups = construct_groups(nodes, edges)
print(groups)
