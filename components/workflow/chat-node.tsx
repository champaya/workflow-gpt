/**
 * @fileoverview チャットノードコンポーネント
 * ReactFlowのノードとして使用されるチャットインターフェースを提供
 * @module components/workflow/chat-node
 */

"use client";
import { Handle, Position } from "reactflow";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Message } from "@/types/chat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { chatModels } from "@/utils/ai/model";
import { Copy, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { eventBus } from "@/utils/event-bus";
import MarkdownRenderer from "../common/wrapped-markdown";

/**
 * チャットノードコンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Object} props.data - ノードのデータ
 * @param {boolean} [props.data.isSelected] - ノードが選択されているかどうか
 * @param {string} props.data.chatId - チャットのID
 */
export function ChatNode({
  data,
}: {
  data: {
    isSelected?: boolean;
    chatId: string;
  };
}) {
  // 状態管理
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [model, setModel] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 初期データの読み込み
  useEffect(() => {
    const loadMessages = async () => {
      // メッセージの取得
      const { data: initialMessages } = await supabase
        .from("reactflow_message")
        .select("*")
        .eq("chat_id", data.chatId)
        .order("created_at", { ascending: true });

      // チャット情報の取得
      const { data: chat } = await supabase
        .from("reactflow_chat")
        .select("title, recent_model")
        .eq("id", data.chatId)
        .single();

      setTitle(chat?.title ?? "");
      setModel(chat?.recent_model ?? "");

      if (initialMessages) {
        setInitialMessages(
          initialMessages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content.text,
          }))
        );
      }
    };

    loadMessages();
  }, [supabase, data.chatId]);

  // チャット機能の初期化
  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    initialMessages: initialMessages,
    body: {
      chatId: data.chatId,
      model: model,
    },
    onFinish: () => {
      eventBus.emit(`node-sidebar-${data.chatId}-updated`);
    },
  });

  // メッセージ更新のイベント購読
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(
      `chat-node-${data.chatId}-updated`,
      async () => {
        const { data: messages } = await supabase
          .from("reactflow_message")
          .select("*")
          .eq("chat_id", data.chatId)
          .order("created_at", { ascending: true });

        if (messages) {
          setMessages(
            messages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content.text,
            }))
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [data.chatId]);

  /**
   * モデル変更時の処理
   * @param {string} modelId - 選択されたモデルのID
   */
  const handleModelChange = async (modelId: string) => {
    const { error } = await supabase
      .from("reactflow_chat")
      .update({ recent_model: modelId })
      .eq("id", data.chatId);

    if (error) {
      console.error(error);
    }

    setModel(modelId);
    eventBus.emit(`node-sidebar-${data.chatId}-model-updated`);
  };

  // モデル更新のイベント購読
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(
      `chat-node-${data.chatId}-model-updated`,
      async () => {
        const { data: chat } = await supabase
          .from("reactflow_chat")
          .select("recent_model")
          .eq("id", data.chatId)
          .single();

        if (chat) {
          setModel(chat.recent_model);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [data.chatId]);

  /**
   * タイトル更新の処理
   * @param {string} newTitle - 新しいタイトル
   */
  const handleTitleUpdate = async (newTitle: string) => {
    const { error } = await supabase
      .from("reactflow_chat")
      .update({
        title: newTitle,
      })
      .eq("id", data.chatId);

    if (error) {
      console.error(error);
      toast.error("タイトルの更新に失敗しました");
      return;
    }

    setTitle(newTitle);
    setIsEditingTitle(false);
    toast.success("タイトルを更新しました");
  };

  /**
   * メッセージコンテナを最下部にスクロール
   */
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // メッセージ追加時のスクロール処理
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Card
      className={`w-[400px] chat-node ${
        data.isSelected ? "ring-2 ring-primary" : ""
      }`}
    >
      {/* 接続ハンドル */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !-left-2 !bg-blue-500 hover:!bg-blue-600 hover:!w-5 hover:!h-5 transition-all duration-200"
        style={{ borderRadius: "8px" }}
      />

      <div className="p-3">
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-center mb-2 gap-2">
          <div className="flex items-center gap-2 flex-1">
            {/* タイトル編集 */}
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleTitleUpdate(title)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTitleUpdate(title);
                  }
                  if (e.key === "Escape") {
                    setIsEditingTitle(false);
                  }
                }}
                className="text-lg font-bold pl-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            ) : (
              <div
                className="text-lg font-bold pl-2 cursor-pointer rounded px-2"
                onClick={() => setIsEditingTitle(true)}
              >
                {title}
              </div>
            )}
          </div>
          {/* 折りたたみボタン */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* メッセージ一覧 */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isCollapsed ? "h-0 overflow-hidden" : ""
          }`}
        >
          <div
            ref={messagesContainerRef}
            className="min-h-[150px] max-h-[400px] overflow-y-auto mb-2 pt-2 space-y-2"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "user" ? (
                  <Button
                    variant="ghost"
                    className={`h-6 w-6`}
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      toast.success("メッセージをコピーしました");
                    }}
                  >
                    <Copy />
                  </Button>
                ) : null}
                <div
                  className={`group relative p-4 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-50 dark:bg-blue-800 ml-4"
                      : "bg-gray-50 dark:bg-gray-600 mr-4"
                  }`}
                >
                  <MarkdownRenderer content={message.content} />
                </div>
                {message.role === "assistant" ? (
                  <Button
                    variant="ghost"
                    className={`h-6 w-6`}
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      toast.success("メッセージをコピーしました");
                    }}
                  >
                    <Copy />
                  </Button>
                ) : null}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <Select onValueChange={handleModelChange} value={model}>
            <SelectTrigger className="w-[180px] dark:border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chatModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="メッセージを入力..."
              className="text-sm dark:border-gray-600"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.metaKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  } else {
                    e.stopPropagation();
                  }
                }
              }}
            />
            <Button
              type="submit"
              className="self-end"
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "送信"
              )}
            </Button>
          </form>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !-right-2 !bg-blue-500 hover:!bg-blue-600 hover:!w-5 hover:!h-5 transition-all duration-200"
        style={{ borderRadius: "8px" }}
      />
    </Card>
  );
}
