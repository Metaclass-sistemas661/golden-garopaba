-- Enable Row Level Security (RLS)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
-- 1. Usuários podem ver o próprio perfil
CREATE POLICY "Users can view own profile" 
ON "User" FOR SELECT 
USING (auth.uid() = id);

-- 2. Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users" 
ON "User" FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM "User" u WHERE u.id = auth.uid() AND u.role = 'ADMIN'::"Role"
  )
);

-- Properties Table Policies
-- 1. Qualquer pessoa (incluindo anônimos) pode visualizar os imóveis
CREATE POLICY "Anyone can view properties" 
ON "Property" FOR SELECT 
USING (true);

-- 2. Apenas Admins podem inserir, atualizar e deletar imóveis
CREATE POLICY "Admins can insert properties" 
ON "Property" FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User" u WHERE u.id = auth.uid() AND u.role = 'ADMIN'::"Role"
  )
);

CREATE POLICY "Admins can update properties" 
ON "Property" FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM "User" u WHERE u.id = auth.uid() AND u.role = 'ADMIN'::"Role"
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User" u WHERE u.id = auth.uid() AND u.role = 'ADMIN'::"Role"
  )
);

CREATE POLICY "Admins can delete properties" 
ON "Property" FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM "User" u WHERE u.id = auth.uid() AND u.role = 'ADMIN'::"Role"
  )
);
