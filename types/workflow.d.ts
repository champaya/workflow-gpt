import { Chat } from "./chat";

export interface WorkflowThread {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowNode {
  id: string;
  thread_id: string;
  chat_id: string;
  position: {
    x: number;
    y: number;
  };
  chat?: Chat[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}
