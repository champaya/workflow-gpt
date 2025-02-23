import { createClient } from "@/utils/supabase/server";
import { streamText } from "ai";
import { myProvider } from "@/utils/ai/model";
import { Message } from "@ai-sdk/ui-utils";

export const maxDuration = 60;

// 祖先ノードのメッセージを再帰的に取得する関数
async function fetchAncestorMessages(
  supabase: any,
  chatId: string,
  visitedNodes = new Set<string>(),
  visitedChats = new Set<string>()
): Promise<Message[]> {
  // まず、現在のチャットIDに対応するノードを取得
  const { data: currentNode } = await supabase
    .from("reactflow_workflow_node")
    .select("id")
    .eq("chat_id", chatId)
    .single();

  if (!currentNode || visitedNodes.has(currentNode.id)) {
    return [];
  }

  // このノードを訪問済みとしてマーク
  visitedNodes.add(currentNode.id);
  visitedChats.add(chatId);

  // 親ノードの関係性を取得
  const { data: parentRelationships } = await supabase
    .from("reactflow_node_relationship")
    .select("parent_node_id")
    .eq("child_node_id", currentNode.id);

  if (!parentRelationships || parentRelationships.length === 0) {
    return [];
  }

  // すべての親ノードのメッセージを取得
  let allMessages: Message[] = [];
  for (const rel of parentRelationships) {
    // 親ノードの情報を取得
    const { data: parentNode } = await supabase
      .from("reactflow_workflow_node")
      .select("chat_id")
      .eq("id", rel.parent_node_id)
      .single();

    if (parentNode && !visitedChats.has(parentNode.chat_id)) {
      // まず、さらに上の祖先のメッセージを再帰的に取得
      const ancestorMessages = await fetchAncestorMessages(
        supabase,
        parentNode.chat_id,
        visitedNodes,
        visitedChats
      );

      // 次に、親ノードのメッセージを取得（まだ取得していない場合のみ）
      const { data: messages } = await supabase
        .from("reactflow_message")
        .select("*")
        .eq("chat_id", parentNode.chat_id)
        .order("created_at", { ascending: true });

      if (messages) {
        // 祖先のメッセージを先に追加し、その後に親のメッセージを追加
        allMessages = [
          ...allMessages,
          ...ancestorMessages,
          ...messages.map((msg: Message) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
          })),
        ];
      }
    }
  }

  return allMessages;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { messages, chatId, model } = await req.json();

  // 祖先のメッセージを取得（順序は祖父 -> 親 -> 現在）
  const ancestorMessages = await fetchAncestorMessages(
    supabase,
    chatId,
    new Set<string>(),
    new Set<string>()
  );

  // 会話コンテキストを作成
  const allMessages = [
    ...ancestorMessages.map((msg: any) => ({
      role: msg.role,
      content: msg.content.text,
    })),
    ...messages,
  ];

  // ユーザーメッセージを保存（最新のメッセージがユーザーからと想定）
  const userMsg = messages[messages.length - 1];
  await supabase.from("reactflow_message").insert({
    content: { type: "text", text: userMsg.content },
    role: userMsg.role,
    chat_id: chatId,
  });

  // OpenAIモデル（例: GPT-3.5-turbo）でストリーム生成開始
  const result = streamText({
    model: myProvider.languageModel(model),
    messages: allMessages,
    async onFinish({ response }) {
      const supabase = await createClient();
      // 応答完了時、AIアシスタントのメッセージを保存
      for (const msg of response.messages) {
        if (msg.role === "assistant") {
          await supabase.from("reactflow_message").insert({
            content: msg.content[0],
            role: "assistant",
            chat_id: chatId,
          });
        }
      }
    },
  });

  // クライアント切断時も最後まで生成する設定
  result.consumeStream();
  // ストリーミングレスポンスを返す
  return result.toDataStreamResponse();
}
