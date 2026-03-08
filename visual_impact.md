# 🚀 visual_impact.md: System Control & Execution

## 🔧 Agent Capabilities
- **SSH Inventory Management**: Tracking and maintaining connections to remote environments.
- **One-off Bash Scripts**: Generation and execution of transient scripts for system setup or diagnosis.
- **SQL Logging**: Automated tracing of database queries triggered during execution flows.

## 🛡️ Execution Safety
- **Reserved Nodes**: High-risk system actions are staged as 'Reserved'. They require explicit 'Final Confirm' from the Commander before execution.
- **Log Masking**: Paths and secrets are masked in the terminal logs to project-relative paths to ensure external integrity.
