export type UserProfile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type FamilyGroup = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
};

export type FamilyMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
};

export type CategoryType = 'income' | 'expense';

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  group_id: string | null;
  user_id: string | null;
  is_default: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  group_id: string | null;
  user_id: string;
  category_id: string;
  amount_cents: number;
  memo: string;
  transaction_date: string;
  receipt_url: string | null;
  created_at: string;
};

export type Budget = {
  id: string;
  group_id: string | null;
  category_id: string;
  amount_cents: number;
  month: string;
  created_at: string;
};

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'savings' | 'category' | 'family';

export type AiReport = {
  id: string;
  user_id: string;
  report_type: ReportType;
  target_date: string;
  content: string;
  summary: string | null;
  created_at: string;
};

export type ParsedReceipt = {
  type: 'receipt' | 'salary' | 'invoice' | 'unknown';
  storeName: string | null;
  date: string | null;
  totalAmount: number | null;
  items: ReceiptItem[];
  suggestedCategory: string;
  transactionType: 'expense' | 'income';
  confidence: 'high' | 'medium' | 'low';
  rawText: string;
};

export type ReceiptItem = {
  name: string;
  amount: number;
};
