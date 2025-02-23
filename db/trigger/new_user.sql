-- 新規認証ユーザー作成時のトリガー関数
-- auth.usersテーブルに新規ユーザーが作成された際に、
-- アプリケーション用のユーザーテーブルにも自動的にレコードを作成する
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 新規ユーザーのレコードを作成
  -- auth.usersテーブルのIDとメールアドレスを使用
  INSERT INTO public.reactflow_user (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの定義
-- auth.usersテーブルへのINSERT時に自動実行
CREATE TRIGGER auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();
