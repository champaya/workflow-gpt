import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// 循環参照をチェックする関数
async function checkForCyclicDependency(
  supabase: any,
  sourceId: string,
  targetId: string,
  visited = new Set<string>()
): Promise<boolean> {
  if (sourceId === targetId) return true;
  if (visited.has(targetId)) return false;

  visited.add(targetId);

  const { data: children } = await supabase
    .from("reactflow_node_relationship")
    .select("child_node_id")
    .eq("parent_node_id", targetId);

  if (!children) return false;

  for (const child of children) {
    if (
      await checkForCyclicDependency(
        supabase,
        sourceId,
        child.child_node_id,
        visited
      )
    ) {
      return true;
    }
  }

  return false;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { source, target } = await req.json();

  // 循環参照をチェック
  const hasCycle = await checkForCyclicDependency(supabase, source, target);
  if (hasCycle) {
    return NextResponse.json(
      { error: "循環参照は許可されていません。" },
      { status: 400 }
    );
  }

  // 新しい関係性を作成
  const { data, error } = await supabase
    .from("reactflow_node_relationship")
    .insert([
      {
        parent_node_id: source,
        child_node_id: target,
      },
    ])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { source, target } = await req.json();

  if (!source || !target) {
    return NextResponse.json(
      { error: "Source and target IDs are required" },
      { status: 400 }
    );
  }

  // 特定の親子関係を削除
  const { error } = await supabase
    .from("reactflow_node_relationship")
    .delete()
    .eq("parent_node_id", source)
    .eq("child_node_id", target);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
