CREATE TABLE "contadores" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"orcamento_proximo" integer DEFAULT 1 NOT NULL,
	"cotacao_proximo" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cotacoes_importadas" (
	"id" text PRIMARY KEY NOT NULL,
	"orcamento_id" text NOT NULL,
	"fornecedor_id" text,
	"fornecedor_nome" text NOT NULL,
	"arquivo" text DEFAULT '' NOT NULL,
	"frete" numeric(14, 2) DEFAULT '0' NOT NULL,
	"itens" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fornecedores" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"cnpj" text NOT NULL,
	"telefone" text NOT NULL,
	"email" text NOT NULL,
	"forma_pagamento" text NOT NULL,
	"chave_pix" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historico_orcamento" (
	"id" text PRIMARY KEY NOT NULL,
	"orcamento_id" text NOT NULL,
	"tipo" text NOT NULL,
	"descricao" text NOT NULL,
	"justificativa" text NOT NULL,
	"autor" text NOT NULL,
	"registrado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificacoes" (
	"id" text PRIMARY KEY NOT NULL,
	"perfil_destino" text NOT NULL,
	"usuario_destino" text,
	"mensagem" text NOT NULL,
	"orcamento_id" text NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"lida" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obras" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"cliente" text NOT NULL,
	"endereco" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orcamentos" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"etapa" text NOT NULL,
	"obra_id" text,
	"obra_nome" text DEFAULT '' NOT NULL,
	"cliente" text DEFAULT '' NOT NULL,
	"comprador_responsavel" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"itens_requisicao" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requisicao_validada" boolean DEFAULT false NOT NULL,
	"codigo_cotacao" text,
	"requisicao_enviada_em" timestamp with time zone,
	"mapa_montado_em" timestamp with time zone,
	CONSTRAINT "orcamentos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "recebimentos" (
	"id" text PRIMARY KEY NOT NULL,
	"orcamento_id" text NOT NULL,
	"tipo" text NOT NULL,
	"itens_recebidos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"foto_nota_fiscal" text NOT NULL,
	"recebido_por" text NOT NULL,
	"recebido_em" timestamp with time zone DEFAULT now() NOT NULL,
	"observacao" text
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"senha_hash" text NOT NULL,
	"perfil" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "usuarios_obras" (
	"usuario_id" text NOT NULL,
	"obra_id" text NOT NULL,
	CONSTRAINT "usuarios_obras_usuario_id_obra_id_pk" PRIMARY KEY("usuario_id","obra_id")
);
--> statement-breakpoint
CREATE TABLE "versoes_orcamento" (
	"id" text PRIMARY KEY NOT NULL,
	"orcamento_id" text NOT NULL,
	"versao" integer NOT NULL,
	"status" text NOT NULL,
	"itens" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"totais_por_fornecedor" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"frete" numeric(14, 2) DEFAULT '0' NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"enviada_para_aprovacao_em" timestamp with time zone,
	"decidida_em" timestamp with time zone,
	"aprovado_por" text,
	"justificativa" text,
	"editado_por" text,
	"nota_edicao" text
);
--> statement-breakpoint
ALTER TABLE "cotacoes_importadas" ADD CONSTRAINT "cotacoes_importadas_orcamento_id_orcamentos_id_fk" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotacoes_importadas" ADD CONSTRAINT "cotacoes_importadas_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_orcamento" ADD CONSTRAINT "historico_orcamento_orcamento_id_orcamentos_id_fk" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_orcamento_id_orcamentos_id_fk" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimentos" ADD CONSTRAINT "recebimentos_orcamento_id_orcamentos_id_fk" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_obras" ADD CONSTRAINT "usuarios_obras_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_obras" ADD CONSTRAINT "usuarios_obras_obra_id_obras_id_fk" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versoes_orcamento" ADD CONSTRAINT "versoes_orcamento_orcamento_id_orcamentos_id_fk" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id") ON DELETE cascade ON UPDATE no action;