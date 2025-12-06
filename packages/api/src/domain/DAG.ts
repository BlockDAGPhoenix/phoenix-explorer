/**
 * DAG Domain Models
 */
export interface DAGBlock {
  hash: string;
  number: bigint;
  blueScore: bigint;
  isSelectedParent?: boolean;
}

export interface DAGRelationship {
  parent: string;
  child: string;
  isSelectedParent: boolean;
}

export interface GHOSTDAGData {
  blueScore: bigint;
  blueWork: bigint;
  mergeSetBlues: string[];
  mergeSetReds: string[];
}

export interface DAGInfo {
  block: DAGBlock;
  parents: DAGBlock[];
  children: DAGBlock[];
  ghostdagData?: GHOSTDAGData;
  relationships: DAGRelationship[];
}

