import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Database, HardDrive, Globe, Shield, Terminal, Server, Download, Settings, RefreshCw } from "lucide-react";

export default function Migracao() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Guia de Migração</h1>
        <p className="text-muted-foreground mt-1">
          Documentação completa para migrar o banco de dados do Supabase para PostgreSQL local e implantar o sistema em Ubuntu Server 24.04
        </p>
      </div>

      {/* Visão Geral */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Antes de Começar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Este guia cobre duas etapas principais:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li><strong>Migração do Banco de Dados:</strong> Exportar dados do Supabase e importar em um PostgreSQL local.</li>
            <li><strong>Implantação do Sistema:</strong> Configurar o Ubuntu Server 24.04 para rodar a aplicação completa.</li>
          </ol>
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <p className="font-medium text-yellow-600">⚠️ Recomendações importantes:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Faça backup completo antes de qualquer operação</li>
              <li>Teste todo o processo em ambiente de homologação antes de produção</li>
              <li>Documente todas as alterações realizadas</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Requisitos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Requisitos do Servidor
          </CardTitle>
          <CardDescription>Hardware e software mínimos recomendados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Hardware Mínimo</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• CPU: 2 cores</li>
                <li>• RAM: 4 GB</li>
                <li>• Disco: 50 GB SSD</li>
                <li>• Rede: Acesso à rede local / internet</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Software Necessário</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ubuntu Server 24.04 LTS</li>
                <li>• PostgreSQL 15+</li>
                <li>• Node.js 20 LTS</li>
                <li>• Nginx (proxy reverso)</li>
                <li>• Git</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* PARTE 1 - Migração do Banco */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-4">
          <Database className="h-6 w-6 text-primary" />
          Parte 1 — Migração do Banco de Dados
        </h2>

        <Accordion type="single" collapsible className="space-y-2">
          {/* Passo 1.1 */}
          <AccordionItem value="1-1" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">1.1</Badge>
                <span>Exportar o banco de dados do Supabase</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <p>Existem duas formas de exportar o banco do Supabase:</p>

              <div className="space-y-2">
                <h4 className="font-semibold">Opção A: Via linha de comando (pg_dump)</h4>
                <p className="text-muted-foreground">Acesse as configurações do Supabase para obter a string de conexão:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                  <li>No painel do Supabase, vá em <strong>Settings → Database</strong></li>
                  <li>Copie a <strong>Connection string</strong> (URI) no modo <strong>Session pooler</strong> ou <strong>Direct</strong></li>
                </ol>
                <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
                  <p className="text-muted-foreground mb-1"># Exportar estrutura + dados</p>
                  <p>pg_dump "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \</p>
                  <p className="ml-4">--no-owner \</p>
                  <p className="ml-4">--no-privileges \</p>
                  <p className="ml-4">--schema=public \</p>
                  <p className="ml-4">--file=backup_supabase.sql</p>
                </div>
                <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto mt-2">
                  <p className="text-muted-foreground mb-1"># Exportar apenas os dados (se já tiver a estrutura)</p>
                  <p>pg_dump "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \</p>
                  <p className="ml-4">--data-only \</p>
                  <p className="ml-4">--schema=public \</p>
                  <p className="ml-4">--file=backup_dados.sql</p>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <h4 className="font-semibold">Opção B: Via painel do Supabase (Backup)</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Acesse <strong>Settings → Database → Backups</strong></li>
                  <li>Clique em <strong>Download backup</strong> para baixar o último backup</li>
                  <li>O arquivo será um dump SQL completo do banco</li>
                </ol>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md mt-2">
                <p className="text-blue-600 text-xs"><strong>💡 Dica:</strong> Use a flag <code>--schema=public</code> para exportar apenas o schema público, evitando conflitos com schemas internos do Supabase (auth, storage, etc.)</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 1.2 */}
          <AccordionItem value="1-2" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">1.2</Badge>
                <span>Instalar e configurar o PostgreSQL no Ubuntu</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-muted-foreground"># Atualizar pacotes</p>
                <p>sudo apt update && sudo apt upgrade -y</p>
                <p></p>
                <p className="text-muted-foreground"># Instalar PostgreSQL</p>
                <p>sudo apt install postgresql postgresql-contrib -y</p>
                <p></p>
                <p className="text-muted-foreground"># Verificar status do serviço</p>
                <p>sudo systemctl status postgresql</p>
                <p></p>
                <p className="text-muted-foreground"># Habilitar inicialização automática</p>
                <p>sudo systemctl enable postgresql</p>
              </div>

              <h4 className="font-semibold mt-3">Criar o banco e o usuário</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-muted-foreground"># Acessar o PostgreSQL como superusuário</p>
                <p>sudo -u postgres psql</p>
                <p></p>
                <p className="text-muted-foreground">-- Dentro do psql:</p>
                <p>CREATE USER siif_user WITH PASSWORD 'sua_senha_segura';</p>
                <p>CREATE DATABASE siif_db OWNER siif_user;</p>
                <p>GRANT ALL PRIVILEGES ON DATABASE siif_db TO siif_user;</p>
                <p></p>
                <p className="text-muted-foreground">-- Criar o tipo enum necessário</p>
                <p>\c siif_db</p>
                <p>CREATE TYPE public.status_inventario AS ENUM ('nao_iniciado', 'em_andamento', 'concluido');</p>
                <p>CREATE TYPE public.user_role AS ENUM ('admin', 'user');</p>
                <p></p>
                <p>\q</p>
              </div>

              <h4 className="font-semibold mt-3">Configurar acesso remoto (opcional)</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-muted-foreground"># Editar postgresql.conf para aceitar conexões externas</p>
                <p>sudo nano /etc/postgresql/16/main/postgresql.conf</p>
                <p className="text-muted-foreground"># Alterar: listen_addresses = '*'</p>
                <p></p>
                <p className="text-muted-foreground"># Editar pg_hba.conf para permitir conexões da rede</p>
                <p>sudo nano /etc/postgresql/16/main/pg_hba.conf</p>
                <p className="text-muted-foreground"># Adicionar linha:</p>
                <p>host    siif_db    siif_user    192.168.0.0/24    scram-sha-256</p>
                <p></p>
                <p className="text-muted-foreground"># Reiniciar o PostgreSQL</p>
                <p>sudo systemctl restart postgresql</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 1.3 */}
          <AccordionItem value="1-3" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">1.3</Badge>
                <span>Importar os dados no PostgreSQL local</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-muted-foreground"># Importar o dump no banco local</p>
                <p>psql -U siif_user -d siif_db -f backup_supabase.sql</p>
                <p></p>
                <p className="text-muted-foreground"># Caso haja erros de permissão, importe como superusuário:</p>
                <p>sudo -u postgres psql -d siif_db -f backup_supabase.sql</p>
                <p></p>
                <p className="text-muted-foreground"># Depois conceda as permissões ao usuário da aplicação:</p>
                <p>sudo -u postgres psql -d siif_db -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO siif_user;"</p>
                <p>sudo -u postgres psql -d siif_db -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO siif_user;"</p>
                <p>sudo -u postgres psql -d siif_db -c "GRANT USAGE ON SCHEMA public TO siif_user;"</p>
              </div>

              <h4 className="font-semibold mt-3">Verificar a importação</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-muted-foreground"># Conectar ao banco e verificar as tabelas</p>
                <p>psql -U siif_user -d siif_db</p>
                <p></p>
                <p>\dt</p>
                <p className="text-muted-foreground">-- Deve listar: ambientes, bens, usuarios, inventarios,</p>
                <p className="text-muted-foreground">-- inventario_itens, grupos, grupos_usuarios, patrimonio, ambiente_bens</p>
                <p></p>
                <p className="text-muted-foreground">-- Verificar contagem de registros</p>
                <p>SELECT 'ambientes' AS tabela, COUNT(*) FROM ambientes</p>
                <p>UNION ALL SELECT 'bens', COUNT(*) FROM bens</p>
                <p>UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios</p>
                <p>UNION ALL SELECT 'inventarios', COUNT(*) FROM inventarios</p>
                <p>UNION ALL SELECT 'inventario_itens', COUNT(*) FROM inventario_itens;</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 1.4 */}
          <AccordionItem value="1-4" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">1.4</Badge>
                <span>Recriar funções e triggers do banco</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">As funções auxiliares do Supabase precisam ser recriadas no banco local. Execute os seguintes comandos:</p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p>psql -U siif_user -d siif_db</p>
                <p></p>
                <p className="text-muted-foreground">-- Função para atualizar updated_at automaticamente</p>
                <p>CREATE OR REPLACE FUNCTION public.update_updated_at_column()</p>
                <p>RETURNS trigger LANGUAGE plpgsql AS $$</p>
                <p>BEGIN</p>
                <p>  NEW.updated_at = now();</p>
                <p>  RETURN NEW;</p>
                <p>END;</p>
                <p>$$;</p>
                <p></p>
                <p className="text-muted-foreground">-- Aplicar trigger em todas as tabelas</p>
                <p>CREATE TRIGGER update_ambientes_updated_at BEFORE UPDATE ON ambientes</p>
                <p>  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();</p>
                <p></p>
                <p>CREATE TRIGGER update_bens_updated_at BEFORE UPDATE ON bens</p>
                <p>  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();</p>
                <p></p>
                <p>CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios</p>
                <p>  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();</p>
                <p></p>
                <p>CREATE TRIGGER update_inventarios_updated_at BEFORE UPDATE ON inventarios</p>
                <p>  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();</p>
                <p></p>
                <p>CREATE TRIGGER update_inventario_itens_updated_at BEFORE UPDATE ON inventario_itens</p>
                <p>  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <Separator />

      {/* PARTE 2 - Implantação do Sistema */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-4">
          <Server className="h-6 w-6 text-primary" />
          Parte 2 — Implantação no Ubuntu Server 24.04
        </h2>

        <Accordion type="single" collapsible className="space-y-2">
          {/* Passo 2.1 */}
          <AccordionItem value="2-1" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">2.1</Badge>
                <span>Instalar Node.js e dependências do sistema</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-muted-foreground"># Instalar Node.js 20 LTS via NodeSource</p>
                <p>curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -</p>
                <p>sudo apt install -y nodejs</p>
                <p></p>
                <p className="text-muted-foreground"># Verificar versões</p>
                <p>node --version   # v20.x.x</p>
                <p>npm --version</p>
                <p></p>
                <p className="text-muted-foreground"># Instalar ferramentas de build essenciais</p>
                <p>sudo apt install -y build-essential git curl</p>
                <p></p>
                <p className="text-muted-foreground"># Instalar Nginx como proxy reverso</p>
                <p>sudo apt install -y nginx</p>
                <p>sudo systemctl enable nginx</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 2.2 */}
          <AccordionItem value="2-2" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">2.2</Badge>
                <span>Clonar o projeto e instalar dependências</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-muted-foreground"># Criar diretório da aplicação</p>
                <p>sudo mkdir -p /opt/siif</p>
                <p>sudo chown $USER:$USER /opt/siif</p>
                <p></p>
                <p className="text-muted-foreground"># Clonar o repositório (substitua pela URL real)</p>
                <p>cd /opt/siif</p>
                <p>git clone https://github.com/seu-usuario/siif.git .</p>
                <p></p>
                <p className="text-muted-foreground"># Instalar dependências do projeto</p>
                <p>npm install</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 2.3 */}
          <AccordionItem value="2-3" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">2.3</Badge>
                <span>Criar o backend (API) para substituir o Supabase</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Como o sistema utiliza o Supabase como backend, será necessário criar uma API REST para substituí-lo. 
                Recomendamos usar <strong>Express.js</strong> com <strong>pg</strong> (node-postgres).
              </p>

              <h4 className="font-semibold mt-3">Estrutura do backend</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p>mkdir -p /opt/siif/backend</p>
                <p>cd /opt/siif/backend</p>
                <p>npm init -y</p>
                <p>npm install express pg cors dotenv bcryptjs jsonwebtoken</p>
              </div>

              <h4 className="font-semibold mt-3">Arquivo .env do backend</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-muted-foreground"># /opt/siif/backend/.env</p>
                <p>DB_HOST=localhost</p>
                <p>DB_PORT=5432</p>
                <p>DB_NAME=siif_db</p>
                <p>DB_USER=siif_user</p>
                <p>DB_PASSWORD=sua_senha_segura</p>
                <p>JWT_SECRET=uma_chave_secreta_muito_forte</p>
                <p>PORT=3001</p>
              </div>

              <h4 className="font-semibold mt-3">Exemplo de server.js</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p>{`const express = require('express');`}</p>
                <p>{`const cors = require('cors');`}</p>
                <p>{`const { Pool } = require('pg');`}</p>
                <p>{`require('dotenv').config();`}</p>
                <p></p>
                <p>{`const app = express();`}</p>
                <p>{`app.use(cors());`}</p>
                <p>{`app.use(express.json());`}</p>
                <p></p>
                <p>{`const pool = new Pool({`}</p>
                <p>{`  host: process.env.DB_HOST,`}</p>
                <p>{`  port: process.env.DB_PORT,`}</p>
                <p>{`  database: process.env.DB_NAME,`}</p>
                <p>{`  user: process.env.DB_USER,`}</p>
                <p>{`  password: process.env.DB_PASSWORD,`}</p>
                <p>{`});`}</p>
                <p></p>
                <p>{`// Exemplo: listar ambientes`}</p>
                <p>{`app.get('/api/ambientes', async (req, res) => {`}</p>
                <p>{`  const result = await pool.query('SELECT * FROM ambientes ORDER BY nome');`}</p>
                <p>{`  res.json(result.rows);`}</p>
                <p>{`});`}</p>
                <p></p>
                <p>{`// Exemplo: listar inventários com ambiente`}</p>
                <p>{`app.get('/api/inventarios', async (req, res) => {`}</p>
                <p>{`  const result = await pool.query(`}</p>
                <p>{`    'SELECT i.*, a.nome as ambiente_nome FROM inventarios i ' +`}</p>
                <p>{`    'JOIN ambientes a ON i.ambiente_id = a.id ORDER BY a.nome'`}</p>
                <p>{`  );`}</p>
                <p>{`  res.json(result.rows);`}</p>
                <p>{`});`}</p>
                <p></p>
                <p>{`// Autenticação (login)`}</p>
                <p>{`const jwt = require('jsonwebtoken');`}</p>
                <p>{`const bcrypt = require('bcryptjs');`}</p>
                <p></p>
                <p>{`app.post('/api/auth/login', async (req, res) => {`}</p>
                <p>{`  const { nome, senha } = req.body;`}</p>
                <p>{`  const result = await pool.query(`}</p>
                <p>{`    'SELECT * FROM usuarios WHERE nome = $1', [nome]`}</p>
                <p>{`  );`}</p>
                <p>{`  const user = result.rows[0];`}</p>
                <p>{`  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });`}</p>
                <p>{`  // Verificar senha (ajuste conforme armazenamento atual)`}</p>
                <p>{`  const token = jwt.sign(`}</p>
                <p>{`    { id: user.id, nome: user.nome, role: user.role },`}</p>
                <p>{`    process.env.JWT_SECRET,`}</p>
                <p>{`    { expiresIn: '8h' }`}</p>
                <p>{`  );`}</p>
                <p>{`  res.json({ token, user });`}</p>
                <p>{`});`}</p>
                <p></p>
                <p>{`app.listen(process.env.PORT, () => {`}</p>
                <p>{`  console.log('API rodando na porta ' + process.env.PORT);`}</p>
                <p>{`});`}</p>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md mt-2">
                <p className="text-blue-600 text-xs"><strong>💡 Dica:</strong> Você precisará criar endpoints equivalentes para todas as operações que o frontend faz via Supabase: CRUD de ambientes, bens, usuários, inventários, inventário_itens, grupos e patrimônio.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 2.4 */}
          <AccordionItem value="2-4" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">2.4</Badge>
                <span>Adaptar o frontend para usar a API local</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Substitua as chamadas ao <code>supabase</code> client por chamadas <code>fetch</code> ou <code>axios</code> apontando para a API local.
              </p>

              <h4 className="font-semibold mt-3">Arquivo .env do frontend</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-muted-foreground"># /opt/siif/.env</p>
                <p>VITE_API_URL=http://seu-servidor:3001/api</p>
              </div>

              <h4 className="font-semibold mt-3">Exemplo de adaptação</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-muted-foreground">// Antes (Supabase):</p>
                <p>{`const { data } = await supabase.from('ambientes').select('*');`}</p>
                <p></p>
                <p className="text-muted-foreground">// Depois (API local):</p>
                <p>{`const response = await fetch(\`\${import.meta.env.VITE_API_URL}/ambientes\`);`}</p>
                <p>{`const data = await response.json();`}</p>
              </div>

              <h4 className="font-semibold mt-3">Build do frontend</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p>cd /opt/siif</p>
                <p>npm run build</p>
                <p className="text-muted-foreground"># Os arquivos estáticos serão gerados em /opt/siif/dist</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 2.5 */}
          <AccordionItem value="2-5" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">2.5</Badge>
                <span>Configurar o Nginx como proxy reverso</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p>sudo nano /etc/nginx/sites-available/siif</p>
              </div>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1 mt-2">
                <p>{`server {`}</p>
                <p>{`    listen 80;`}</p>
                <p>{`    server_name seu-dominio.com.br;  # ou IP do servidor`}</p>
                <p></p>
                <p>{`    # Frontend (arquivos estáticos)`}</p>
                <p>{`    location / {`}</p>
                <p>{`        root /opt/siif/dist;`}</p>
                <p>{`        index index.html;`}</p>
                <p>{`        try_files $uri $uri/ /index.html;`}</p>
                <p>{`    }`}</p>
                <p></p>
                <p>{`    # Backend (API)`}</p>
                <p>{`    location /api/ {`}</p>
                <p>{`        proxy_pass http://127.0.0.1:3001;`}</p>
                <p>{`        proxy_http_version 1.1;`}</p>
                <p>{`        proxy_set_header Upgrade $http_upgrade;`}</p>
                <p>{`        proxy_set_header Connection 'upgrade';`}</p>
                <p>{`        proxy_set_header Host $host;`}</p>
                <p>{`        proxy_set_header X-Real-IP $remote_addr;`}</p>
                <p>{`        proxy_cache_bypass $http_upgrade;`}</p>
                <p>{`    }`}</p>
                <p>{`}`}</p>
              </div>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1 mt-2">
                <p className="text-muted-foreground"># Ativar o site e reiniciar o Nginx</p>
                <p>sudo ln -s /etc/nginx/sites-available/siif /etc/nginx/sites-enabled/</p>
                <p>sudo rm /etc/nginx/sites-enabled/default</p>
                <p>sudo nginx -t</p>
                <p>sudo systemctl restart nginx</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 2.6 */}
          <AccordionItem value="2-6" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">2.6</Badge>
                <span>Configurar o backend como serviço (systemd)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">Crie um serviço systemd para manter a API rodando automaticamente:</p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p>sudo nano /etc/systemd/system/siif-api.service</p>
              </div>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1 mt-2">
                <p>[Unit]</p>
                <p>Description=SIIF API Backend</p>
                <p>After=network.target postgresql.service</p>
                <p></p>
                <p>[Service]</p>
                <p>Type=simple</p>
                <p>User=www-data</p>
                <p>WorkingDirectory=/opt/siif/backend</p>
                <p>ExecStart=/usr/bin/node server.js</p>
                <p>Restart=on-failure</p>
                <p>RestartSec=10</p>
                <p>Environment=NODE_ENV=production</p>
                <p></p>
                <p>[Install]</p>
                <p>WantedBy=multi-user.target</p>
              </div>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1 mt-2">
                <p className="text-muted-foreground"># Ativar e iniciar o serviço</p>
                <p>sudo systemctl daemon-reload</p>
                <p>sudo systemctl enable siif-api</p>
                <p>sudo systemctl start siif-api</p>
                <p></p>
                <p className="text-muted-foreground"># Verificar status</p>
                <p>sudo systemctl status siif-api</p>
                <p></p>
                <p className="text-muted-foreground"># Ver logs</p>
                <p>sudo journalctl -u siif-api -f</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 2.7 */}
          <AccordionItem value="2-7" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">2.7</Badge>
                <span>Configurar HTTPS com Certbot (opcional)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">Se o servidor estiver acessível pela internet, configure HTTPS:</p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p>sudo apt install -y certbot python3-certbot-nginx</p>
                <p>sudo certbot --nginx -d seu-dominio.com.br</p>
                <p></p>
                <p className="text-muted-foreground"># Renovação automática (já configurada pelo certbot)</p>
                <p>sudo certbot renew --dry-run</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 2.8 */}
          <AccordionItem value="2-8" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">2.8</Badge>
                <span>Firewall e segurança</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p className="text-muted-foreground"># Configurar UFW (firewall)</p>
                <p>sudo ufw allow OpenSSH</p>
                <p>sudo ufw allow 'Nginx Full'</p>
                <p>sudo ufw enable</p>
                <p>sudo ufw status</p>
                <p></p>
                <p className="text-muted-foreground"># NÃO exponha a porta do PostgreSQL (5432) publicamente</p>
                <p className="text-muted-foreground"># NÃO exponha a porta da API (3001) publicamente — o Nginx faz o proxy</p>
              </div>

              <h4 className="font-semibold mt-3">Boas práticas de segurança</h4>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside ml-2">
                <li>Use senhas fortes para o PostgreSQL e JWT</li>
                <li>Mantenha o sistema atualizado: <code>sudo apt update && sudo apt upgrade</code></li>
                <li>Configure backups automáticos do banco de dados</li>
                <li>Monitore logs regularmente</li>
                <li>Desabilite login root via SSH</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Passo 2.9 */}
          <AccordionItem value="2-9" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">2.9</Badge>
                <span>Backup automático do banco de dados</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">Configure um script de backup diário com cron:</p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1">
                <p>sudo mkdir -p /opt/backups/postgresql</p>
                <p>sudo nano /opt/backups/backup_siif.sh</p>
              </div>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1 mt-2">
                <p>#!/bin/bash</p>
                <p>DATA=$(date +%Y-%m-%d_%H%M)</p>
                <p>BACKUP_DIR="/opt/backups/postgresql"</p>
                <p>pg_dump -U siif_user -d siif_db &gt; "$BACKUP_DIR/siif_$DATA.sql"</p>
                <p></p>
                <p># Manter apenas os últimos 30 backups</p>
                <p>ls -t "$BACKUP_DIR"/siif_*.sql | tail -n +31 | xargs -r rm</p>
                <p></p>
                <p>echo "Backup realizado: siif_$DATA.sql"</p>
              </div>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto space-y-1 mt-2">
                <p>sudo chmod +x /opt/backups/backup_siif.sh</p>
                <p></p>
                <p className="text-muted-foreground"># Agendar execução diária às 2h da manhã</p>
                <p>sudo crontab -e</p>
                <p className="text-muted-foreground"># Adicionar a linha:</p>
                <p>0 2 * * * /opt/backups/backup_siif.sh</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <Separator />

      {/* Checklist final */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Checklist Final
          </CardTitle>
          <CardDescription>Verifique todos os itens antes de considerar a migração concluída</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> PostgreSQL instalado e rodando</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Banco de dados importado com todas as tabelas</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Enums (status_inventario, user_role) criados</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Funções e triggers recriados</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> API backend funcional com todos os endpoints</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Frontend adaptado e compilado (build)</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Nginx configurado como proxy reverso</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Serviço systemd configurado e ativo</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Firewall configurado (UFW)</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Backup automático agendado</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> HTTPS configurado (se acessível pela internet)</li>
            <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Testes de login, cadastro e inventário realizados</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
