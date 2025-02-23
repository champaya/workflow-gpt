/**
 * @fileoverview ノードのサイドバーコンポーネント
 * チャットの詳細表示、メッセージの送受信、モデル選択などの機能を提供
 * @module components/workflow/node-side-bar
 */

"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { chatModels } from "@/utils/ai/model";
import { Copy, Loader2 } from "lucide-react";
import { Message } from "@/types/chat";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { eventBus } from "@/utils/event-bus";
import MarkdownRenderer from "../common/wrapped-markdown";

/**
 * ノードのサイドバーを表示するコンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 * @param {string} [props.currentChatId] - 現在表示中のチャットID
 * @param {() => void} props.onClose - サイドバーを閉じる関数
 */
export function NodeSideBar({
  currentChatId,
  onClose,
}: {
  currentChatId?: string;
  onClose: () => void;
}) {
  // 状態管理
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [model, setModel] = useState("");
  const [width, setWidth] = useState(700); // デフォルトの幅
  const [isDragging, setIsDragging] = useState(false);
  const supabase = createClient();

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
      chatId: currentChatId,
      model: model,
    },
    onFinish: () => {
      eventBus.emit(`chat-node-${currentChatId}-updated`);
    },
  });

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  /**
   * メッセージコンテナを最下部にスクロール
   */
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const scrollContainer = messagesContainerRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // メッセージ追加時のスクロール処理
  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages.length]);

  // 初期データの読み込み
  useEffect(() => {
    const loadData = async () => {
      // メッセージの取得
      const { data: initialMessages } = await supabase
        .from("reactflow_message")
        .select("*")
        .eq("chat_id", currentChatId)
        .order("created_at", { ascending: true });

      // 最近使用したモデルの取得
      const { data: chat } = await supabase
        .from("reactflow_chat")
        .select("recent_model")
        .eq("id", currentChatId)
        .single();

      if (initialMessages) {
        setInitialMessages(
          initialMessages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content.text,
          }))
        );
      }
      setModel(chat?.recent_model ?? "");
    };

    if (currentChatId) {
      loadData();
    }
  }, [supabase, currentChatId]);

  // メッセージ更新のイベント購読
  useEffect(() => {
    if (!currentChatId) return;

    const unsubscribe = eventBus.subscribe(
      `node-sidebar-${currentChatId}-updated`,
      async () => {
        const { data: messages } = await supabase
          .from("reactflow_message")
          .select("*")
          .eq("chat_id", currentChatId)
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
  }, [currentChatId]);

  /**
   * モデル変更時の処理
   * @param {string} modelId - 選択されたモデルのID
   */
  const handleModelChange = async (modelId: string) => {
    if (!currentChatId) return;

    // モデル情報の更新
    const { error } = await supabase
      .from("reactflow_chat")
      .update({ recent_model: modelId })
      .eq("id", currentChatId);

    if (error) {
      console.error(error);
    }

    setModel(modelId);
    eventBus.emit(`chat-node-${currentChatId}-model-updated`);
  };

  // モデル更新のイベント購読
  useEffect(() => {
    if (!currentChatId) return;

    const unsubscribe = eventBus.subscribe(
      `node-sidebar-${currentChatId}-model-updated`,
      async () => {
        const { data: chat } = await supabase
          .from("reactflow_chat")
          .select("recent_model")
          .eq("id", currentChatId)
          .single();

        if (chat) {
          setModel(chat.recent_model);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentChatId]);

  // サイドバーのリサイズ機能
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newWidth = window.innerWidth - e.clientX;
    setWidth(Math.max(300, Math.min(900, newWidth))); // 最小300px、最大900px
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ドラッグ操作のイベントリスナー設定
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!currentChatId) {
    return (
      <div className="p-4 text-foreground">チャットが選択されていません</div>
    );
  }

  return (
    <div
      className="fixed right-0 top-0 z-50 h-screen bg-background border-l border-gray-200 dark:border-gray-700 dark:bg-gray-800 flex flex-col"
      style={{ width: `${width}px` }}
    >
      {/* リサイズハンドル */}
      <div
        className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-border"
        onMouseDown={handleMouseDown}
      />

      {/* ヘッダー */}
      <div className="p-4 border-b dark:border-gray-800">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">チャット詳細</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* コピーボタン（ユーザーメッセージのみ） */}
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
              {/* メッセージ本文 */}
              <div
                key={message.id}
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
        </div>
      </div>
      <div className="p-4 border-t dark:border-gray-700 dark:bg-gray-800">
        <Select value={model} onValueChange={handleModelChange}>
          <SelectTrigger className="dark:border-gray-700">
            <SelectValue placeholder="モデルを選択" />
          </SelectTrigger>
          <SelectContent>
            {chatModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 flex gap-2 items-end mt-2"
        >
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="メッセージを入力..."
            className="min-h-[100px] dark:border-gray-700"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.metaKey) {
                  // Command + Enter で送信
                  e.preventDefault();
                  handleSubmit(e as any);
                } else {
                  // 通常のエンターキーは改行
                  e.stopPropagation();
                }
              }
            }}
          />
          <Button type="submit" variant="outline" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "送信"}
          </Button>
        </form>
      </div>
    </div>
  );
}
