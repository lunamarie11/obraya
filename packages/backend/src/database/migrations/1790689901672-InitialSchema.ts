import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1790689901672 implements MigrationInterface {
    name = 'InitialSchema1790689901672'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."company_users_role_enum" AS ENUM('SuperAdmin', 'Admin', 'Vendedor', 'Logistica', 'Contabilidad')`);
        await queryRunner.query(`CREATE TABLE "company_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "email" character varying(150) NOT NULL, "password_hash" character varying(255) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "role" "public"."company_users_role_enum" NOT NULL DEFAULT 'Vendedor', "is_active" boolean NOT NULL DEFAULT true, "permissions" jsonb, "last_login_at" TIMESTAMP, "invite_token" character varying(255), "invite_expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c6f15bbc68300ad13c9536da486" UNIQUE ("email"), CONSTRAINT "PK_fcd31773e604355d8a473de888c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."companies_status_enum" AS ENUM('pending', 'active', 'suspended', 'rejected')`);
        await queryRunner.query(`CREATE TYPE "public"."companies_iva_condition_enum" AS ENUM('RI', 'MONOTRIBUTO', 'EXENTO')`);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cuit" character varying(11) NOT NULL, "razon_social" character varying(200) NOT NULL, "email" character varying(150) NOT NULL, "phone" character varying(20), "logo_url" character varying(500), "status" "public"."companies_status_enum" NOT NULL DEFAULT 'pending', "iva_condition" "public"."companies_iva_condition_enum" NOT NULL DEFAULT 'RI', "banking_data" jsonb, "delivery_zones" jsonb, "address" character varying(300), "city" character varying(100), "province" character varying(100), "approved_at" TIMESTAMP, "approved_by" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ea066a580662dbe1d4fe3778147" UNIQUE ("cuit"), CONSTRAINT "UQ_d0af6f5866201d5cb424767744a" UNIQUE ("email"), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "sku_variant" character varying(80), "attributes" jsonb, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "name" character varying(200) NOT NULL, "sku" character varying(50), "description" text, "category" character varying(100), "subcategory" character varying(100), "brand" character varying(100), "images" jsonb, "technical_sheet_url" character varying(500), "unit_of_measure" character varying(30), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "stock" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "variant_id" uuid, "warehouse_id" character varying(100) NOT NULL DEFAULT 'principal', "warehouse_name" character varying(100) NOT NULL DEFAULT 'Depósito Principal', "quantity" integer NOT NULL DEFAULT '0', "reserved_quantity" integer NOT NULL DEFAULT '0', "minimum_alert" integer NOT NULL DEFAULT '5', "alert_enabled" boolean NOT NULL DEFAULT true, "last_restock_at" TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_092bc1fc7d860426a1dec5aa8e9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4859167c3b03980488504c5d91" ON "stock" ("product_id", "variant_id", "warehouse_id") `);
        await queryRunner.query(`CREATE TYPE "public"."stock_movements_type_enum" AS ENUM('entrada', 'salida', 'reserva', 'liberacion', 'ajuste')`);
        await queryRunner.query(`CREATE TABLE "stock_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "stock_id" uuid NOT NULL, "type" "public"."stock_movements_type_enum" NOT NULL, "quantity" integer NOT NULL, "quantity_after" integer NOT NULL, "notes" character varying(300), "order_id" character varying(36), "user_id" character varying(36), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_57a26b190618550d8e65fb860e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buyer_id" character varying NOT NULL, "company_id" character varying NOT NULL, "order_id" character varying NOT NULL, "rating" smallint NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e4b0ed40bdd0f318108612c2851" UNIQUE ("order_id"), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bcb2d179b57808a093bc971893" ON "reviews" ("company_id") `);
        await queryRunner.query(`CREATE TYPE "public"."prices_type_enum" AS ENUM('B2C', 'B2B')`);
        await queryRunner.query(`CREATE TABLE "prices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "variant_id" uuid, "type" "public"."prices_type_enum" NOT NULL, "base_price" bigint NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'ARS', "volume_prices" jsonb, "scheduled_discount" jsonb, "is_active" boolean NOT NULL DEFAULT true, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2e40b9e4e631a53cd514d82ccd2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7975101e50d6d55a663e1902cb" ON "prices" ("product_id", "variant_id", "type") `);
        await queryRunner.query(`CREATE TABLE "price_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "price_id" uuid NOT NULL, "previous_price" bigint NOT NULL, "new_price" bigint NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'ARS', "changed_by" character varying(36), "reason" character varying(200), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e41e25472373d4b574b153229e9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "product_id" character varying(36) NOT NULL, "variant_id" character varying(36), "product_name" character varying(200) NOT NULL, "product_sku" character varying(50), "quantity" integer NOT NULL, "unit_price" bigint NOT NULL, "subtotal" bigint NOT NULL, "discount_percent" numeric(5,2) NOT NULL DEFAULT '0', "notes" character varying(300), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_messages_sender_enum" AS ENUM('company', 'buyer', 'system')`);
        await queryRunner.query(`CREATE TABLE "order_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "sender" "public"."order_messages_sender_enum" NOT NULL, "sender_id" character varying(36), "sender_name" character varying(200), "content" text NOT NULL, "is_predefined" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_25d8eb6fb6e1ccb6b33e034ee28" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('Nuevo', 'Aceptado', 'Preparacion', 'Despachado', 'Entregado', 'Cancelado')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_payment_method_enum" AS ENUM('Efectivo', 'Transferencia', 'MercadoPago')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "buyer_id" character varying(36) NOT NULL, "buyer_name" character varying(200), "buyer_email" character varying(150), "buyer_phone" character varying(20), "order_number" character varying(20) NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'Nuevo', "rejection_reason" character varying(500), "total_amount" bigint NOT NULL, "shipping_cost" bigint NOT NULL DEFAULT '0', "shipping_zone_name" character varying(100), "currency" character varying(3) NOT NULL DEFAULT 'ARS', "notes" text, "delivery_address" jsonb, "scheduled_delivery_date" TIMESTAMP, "actual_delivery_date" TIMESTAMP, "payment_method" "public"."orders_payment_method_enum" NOT NULL DEFAULT 'Efectivo', "mp_preference_id" character varying(100), "mp_payment_id" character varying(100), "payment_url" text, "payment_status" character varying(30), "afip_cae" character varying(20), "afip_cae_expiration" TIMESTAMP, "afip_invoice_number" character varying(20), "afip_invoice_type" character varying(5), "afip_status" character varying(20), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_75eba1c6b1a66b09f2a97e6927b" UNIQUE ("order_number"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_75eba1c6b1a66b09f2a97e6927" ON "orders" ("order_number") `);
        await queryRunner.query(`CREATE TABLE "buyers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(150) NOT NULL, "password_hash" character varying(255) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "phone" character varying(20), "is_active" boolean NOT NULL DEFAULT true, "last_login_at" TIMESTAMP, "fcm_token" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c63a289e65c35c1971da0c2f7bd" UNIQUE ("email"), CONSTRAINT "PK_aff372821d05bac04a18ff8eb87" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "buyer_favorites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buyer_id" character varying NOT NULL, "type" character varying(20) NOT NULL, "target_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1c9a6137432f45ba65c5298acf6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c7de3063710274e88f51613b8d" ON "buyer_favorites" ("buyer_id", "type", "target_id") `);
        await queryRunner.query(`CREATE TABLE "buyer_addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buyer_id" character varying NOT NULL, "label" character varying(100) NOT NULL DEFAULT 'Casa', "street" character varying(255) NOT NULL, "city" character varying(100) NOT NULL, "province" character varying(100) NOT NULL, "postal_code" character varying(20) NOT NULL, "notes" character varying(255), "is_default" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fddd300ac7d97370b63d2c5731d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "company_users" ADD CONSTRAINT "FK_0a12e8588834314e38e43d6f5a7" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "FK_6343513e20e2deab45edfce1316" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_b417f1726f6ccafb18730adffb0" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock" ADD CONSTRAINT "FK_375ba760c8cff338fc8c94b416c" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock" ADD CONSTRAINT "FK_21ca5477fd93f446af1ae16b3db" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_fe1f8086b016f319c4f7f389602" FOREIGN KEY ("stock_id") REFERENCES "stock"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prices" ADD CONSTRAINT "FK_144765f6b6bef86e113b507ed12" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prices" ADD CONSTRAINT "FK_32d5d9b0035c5bf99a48863b022" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "price_history" ADD CONSTRAINT "FK_8f851de1b863afc6cf797e92b6f" FOREIGN KEY ("price_id") REFERENCES "prices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_messages" ADD CONSTRAINT "FK_01e1cb89abad3329a9fe957a9e3" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_f5d519a61e918f7efb299de31a0" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_f5d519a61e918f7efb299de31a0"`);
        await queryRunner.query(`ALTER TABLE "order_messages" DROP CONSTRAINT "FK_01e1cb89abad3329a9fe957a9e3"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "price_history" DROP CONSTRAINT "FK_8f851de1b863afc6cf797e92b6f"`);
        await queryRunner.query(`ALTER TABLE "prices" DROP CONSTRAINT "FK_32d5d9b0035c5bf99a48863b022"`);
        await queryRunner.query(`ALTER TABLE "prices" DROP CONSTRAINT "FK_144765f6b6bef86e113b507ed12"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_fe1f8086b016f319c4f7f389602"`);
        await queryRunner.query(`ALTER TABLE "stock" DROP CONSTRAINT "FK_21ca5477fd93f446af1ae16b3db"`);
        await queryRunner.query(`ALTER TABLE "stock" DROP CONSTRAINT "FK_375ba760c8cff338fc8c94b416c"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_b417f1726f6ccafb18730adffb0"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "FK_6343513e20e2deab45edfce1316"`);
        await queryRunner.query(`ALTER TABLE "company_users" DROP CONSTRAINT "FK_0a12e8588834314e38e43d6f5a7"`);
        await queryRunner.query(`DROP TABLE "buyer_addresses"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c7de3063710274e88f51613b8d"`);
        await queryRunner.query(`DROP TABLE "buyer_favorites"`);
        await queryRunner.query(`DROP TABLE "buyers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_75eba1c6b1a66b09f2a97e6927"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_payment_method_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP TABLE "order_messages"`);
        await queryRunner.query(`DROP TYPE "public"."order_messages_sender_enum"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "price_history"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7975101e50d6d55a663e1902cb"`);
        await queryRunner.query(`DROP TABLE "prices"`);
        await queryRunner.query(`DROP TYPE "public"."prices_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bcb2d179b57808a093bc971893"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "stock_movements"`);
        await queryRunner.query(`DROP TYPE "public"."stock_movements_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4859167c3b03980488504c5d91"`);
        await queryRunner.query(`DROP TABLE "stock"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "product_variants"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TYPE "public"."companies_iva_condition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."companies_status_enum"`);
        await queryRunner.query(`DROP TABLE "company_users"`);
        await queryRunner.query(`DROP TYPE "public"."company_users_role_enum"`);
    }

}
