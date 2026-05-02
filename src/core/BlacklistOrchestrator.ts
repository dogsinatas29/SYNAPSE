import { GraphModel } from './GraphModel';
import { filterSnapshot } from './filterSnapshot';
import { RuleEngine } from './RuleEngine';
import { Node } from '../types/schema';

/**
 * [v0.3.23] Blacklist Orchestrator
 * Coordinates real-time node exclusion and full graph rebuilds.
 */
export class BlacklistOrchestrator {
  private graphModel: GraphModel;

  constructor(graphModel: GraphModel) {
    this.graphModel = graphModel;
  }

  /**
   * Guarded node addition. Discards nodes that match the blacklist.
   */
  public handleNodeAdd(node: Node): boolean {
    const ruleEngine = RuleEngine.getInstance();
    const pathToCheck = (node as any).filePath || node.data?.file || node.id;
    
    if (ruleEngine.shouldIgnoreFile(pathToCheck)) {
      console.log(`[SYNAPSE] Orchestrator: Discarded node ${node.id} (${pathToCheck})`);
      return false;
    }
    
    // In actual implementation, we might call this.graphModel.addNode(node) 
    // if it exists, or just set it. 
    // For consistency with the protocol:
    (this.graphModel as any).addNode(node);
    return true;
  }

  /**
   * Handle blacklist update event
   */
  public handleBlacklistChanged() {
    console.log('[SYNAPSE] Orchestrator: Blacklist update detected. Triggering rebuild.');
    this.rebuild();
  }

  /**
   * Unified rebuild process
   */
  public rebuild() {
    const snapshot = this.graphModel.createSnapshot();
    const filtered = filterSnapshot(snapshot);
    this.graphModel.restoreSnapshot(filtered);
  }
}
