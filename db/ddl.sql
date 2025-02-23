-- ワークフローアプリケーションのデータベーススキーマ定義

-- 1. ユーザー情報を管理するテーブル
-- auth.usersテーブルと紐づけて、アプリケーション固有のユーザー情報を管理
CREATE TABLE reactflow_user (
    id UUID NOT NULL DEFAULT gen_random_uuid() REFERENCES auth.users(id), -- Supabaseの認証ユーザーID
    email VARCHAR(64) NOT NULL,                                          -- ユーザーのメールアドレス
    PRIMARY KEY (id)
);

-- 2. チャット情報を管理するテーブル
-- 各チャットの基本情報とAIモデルの設定を保持
CREATE TABLE reactflow_chat (
    id UUID NOT NULL DEFAULT gen_random_uuid(),                                    -- チャットID
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,                       -- 作成日時
    title TEXT NOT NULL,                                                          -- チャットのタイトル
    user_id UUID NOT NULL,                                                        -- 作成者のユーザーID
    recent_model VARCHAR NOT NULL DEFAULT 'gemini-2.0-flash-thinking-exp',        -- 最後に使用したAIモデル
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES reactflow_user(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 3. チャットメッセージを管理するテーブル
-- チャット内の各メッセージの内容と送信者の種類を保持
CREATE TABLE reactflow_message (
    id UUID NOT NULL DEFAULT gen_random_uuid(),                    -- メッセージID
    chat_id UUID NOT NULL,                                        -- 所属するチャットID
    role VARCHAR NOT NULL,                                        -- メッセージの送信者種別（user/assistant）
    content JSON NOT NULL,                                        -- メッセージの内容（JSON形式）
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,      -- 作成日時
    PRIMARY KEY (id),
    FOREIGN KEY (chat_id) REFERENCES reactflow_chat(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 4. ワークフロースレッドを管理するテーブル
-- ワークフローの基本情報とメタデータを保持
CREATE TABLE reactflow_workflow_thread (
    id UUID NOT NULL DEFAULT gen_random_uuid(),                    -- スレッドID
    title TEXT NOT NULL,                                          -- ワークフローのタイトル
    description TEXT,                                             -- ワークフローの説明
    user_id UUID NOT NULL,                                        -- 作成者のユーザーID
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,      -- 作成日時
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,      -- 更新日時
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES reactflow_user(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 5. ワークフローのノードを管理するテーブル
-- フロー図上の各ノードの位置情報とチャットの関連付けを管理
CREATE TABLE reactflow_workflow_node (
    id UUID NOT NULL DEFAULT gen_random_uuid(),                    -- ノードID
    thread_id UUID NOT NULL,                                      -- 所属するスレッドID
    chat_id UUID NOT NULL,                                        -- 関連付けられたチャットID
    position JSON NOT NULL,                                       -- ノードの座標情報（x, y）
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,      -- 作成日時
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,      -- 更新日時
    PRIMARY KEY (id),
    FOREIGN KEY (thread_id) REFERENCES reactflow_workflow_thread(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (chat_id) REFERENCES reactflow_chat(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 6. ノード間の関係性を管理するテーブル
-- フロー図上のノード間の接続情報（エッジ）を管理
CREATE TABLE reactflow_node_relationship (
    id UUID NOT NULL DEFAULT gen_random_uuid(),                    -- 関係性ID
    parent_node_id UUID NOT NULL,                                 -- 親ノードID
    child_node_id UUID NOT NULL,                                  -- 子ノードID
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,      -- 作成日時
    PRIMARY KEY (id),
    FOREIGN KEY (parent_node_id) REFERENCES reactflow_workflow_node(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (child_node_id) REFERENCES reactflow_workflow_node(id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE(parent_node_id, child_node_id)                        -- 同じ親子関係は1つまで
);

