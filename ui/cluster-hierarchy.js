(function(root) {
    'use strict';

    function ClusterHierarchy(clusters) {
        if (!Array.isArray(clusters)) {
            this.nodeMap = new Map();
            this.rootIds = [];
            return;
        }

        const nodeMap = new Map();

        for (const c of clusters) {
            if (!c || !c.id) continue;
            nodeMap.set(c.id, {
                id: c.id,
                cluster: c,
                parentId: c.parent_id || null,
                children: [],
                depth: 0
            });
        }

        for (const [id, node] of nodeMap) {
            if (node.parentId && nodeMap.has(node.parentId)) {
                nodeMap.get(node.parentId).children.push(id);
            }
        }

        const rootIds = [];
        for (const [id, node] of nodeMap) {
            if (!node.parentId || !nodeMap.has(node.parentId) || node.parentId === 'world') {
                rootIds.push(id);
            }
        }
        
        // Sort rootIds deterministically by cluster node length then by id
        rootIds.sort((a, b) => {
            const nodeA = nodeMap.get(a).cluster;
            const nodeB = nodeMap.get(b).cluster;
            const lenA = (nodeA.nodes && nodeA.nodes.length) || 0;
            const lenB = (nodeB.nodes && nodeB.nodes.length) || 0;
            if (lenB !== lenA) return lenB - lenA;
            return a.localeCompare(b);
        });

        console.log('[FRONTEND_ROOT_AUDIT] ClusterHierarchy initialized. Top 20 Roots:', {
            totalRoots: rootIds.length,
            top20: rootIds.slice(0, 20).map(id => {
                const c = nodeMap.get(id).cluster;
                return `${id} (${(c.nodes && c.nodes.length) || 0} files)`;
            })
        });

        function assignDepth(ids, depth) {
            for (const id of ids) {
                const node = nodeMap.get(id);
                if (!node) continue;
                node.depth = depth;
                if (node.children.length > 0) {
                    assignDepth(node.children, depth + 1);
                }
            }
        }
        assignDepth(rootIds, 0);

        this.nodeMap = nodeMap;
        this.rootIds = rootIds;
    }

    ClusterHierarchy.prototype.get = function(id) {
        return this.nodeMap.get(id) || null;
    };

    ClusterHierarchy.prototype.getChildren = function(id) {
        const node = this.nodeMap.get(id);
        if (!node) return [];
        return node.children.map(cid => this.nodeMap.get(cid)).filter(Boolean);
    };

    ClusterHierarchy.prototype.getParent = function(id) {
        const node = this.nodeMap.get(id);
        if (!node || !node.parentId) return null;
        return this.nodeMap.get(node.parentId) || null;
    };

    ClusterHierarchy.prototype.getDepth = function(id) {
        const node = this.nodeMap.get(id);
        return node ? node.depth : -1;
    };

    ClusterHierarchy.prototype.getRoots = function() {
        return this.rootIds.map(id => this.nodeMap.get(id)).filter(Boolean);
    };

    ClusterHierarchy.prototype.getAllNodes = function() {
        return Array.from(this.nodeMap.values());
    };

    ClusterHierarchy.prototype.getAncestors = function(id) {
        const ancestors = [];
        let current = this.nodeMap.get(id);
        while (current && current.parentId) {
            const parent = this.nodeMap.get(current.parentId);
            if (parent) {
                ancestors.push(parent);
                current = parent;
            } else {
                break;
            }
        }
        return ancestors;
    };

    ClusterHierarchy.prototype.getDescendants = function(id) {
        const result = [];
        const node = this.nodeMap.get(id);
        if (!node) return result;
        const stack = [node];
        while (stack.length > 0) {
            const current = stack.pop();
            for (const cid of current.children) {
                const child = this.nodeMap.get(cid);
                if (child) {
                    result.push(child);
                    stack.push(child);
                }
            }
        }
        return result;
    };

    ClusterHierarchy.prototype.getSiblings = function(id) {
        const node = this.nodeMap.get(id);
        if (!node || !node.parentId) return [];
        const parent = this.nodeMap.get(node.parentId);
        if (!parent) return [];
        return parent.children
            .filter(cid => cid !== id)
            .map(cid => this.nodeMap.get(cid))
            .filter(Boolean);
    };

    ClusterHierarchy.prototype.getLeafClusterIds = function() {
        const leaves = [];
        for (const [id, node] of this.nodeMap) {
            if (node.children.length === 0) {
                leaves.push(id);
            }
        }
        return leaves;
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ClusterHierarchy;
    } else {
        root.ClusterHierarchy = ClusterHierarchy;
    }
})(this);
