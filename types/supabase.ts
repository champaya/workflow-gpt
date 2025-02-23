export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      reactflow_user: {
        Row: {
          id: string;
          email: string;
        };
        Insert: {
          id?: string;
          email: string;
        };
        Update: {
          id?: string;
          email?: string;
        };
      };
      reactflow_chat: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          user_id: string;
          recent_model: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          user_id: string;
          recent_model?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          user_id?: string;
          recent_model?: string;
        };
      };
      reactflow_message: {
        Row: {
          id: string;
          chat_id: string;
          role: string;
          content: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          role: string;
          content: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          role?: string;
          content?: Json;
          created_at?: string;
        };
      };
      reactflow_document: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          content: string | null;
          kind: "text" | "code" | "image" | "sheet";
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          content?: string | null;
          kind?: "text" | "code" | "image" | "sheet";
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          content?: string | null;
          kind?: "text" | "code" | "image" | "sheet";
          user_id?: string;
        };
      };
      reactflow_suggestion: {
        Row: {
          id: string;
          document_id: string;
          document_created_at: string;
          original_text: string;
          suggested_text: string;
          description: string | null;
          is_resolved: boolean;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          document_created_at: string;
          original_text: string;
          suggested_text: string;
          description?: string | null;
          is_resolved?: boolean;
          user_id: string;
          created_at: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          document_created_at?: string;
          original_text?: string;
          suggested_text?: string;
          description?: string | null;
          is_resolved?: boolean;
          user_id?: string;
          created_at?: string;
        };
      };
      reactflow_workflow_thread: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      reactflow_workflow_node: {
        Row: {
          id: string;
          thread_id: string;
          chat_id: string;
          position: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          chat_id: string;
          position: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          chat_id?: string;
          position?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      reactflow_node_relationship: {
        Row: {
          id: string;
          parent_node_id: string;
          child_node_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_node_id: string;
          child_node_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_node_id?: string;
          child_node_id?: string;
          created_at?: string;
        };
      };
    };
  };
}
