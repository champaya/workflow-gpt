import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { threadId, position, title } = await req.json();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 新しいチャットを作成
  const { data: chat } = await supabase
    .from("reactflow_chat")
    .insert({
      title,
      user_id: user.id,
    })
    .select()
    .single();

  if (!chat) {
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }

  // ワークフローノードを作成
  const { data: node } = await supabase
    .from("reactflow_workflow_node")
    .insert({
      thread_id: threadId,
      chat_id: chat.id,
      position,
    })
    .select()
    .single();

  return NextResponse.json({ node });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const nodeId = searchParams.get("nodeId");

  if (!nodeId) {
    return NextResponse.json({ error: "Node ID is required" }, { status: 400 });
  }

  // まず、ノードの情報を取得
  const { data: node } = await supabase
    .from("reactflow_workflow_node")
    .select("chat_id")
    .eq("id", nodeId)
    .single();

  if (!node) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  // ワークフローノードを削除
  await supabase.from("reactflow_workflow_node").delete().eq("id", nodeId);

  // 関連するチャットも削除
  await supabase.from("reactflow_chat").delete().eq("id", node.chat_id);

  return NextResponse.json({ success: true });
}
