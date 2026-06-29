# 🆕 Full Revision History - SYNAPSE

## 🆕 Revision History

| Version | Date | Description |
| :--- | :--- | :--- |
| **v0.3.32.2** | 2026-06-29 | **File Deletion Sync & Architecture Physics Fixes**: Fixed manual node deletion sync bug, safely handling absolute vs relative paths. Expanded `EXTERNAL_PACKAGES` to recognize 100+ standard frameworks across 7 languages, eliminating false ghost nodes. Enhanced regex to properly resolve `[SYNAPSE_NETWORK_LINK]` cross-workspace dependencies and cluster remote ghosts into `cluster_ghost_network_remote`. Fixed root-level files infinite layout collapse by injecting a dynamic `📁 Root` cluster to force global physics packing. Resolved false-positive JSON serialization errors for workspace states. |
| **v0.3.32.1** | 2026-06-27 | **Cross-Project Trace & Semantic Flow Layout**: Upgraded Flow View to Semantic Flow Layout with single-pass Barycenter Ordering, drastically reducing edge crossings. Visualized back-edges in red dashed lines. Introduced `[SYNAPSE_NETWORK_LINK]` for universal language-agnostic cross-network dependency parsing. Fixed client node mirroring (IFF logic) to distinguish local vs remote client nodes. Proved distributed architecture collaboration via Harvest DAG merge within Flow View. |
| **v0.3.32** | 2026-06-26 | **Collaboration Flow Visibility**: Fixed ghost filter collision that made 100% of client-contributed nodes invisible in Flow View. Client nodes now bypass `!isGhost` filter, controlled by `_isClientLayerVisible()` toggle. Fixed `reasons` ReferenceError that silently crashed `buildFlow()` when client nodes were present. Unified client node detection filters across debug/survival/flow logic. Contribution Entity Graph Phase 0 validated: `(filePath, userId)` confirmed as canonical identity. |
| **v0.3.31** | 2026-06-25 | **Diagnostics Stabilization & Observability**: Fixed false-positive Necrosis from `doc`/`file`/`folder` nodes. Normalized Pressure calculation to `criticalIssues / totalNodes`. Excluded Ghost Cluster (`cluster_ghosts`, `doc_shelf`) from dependency hints. Added `clientTimestamp`-based Stale opacity visualization (Active/Stale/Offline). Tooltip now shows `"[username] Updated Xm ago"`. Soft Disconnect with 15-minute cache retention for post-crash debugging. |
| **v0.3.30.2** | 2026-06-25 | **Security Hardening & Harvest Stabilization**: Verified 6 critical attack vectors (Path Traversal, Auth Bypass, SSE Contamination, Lock Bypass, Sandbox Escape, Client Spoofing). Fixed port binding conflict & 403 Auth error on Admin UI. Implemented backward compatibility for legacy array-formatted `accounts.json` and `synapse_history.json` to prevent `unshift` crash during Harvest. |
| **v0.3.30.1** | 2026-06-22 | **UI/UX Refinement & Feature Cleanup**: Implemented Tooltip Merge Logic to resolve Z-Index bleeding when hovering overlapping nodes and edges. Disabled problematic Tree View mode to align with graph-centric architecture. |
| **v0.3.30** | 2026-06-22 | **Harvest-Based Collaboration Model**: Major architecture upgrade introducing session management, secure SSH transport, and remote projection layers. Full integration of Harvest Engine and Identity permissions. |
| **v0.3.29** | 2026-06-06 | **Cluster Overlap Resolution & External Layer Fix**: Implemented Initial Spread (circular layout via FNV-1a hash) + Cluster Push-Apart engine (Mass-weighted AABB push-apart) to resolve cluster/node overlapping. Fixed External Ghosts cluster box not showing when External layer is ON. Reduced Align Architecture cluster expansion by 50% (roleOffsets halved). |
| **v0.3.27** | 2026-05-28 | **Data Sync Resilience & Layer Sovereignty**: Resolved critical data synchronization bugs causing phantom edge disappearances (`Edges: 0`). Ensured UI layer separation logic properly isolates scanned folders and custom groupings without structural damage. |
| **v0.3.26** | 2026-05-26 | **2D Edge Validation Patch**: Fixed a bug where solid edges would silently fail to render in 2D mode due to invalid dash array fallback `[0, 0]` not supported by HTML5 Canvas API context. |
| **v0.3.25** | 2026-05-25 | **Cluster-Aware Local Alignment**: Refactored the layout alignment physics so that nodes align cleanly relative to their specific cluster's gravity center, preventing global coordinate collapses when arranging architecture. |
| **v0.3.24** | 2026-05-24 | **RULES.md Embedding & Bootstrap Hardening**: Embedded standard DTR (Dynamic Thought Routing) & Forced File Projection Rules deeply into the Bootstrap Engine, establishing security and design constraints by default upon initialization. |
| **v0.3.23** | 2026-05-02 | **Hybrid Blacklist & Intelligent Onboarding**: Implemented O(1) path-matching blacklist system. Added Explorer context menu for instant exclusion. Fixed webview layout collapse issues. |
| **v0.3.22.11** | 2026-04-22 | **Interaction Stability & Coordinate Sovereignty**: Resolved node dragging jitter via Timestamp Guards and Position Persistence. Unified absolute coordinate system across SSoT layers. |22.11** | 2026-04-22 | **Interaction Stability & Coordinate Sovereignty**: Resolved node dragging jitter via Timestamp Guards and Position Persistence. Unified absolute coordinate system across SSoT layers. |
| **v0.3.22.10** | 2026-04-20 | **Rendering Parity & Identity Binding (SSoT)**: Full 2D/3D visual synchronization, and SSoT-based tooltip identity binding for 100% data consistency. |
| **v0.3.21** | 2026-04-18 | **Visual Consistency & Edge Bundling**: Full convention synchronization, Bezier flow consolidation, and Amnesia Guard for snapshot integrity. |
| **v0.3.20** | 2026-04-17 | **Rust Persistence & Engine Hardening**: Path-based IDs for Rust support, Velocity clamping for physics stability. |
| **v0.3.18** | 2026-04-17 | **Diagnostic Hint Engine**: Real-time architectural analysis (R1-R5), Zero-Unknown semantic labeling. |

[View Full History](REVISION_HISTORY.md)

---

## 📅 Status & Roadmap

- **Status**: v0.3.30.1 – UI/UX Refinement & Feature Cleanup.
- **Next**:
    - Server / Client separation for remote analysis.
    - Advanced Performance optimization for 50k+ nodes.
    - Real-time collaborative architecture design.

---

## 📜 License & Author
Licensed under the [GNU General Public License v3.0](LICENSE).  
Created with 🧠 by [dogsinatas29](https://github.com/dogsinatas29)
