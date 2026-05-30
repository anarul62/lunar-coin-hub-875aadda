
CREATE TABLE public.site_content_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('fra','about')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category, slug)
);

GRANT SELECT ON public.site_content_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content_sections TO authenticated;
GRANT ALL ON public.site_content_sections TO service_role;

ALTER TABLE public.site_content_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled sections"
ON public.site_content_sections FOR SELECT
USING (enabled = true OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'subadmin'));

CREATE POLICY "Admins can insert sections"
ON public.site_content_sections FOR INSERT
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'subadmin'));

CREATE POLICY "Admins can update sections"
ON public.site_content_sections FOR UPDATE
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'subadmin'));

CREATE POLICY "Admins can delete sections"
ON public.site_content_sections FOR DELETE
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'subadmin'));

CREATE TRIGGER trg_site_content_sections_updated
BEFORE UPDATE ON public.site_content_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_content_sections (category, slug, icon, title, body, sort_order) VALUES
('fra','faq','❓','FAQ','Find answers to common questions regarding account registration, deposits, withdrawals, investments, referrals, and platform features.',10),
('fra','terms','📜','Terms & Conditions','These Terms & Conditions govern your use of Crypto X. By accessing or using our platform, you agree to comply with all applicable rules, policies, and legal obligations.',20),
('fra','investment-rules','📈','Investment Rules','All investment plans offered by Crypto X are subject to specific terms, durations, and profit structures. Users must review plan details before investing.',30),
('fra','deposit-policy','💰','Deposit Policy','Deposits must be made through approved payment methods. Crypto X reserves the right to verify transactions and reject suspicious or unauthorized deposits.',40),
('fra','withdrawal-policy','💸','Withdrawal Policy','Withdrawals are processed according to platform guidelines and may require identity verification. Processing times and minimum withdrawal limits may apply.',50),
('fra','risk-warning','⚠️','Risk Warning','Investments involve risk and may result in partial or total loss of capital. Crypto X does not guarantee profits, returns, or future performance.',60),
('fra','user-agreement','🤝','User Agreement','Users agree to provide accurate information, maintain account security, and comply with all platform rules. Violations may result in account restrictions or termination.',70),
('fra','privacy-policy','🔒','Privacy Policy','Crypto X is committed to protecting user privacy and safeguarding personal information through secure data management practices.',80),
('fra','aml-kyc','🛡️','AML & KYC Policy','To prevent fraud, money laundering, and illegal activities, users may be required to complete identity verification procedures before accessing certain services.',90),
('fra','anti-fraud','🚫','Anti-Fraud Policy','Any form of fraud, account manipulation, unauthorized access, or abusive behavior is strictly prohibited and may result in permanent account suspension.',100),
('fra','bonus-rewards','🎁','Bonus & Rewards Policy','Promotional bonuses, referral rewards, and special incentives are subject to eligibility requirements and may be modified or discontinued at any time.',110),
('fra','referral-program','👥','Referral Program Terms','Users participating in referral programs must follow all applicable rules. Fraudulent referrals or system abuse may lead to reward cancellation.',120),
('fra','account-security','🔐','Account Security Policy','Users are responsible for protecting their login credentials and enabling available security features. Crypto X is not responsible for losses caused by user negligence.',130),
('fra','complaint-dispute','⚖️','Complaint & Dispute Resolution','Users may submit complaints through official support channels. All disputes will be reviewed fairly and resolved according to company policies.',140),
('fra','compliance','📋','Compliance & Regulatory Notice','Crypto X operates in accordance with applicable laws and regulations where permitted. Users are responsible for complying with their local legal requirements.',150),
('fra','ip-rights','©','Intellectual Property Rights','All trademarks, logos, designs, software, and content displayed on Crypto X are the exclusive property of the company and may not be reproduced without permission.',160),
('fra','liability','📄','Limitation of Liability','Crypto X shall not be liable for indirect, incidental, or consequential damages arising from the use of its platform, except where required by applicable law.',170),
('fra','cookie-policy','🍪','Cookie Policy','Crypto X uses cookies and similar technologies to improve website functionality, user experience, analytics, and security.',180),
('fra','contact-support','📞','Contact & Support','Users can contact our support team through official communication channels for assistance, inquiries, and issue resolution.',190),
('fra','about-us','🏢','About Us','Crypto X is a digital investment platform focused on providing secure, transparent, and innovative financial opportunities. Our goal is to build a trusted ecosystem that delivers value, security, and a seamless experience for users worldwide.',200),
('about','company-profile','🟨','Company Profile','Crypto X is a digital investment and financial technology platform dedicated to providing secure, transparent, and innovative investment opportunities. Our mission is to empower users with accessible financial solutions while maintaining the highest standards of security, reliability, and customer satisfaction. Through advanced technology and professional service, Crypto X aims to create a trusted ecosystem for investors worldwide.',10),
('about','privacy-policy','🔒','Privacy Policy','At Crypto X, we respect and protect your privacy. We collect and process user information solely for account management, security verification, service improvement, and regulatory compliance. Personal information is stored securely and is never sold or shared with unauthorized third parties. By using our platform, you consent to the collection and use of information as described in this Privacy Policy.',20),
('about','terms-of-service','📜','Terms of Service','By accessing or using Crypto X, you agree to comply with all applicable laws, platform policies, and operational guidelines. Users are responsible for maintaining the security of their accounts, providing accurate information, and using the platform in a lawful manner. Crypto X reserves the right to update, modify, suspend, or terminate services and accounts that violate our policies or applicable regulations. Continued use of the platform constitutes acceptance of these Terms of Service.',30);
